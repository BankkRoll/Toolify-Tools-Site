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
import { Input } from "@/components/ui/input";
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
import { RotateCw } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument, degrees } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * PDF rotation tool page
 */
export default function RotatePdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState("90");
  const [pageRange, setPageRange] = useState("all");
  const [customPages, setCustomPages] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [rotatedPdf, setRotatedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-rotate-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const settingsSectionInView = useInView(settingsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes rotation
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsComplete(false);
      setRotatedPdf(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
        toast.success("PDF loaded successfully");
      } catch (error) {
        setError("Failed to load PDF file");
        toast.error("Failed to load PDF file");
      }
    }
  };

  /**
   * Rotates the PDF pages according to the specified settings
   */
  const rotatePdf = async () => {
    if (!selectedFile || !pageRange.trim()) {
      toast.error("Please select a file and specify page range");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = parsePageRange(pageRange, totalPages);

      if (pages.length === 0) {
        throw new Error("No valid pages specified");
      }

      // Rotate specified pages
      pages.forEach((pageNum) => {
        const page = pdfDoc.getPage(pageNum - 1);
        const currentRotation = page.getRotation().angle;
        const rotationValue = parseInt(rotationAngle);
        let newRotation = currentRotation;

        switch (rotationValue) {
          case 90:
            newRotation = currentRotation + 90;
            break;
          case 180:
            newRotation = currentRotation + 180;
            break;
          case 270:
            newRotation = currentRotation + 270;
            break;
          default:
            newRotation = 0;
        }

        page.setRotation(degrees(newRotation % 360));
      });

      const pdfBytes = await pdfDoc.save();
      setRotatedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success(`Rotated ${pages.length} pages successfully`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to rotate PDF";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Parses page range string into array of page numbers
   */
  const parsePageRange = (range: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(",");

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part
          .split("-")
          .map((n) => Number.parseInt(n.trim()));
        for (let i = start; i <= Math.min(end, maxPages); i++) {
          if (i >= 1) pages.push(i);
        }
      } else {
        const pageNum = Number.parseInt(part.trim());
        if (pageNum >= 1 && pageNum <= maxPages) {
          pages.push(pageNum);
        }
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  /**
   * Downloads the rotated PDF
   */
  const downloadRotatedPdf = () => {
    if (!rotatedPdf) return;

    const blob = new Blob([rotatedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotated-${selectedFile?.name || "pages"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setRotationAngle("90");
    setPageRange("all");
    setCustomPages("");
    setTotalPages(0);
    setRotatedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the rotated PDF
   */
  const getDownloadData = () => {
    return rotatedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the rotated PDF
   */
  const getDownloadFilename = () => {
    return `rotated-${selectedFile?.name || "pages"}.pdf`;
  };

  // Motion variants
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
    <ToolLayout toolId="pdf-rotate">
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
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? uploadSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="h-5 w-5" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Select a PDF file to rotate its pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept=".pdf,application/pdf"
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={() => {
                  setSelectedFile(null);
                  setTotalPages(0);
                  setError(null);
                  setIsComplete(false);
                  setRotatedPdf(null);
                }}
              />
              {totalPages > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total pages: {totalPages}
                </p>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={settingsSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? settingsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Rotation Settings</CardTitle>
              <CardDescription>
                Configure rotation angle and page range
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rotationAngle">Rotation Angle</Label>
                  <Select
                    value={rotationAngle}
                    onValueChange={setRotationAngle}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90° (Clockwise)</SelectItem>
                      <SelectItem value="180">180°</SelectItem>
                      <SelectItem value="270">
                        270° (Counter-clockwise)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageRange">Page Range</Label>
                  <Select value={pageRange} onValueChange={setPageRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {pageRange === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customPages">Custom Page Range</Label>
                  <Input
                    id="customPages"
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    placeholder="1-3,5,7-9"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter page numbers separated by commas. Use hyphens for
                    ranges.
                  </p>
                </div>
              )}

              <ActionButtons
                onGenerate={rotatePdf}
                generateLabel="Rotate PDF"
                onReset={clearAll}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={!selectedFile || isProcessing}
                isGenerating={isProcessing}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {rotatedPdf && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? resultsSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Rotated PDF</CardTitle>
                <CardDescription>
                  Your rotated PDF is ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={getDownloadData()}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="application/pdf"
                  onDownload={downloadRotatedPdf}
                  variant="outline"
                  size="sm"
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText="Rotating pages..."
            completeText="Pages rotated successfully!"
            errorText="Failed to rotate pages"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
