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
import { FileText, Scissors } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for split file information
 */
interface SplitFile {
  name: string;
  pages: number[];
  data: Uint8Array;
}

/**
 * PDF split tool page
 */
export default function SplitPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [splitMethod, setSplitMethod] = useState("pages");
  const [pagesPerFile, setPagesPerFile] = useState(1);
  const [customRanges, setCustomRanges] = useState("1-5,6-10");
  const [totalPages, setTotalPages] = useState(0);
  const [splitFiles, setSplitFiles] = useState<SplitFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-split-history",
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
   * Handles file selection and initializes splitting
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsComplete(false);
      setSplitFiles([]);

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
   * Parses page ranges string into array of page groups
   */
  const parsePageRanges = (ranges: string): number[][] => {
    const rangeGroups: number[][] = [];
    const parts = ranges.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed
          .split("-")
          .map((n) => Number.parseInt(n.trim()));
        if (start && end && start <= end && start >= 1 && end <= totalPages) {
          const pages = Array.from(
            { length: end - start + 1 },
            (_, i) => start + i - 1,
          ); // Convert to 0-based
          rangeGroups.push(pages);
        }
      } else {
        const pageNum = Number.parseInt(trimmed);
        if (pageNum >= 1 && pageNum <= totalPages) {
          rangeGroups.push([pageNum - 1]); // Convert to 0-based
        }
      }
    }

    return rangeGroups;
  };

  /**
   * Splits the PDF according to the selected method
   */
  const splitPdf = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const files: SplitFile[] = [];

      let pageGroups: number[][] = [];

      if (splitMethod === "pages") {
        // Split by number of pages per file
        for (let i = 0; i < totalPages; i += pagesPerFile) {
          const endPage = Math.min(i + pagesPerFile, totalPages);
          const pages = Array.from({ length: endPage - i }, (_, j) => i + j);
          pageGroups.push(pages);
        }
      } else if (splitMethod === "ranges") {
        // Split by custom page ranges
        pageGroups = parsePageRanges(customRanges);
        if (pageGroups.length === 0) {
          throw new Error("No valid page ranges specified");
        }
      }

      // Create individual PDFs for each group
      for (let i = 0; i < pageGroups.length; i++) {
        const pages = pageGroups[i];
        const newPdf = await PDFDocument.create();

        for (const pageIndex of pages) {
          const [copiedPage] = await newPdf.copyPages(originalPdf, [pageIndex]);
          newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        const fileName = `split-${i + 1}-${selectedFile.name}`;

        files.push({
          name: fileName,
          pages: pages.map((p) => p + 1), // Convert back to 1-based for display
          data: pdfBytes,
        });
      }

      setSplitFiles(files);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success(`PDF split into ${files.length} files`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to split PDF";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads a specific split file
   */
  const downloadFile = (file: SplitFile) => {
    const blob = new Blob([file.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${file.name} downloaded successfully`);
  };

  /**
   * Downloads all split files as a zip
   */
  const downloadAllFiles = () => {
    splitFiles.forEach((file) => downloadFile(file));
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setSplitMethod("pages");
    setPagesPerFile(1);
    setCustomRanges("1-5,6-10");
    setTotalPages(0);
    setSplitFiles([]);
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

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="pdf-split">
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
                <Scissors className="h-5 w-5" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Select a PDF file to split into multiple files
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
                  setSplitFiles([]);
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
              <CardTitle>Split Settings</CardTitle>
              <CardDescription>Choose how to split the PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="splitMethod">Split Method</Label>
                <Select value={splitMethod} onValueChange={setSplitMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pages">Pages per file</SelectItem>
                    <SelectItem value="ranges">Custom ranges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {splitMethod === "pages" && (
                <div className="space-y-2">
                  <Label htmlFor="pagesPerFile">Pages per file</Label>
                  <Input
                    id="pagesPerFile"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pagesPerFile}
                    onChange={(e) =>
                      setPagesPerFile(Number.parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              )}

              {splitMethod === "ranges" && (
                <div className="space-y-2">
                  <Label htmlFor="customRanges">Page ranges</Label>
                  <Input
                    id="customRanges"
                    value={customRanges}
                    onChange={(e) => setCustomRanges(e.target.value)}
                    placeholder="1-5,6-10,11-15"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter page ranges separated by commas. Use hyphens for
                    ranges.
                  </p>
                </div>
              )}

              <ActionButtons
                onGenerate={splitPdf}
                generateLabel="Split PDF"
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

        {splitFiles.length > 0 && (
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
                <CardTitle>Split Files</CardTitle>
                <CardDescription>
                  {splitFiles.length} files created successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {splitFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Pages: {file.pages.join(", ")}
                          </p>
                        </div>
                      </div>
                      <ActionButtons
                        downloadData={file.data}
                        downloadFilename={file.name}
                        downloadMimeType="application/pdf"
                        onDownload={() => downloadFile(file)}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  ))}
                </div>

                <ActionButtons
                  onGenerate={downloadAllFiles}
                  generateLabel="Download All"
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
            processingText="Splitting PDF..."
            completeText="PDF split successfully!"
            errorText="Failed to split PDF"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
