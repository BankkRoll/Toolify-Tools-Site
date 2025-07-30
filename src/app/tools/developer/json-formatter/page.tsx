"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { FileUploadZone } from "@/components/tools/file-upload-zone";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Braces, CheckCircle, FileText, XCircle } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * JSON formatter tool page
 */
export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState("");
  const [outputJson, setOutputJson] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  const [history] = useLocalStorage<string[]>("json-formatter-history", []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const aboutRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });

  /**
   * Formats JSON with proper indentation
   */
  const formatJson = () => {
    if (!inputJson.trim()) {
      toast.error("Please enter JSON to format");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutputJson(formatted);
      setValidationResult({ isValid: true, message: "Valid JSON" });
      setIsComplete(true);
      toast.success("JSON formatted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid JSON";
      setError(errorMessage);
      setValidationResult({ isValid: false, message: errorMessage });
      toast.error("Invalid JSON format");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Minifies JSON by removing whitespace
   */
  const minifyJson = () => {
    if (!inputJson.trim()) {
      toast.error("Please enter JSON to minify");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setOutputJson(minified);
      setValidationResult({ isValid: true, message: "Valid JSON" });
      setIsComplete(true);
      toast.success("JSON minified successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid JSON";
      setError(errorMessage);
      setValidationResult({ isValid: false, message: errorMessage });
      toast.error("Invalid JSON format");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Validates JSON without formatting
   */
  const validateJson = () => {
    if (!inputJson.trim()) {
      toast.error("Please enter JSON to validate");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      JSON.parse(inputJson);
      setValidationResult({ isValid: true, message: "Valid JSON" });
      setIsComplete(true);
      toast.success("JSON is valid");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid JSON";
      setError(errorMessage);
      setValidationResult({ isValid: false, message: errorMessage });
      toast.error("Invalid JSON format");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles file upload and reads JSON content
   */
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const file = files[0];
      const text = await file.text();
      setInputJson(text);
      setSelectedFiles(files);
      setIsComplete(true);
      toast.success("File loaded successfully");
    } catch (err) {
      setError("Failed to read file");
      toast.error("Failed to read file");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setInputJson("");
    setOutputJson("");
    setSelectedFiles([]);
    setError(null);
    setIsComplete(false);
    setValidationResult(null);
  };

  /**
   * Gets download data for the output
   */
  const getDownloadData = (): string => {
    return outputJson || inputJson;
  };

  /**
   * Gets download filename based on operation
   */
  const getDownloadFilename = (): string => {
    return outputJson ? "formatted.json" : "input.json";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="developer-json-formatter">
      <MotionDiv
        ref={containerRef}
        className="space-y-6"
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled
            ? containerInView
              ? "visible"
              : "hidden"
            : undefined
        }
      >
        <MotionDiv
          ref={inputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? inputSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Braces className="h-5 w-5" />
                JSON Input
              </CardTitle>
              <CardDescription>
                Enter JSON data or upload a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text Input</TabsTrigger>
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jsonInput">JSON Data</Label>
                    <Textarea
                      id="jsonInput"
                      value={inputJson}
                      onChange={(e) => setInputJson(e.target.value)}
                      placeholder='{"example": "JSON data here"}'
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <FileUploadZone
                    onFilesSelected={handleFileUpload}
                    accept=".json,application/json"
                    multiple={false}
                    files={selectedFiles}
                    onRemoveFile={() => {
                      setSelectedFiles([]);
                      setInputJson("");
                      setError(null);
                      setIsComplete(false);
                      setValidationResult(null);
                    }}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <ActionButtons
                  onGenerate={formatJson}
                  generateLabel="Format JSON"
                  onReset={minifyJson}
                  resetLabel="Minify JSON"
                  variant="outline"
                  size="sm"
                  disabled={!inputJson.trim() || isProcessing}
                  isGenerating={isProcessing}
                />
              </div>

              {validationResult && (
                <MotionDiv
                  className="flex items-center gap-2 p-3 rounded-lg border"
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {validationResult.message}
                  </span>
                  <Badge
                    variant={
                      validationResult.isValid ? "default" : "destructive"
                    }
                  >
                    {validationResult.isValid ? "Valid" : "Invalid"}
                  </Badge>
                </MotionDiv>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={outputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? outputSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                JSON Output
              </CardTitle>
              <CardDescription>
                Formatted or minified JSON result
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {outputJson ? (
                <MotionDiv
                  className="space-y-4"
                  initial={
                    animationsEnabled ? { opacity: 0, y: 10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className="space-y-2">
                    <Label>Formatted JSON</Label>
                    <div className="p-3 bg-muted rounded-lg max-h-96 overflow-auto">
                      <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                        {outputJson}
                      </pre>
                    </div>
                  </div>

                  <ActionButtons
                    copyText={outputJson}
                    copySuccessMessage="JSON copied to clipboard"
                    downloadData={getDownloadData()}
                    downloadFilename={getDownloadFilename()}
                    downloadMimeType="application/json"
                    onGenerate={validateJson}
                    generateLabel="Validate JSON"
                    variant="outline"
                    size="sm"
                  />
                </MotionDiv>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Enter JSON and click format to see output
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={aboutRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled ? (aboutInView ? "visible" : "hidden") : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>About JSON Formatting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className="font-medium mb-2">JSON Formatting</h4>
                  <p className="text-muted-foreground">
                    JSON formatting adds proper indentation and spacing to make
                    JSON data more readable. This is useful for debugging,
                    documentation, and human-readable data storage.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">JSON Minification</h4>
                  <p className="text-muted-foreground">
                    JSON minification removes all unnecessary whitespace to
                    reduce file size. This is essential for production
                    environments where bandwidth and storage efficiency matter.
                  </p>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText="Processing JSON..."
            completeText="JSON processing complete!"
            errorText="JSON processing failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
