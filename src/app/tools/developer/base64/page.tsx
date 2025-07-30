"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { FileUploadZone } from "@/components/tools/file-upload-zone";
import { ProcessingStatus } from "@/components/tools/processing-status";
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
import { Binary, FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Base64 encoder/decoder tool page
 */
export default function Base64EncoderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileOutput, setFileOutput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history] = useLocalStorage<string[]>("base64-history", []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const textSectionRef = useRef(null);
  const fileSectionRef = useRef(null);
  const aboutRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const textSectionInView = useInView(textSectionRef, {
    once: true,
    amount: 0.2,
  });
  const fileSectionInView = useInView(fileSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });

  /**
   * Encodes text to Base64
   */
  const encodeText = () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to encode");
      return;
    }

    try {
      const encoded = btoa(inputText);
      setOutputText(encoded);
      setError(null);
      setIsComplete(true);
      toast.success("Text encoded successfully");
    } catch (err) {
      setError("Failed to encode text");
      toast.error("Failed to encode text");
    }
  };

  /**
   * Decodes Base64 text
   */
  const decodeText = () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to decode");
      return;
    }

    try {
      const decoded = atob(inputText);
      setOutputText(decoded);
      setError(null);
      setIsComplete(true);
      toast.success("Text decoded successfully");
    } catch (err) {
      setError("Invalid Base64 string");
      toast.error("Invalid Base64 string");
    }
  };

  /**
   * Encodes file to Base64
   */
  const encodeFile = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select a file to encode");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const file = selectedFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(uint8Array, (byte) =>
        String.fromCharCode(byte),
      ).join("");
      const encoded = btoa(binaryString);

      setFileOutput(encoded);
      setIsComplete(true);
      toast.success("File encoded successfully");
    } catch (err) {
      setError("Failed to encode file");
      toast.error("Failed to encode file");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Decodes Base64 file
   */
  const decodeFile = () => {
    if (!inputText.trim()) {
      toast.error("Please enter Base64 data to decode");
      return;
    }

    try {
      const decoded = atob(inputText);
      setFileOutput(decoded);
      setError(null);
      setIsComplete(true);
      toast.success("File decoded successfully");
    } catch (err) {
      setError("Invalid Base64 data");
      toast.error("Invalid Base64 data");
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setSelectedFiles([]);
    setFileOutput("");
    setError(null);
    setIsComplete(false);
  };

  /**
   * Validates if string is valid Base64
   */
  const isValidBase64 = (str: string): boolean => {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  };

  /**
   * Gets copy text for different outputs
   */
  const getCopyText = (text: string, type: string): string => {
    return `${type}: ${text}`;
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
    <ToolLayout toolId="developer-base64">
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
          ref={textSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? textSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Binary className="h-5 w-5" />
                Text Encoding/Decoding
              </CardTitle>
              <CardDescription>
                Encode text to Base64 or decode Base64 to text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input">Input Text</Label>
                <Textarea
                  id="input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to encode or Base64 to decode..."
                  className="min-h-[120px] font-mono"
                />
              </div>

              <div className="flex gap-2">
                <ActionButtons
                  onGenerate={encodeText}
                  generateLabel="Encode to Base64"
                  onReset={decodeText}
                  resetLabel="Decode from Base64"
                  variant="outline"
                  size="sm"
                  disabled={!inputText.trim()}
                />
              </div>

              {outputText && (
                <MotionDiv
                  className="space-y-2"
                  initial={
                    animationsEnabled ? { opacity: 0, y: 10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <Label>Output</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-mono text-sm break-all">{outputText}</p>
                  </div>
                  <ActionButtons
                    copyText={outputText}
                    copySuccessMessage="Output copied to clipboard"
                    variant="outline"
                    size="sm"
                  />
                </MotionDiv>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={fileSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? fileSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Encoding/Decoding
              </CardTitle>
              <CardDescription>
                Encode files to Base64 or decode Base64 to files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="encode" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="encode">Encode File</TabsTrigger>
                  <TabsTrigger value="decode">Decode File</TabsTrigger>
                </TabsList>

                <TabsContent value="encode" className="space-y-4">
                  <FileUploadZone
                    onFilesSelected={setSelectedFiles}
                    accept="*/*"
                    multiple={false}
                    files={selectedFiles}
                    onRemoveFile={() => {
                      setSelectedFiles([]);
                      setFileOutput("");
                      setError(null);
                      setIsComplete(false);
                    }}
                  />

                  <ActionButtons
                    onGenerate={encodeFile}
                    generateLabel="Encode File"
                    onReset={clearAll}
                    resetLabel="Clear All"
                    variant="outline"
                    size="sm"
                    disabled={selectedFiles.length === 0 || isProcessing}
                    isGenerating={isProcessing}
                  />
                </TabsContent>

                <TabsContent value="decode" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="base64Input">Base64 Data</Label>
                    <Textarea
                      id="base64Input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste Base64 encoded data here..."
                      className="min-h-[120px] font-mono"
                    />
                  </div>

                  <ActionButtons
                    onGenerate={decodeFile}
                    generateLabel="Decode File"
                    onReset={clearAll}
                    resetLabel="Clear All"
                    variant="outline"
                    size="sm"
                    disabled={!inputText.trim() || isProcessing}
                    isGenerating={isProcessing}
                  />
                </TabsContent>
              </Tabs>

              {fileOutput && (
                <MotionDiv
                  className="space-y-2"
                  initial={
                    animationsEnabled ? { opacity: 0, y: 10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <Label>File Output</Label>
                  <div className="p-3 bg-muted rounded-lg max-h-64 overflow-auto">
                    <p className="font-mono text-sm break-all">{fileOutput}</p>
                  </div>
                  <ActionButtons
                    copyText={fileOutput}
                    copySuccessMessage="File output copied to clipboard"
                    variant="outline"
                    size="sm"
                  />
                </MotionDiv>
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
              <CardTitle>About Base64</CardTitle>
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
                  <h4 className="font-medium mb-2">What is Base64?</h4>
                  <p className="text-muted-foreground">
                    Base64 is a binary-to-text encoding scheme that represents
                    binary data in an ASCII string format. It's commonly used
                    for encoding files, images, and other binary data for
                    transmission over text-based protocols.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">Common Uses:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Email attachments</li>
                    <li>• Data URLs in web pages</li>
                    <li>• API responses with binary data</li>
                    <li>• Configuration files</li>
                  </ul>
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
            processingText="Processing file..."
            completeText="File processing complete!"
            errorText="Processing failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
