"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import {
    CheckCircle,
    Copy,
    Download,
    ExternalLink,
    Pause,
    Play,
    Settings,
    Sparkles,
    Target
} from "lucide-react";
import { m, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for vanity address generation result
 */
interface VanityResult {
  publicKey: string;
  privateKey: string;
  attempts: number;
  timeElapsed: number;
  pattern: string;
  timestamp: number;
}

/**
 * Interface for generation settings
 */
interface GenerationSettings {
  pattern: string;
  position: "start" | "end" | "anywhere";
  caseSensitive: boolean;
  maxAttempts: number;
  maxTime: number;
  includePrivateKey: boolean;
}

/**
 * Solana Vanity Address Generator
 * Generate custom Solana addresses with specific patterns
 */
export default function VanityGeneratorPage() {
  const { publicKey, connected } = useWallet();
  const animationsEnabled = useAnimations();
  
  // Refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [results, setResults] = useState<VanityResult[]>([]);
  const [currentKeypair, setCurrentKeypair] = useState<Keypair | null>(null);

  // Settings
  const [settings, setSettings] = useLocalStorage<GenerationSettings>("vanity-settings", {
    pattern: "",
    position: "start",
    caseSensitive: false,
    maxAttempts: 1000000,
    maxTime: 300, // 5 minutes
    includePrivateKey: true,
  });

  // Generated addresses history
  const [generatedHistory] = useLocalStorage<VanityResult[]>("vanity-history", []);

  // Motion variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";
  const MotionSection = animationsEnabled ? m.section : "section";

  /**
   * Check if a public key matches the vanity pattern
   */
  const matchesPattern = useCallback((publicKey: string, pattern: string, position: string, caseSensitive: boolean) => {
    if (!pattern) return false;
    
    const key = caseSensitive ? publicKey : publicKey.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
    
    switch (position) {
      case "start":
        return key.startsWith(searchPattern);
      case "end":
        return key.endsWith(searchPattern);
      case "anywhere":
        return key.includes(searchPattern);
      default:
        return false;
    }
  }, []);

  /**
   * Generate a new keypair
   */
  const generateKeypair = useCallback(() => {
    return Keypair.generate();
  }, []);

  /**
   * Start vanity address generation
   */
  const startGeneration = useCallback(async () => {
    if (!settings.pattern.trim()) {
      toast.error("Please enter a pattern to search for");
      return;
    }

    setIsGenerating(true);
    setCurrentAttempts(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setResults([]);

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);

    try {
      let attempts = 0;
      const maxAttempts = settings.maxAttempts;
      const maxTime = settings.maxTime * 1000; // Convert to milliseconds
      const startTime = Date.now();

      while (attempts < maxAttempts && (Date.now() - startTime) < maxTime) {
        attempts++;
        setCurrentAttempts(attempts);

        const keypair = generateKeypair();
        const publicKey = keypair.publicKey.toBase58();

        if (matchesPattern(publicKey, settings.pattern, settings.position, settings.caseSensitive)) {
          const result: VanityResult = {
            publicKey,
            privateKey: settings.includePrivateKey ? Buffer.from(keypair.secretKey).toString("base64") : "",
            attempts,
            timeElapsed: Date.now() - startTime,
            pattern: settings.pattern,
            timestamp: Date.now(),
          };

          setResults(prev => [result, ...prev]);
          setCurrentKeypair(keypair);
          
          // Save to history
          const updatedHistory = [result, ...generatedHistory].slice(0, 50);
          localStorage.setItem("vanity-history", JSON.stringify(updatedHistory));
          
          toast.success(`Found matching address after ${attempts.toLocaleString()} attempts!`);
          break;
        }

        // Yield to prevent blocking the UI
        if (attempts % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      if (attempts >= maxAttempts) {
        toast.info(`Reached maximum attempts (${maxAttempts.toLocaleString()})`);
      } else if ((Date.now() - startTime) >= maxTime) {
        toast.info(`Reached maximum time (${settings.maxTime}s)`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Generation failed");
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  }, [settings, matchesPattern, generateKeypair, generatedHistory]);

  /**
   * Stop generation
   */
  const stopGeneration = useCallback(() => {
    setIsGenerating(false);
  }, []);

  /**
   * Copy address to clipboard
   */
  const copyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  }, []);

  /**
   * Copy private key to clipboard
   */
  const copyPrivateKey = useCallback(async (privateKey: string) => {
    try {
      await navigator.clipboard.writeText(privateKey);
      toast.success("Private key copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy private key");
    }
  }, []);

  /**
   * Download keypair as JSON
   */
  const downloadKeypair = useCallback((result: VanityResult) => {
    const data = {
      publicKey: result.publicKey,
      privateKey: result.privateKey,
      pattern: result.pattern,
      attempts: result.attempts,
      timeElapsed: result.timeElapsed,
      timestamp: result.timestamp,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vanity-address-${result.pattern}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Keypair downloaded");
  }, []);

  /**
   * View address on Solana Explorer
   */
  const viewOnExplorer = useCallback((address: string) => {
    window.open(`https://explorer.solana.com/address/${address}`, "_blank");
  }, []);

  // Auto-fill pattern from connected wallet
  useEffect(() => {
    if (connected && publicKey && !settings.pattern) {
      const address = publicKey.toBase58();
      const suggestion = address.slice(0, 4);
      setSettings(prev => ({ ...prev, pattern: suggestion }));
    }
  }, [connected, publicKey, settings.pattern, setSettings]);

  return (
    <ToolLayout toolId="web3-vanity-generator">
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >

        <MotionDiv
          variants={animationsEnabled ? itemVariants : undefined}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pattern">Pattern to Search</Label>
                <Input
                  id="pattern"
                  placeholder="e.g., SOL, 123, ABC..."
                  value={settings.pattern}
                  onChange={(e) => setSettings(prev => ({ ...prev, pattern: e.target.value }))}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the pattern you want in your address
                </p>
              </div>

              <div>
                <Label>Pattern Position</Label>
                <div className="flex gap-2 mt-2">
                  {["start", "end", "anywhere"].map((pos) => (
                    <Button
                      key={pos}
                      variant={settings.position === pos ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, position: pos as any }))}
                      disabled={isGenerating}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="case-sensitive">Case Sensitive</Label>
                <Switch
                  id="case-sensitive"
                  checked={settings.caseSensitive}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, caseSensitive: checked }))}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-attempts">Max Attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    value={settings.maxAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 1000000 }))}
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <Label htmlFor="max-time">Max Time (seconds)</Label>
                  <Input
                    id="max-time"
                    type="number"
                    value={settings.maxTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTime: parseInt(e.target.value) || 300 }))}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-private">Include Private Key</Label>
                <Switch
                  id="include-private"
                  checked={settings.includePrivateKey}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includePrivateKey: checked }))}
                  disabled={isGenerating}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Generation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isGenerating ? "default" : "secondary"}>
                  {isGenerating ? "Generating..." : "Ready"}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Attempts:</span>
                  <span className="font-mono">{currentAttempts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Elapsed:</span>
                  <span className="font-mono">{(elapsedTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rate:</span>
                  <span className="font-mono">
                    {elapsedTime > 0 ? Math.round((currentAttempts / (elapsedTime / 1000))).toLocaleString() : 0} attempts/s
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={startGeneration}
                  disabled={isGenerating || !settings.pattern.trim()}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Generation
                </Button>
                <Button
                  onClick={stopGeneration}
                  disabled={!isGenerating}
                  variant="outline"
                >
                  <Pause className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionSection>

      <ProcessingStatus 
        isProcessing={isGenerating}
        isComplete={false}
        error={null}
      />

      <MotionDiv
        ref={contentRef}
        variants={animationsEnabled ? staggerContainer : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined}
        className="space-y-6"
      >
        {results.length > 0 && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generated Addresses
                </CardTitle>
                <CardDescription>
                  Found {results.length} matching address{results.length !== 1 ? "es" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current" className="w-full">
                  <TabsList>
                    <TabsTrigger value="current">Current Session</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="current" className="space-y-4">
                    {results.map((result, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="font-medium">Match Found!</span>
                              </div>
                              <Badge variant="outline">
                                {result.attempts.toLocaleString()} attempts
                              </Badge>
                            </div>

                            <div>
                              <Label className="text-sm text-muted-foreground">Public Key</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                                  {result.publicKey}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyAddress(result.publicKey)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewOnExplorer(result.publicKey)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {result.privateKey && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Private Key (Base64)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                                    {result.privateKey}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyPrivateKey(result.privateKey)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadKeypair(result)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {generatedHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No generation history found
                      </p>
                    ) : (
                      generatedHistory.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm">
                                  {result.publicKey.slice(0, 8)}...{result.publicKey.slice(-8)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(result.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Pattern: {result.pattern}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Attempts: {result.attempts.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <ActionButtons
          onCopy={() => results[0] && copyAddress(results[0].publicKey)}
          onDownload={() => results[0] && downloadKeypair(results[0])}
          copyText={results[0]?.publicKey}
          downloadData={results[0] ? JSON.stringify(results[0], null, 2) : undefined}
          downloadFilename={results[0] ? `vanity-address-${results[0].pattern}-${Date.now()}.json` : undefined}
          downloadMimeType="application/json"
        />
      </MotionDiv>
    </ToolLayout>
  );
} 