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
 * CSS minifier tool for compressing CSS code
 */
export default function CssMinifierPage() {
  const animationsEnabled = useAnimations();
  const [inputCss, setInputCss] = useLocalStorage("css-minifier-input", "");
  const [minifiedCss, setMinifiedCss] = useState("");
  const [minifyLevel, setMinifyLevel] = useLocalStorage(
    "css-minifier-level",
    "basic",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [minifiedSize, setMinifiedSize] = useState(0);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; output: string; level: string; timestamp: number }>
  >("css-minifier-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Minify CSS with specified level
   */
  const minifyCss = (css: string, level: string): string => {
    let minified = css;

    // Basic minification
    if (level === "basic" || level === "advanced" || level === "extreme") {
      // Remove comments
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, "");

      // Remove extra whitespace
      minified = minified.replace(/\s+/g, " ");

      // Remove whitespace around certain characters
      minified = minified.replace(/\s*([{}:;,>+~])\s*/g, "$1");

      // Remove leading/trailing whitespace
      minified = minified.trim();
    }

    // Advanced minification
    if (level === "advanced" || level === "extreme") {
      // Remove unnecessary semicolons
      minified = minified.replace(/;}/g, "}");

      // Remove leading zeros
      minified = minified.replace(/0\./g, ".");
      minified = minified.replace(/ 0px/g, " 0");
      minified = minified.replace(/ 0em/g, " 0");
      minified = minified.replace(/ 0rem/g, " 0");

      // Shorten color values
      minified = minified.replace(
        /#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g,
        "#$1$2$3",
      );
      minified = minified.replace(/rgb\(0,\s*0,\s*0\)/g, "#000");
      minified = minified.replace(/rgb\(255,\s*255,\s*255\)/g, "#fff");
    }

    // Extreme minification
    if (level === "extreme") {
      // Remove vendor prefixes for modern browsers
      minified = minified.replace(/-webkit-|-moz-|-ms-|-o-/g, "");

      // Remove empty rules
      minified = minified.replace(/[^{}]+\{\s*\}/g, "");

      // Remove unnecessary units
      minified = minified.replace(/(\d+)px/g, "$1");
      minified = minified.replace(/(\d+)em/g, "$1em");
      minified = minified.replace(/(\d+)rem/g, "$1rem");
    }

    return minified;
  };

  /**
   * Minify the CSS input
   */
  const minifyCssInput = () => {
    if (!inputCss.trim()) {
      toast.error("Please enter CSS to minify");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const minified = minifyCss(inputCss, minifyLevel);
      setMinifiedCss(minified);

      // Calculate sizes
      const original = new Blob([inputCss]).size;
      const minifiedBlob = new Blob([minified]).size;
      setOriginalSize(original);
      setMinifiedSize(minifiedBlob);

      setIsComplete(true);

      // Add to history
      const newEntry = {
        input:
          inputCss.length > 100 ? inputCss.substring(0, 100) + "..." : inputCss,
        output:
          minified.length > 100 ? minified.substring(0, 100) + "..." : minified,
        level: minifyLevel,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      const reduction = (((original - minifiedBlob) / original) * 100).toFixed(
        1,
      );
      toast.success(`CSS minified successfully! Size reduced by ${reduction}%`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to minify CSS";
      setError(errorMessage);
      toast.error("Failed to minify CSS");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy minified CSS to clipboard
   */
  const copyMinifiedCss = () => {
    navigator.clipboard.writeText(minifiedCss);
    toast.success("Minified CSS copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputCss("");
    setMinifiedCss("");
    setIsComplete(false);
    setError(null);
    setOriginalSize(0);
    setMinifiedSize(0);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout
      title="CSS Minifier"
      description="Compress CSS code by removing unnecessary whitespace and characters"
      toolId="dev-css-minifier"
    >
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="minify-level">Minification Level</Label>
            <Select value={minifyLevel} onValueChange={setMinifyLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  Basic (Remove comments & whitespace)
                </SelectItem>
                <SelectItem value="advanced">
                  Advanced (Remove zeros & shorten colors)
                </SelectItem>
                <SelectItem value="extreme">
                  Extreme (Remove prefixes & empty rules)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input CSS</TabsTrigger>
              <TabsTrigger value="output" disabled={!minifiedCss}>
                Minified CSS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-css">CSS Code</Label>
                <Textarea
                  id="input-css"
                  value={inputCss}
                  onChange={(e) => setInputCss(e.target.value)}
                  placeholder="Enter your CSS code here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <ActionButtons
                onGenerate={minifyCssInput}
                onClear={clearAll}
                generateLabel="Minify CSS"
                clearLabel="Clear All"
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              {minifiedCss && (
                <>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Original:</span>{" "}
                      {originalSize} bytes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Minified:</span>{" "}
                      {minifiedSize} bytes
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Reduction:</span>{" "}
                      {(
                        ((originalSize - minifiedSize) / originalSize) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="minified-css">Minified CSS</Label>
                      <button
                        onClick={copyMinifiedCss}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    <Textarea
                      id="minified-css"
                      value={minifiedCss}
                      readOnly
                      className="min-h-[300px] font-mono text-sm"
                    />
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
                          <p className="font-medium truncate">{entry.input}</p>
                          <Badge variant="secondary">{entry.level}</Badge>
                        </div>
                        <p className="text-gray-500 mt-1">{entry.output}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputCss(entry.input);
                          setMinifyLevel(entry.level);
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
