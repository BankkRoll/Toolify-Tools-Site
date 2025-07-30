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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Download, Edit2, FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Annotation for a single PDF page
 */
interface PageAnnotation {
  text: string;
}

/**
 * PDF annotation tool page
 */
export default function PdfAnnotatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([]);
  const [annotatedPdf, setAnnotatedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-annotate-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const annotateSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const annotateSectionInView = useInView(annotateSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes annotation fields
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setAnnotatedPdf(null);
      setError(null);
      setIsComplete(false);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setAnnotations(Array(pdfDoc.getPageCount()).fill({ text: "" }));
        toast.success("PDF loaded successfully");
      } catch (err) {
        setError("Failed to load PDF file");
        toast.error("Failed to load PDF file");
      }
    }
  };

  /**
   * Updates annotation text for a specific page
   */
  const updateAnnotation = (pageIndex: number, text: string) => {
    setAnnotations((prev) => {
      const updated = [...prev];
      updated[pageIndex] = { text };
      return updated;
    });
  };

  /**
   * Embeds annotations into the PDF and generates a new file
   */
  const annotatePdf = async () => {
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
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      annotations.forEach((annotation, i) => {
        if (annotation.text.trim()) {
          const page = pages[i];
          page.drawText(annotation.text, {
            x: 50,
            y: 50,
            size: 14,
            font,
            color: rgb(0.2, 0.2, 0.8),
            opacity: 0.8,
          });
        }
      });
      const pdfBytes = await pdfDoc.save();
      setAnnotatedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success("Annotations added to PDF");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to annotate PDF";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the annotated PDF
   */
  const downloadAnnotatedPdf = () => {
    if (!annotatedPdf) return;
    const blob = new Blob([annotatedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotated-${selectedFile?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setAnnotations([]);
    setAnnotatedPdf(null);
    setError(null);
    setIsComplete(false);
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
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="pdf-annotate">
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
              <CardDescription>Select a PDF file to annotate</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept=".pdf,application/pdf"
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={clearAll}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && annotations.length > 0 && (
          <MotionDiv
            ref={annotateSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? annotateSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  Add Annotations
                </CardTitle>
                <CardDescription>
                  Enter annotation text for each page (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {annotations.map((annotation, i) => (
                  <div key={i} className="space-y-2">
                    <label className="font-medium text-sm">Page {i + 1}</label>
                    <Input
                      value={annotation.text}
                      onChange={(e) => updateAnnotation(i, e.target.value)}
                      placeholder="Annotation text..."
                      className="w-full"
                    />
                  </div>
                ))}
                <ActionButtons
                  onGenerate={annotatePdf}
                  generateLabel="Annotate PDF"
                  onReset={clearAll}
                  resetLabel="Clear"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  isGenerating={isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {annotatedPdf && (
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
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Annotated PDF
                </CardTitle>
                <CardDescription>
                  Download your annotated PDF file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={annotatedPdf}
                  downloadFilename={
                    selectedFile
                      ? `annotated-${selectedFile.name}`
                      : "annotated.pdf"
                  }
                  downloadMimeType="application/pdf"
                  onDownload={downloadAnnotatedPdf}
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
            processingText="Adding annotations to PDF..."
            completeText="Annotations added successfully!"
            errorText="Failed to annotate PDF"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
