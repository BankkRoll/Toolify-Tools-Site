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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * PDF page extraction tool page
 */
export default function ExtractPagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [extractedPdf, setExtractedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-extract-pages-history",
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
   * Handles file selection and initializes extraction
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsComplete(false);
      setExtractedPdf(null);

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
   * Extracts specified pages from the PDF
   */
  const extractPages = async () => {
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
      const newPdfDoc = await PDFDocument.create();

      // Parse page range (e.g., "1-3,5,7-9")
      const pages = parsePageRange(pageRange, totalPages);

      if (pages.length === 0) {
        throw new Error("No valid pages specified");
      }

      for (const pageNum of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      setExtractedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success(`Extracted ${pages.length} pages from PDF`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to extract pages";
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
   * Downloads the extracted PDF
   */
  const downloadExtractedPdf = () => {
    if (!extractedPdf) return;

    const blob = new Blob([extractedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-${selectedFile?.name || "pages"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setPageRange("");
    setTotalPages(0);
    setExtractedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the extracted PDF
   */
  const getDownloadData = () => {
    return extractedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the extracted PDF
   */
  const getDownloadFilename = () => {
    return `extracted-${selectedFile?.name || "pages"}.pdf`;
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
    <ToolLayout toolId="pdf-extract-pages">
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
                <FileText className="h-5 w-5" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Select a PDF file to extract pages from
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
                  setExtractedPdf(null);
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
              <CardTitle>Page Range</CardTitle>
              <CardDescription>
                Specify which pages to extract (e.g., "1-3,5,7-9")
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageRange">Page Range</Label>
                <Input
                  id="pageRange"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="1-3,5,7-9"
                  className="font-mono"
                />
              </div>

              <ActionButtons
                onGenerate={extractPages}
                generateLabel="Extract Pages"
                onReset={clearAll}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={!selectedFile || !pageRange.trim() || isProcessing}
                isGenerating={isProcessing}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {extractedPdf && (
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
                <CardTitle>Extracted PDF</CardTitle>
                <CardDescription>
                  Your extracted pages are ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={getDownloadData()}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="application/pdf"
                  onDownload={downloadExtractedPdf}
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
            processingText="Extracting pages..."
            completeText="Pages extracted successfully!"
            errorText="Failed to extract pages"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
