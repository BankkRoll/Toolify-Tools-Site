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
import { Binary, FileText, History, Info, Zap } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("text");

  const [history, setHistory] = useLocalStorage<string[]>("base64-history", []);
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
      setHistory(
        [`Text encoded: ${inputText.substring(0, 20)}...`, ...history].slice(
          0,
          10,
        ),
      );
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
      setHistory(
        [`Text decoded: ${decoded.substring(0, 20)}...`, ...history].slice(
          0,
          10,
        ),
      );
      toast.success("Text decoded successfully");
    } catch (err) {
      setError("Invalid Base64 format");
      toast.error("Invalid Base64 format");
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
      setHistory([`File encoded: ${file.name}`, ...history].slice(0, 10));
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
    if (!fileOutput.trim()) {
      toast.error("Please encode a file first");
      return;
    }

    try {
      const decoded = atob(fileOutput);
      const uint8Array = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        uint8Array[i] = decoded.charCodeAt(i);
      }
      const blob = new Blob([uint8Array]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "decoded_file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File decoded and downloaded");
    } catch (err) {
      setError("Failed to decode file");
      toast.error("Failed to decode file");
    }
  };

  /**
   * Clears all input and output
   */
  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setSelectedFiles([]);
    setFileOutput("");
    setError(null);
    setIsComplete(false);
    setIsProcessing(false);
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
   * Gets copy text with type information
   */
  const getCopyText = (text: string, type: string): string => {
    return `${type}:\n${text}`;
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
    <ToolLayout toolId="dev-base64">
      <MotionDiv
        ref={containerRef}
        className="space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6"
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
        {/* Main Content */}
        <MotionDiv
          ref={textSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
        >
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-4 sm:pb-6">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col space-y-4 sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Binary className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="truncate">Base64 Encoder/Decoder</span>
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      Convert text and files to Base64 encoding
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <ActionButtons
                    onGenerate={activeTab === "text" ? encodeText : encodeFile}
                    generateLabel={activeTab === "text" ? "Encode" : "Encode"}
                    onReset={activeTab === "text" ? decodeText : decodeFile}
                    resetLabel={activeTab === "text" ? "Decode" : "Decode"}
                    onClear={clearAll}
                    clearLabel="Clear"
                    variant="outline"
                    size="sm"
                    disabled={
                      activeTab === "text"
                        ? !inputText.trim()
                        : selectedFiles.length === 0
                    }
                  />
                </div>
              </div>

              {/* Desktop: Side-by-side layout */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Binary className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Base64 Encoder/Decoder
                    </CardTitle>
                    <CardDescription>
                      Convert text and files to Base64 encoding or decode Base64
                      back to original format
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ActionButtons
                    onGenerate={activeTab === "text" ? encodeText : encodeFile}
                    generateLabel={
                      activeTab === "text" ? "Encode" : "Encode File"
                    }
                    onReset={activeTab === "text" ? decodeText : decodeFile}
                    resetLabel={activeTab === "text" ? "Decode" : "Decode File"}
                    onClear={clearAll}
                    clearLabel="Clear All"
                    variant="outline"
                    size="sm"
                    disabled={
                      activeTab === "text"
                        ? !inputText.trim()
                        : selectedFiles.length === 0
                    }
                  />
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full mt-4 sm:mt-6"
              >
                <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
                  <TabsTrigger
                    value="text"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Text</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="file"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Binary className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">File</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsContent
                  value="text"
                  className="space-y-4 sm:space-y-6 mt-0"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* Input Section */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="input"
                          className="text-sm font-medium flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span>Input Text</span>
                        </Label>
                        <Textarea
                          id="input"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Enter text to encode or Base64 to decode..."
                          className="min-h-[120px] sm:min-h-[160px] lg:min-h-[200px] font-mono text-xs sm:text-sm resize-none border-2 focus:border-primary transition-colors"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{inputText.length} characters</span>
                          {inputText && (
                            <Badge
                              variant={
                                isValidBase64(inputText)
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {isValidBase64(inputText)
                                ? "Valid Base64"
                                : "Plain Text"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Binary className="h-4 w-4 flex-shrink-0" />
                          <span>Output</span>
                        </Label>
                        {outputText ? (
                          <MotionDiv
                            className="space-y-3"
                            initial={
                              animationsEnabled
                                ? { opacity: 0, y: 10 }
                                : undefined
                            }
                            animate={
                              animationsEnabled
                                ? { opacity: 1, y: 0 }
                                : undefined
                            }
                            transition={
                              animationsEnabled ? { duration: 0.3 } : undefined
                            }
                          >
                            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border-2 border-primary/20 max-h-[120px] sm:max-h-[160px] lg:max-h-[200px] overflow-auto">
                              <pre className="font-mono text-xs sm:text-sm break-all whitespace-pre-wrap leading-relaxed">
                                {outputText}
                              </pre>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{outputText.length} characters</span>
                              <Badge variant="outline" className="text-xs">
                                {isValidBase64(outputText)
                                  ? "Base64"
                                  : "Decoded"}
                              </Badge>
                            </div>
                            <ActionButtons
                              copyText={outputText}
                              variant="outline"
                              size="sm"
                            />
                          </MotionDiv>
                        ) : (
                          <div className="flex items-center justify-center h-[120px] sm:h-[160px] lg:h-[200px] border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="text-center p-4">
                              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Enter text and click encode/decode to see output
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="file"
                  className="space-y-4 sm:space-y-6 mt-0"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {/* File Upload Section */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span>Select File</span>
                        </Label>
                        <FileUploadZone
                          onFilesSelected={setSelectedFiles}
                          files={selectedFiles}
                          onRemoveFile={(index) => {
                            const newFiles = [...selectedFiles];
                            newFiles.splice(index, 1);
                            setSelectedFiles(newFiles);
                          }}
                          accept="*/*"
                          multiple={false}
                          maxSize={10 * 1024 * 1024} // 10MB
                        />
                      </div>
                    </div>

                    {/* File Output Section */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Binary className="h-4 w-4 flex-shrink-0" />
                          <span>Encoded File</span>
                        </Label>
                        {fileOutput ? (
                          <MotionDiv
                            className="space-y-3"
                            initial={
                              animationsEnabled
                                ? { opacity: 0, y: 10 }
                                : undefined
                            }
                            animate={
                              animationsEnabled
                                ? { opacity: 1, y: 0 }
                                : undefined
                            }
                            transition={
                              animationsEnabled ? { duration: 0.3 } : undefined
                            }
                          >
                            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border-2 border-primary/20 max-h-[120px] sm:max-h-[160px] lg:max-h-[200px] overflow-auto">
                              <pre className="font-mono text-xs break-all whitespace-pre-wrap leading-relaxed">
                                {fileOutput}
                              </pre>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{fileOutput.length} characters</span>
                              <Badge variant="outline" className="text-xs">
                                Base64 Encoded
                              </Badge>
                            </div>
                            <ActionButtons
                              copyText={fileOutput}
                              onDownload={decodeFile}
                              variant="outline"
                              size="sm"
                            />
                          </MotionDiv>
                        ) : (
                          <div className="flex items-center justify-center h-[120px] sm:h-[160px] lg:h-[200px] border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="text-center p-4">
                              <Binary className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Select a file and click encode to see output
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* History Section */}
        {history.length > 0 && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card className="shadow-md border-0 overflow-hidden">
              <CardHeader className="p-4 sm:p-6 pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <History className="h-5 w-5 text-primary" />
                  Recent Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-2">
                  {history.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {item}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {/* About Section */}
        <MotionDiv
          ref={aboutRef}
          variants={animationsEnabled ? cardVariants : undefined}
        >
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Info className="h-5 w-5 text-primary" />
                About Base64 Encoding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-sm">
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className="font-semibold mb-3 text-primary">
                    What is Base64?
                  </h4>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Base64 is a binary-to-text encoding scheme that represents
                    binary data in an ASCII string format. It's commonly used
                    for transmitting data over text-based protocols like HTTP,
                    email, and JSON.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-semibold mb-3 text-primary">
                    Common Uses
                  </h4>
                  <ul className="text-muted-foreground space-y-2 text-sm sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Embedding images in HTML/CSS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>API data transmission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Email attachments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1 flex-shrink-0">•</span>
                      <span>Data storage in databases</span>
                    </li>
                  </ul>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
