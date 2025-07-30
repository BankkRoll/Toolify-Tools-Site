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
    Copy,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    Plus,
    RefreshCw,
    Settings,
    Sparkles,
    Wallet
} from "lucide-react";
import { m, useInView } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for generated wallet
 */
interface GeneratedWallet {
  publicKey: string;
  privateKey: string;
  mnemonic?: string;
  timestamp: number;
  name?: string;
}

/**
 * Interface for generation settings
 */
interface GenerationSettings {
  count: number;
  includeMnemonic: boolean;
  includePrivateKey: boolean;
  includeQR: boolean;
  autoSave: boolean;
}

/**
 * Solana Wallet Generator
 * Generate new Solana wallets with various export options
 */
export default function WalletGeneratorPage() {
  const { publicKey, connected } = useWallet();
  const animationsEnabled = useAnimations();
  
  // Refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWallets, setGeneratedWallets] = useState<GeneratedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<GeneratedWallet | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [walletName, setWalletName] = useState("");

  // Settings
  const [settings, setSettings] = useLocalStorage<GenerationSettings>("wallet-gen-settings", {
    count: 1,
    includeMnemonic: false,
    includePrivateKey: true,
    includeQR: false,
    autoSave: true,
  });

  // Generated wallets history
  const [walletHistory] = useLocalStorage<GeneratedWallet[]>("wallet-history", []);

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
   * Generate a new Solana keypair
   */
  const generateKeypair = useCallback(() => {
    return Keypair.generate();
  }, []);

  /**
   * Generate wallets based on current settings
   */
  const generateWallets = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const wallets: GeneratedWallet[] = [];
      
      for (let i = 0; i < settings.count; i++) {
        const keypair = generateKeypair();
        const wallet: GeneratedWallet = {
          publicKey: keypair.publicKey.toBase58(),
          privateKey: Buffer.from(keypair.secretKey).toString("base64"),
          timestamp: Date.now(),
          name: walletName || `Wallet ${i + 1}`,
        };
        
        wallets.push(wallet);
        
        // Add small delay to prevent UI blocking
        if (i < settings.count - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      setGeneratedWallets(wallets);
      setSelectedWallet(wallets[0]);
      
      // Auto-save to history if enabled
      if (settings.autoSave) {
        const updatedHistory = [...wallets, ...walletHistory].slice(0, 100);
        localStorage.setItem("wallet-history", JSON.stringify(updatedHistory));
      }
      
      toast.success(`Generated ${settings.count} wallet${settings.count !== 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate wallets");
    } finally {
      setIsGenerating(false);
    }
  }, [settings, generateKeypair, walletName, walletHistory]);

  /**
   * Copy public key to clipboard
   */
  const copyPublicKey = useCallback(async (publicKey: string) => {
    try {
      await navigator.clipboard.writeText(publicKey);
      toast.success("Public key copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy public key");
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
   * Download wallet as JSON
   */
  const downloadWallet = useCallback((wallet: GeneratedWallet) => {
    const data = {
      name: wallet.name,
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
      timestamp: wallet.timestamp,
      generatedBy: "Toolify Wallet Generator",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solana-wallet-${wallet.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Wallet downloaded");
  }, []);

  /**
   * Download all wallets as JSON
   */
  const downloadAllWallets = useCallback(() => {
    const data = {
      wallets: generatedWallets.map(wallet => ({
        name: wallet.name,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        timestamp: wallet.timestamp,
      })),
      generatedBy: "Toolify Wallet Generator",
      timestamp: Date.now(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solana-wallets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All wallets downloaded");
  }, [generatedWallets]);

  /**
   * View address on Solana Explorer
   */
  const viewOnExplorer = useCallback((address: string) => {
    window.open(`https://explorer.solana.com/address/${address}`, "_blank");
  }, []);

  /**
   * Clear generated wallets
   */
  const clearWallets = useCallback(() => {
    setGeneratedWallets([]);
    setSelectedWallet(null);
    toast.success("Generated wallets cleared");
  }, []);

  return (
    <ToolLayout toolId="web3-wallet-generator">
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
                <Label htmlFor="wallet-name">Wallet Name (Optional)</Label>
                <Input
                  id="wallet-name"
                  placeholder="My Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <Label htmlFor="count">Number of Wallets</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.count}
                  onChange={(e) => setSettings(prev => ({ ...prev, count: Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Generate 1-100 wallets at once
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-private">Include Private Key</Label>
                  <Switch
                    id="include-private"
                    checked={settings.includePrivateKey}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includePrivateKey: checked }))}
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto-save to History</Label>
                  <Switch
                    id="auto-save"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSave: checked }))}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateWallets}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Wallets
                </Button>
                <Button
                  onClick={clearWallets}
                  disabled={isGenerating || generatedWallets.length === 0}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSettings(prev => ({ ...prev, count: 1 }))}
                  disabled={isGenerating}
                >
                  Single Wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSettings(prev => ({ ...prev, count: 5 }))}
                  disabled={isGenerating}
                >
                  5 Wallets
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSettings(prev => ({ ...prev, count: 10 }))}
                  disabled={isGenerating}
                >
                  10 Wallets
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSettings(prev => ({ ...prev, count: 25 }))}
                  disabled={isGenerating}
                >
                  25 Wallets
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Generated:</span>
                  <Badge variant="outline">{generatedWallets.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In History:</span>
                  <Badge variant="outline">{walletHistory.length}</Badge>
                </div>
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
        {generatedWallets.length > 0 && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generated Wallets
                </CardTitle>
                <CardDescription>
                  {generatedWallets.length} wallet{generatedWallets.length !== 1 ? "s" : ""} generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="list" className="w-full">
                  <TabsList>
                    <TabsTrigger value="list">Wallet List</TabsTrigger>
                    <TabsTrigger value="details">Wallet Details</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedWallets.map((wallet, index) => (
                        <Card 
                          key={index}
                          className={`cursor-pointer transition-colors ${
                            selectedWallet?.publicKey === wallet.publicKey ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => setSelectedWallet(wallet)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{wallet.name}</span>
                                <Badge variant="outline">#{index + 1}</Badge>
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(wallet.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    {selectedWallet ? (
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Wallet Name</Label>
                              <div className="font-medium">{selectedWallet.name}</div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Public Key</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                                  {selectedWallet.publicKey}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyPublicKey(selectedWallet.publicKey)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => viewOnExplorer(selectedWallet.publicKey)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {settings.includePrivateKey && (
                              <div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Private Key (Base64)</Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                                  >
                                    {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                                    {showPrivateKeys ? selectedWallet.privateKey : "••••••••••••••••"}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyPrivateKey(selectedWallet.privateKey)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                                {!showPrivateKeys && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Click the eye icon to reveal the private key
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => downloadWallet(selectedWallet)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download This Wallet
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Select a wallet to view details
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {walletHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No wallet history found
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {walletHistory.slice(0, 20).map((wallet, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{wallet.name}</div>
                                  <div className="font-mono text-sm text-muted-foreground">
                                    {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(wallet.timestamp).toLocaleDateString()}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadWallet(wallet)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <ActionButtons
          onCopy={() => selectedWallet && copyPublicKey(selectedWallet.publicKey)}
          onDownload={() => generatedWallets.length > 1 ? downloadAllWallets() : selectedWallet && downloadWallet(selectedWallet)}
          copyText={selectedWallet?.publicKey}
          downloadData={generatedWallets.length > 1 ? JSON.stringify({
            wallets: generatedWallets.map(wallet => ({
              name: wallet.name,
              publicKey: wallet.publicKey,
              privateKey: wallet.privateKey,
              timestamp: wallet.timestamp,
            })),
            generatedBy: "Toolify Wallet Generator",
            timestamp: Date.now(),
          }, null, 2) : selectedWallet ? JSON.stringify({
            name: selectedWallet.name,
            publicKey: selectedWallet.publicKey,
            privateKey: selectedWallet.privateKey,
            timestamp: selectedWallet.timestamp,
            generatedBy: "Toolify Wallet Generator",
          }, null, 2) : undefined}
          downloadFilename={generatedWallets.length > 1 ? `solana-wallets-${Date.now()}.json` : selectedWallet ? `solana-wallet-${selectedWallet.name}-${Date.now()}.json` : undefined}
          downloadMimeType="application/json"
        />
      </MotionDiv>
    </ToolLayout>
  );
} 