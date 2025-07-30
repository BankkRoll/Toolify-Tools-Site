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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * YAML formatter tool for formatting and validating YAML code
 */
export default function YamlPage() {
  const animationsEnabled = useAnimations();
  const [inputYaml, setInputYaml] = useLocalStorage("yaml-input", "");
  const [formattedYaml, setFormattedYaml] = useState("");
  const [operation, setOperation] = useLocalStorage("yaml-operation", "format");
  const [indentSize, setIndentSize] = useLocalStorage("yaml-indent", "2");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; operation: string; timestamp: number }>
  >("yaml-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Simple YAML formatter
   */
  const formatYaml = (yaml: string, indent: string): string => {
    const lines = yaml.split("\n");
    const indentSize = parseInt(indent);
    const indentStr = " ".repeat(indentSize);
    let formattedLines: string[] = [];
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push("");
        continue;
      }

      // Handle list items
      if (trimmed.startsWith("- ")) {
        formattedLines.push(indentStr.repeat(currentIndent) + trimmed);
        continue;
      }

      // Handle key-value pairs
      if (trimmed.includes(":")) {
        const colonIndex = trimmed.indexOf(":");
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (value) {
          formattedLines.push(
            indentStr.repeat(currentIndent) + `${key}: ${value}`,
          );
        } else {
          formattedLines.push(indentStr.repeat(currentIndent) + `${key}:`);
          currentIndent++;
        }
      } else {
        formattedLines.push(indentStr.repeat(currentIndent) + trimmed);
      }
    }

    return formattedLines.join("\n");
  };

  /**
   * Validate YAML structure
   */
  const validateYaml = (
    yaml: string,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = yaml.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) continue;

      // Check for basic YAML syntax
      if (
        trimmed.includes(":") &&
        !trimmed.includes('"') &&
        !trimmed.includes("'")
      ) {
        const colonIndex = trimmed.indexOf(":");
        const key = trimmed.substring(0, colonIndex).trim();

        if (!key) {
          errors.push(`Line ${i + 1}: Invalid key format`);
        }
      }

      // Check for unclosed quotes
      const singleQuotes = (trimmed.match(/'/g) || []).length;
      const doubleQuotes = (trimmed.match(/"/g) || []).length;

      if (singleQuotes % 2 !== 0) {
        errors.push(`Line ${i + 1}: Unclosed single quotes`);
      }

      if (doubleQuotes % 2 !== 0) {
        errors.push(`Line ${i + 1}: Unclosed double quotes`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Convert YAML to JSON
   */
  const yamlToJson = (yaml: string): string => {
    // Simple YAML to JSON conversion
    let json = yaml
      .replace(/^\s*-\s*/gm, "") // Remove list markers
      .replace(/:\s*$/gm, ": null") // Add null for empty values
      .replace(/:\s*"/g, ': "') // Fix quotes
      .replace(/"\s*$/gm, '",') // Add commas
      .replace(/,\s*$/gm, ""); // Remove trailing commas

    return `{\n${json}\n}`;
  };

  /**
   * Process YAML based on operation
   */
  const processYaml = () => {
    if (!inputYaml.trim()) {
      toast.error("Please enter YAML to process");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result = "";

      if (operation === "format") {
        result = formatYaml(inputYaml, indentSize);
        setFormattedYaml(result);
      } else if (operation === "validate") {
        const validation = validateYaml(inputYaml);
        setValidationResult(validation);
        result = validation.isValid
          ? "YAML is valid"
          : `YAML has ${validation.errors.length} errors`;
      } else if (operation === "to-json") {
        result = yamlToJson(inputYaml);
        setFormattedYaml(result);
      }

      setIsComplete(true);

      // Add to history
      const newEntry = {
        input:
          inputYaml.length > 100
            ? inputYaml.substring(0, 100) + "..."
            : inputYaml,
        operation,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`YAML ${operation} completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process YAML";
      setError(errorMessage);
      toast.error("Failed to process YAML");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy formatted YAML to clipboard
   */
  const copyYaml = () => {
    navigator.clipboard.writeText(formattedYaml);
    toast.success("YAML copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputYaml("");
    setFormattedYaml("");
    setIsComplete(false);
    setError(null);
    setValidationResult(null);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-yaml">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format YAML</SelectItem>
                  <SelectItem value="validate">Validate YAML</SelectItem>
                  <SelectItem value="to-json">Convert to JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operation === "format" && (
              <div className="space-y-2">
                <Label htmlFor="indent-size">Indent Size</Label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Spaces</SelectItem>
                    <SelectItem value="4">4 Spaces</SelectItem>
                    <SelectItem value="8">8 Spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input YAML</TabsTrigger>
              <TabsTrigger
                value="output"
                disabled={!formattedYaml && !validationResult}
              >
                Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-yaml">YAML Code</Label>
                <Textarea
                  id="input-yaml"
                  value={inputYaml}
                  onChange={(e) => setInputYaml(e.target.value)}
                  placeholder="Enter your YAML code here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <ActionButtons
                onGenerate={processYaml}
                onClear={clearAll}
                generateLabel={
                  operation === "validate"
                    ? "Validate YAML"
                    : operation === "to-json"
                      ? "Convert to JSON"
                      : "Format YAML"
                }
                clearLabel="Clear All"
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              {formattedYaml && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Result</Label>
                    <button
                      onClick={copyYaml}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                  <Textarea
                    value={formattedYaml}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              )}

              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Validation Result
                      <Badge
                        variant={
                          validationResult.isValid ? "default" : "destructive"
                        }
                      >
                        {validationResult.isValid ? "Valid" : "Invalid"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {validationResult.isValid ? (
                      <p className="text-green-600">YAML is valid!</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-red-600 font-medium">
                          Found {validationResult.errors.length} errors:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.errors.map(
                            (error: string, index: number) => (
                              <li key={index} className="text-red-600">
                                {error}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                          <Badge variant="secondary">{entry.operation}</Badge>
                        </div>
                        <p className="text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputYaml(entry.input);
                          setOperation(entry.operation);
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
