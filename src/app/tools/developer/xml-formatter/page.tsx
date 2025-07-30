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
 * XML formatter tool for formatting and validating XML code
 */
export default function XmlFormatterPage() {
  const animationsEnabled = useAnimations();
  const [inputXml, setInputXml] = useLocalStorage("xml-formatter-input", "");
  const [formattedXml, setFormattedXml] = useState("");
  const [operation, setOperation] = useLocalStorage(
    "xml-formatter-operation",
    "format",
  );
  const [indentSize, setIndentSize] = useLocalStorage(
    "xml-formatter-indent",
    "2",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; operation: string; timestamp: number }>
  >("xml-formatter-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Format XML with proper indentation
   */
  const formatXml = (xml: string, indent: string): string => {
    const indentSize = parseInt(indent);
    const indentStr = " ".repeat(indentSize);

    let formatted = xml.trim();

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, " ");

    // Add line breaks after tags
    formatted = formatted.replace(/>/g, ">\n");
    formatted = formatted.replace(/</g, "\n<");

    // Split into lines and process
    const lines = formatted.split("\n").filter((line) => line.trim());
    let currentIndent = 0;
    const formattedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Handle closing tags
      if (trimmed.startsWith("</")) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      // Add indentation
      formattedLines.push(indentStr.repeat(currentIndent) + trimmed);

      // Handle opening tags (but not self-closing)
      if (
        trimmed.startsWith("<") &&
        !trimmed.startsWith("</") &&
        !trimmed.endsWith("/>")
      ) {
        currentIndent++;
      }
    }

    return formattedLines.join("\n");
  };

  /**
   * Validate XML structure
   */
  const validateXml = (xml: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = xml.split("\n");

    // Check for XML declaration
    const hasDeclaration = /<\?xml/.test(xml);
    if (!hasDeclaration) {
      errors.push('Missing XML declaration (<?xml version="1.0"?>)');
    }

    // Check for balanced tags
    const openTags: string[] = [];
    const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)/g;
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      const isClosing = match[1] === "/";
      const tagName = match[2];

      if (isClosing) {
        if (openTags.length === 0 || openTags.pop() !== tagName) {
          errors.push(`Mismatched closing tag: </${tagName}>`);
        }
      } else {
        openTags.push(tagName);
      }
    }

    if (openTags.length > 0) {
      errors.push(`Unclosed tags: ${openTags.join(", ")}`);
    }

    // Check for proper attribute syntax
    const attrRegex = /<[^>]*\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*([^"'>\s]+)/g;
    while ((match = attrRegex.exec(xml)) !== null) {
      errors.push(`Attribute value should be quoted: ${match[1]}=${match[2]}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Minify XML by removing unnecessary whitespace
   */
  const minifyXml = (xml: string): string => {
    return xml
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/>\s+</g, "><") // Remove spaces between tags
      .replace(/\s*\/>/g, "/>") // Remove spaces before self-closing tags
      .trim();
  };

  /**
   * Extract XML structure information
   */
  const extractXmlInfo = (xml: string) => {
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)/g;
    const tags = new Set<string>();
    let match;

    while ((match = tagRegex.exec(xml)) !== null) {
      tags.add(match[1]);
    }

    const attrRegex = /([a-zA-Z][a-zA-Z0-9]*)\s*=\s*["'][^"']*["']/g;
    const attributes = new Set<string>();

    while ((match = attrRegex.exec(xml)) !== null) {
      attributes.add(match[1]);
    }

    return {
      tagCount: tags.size,
      tags: Array.from(tags),
      attributeCount: attributes.size,
      attributes: Array.from(attributes),
      hasDeclaration: /<\?xml/.test(xml),
      hasRoot: /<[a-zA-Z][a-zA-Z0-9]*[^>]*>/.test(xml),
    };
  };

  /**
   * Process XML based on operation
   */
  const processXml = () => {
    if (!inputXml.trim()) {
      toast.error("Please enter XML to process");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result = "";

      if (operation === "format") {
        result = formatXml(inputXml, indentSize);
        setFormattedXml(result);
      } else if (operation === "minify") {
        result = minifyXml(inputXml);
        setFormattedXml(result);
      } else if (operation === "validate") {
        const validation = validateXml(inputXml);
        setValidationResult(validation);
        result = validation.isValid
          ? "XML is valid"
          : `XML has ${validation.errors.length} errors`;
      } else if (operation === "analyze") {
        const info = extractXmlInfo(inputXml);
        setValidationResult(info);
        result = `Analyzed XML with ${info.tagCount} unique tags`;
      }

      setIsComplete(true);

      // Add to history
      const newEntry = {
        input:
          inputXml.length > 100 ? inputXml.substring(0, 100) + "..." : inputXml,
        operation,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`XML ${operation} completed successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process XML";
      setError(errorMessage);
      toast.error("Failed to process XML");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy formatted XML to clipboard
   */
  const copyXml = () => {
    navigator.clipboard.writeText(formattedXml);
    toast.success("XML copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputXml("");
    setFormattedXml("");
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
    <ToolLayout toolId="dev-xml-formatter">
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
                  <SelectItem value="format">Format XML</SelectItem>
                  <SelectItem value="minify">Minify XML</SelectItem>
                  <SelectItem value="validate">Validate XML</SelectItem>
                  <SelectItem value="analyze">Analyze XML</SelectItem>
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
              <TabsTrigger value="input">Input XML</TabsTrigger>
              <TabsTrigger
                value="output"
                disabled={!formattedXml && !validationResult}
              >
                Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input-xml">XML Code</Label>
                <Textarea
                  id="input-xml"
                  value={inputXml}
                  onChange={(e) => setInputXml(e.target.value)}
                  placeholder="Enter your XML code here..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <ActionButtons
                onGenerate={processXml}
                onClear={clearAll}
                generateLabel={
                  operation === "validate"
                    ? "Validate XML"
                    : operation === "analyze"
                      ? "Analyze XML"
                      : operation === "minify"
                        ? "Minify XML"
                        : "Format XML"
                }
                clearLabel="Clear All"
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value="output" className="space-y-4">
              {formattedXml && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Result</Label>
                    <button
                      onClick={copyXml}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                  <Textarea
                    value={formattedXml}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              )}

              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {operation === "validate"
                        ? "Validation Result"
                        : "XML Analysis"}
                      {operation === "validate" && (
                        <Badge
                          variant={
                            validationResult.isValid ? "default" : "destructive"
                          }
                        >
                          {validationResult.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {operation === "validate" ? (
                      validationResult.isValid ? (
                        <p className="text-green-600">XML is valid!</p>
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
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2">
                              Tags ({validationResult.tagCount})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {validationResult.tags.map(
                                (tag: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2">
                              Attributes ({validationResult.attributeCount})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {validationResult.attributes.map(
                                (attr: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {attr}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                validationResult.hasDeclaration
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {validationResult.hasDeclaration
                                ? "Has Declaration"
                                : "No Declaration"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                validationResult.hasRoot
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {validationResult.hasRoot
                                ? "Has Root"
                                : "No Root"}
                            </Badge>
                          </div>
                        </div>
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
                          setInputXml(entry.input);
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
