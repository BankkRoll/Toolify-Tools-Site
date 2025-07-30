"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Code diff tool for comparing text and code differences
 */
export default function CodeDiffPage() {
  const animationsEnabled = useAnimations();
  const [text1, setText1] = useLocalStorage("code-diff-text1", "");
  const [text2, setText2] = useLocalStorage("code-diff-text2", "");
  const [diffMode, setDiffMode] = useLocalStorage("code-diff-mode", "line");
  const [diffResult, setDiffResult] = useState<{
    added: string[];
    removed: string[];
    unchanged: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ text1: string; text2: string; mode: string; timestamp: number }>
  >("code-diff-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Simple line-by-line diff algorithm
   */
  const computeDiff = (
    text1: string,
    text2: string,
  ): { added: string[]; removed: string[]; unchanged: string[] } => {
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    const maxLength = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLength; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";

      if (line1 === line2) {
        unchanged.push(line1);
      } else {
        if (line1) removed.push(`- ${line1}`);
        if (line2) added.push(`+ ${line2}`);
      }
    }

    return { added, removed, unchanged };
  };

  /**
   * Character-level diff for word-by-word comparison
   */
  const computeCharDiff = (
    text1: string,
    text2: string,
  ): { added: string[]; removed: string[]; unchanged: string[] } => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    const maxLength = Math.max(words1.length, words2.length);

    for (let i = 0; i < maxLength; i++) {
      const word1 = words1[i] || "";
      const word2 = words2[i] || "";

      if (word1 === word2) {
        unchanged.push(word1);
      } else {
        if (word1) removed.push(`-${word1}`);
        if (word2) added.push(`+${word2}`);
      }
    }

    return { added, removed, unchanged };
  };

  /**
   * Generate diff between two texts
   */
  const generateDiff = () => {
    if (!text1.trim() && !text2.trim()) {
      toast.error("Please enter text to compare");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result;

      if (diffMode === "line") {
        result = computeDiff(text1, text2);
      } else {
        result = computeCharDiff(text1, text2);
      }

      setDiffResult(result);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        text1: text1.length > 50 ? text1.substring(0, 50) + "..." : text1,
        text2: text2.length > 50 ? text2.substring(0, 50) + "..." : text2,
        mode: diffMode,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      const totalChanges = result.added.length + result.removed.length;
      toast.success(`Diff generated with ${totalChanges} changes`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate diff";
      setError(errorMessage);
      toast.error("Failed to generate diff");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy diff result to clipboard
   */
  const copyDiff = () => {
    if (!diffResult) return;

    const diffText = [
      ...diffResult.removed.map((line) => line),
      ...diffResult.added.map((line) => line),
      ...diffResult.unchanged.map((line) => line),
    ].join("\n");

    navigator.clipboard.writeText(diffText);
    toast.success("Diff result copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setText1("");
    setText2("");
    setDiffResult(null);
    setIsComplete(false);
    setError(null);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-code-diff">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="diff-mode">Diff Mode</Label>
            <Select value={diffMode} onValueChange={setDiffMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line by Line</SelectItem>
                <SelectItem value="word">Word by Word</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input Text</TabsTrigger>
              <TabsTrigger value="output" disabled={!diffResult}>
                Diff Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text1">Original Text</Label>
                  <Textarea
                    id="text1"
                    value={text1}
                    onChange={(e) => setText1(e.target.value)}
                    placeholder="Enter original text..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text2">Modified Text</Label>
                  <Textarea
                    id="text2"
                    value={text2}
                    onChange={(e) => setText2(e.target.value)}
                    placeholder="Enter modified text..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </div>

              <ActionButtons
                onGenerate={generateDiff}
                onClear={clearAll}
                generateLabel="Generate Diff"
                clearLabel="Clear All"
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              {diffResult && (
                <>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Removed:</span>{" "}
                      {diffResult.removed.length} lines
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Added:</span>{" "}
                      {diffResult.added.length} lines
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Unchanged:</span>{" "}
                      {diffResult.unchanged.length} lines
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Diff Result</Label>
                      <button
                        onClick={copyDiff}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-1 font-mono text-sm">
                          {diffResult.removed.map((line, index) => (
                            <div
                              key={`removed-${index}`}
                              className="text-red-600 bg-red-50 p-1 rounded"
                            >
                              {line}
                            </div>
                          ))}
                          {diffResult.added.map((line, index) => (
                            <div
                              key={`added-${index}`}
                              className="text-green-600 bg-green-50 p-1 rounded"
                            >
                              {line}
                            </div>
                          ))}
                          {diffResult.unchanged.map((line, index) => (
                            <div
                              key={`unchanged-${index}`}
                              className="text-gray-600 p-1"
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </MotionDiv>

        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={isComplete}
          error={error}
        />

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Recent History</h3>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{entry.text1}</p>
                          <Badge variant="secondary">{entry.mode}</Badge>
                        </div>
                        <p className="text-gray-500 mt-1 truncate">
                          {entry.text2}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setText1(entry.text1);
                          setText2(entry.text2);
                          setDiffMode(entry.mode);
                          toast.success("Settings restored from history");
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Restore
                      </button>
                    </div>
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
