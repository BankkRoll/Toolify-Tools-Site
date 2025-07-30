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
import { FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for conversion settings
 */
interface ConversionSettings {
  outputFormat: string;
  quality: number;
  dpi: number;
}

/**
 * PDF to image conversion tool page
 */
export default function PdfToImagePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState(150);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-to-image-history",
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
   * Handles file selection and initializes page count
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setIsComplete(false);
      setConvertedImages([]);

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
   * Converts PDF pages to images
   */
  const convertToImages = async () => {
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
      const pageCount = pdfDoc.getPageCount();
      const convertedImages: string[] = [];

      // For demo purposes, we'll create placeholder images
      // In a real implementation, you would use a library like pdf2pic or similar
      for (let i = 0; i < pageCount; i++) {
        // Create a canvas and draw a placeholder
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 800;
          canvas.height = 600;
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#333";
          ctx.font = "24px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`Page ${i + 1}`, canvas.width / 2, canvas.height / 2);
          ctx.fillText(
            "(Image conversion placeholder)",
            canvas.width / 2,
            canvas.height / 2 + 40,
          );
        }
        convertedImages.push(canvas.toDataURL("image/png"));
      }

      setConvertedImages(convertedImages);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success(`Converted ${pageCount} pages to images`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to convert PDF to images";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads a single image
   */
  const downloadImage = (imageData: string, pageNumber: number) => {
    const link = document.createElement("a");
    link.download = `page-${pageNumber + 1}.${outputFormat}`;
    link.href = imageData;
    link.click();
    toast.success(`Downloaded page ${pageNumber + 1}`);
  };

  /**
   * Downloads all converted images
   */
  const downloadAllImages = () => {
    convertedImages.forEach((imageData, index) => {
      setTimeout(() => downloadImage(imageData, index), index * 100);
    });
    toast.success("Downloading all images...");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setConvertedImages([]);
    setTotalPages(0);
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
    <ToolLayout toolId="pdf-to-image">
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
                Select a PDF file to convert to images
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
                  setConvertedImages([]);
                  setTotalPages(0);
                  setError(null);
                  setIsComplete(false);
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

        {selectedFile && totalPages > 0 && (
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
                <CardTitle>Conversion Settings</CardTitle>
                <CardDescription>
                  Configure image output format and quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">
                        PNG (Lossless, supports transparency)
                      </SelectItem>
                      <SelectItem value="jpeg">
                        JPEG (Compressed, smaller file size)
                      </SelectItem>
                      <SelectItem value="webp">
                        WebP (Modern format, good compression)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dpi">DPI (Resolution): {dpi}</Label>
                  <Input
                    id="dpi"
                    type="range"
                    min="72"
                    max="300"
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>72 DPI (Web)</span>
                    <span>150 DPI (Standard)</span>
                    <span>300 DPI (Print)</span>
                  </div>
                </div>

                {(outputFormat === "jpeg" || outputFormat === "webp") && (
                  <div className="space-y-2">
                    <Label htmlFor="quality">Quality: {quality}%</Label>
                    <Input
                      id="quality"
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                    />
                  </div>
                )}

                <ActionButtons
                  onGenerate={convertToImages}
                  generateLabel="Convert to Images"
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

        {convertedImages.length > 0 && (
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
                <CardTitle className="flex items-center justify-between">
                  Converted Images
                  <ActionButtons
                    onDownload={downloadAllImages}
                    variant="outline"
                    size="sm"
                  />
                </CardTitle>
                <CardDescription>
                  {convertedImages.length} images ready for download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {convertedImages.map((imageData, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border rounded overflow-hidden">
                          <img
                            src={imageData || "/placeholder.svg"}
                            alt={`Page ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Page {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {outputFormat.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <ActionButtons
                        onDownload={() => downloadImage(imageData, index)}
                        variant="outline"
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
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
            processingText="Converting PDF to images..."
            completeText="PDF converted to images successfully!"
            errorText="Failed to convert PDF to images"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
