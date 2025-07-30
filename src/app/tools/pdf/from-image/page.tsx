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
import { ArrowDown, ArrowUp, FileText, X } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image to PDF conversion tool page
 */
export default function ImageToPdfPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margin, setMargin] = useState("medium");
  const [generatedPdf, setGeneratedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-from-image-history",
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
   * Handles file selection for images
   */
  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    setError(null);
    setIsComplete(false);
    setGeneratedPdf(null);
  };

  /**
   * Removes a file from the selection
   */
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
    setIsComplete(false);
    setGeneratedPdf(null);
  };

  /**
   * Moves a file up or down in the list
   */
  const moveFile = (index: number, direction: "up" | "down") => {
    const newFiles = [...selectedFiles];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [
        newFiles[targetIndex],
        newFiles[index],
      ];
      setSelectedFiles(newFiles);
    }
  };

  /**
   * Gets page dimensions based on size and orientation
   */
  const getPageDimensions = () => {
    let dimensions = PageSizes.A4;

    switch (pageSize) {
      case "A3":
        dimensions = PageSizes.A3;
        break;
      case "A4":
        dimensions = PageSizes.A4;
        break;
      case "A5":
        dimensions = PageSizes.A5;
        break;
      case "Letter":
        dimensions = PageSizes.Letter;
        break;
      case "Legal":
        dimensions = PageSizes.Legal;
        break;
    }

    if (orientation === "landscape") {
      return [dimensions[1], dimensions[0]];
    }
    return dimensions;
  };

  /**
   * Gets margin value in points
   */
  const getMarginValue = () => {
    switch (margin) {
      case "none":
        return 0;
      case "small":
        return 20;
      case "medium":
        return 40;
      case "large":
        return 60;
      default:
        return 40;
    }
  };

  /**
   * Creates PDF from selected images
   */
  const createPdf = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const pdfDoc = await PDFDocument.create();
      const marginValue = getMarginValue();
      const [pageWidth, pageHeight] = getPageDimensions();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        if (file.type.includes("jpeg") || file.type.includes("jpg")) {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (file.type.includes("png")) {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          throw new Error(`Unsupported image format: ${file.type}`);
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { width, height } = image.scale(1);

        // Calculate scaling to fit image within page margins
        const maxWidth = pageWidth - 2 * marginValue;
        const maxHeight = pageHeight - 2 * marginValue;
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY, 1);

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Center the image on the page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      setGeneratedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([`${selectedFiles.length} images`, ...history].slice(0, 10));
      toast.success("PDF created successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create PDF";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the generated PDF
   */
  const downloadPdf = () => {
    if (!generatedPdf) return;

    const blob = new Blob([generatedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `images-to-pdf.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFiles([]);
    setGeneratedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the generated PDF
   */
  const getDownloadData = () => {
    return generatedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the generated PDF
   */
  const getDownloadFilename = () => {
    return `images-to-pdf.pdf`;
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
    <ToolLayout toolId="pdf-from-image">
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
                Upload Images
              </CardTitle>
              <CardDescription>Select images to convert to PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                onFilesSelected={handleFilesSelect}
                accept="image/*"
                multiple={true}
                files={selectedFiles}
                onRemoveFile={removeFile}
              />

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Images ({selectedFiles.length})</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <span className="text-sm truncate flex-1">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveFile(index, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveFile(index, "down")}
                            disabled={index === selectedFiles.length - 1}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
              <CardTitle>PDF Settings</CardTitle>
              <CardDescription>Configure the output PDF format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageSize">Page Size</Label>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select value={orientation} onValueChange={setOrientation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margin">Margin</Label>
                  <Select value={margin} onValueChange={setMargin}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ActionButtons
                onGenerate={createPdf}
                generateLabel="Create PDF"
                onReset={clearAll}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={selectedFiles.length === 0 || isProcessing}
                isGenerating={isProcessing}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {generatedPdf && (
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
                <CardTitle>Generated PDF</CardTitle>
                <CardDescription>
                  Your PDF is ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={getDownloadData()}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="application/pdf"
                  onDownload={downloadPdf}
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
            processingText="Creating PDF..."
            completeText="PDF created successfully!"
            errorText="Failed to create PDF"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
