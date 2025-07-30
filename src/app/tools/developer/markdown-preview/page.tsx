"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

/**
 * Markdown Preview tool for live Markdown editing and previewing
 */
export default function MarkdownPreviewPage() {
  const animationsEnabled = useAnimations();
  const [markdown, setMarkdown] = useLocalStorage(
    "markdown-preview-input",
    "# Hello, Markdown!\n\nType your *Markdown* here.",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ markdown: string; timestamp: number }>
  >("markdown-preview-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Copy the rendered HTML to clipboard
   */
  const handleCopy = async () => {
    try {
      setIsProcessing(true);
      const html =
        document.getElementById("markdown-preview-html")?.innerHTML || "";
      await navigator.clipboard.writeText(html);
      toast.success("HTML copied to clipboard");
      setIsComplete(true);
    } catch (e) {
      setError("Failed to copy HTML");
      toast.error("Failed to copy HTML");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsComplete(false), 1200);
    }
  };

  /**
   * Download the rendered HTML as a file
   */
  const handleDownload = () => {
    try {
      setIsProcessing(true);
      const html =
        document.getElementById("markdown-preview-html")?.innerHTML || "";
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "markdown-preview.html";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("HTML downloaded");
      setIsComplete(true);
    } catch (e) {
      setError("Failed to download HTML");
      toast.error("Failed to download HTML");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsComplete(false), 1200);
    }
  };

  /**
   * Save current markdown to history
   */
  const saveToHistory = () => {
    setHistory([{ markdown, timestamp: Date.now() }, ...history.slice(0, 9)]);
    toast.success("Saved to history");
  };

  return (
    <ToolLayout toolId="dev-markdown-preview">
      <MotionDiv
        ref={containerRef}
        variants={{
          hidden: { opacity: 0, y: 32 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={isInView && animationsEnabled ? "visible" : "hidden"}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Markdown Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={14}
              className="font-mono resize-vertical"
              placeholder="Type your Markdown here..."
              aria-label="Markdown input"
            />
            <div className="flex gap-2 mt-4">
              <ActionButtons
                onGenerate={saveToHistory}
                generateLabel="Save to History"
                isGenerating={isProcessing}
                onCopy={handleCopy}
                onDownload={handleDownload}
                copyText="Copy HTML"
                saveLabel="Download HTML"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="markdown-preview-html"
              className="prose max-w-none min-h-[300px] bg-background rounded p-4 border"
              aria-label="Markdown preview"
            >
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </MotionDiv>
      <MotionDiv
        variants={{
          hidden: { opacity: 0, y: 32 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={isInView && animationsEnabled ? "visible" : "hidden"}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8"
      >
        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={isComplete}
          error={error}
        />
        {history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {history.map((item, idx) => (
                  <li key={item.timestamp} className="flex items-center gap-2">
                    <button
                      className="text-xs underline text-primary hover:text-primary/80"
                      onClick={() => setMarkdown(item.markdown)}
                    >
                      Load
                    </button>
                    <span className="truncate text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </MotionDiv>
    </ToolLayout>
  );
}
