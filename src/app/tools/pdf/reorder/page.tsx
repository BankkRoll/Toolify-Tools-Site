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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { ArrowDown, ArrowUp, FileText, GripVertical } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for page information
 */
interface PageInfo {
  index: number;
  originalIndex: number;
}

/**
 * PDF page reordering tool page
 */
export default function ReorderPagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [reorderedPdf, setReorderedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-reorder-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const pagesSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const pagesSectionInView = useInView(pagesSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes page list
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsComplete(false);
      setReorderedPdf(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        const pageList: PageInfo[] = Array.from(
          { length: pageCount },
          (_, i) => ({
            index: i,
            originalIndex: i,
          }),
        );
        setPages(pageList);
        toast.success("PDF loaded successfully");
      } catch (error) {
        setError("Failed to load PDF file");
        toast.error("Failed to load PDF file");
      }
    }
  };

  /**
   * Moves a page from one position to another
   */
  const movePage = (fromIndex: number, toIndex: number) => {
    const newPages = [...pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    setPages(newPages);
  };

  /**
   * Moves a page up in the list
   */
  const movePageUp = (index: number) => {
    if (index > 0) {
      movePage(index, index - 1);
    }
  };

  /**
   * Moves a page down in the list
   */
  const movePageDown = (index: number) => {
    if (index < pages.length - 1) {
      movePage(index, index + 1);
    }
  };

  /**
   * Reorders pages according to the current arrangement
   */
  const reorderPages = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Add pages in the new order
      for (const pageInfo of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
          pageInfo.originalIndex,
        ]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      setReorderedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success("Pages reordered successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reorder pages";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the reordered PDF
   */
  const downloadReorderedPdf = () => {
    if (!reorderedPdf) return;

    const blob = new Blob([reorderedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reordered-${selectedFile?.name || "pages"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setPages([]);
    setReorderedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the reordered PDF
   */
  const getDownloadData = () => {
    return reorderedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the reordered PDF
   */
  const getDownloadFilename = () => {
    return `reordered-${selectedFile?.name || "pages"}.pdf`;
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
    <ToolLayout toolId="pdf-reorder">
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
                Select a PDF file to reorder its pages
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
                  setPages([]);
                  setError(null);
                  setIsComplete(false);
                  setReorderedPdf(null);
                }}
              />
              {pages.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total pages: {pages.length}
                </p>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        {pages.length > 0 && (
          <MotionDiv
            ref={pagesSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? pagesSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Page Order</CardTitle>
                <CardDescription>
                  Drag and drop or use arrows to reorder pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pages.map((page, index) => (
                    <div
                      key={page.originalIndex}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Page {page.originalIndex + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePageUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => movePageDown(index)}
                          disabled={index === pages.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <ActionButtons
                  onGenerate={reorderPages}
                  generateLabel="Reorder Pages"
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
        )}

        {reorderedPdf && (
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
                <CardTitle>Reordered PDF</CardTitle>
                <CardDescription>
                  Your reordered PDF is ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={getDownloadData()}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="application/pdf"
                  onDownload={downloadReorderedPdf}
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
            processingText="Reordering pages..."
            completeText="Pages reordered successfully!"
            errorText="Failed to reorder pages"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
