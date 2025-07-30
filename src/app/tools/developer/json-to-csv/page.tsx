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

/**
 * JSON to CSV converter tool for transforming JSON arrays into CSV format
 */
export default function JsonToCsvPage() {
  const animationsEnabled = useAnimations();
  const [jsonInput, setJsonInput] = useLocalStorage(
    "json-to-csv-input",
    '[{"name":"John","age":30},{"name":"Jane","age":25}]',
  );
  const [csvOutput, setCsvOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ json: string; csv: string; timestamp: number }>
  >("json-to-csv-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Convert JSON array to CSV string
   * @param jsonStr JSON string representing an array of objects
   */
  const convertToCsv = (jsonStr: string): string => {
    try {
      const arr = JSON.parse(jsonStr);
      if (
        !Array.isArray(arr) ||
        arr.length === 0 ||
        typeof arr[0] !== "object"
      ) {
        throw new Error("Input must be a JSON array of objects");
      }
      const headers = Object.keys(arr[0]);
      const csvRows = [headers.join(",")];
      for (const obj of arr) {
        const row = headers.map((h) => {
          const val = obj[h];
          if (val === null || val === undefined) return "";
          if (
            typeof val === "string" &&
            (val.includes(",") || val.includes('"') || val.includes("\n"))
          ) {
            return '"' + val.replace(/"/g, '""') + '"';
          }
          return String(val);
        });
        csvRows.push(row.join(","));
      }
      return csvRows.join("\n");
    } catch (e: any) {
      throw new Error(e.message || "Invalid JSON input");
    }
  };

  /**
   * Handle conversion and update state
   */
  const handleConvert = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);
    try {
      const csv = convertToCsv(jsonInput);
      setCsvOutput(csv);
      setHistory([
        { json: jsonInput, csv, timestamp: Date.now() },
        ...history.slice(0, 9),
      ]);
      setIsComplete(true);
      toast.success("Converted to CSV");
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsComplete(false), 1200);
    }
  };

  /**
   * Copy CSV output to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvOutput);
      toast.success("CSV copied to clipboard");
    } catch {
      toast.error("Failed to copy CSV");
    }
  };

  /**
   * Download CSV output as a file
   */
  const handleDownload = () => {
    try {
      const blob = new Blob([csvOutput], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to download CSV");
    }
  };

  return (
    <ToolLayout toolId="dev-json-to-csv">
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
            <CardTitle>JSON Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={14}
              className="font-mono resize-vertical"
              placeholder='[{"name":"John","age":30},{"name":"Jane","age":25}]'
              aria-label="JSON input"
            />
            <div className="flex gap-2 mt-4">
              <ActionButtons
                onGenerate={handleConvert}
                generateLabel="Convert to CSV"
                isGenerating={isProcessing}
                onCopy={handleCopy}
                onDownload={handleDownload}
                copyText="Copy CSV"
                saveLabel="Download CSV"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>CSV Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={csvOutput}
              readOnly
              rows={14}
              className="font-mono bg-muted/50 resize-vertical"
              aria-label="CSV output"
            />
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
                      onClick={() => {
                        setJsonInput(item.json);
                        setCsvOutput(item.csv);
                      }}
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
