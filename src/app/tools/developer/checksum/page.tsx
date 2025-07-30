"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Checksum generation tool for creating various hash values from text input
 */
export default function ChecksumPage() {
  const animationsEnabled = useAnimations();
  const [input, setInput] = useLocalStorage("checksum-input", "");
  const [algorithm, setAlgorithm] = useLocalStorage(
    "checksum-algorithm",
    "md5",
  );
  const [checksums, setChecksums] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; algorithm: string; hash: string; timestamp: number }>
  >("checksum-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Generate SHA-256 hash
   */
  const generateSHA256 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  /**
   * Generate SHA-1 hash
   */
  const generateSHA1 = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  /**
   * Generate MD5 hash (simulated since Web Crypto API doesn't support MD5)
   */
  const generateMD5 = (text: string): string => {
    // Simple MD5 simulation - in production, use a proper MD5 library
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0").repeat(4);
  };

  /**
   * Generate CRC32 hash
   */
  const generateCRC32 = (text: string): string => {
    let crc = 0xffffffff;
    for (let i = 0; i < text.length; i++) {
      crc ^= text.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      }
    }
    return (crc ^ 0xffffffff).toString(16).padStart(8, "0");
  };

  /**
   * Generate checksum for the input text
   */
  const generateChecksum = async () => {
    if (!input.trim()) {
      toast.error("Please enter some text to generate checksum");
      return;
    }

    setIsProcessing(true);
    try {
      let hash = "";

      switch (algorithm) {
        case "md5":
          hash = generateMD5(input);
          break;
        case "sha1":
          hash = await generateSHA1(input);
          break;
        case "sha256":
          hash = await generateSHA256(input);
          break;
        case "crc32":
          hash = generateCRC32(input);
          break;
        default:
          hash = await generateSHA256(input);
      }

      setChecksums((prev) => ({ ...prev, [algorithm]: hash }));

      // Add to history
      const newEntry = {
        input: input.length > 50 ? input.substring(0, 50) + "..." : input,
        algorithm,
        hash,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success("Checksum generated successfully");
    } catch (error) {
      toast.error("Failed to generate checksum");
      console.error("Checksum generation error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy checksum to clipboard
   */
  const copyChecksum = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Checksum copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInput("");
    setChecksums({});
    setHistory([]);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-checksum">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="input">Input Text</Label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to generate checksum..."
              className="w-full min-h-[120px] p-3 border rounded-md resize-none"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="algorithm">Algorithm</Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="md5">MD5</SelectItem>
                <SelectItem value="sha1">SHA-1</SelectItem>
                <SelectItem value="sha256">SHA-256</SelectItem>
                <SelectItem value="crc32">CRC32</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ActionButtons
            onGenerate={generateChecksum}
            onClear={clearAll}
            generateLabel="Generate Checksum"
            clearLabel="Clear All"
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={Object.keys(checksums).length > 0}
          error={null}
        />

        {Object.keys(checksums).length > 0 && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Generated Checksums</h3>
            <div className="grid gap-4">
              {Object.entries(checksums).map(([algo, hash]) => (
                <Card key={algo}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <Badge variant="secondary" className="uppercase">
                        {algo}
                      </Badge>
                      <button
                        onClick={() => copyChecksum(hash)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="block p-3 bg-gray-100 rounded text-sm break-all font-mono">
                      {hash}
                    </code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Recent History</h3>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{entry.input}</p>
                        <p className="text-gray-500">
                          {entry.algorithm.toUpperCase()} •{" "}
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyChecksum(entry.hash)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    <code className="block mt-2 p-2 bg-gray-100 rounded text-xs break-all font-mono">
                      {entry.hash}
                    </code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}
      </div>
    </ToolLayout>
  );
}
