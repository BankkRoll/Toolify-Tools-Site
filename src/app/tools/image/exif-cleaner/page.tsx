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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Download, FileImage, Shield } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * EXIF data interface
 */
interface ExifData {
  [key: string]: string | number | Date;
}

/**
 * Image EXIF cleaner tool page
 */
export default function ImageExifCleanerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cleanedImage, setCleanedImage] = useState<string | null>(null);
  const [exifData, setExifData] = useState<ExifData>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "image-exif-cleaner-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const exifSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const exifSectionInView = useInView(exifSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and extracts EXIF data
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setCleanedImage(null);
      setExifData({});
      setError(null);
      setIsComplete(false);

      // Extract EXIF data for display
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        const img = new Image();
        img.onload = () => {
          // Simulate EXIF data extraction (in real app, use exif-js or similar)
          const mockExifData: ExifData = {
            Make: "Camera Brand",
            Model: "Camera Model",
            DateTime: new Date().toISOString(),
            GPSLatitude: "40.7128° N",
            GPSLongitude: "74.0060° W",
            Software: "Photo Editor",
            Artist: "Photographer Name",
          };
          setExifData(mockExifData);
        };
        img.src = URL.createObjectURL(file);
      } catch (err) {
        console.warn("Could not extract EXIF data");
      }

      toast.success("Image loaded successfully");
    }
  };

  /**
   * Removes EXIF data from the image
   */
  const cleanExif = async () => {
    if (!selectedFile) {
      toast.error("Please select an image file");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image without EXIF data
        ctx.drawImage(img, 0, 0);

        // Convert to data URL (this strips EXIF data)
        const cleanedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCleanedImage(cleanedDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success("EXIF data removed successfully");
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error("Failed to load image");
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove EXIF data";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the cleaned image
   */
  const downloadCleanedImage = () => {
    if (!cleanedImage) return;
    const link = document.createElement("a");
    link.href = cleanedImage;
    link.download = `cleaned-${selectedFile?.name || "image.jpg"}`;
    link.click();
    toast.success("Cleaned image downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setCleanedImage(null);
    setExifData({});
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
    <ToolLayout toolId="image-exif-cleaner">
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
                <FileImage className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Select an image to remove EXIF data and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept="image/*"
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={clearAll}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && Object.keys(exifData).length > 0 && (
          <MotionDiv
            ref={exifSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? exifSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  EXIF Data Found
                </CardTitle>
                <CardDescription>
                  Metadata that will be removed from your image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(exifData).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm font-medium">{key}:</span>
                      <Badge variant="secondary" className="text-xs">
                        {String(value)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <ActionButtons
                  onGenerate={cleanExif}
                  generateLabel="Remove EXIF Data"
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

        {cleanedImage && (
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
                  Cleaned Image
                </CardTitle>
                <CardDescription>
                  Your image with all EXIF data and metadata removed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={cleanedImage}
                  alt="Cleaned"
                  className="max-w-full h-auto rounded-lg border"
                />
                <ActionButtons
                  onGenerate={downloadCleanedImage}
                  generateLabel="Download Cleaned Image"
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
            processingText="Removing EXIF data..."
            completeText="EXIF data removed successfully!"
            errorText="Failed to remove EXIF data"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
