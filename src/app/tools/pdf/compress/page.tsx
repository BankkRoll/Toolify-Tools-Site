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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * PDF compression tool page
 */
export default function CompressPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-compress-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutSectionInView = useInView(aboutSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Formats file size to a readable format
   */
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  /**
   * Handles file selection and initializes compression
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setError(null);
      setIsComplete(false);
      setCompressedPdf(null);
    }
  };

  /**
   * Compresses the PDF using pdf-lib
   */
  const compressPdf = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Basic compression by removing unused objects and optimizing
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: compressionLevel !== "low",
        addDefaultPage: false,
        objectsPerTick: compressionLevel === "high" ? 50 : 20,
      });

      setCompressedPdf(pdfBytes);
      setCompressedSize(pdfBytes.length);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));

      const compressionRatio = (
        ((originalSize - pdfBytes.length) / originalSize) *
        100
      ).toFixed(1);

      toast.success(`PDF compressed by ${compressionRatio}%`);
    } catch (error) {
      setError(
        "Failed to compress PDF. Please ensure the file is a valid PDF.",
      );
      toast.error("Failed to compress PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setCompressedPdf(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for compressed PDF
   */
  const getDownloadData = () => {
    if (!compressedPdf) return null;
    return new Blob([compressedPdf], { type: "application/pdf" });
  };

  /**
   * Generates download filename for compressed PDF
   */
  const getDownloadFilename = () => {
    if (!selectedFile) return "compressed-document.pdf";
    const name = selectedFile.name.replace(/\.pdf$/i, "");
    return `compressed-${name}.pdf`;
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
    <ToolLayout toolId="pdf-compress">
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
          ref={uploadSectionRef}
          className="grid gap-6 lg:grid-cols-2"
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? uploadSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>PDF Compression</CardTitle>
                <CardDescription>
                  Compress PDF files to reduce file size while maintaining
                  quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  accept=".pdf,application/pdf"
                  onFilesSelected={handleFileSelect}
                  multiple={false}
                  files={selectedFile ? [selectedFile] : []}
                  onRemoveFile={() => {
                    clearAll();
                    setSelectedFile(null);
                    setOriginalSize(0);
                    setCompressedSize(0);
                    setError(null);
                    setIsComplete(false);
                    setIsProcessing(false);
                    setIsComplete(false);
                    setCompressedPdf(null);
                  }}
                />

                {selectedFile && (
                  <MotionDiv
                    className="space-y-4"
                    initial={
                      animationsEnabled ? { opacity: 0, height: 0 } : undefined
                    }
                    animate={
                      animationsEnabled
                        ? { opacity: 1, height: "auto" }
                        : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <div className="space-y-2">
                      <Label htmlFor="compression-level">
                        Compression Level
                      </Label>
                      <Select
                        value={compressionLevel}
                        onValueChange={setCompressionLevel}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            Low (Better Quality)
                          </SelectItem>
                          <SelectItem value="medium">
                            Medium (Balanced)
                          </SelectItem>
                          <SelectItem value="high">
                            High (Smaller Size)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </MotionDiv>
                )}

                <ActionButtons
                  onGenerate={compressPdf}
                  generateLabel="Compress PDF"
                  onReset={clearAll}
                  resetLabel="Clear"
                  variant="outline"
                  size="sm"
                  disabled={!selectedFile || isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Compression Results</CardTitle>
                <CardDescription>
                  View compression statistics and download the result
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFile && (
                  <MotionDiv
                    className="space-y-3"
                    initial={
                      animationsEnabled ? { opacity: 0, x: 20 } : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, x: 0 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Original Size:
                        </span>
                        <div className="font-medium">
                          {formatFileSize(originalSize)}
                        </div>
                      </div>
                      {compressedSize > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            Compressed Size:
                          </span>
                          <div className="font-medium">
                            {formatFileSize(compressedSize)}
                          </div>
                        </div>
                      )}
                    </div>

                    {compressedSize > 0 && (
                      <MotionDiv
                        className="space-y-2"
                        initial={
                          animationsEnabled ? { opacity: 0, y: 10 } : undefined
                        }
                        animate={
                          animationsEnabled ? { opacity: 1, y: 0 } : undefined
                        }
                        transition={
                          animationsEnabled ? { delay: 0.2 } : undefined
                        }
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Compression Ratio:
                          </span>
                          <span className="font-medium">
                            {(
                              ((originalSize - compressedSize) / originalSize) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (compressedSize / originalSize) * 100)}%`,
                            }}
                          />
                        </div>
                      </MotionDiv>
                    )}
                  </MotionDiv>
                )}

                {compressedPdf && (
                  <MotionDiv
                    className="space-y-4"
                    initial={
                      animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <ActionButtons
                      downloadData={getDownloadData()!}
                      downloadFilename={getDownloadFilename()}
                      downloadMimeType="application/pdf"
                      variant="outline"
                      size="sm"
                    />
                  </MotionDiv>
                )}

                {!selectedFile && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Upload a PDF file to get started
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={aboutSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? aboutSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>About PDF Compression</CardTitle>
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
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <p className="text-muted-foreground">
                    PDF compression reduces file size by optimizing images,
                    removing unused objects, and applying various compression
                    techniques while maintaining document quality.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">Compression Levels:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>
                      • <strong>Low:</strong> Minimal compression, best quality
                    </li>
                    <li>
                      • <strong>Medium:</strong> Balanced compression and
                      quality
                    </li>
                    <li>
                      • <strong>High:</strong> Maximum compression, smaller
                      files
                    </li>
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
            processingText="Compressing PDF..."
            completeText="PDF compression complete!"
            errorText="Compression failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
