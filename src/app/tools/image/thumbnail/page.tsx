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
import { Download, FileImage, ImageIcon } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Thumbnail configuration interface
 */
interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  format: "jpeg" | "png" | "webp";
}

/**
 * Image thumbnail tool page
 */
export default function ImageThumbnailPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [thumbnailConfig, setThumbnailConfig] = useState<ThumbnailConfig>({
    width: 150,
    height: 150,
    quality: 0.8,
    format: "jpeg",
  });

  const [history, setHistory] = useLocalStorage<string[]>(
    "image-thumbnail-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const configSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const configSectionInView = useInView(configSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setThumbnailImage(null);
      setError(null);
      setIsComplete(false);
      toast.success("Image loaded successfully");
    }
  };

  /**
   * Updates thumbnail configuration
   */
  const updateConfig = (key: keyof ThumbnailConfig, value: any) => {
    setThumbnailConfig((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Creates thumbnail from the image
   */
  const createThumbnail = async () => {
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
        // Calculate aspect ratio to maintain proportions
        const aspectRatio = img.width / img.height;
        let targetWidth = thumbnailConfig.width;
        let targetHeight = thumbnailConfig.height;

        // Maintain aspect ratio if one dimension is 0
        if (targetWidth === 0) {
          targetWidth = targetHeight * aspectRatio;
        } else if (targetHeight === 0) {
          targetHeight = targetWidth / aspectRatio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw image with proper scaling
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to desired format
        const mimeType = `image/${thumbnailConfig.format}`;
        const thumbnailDataUrl = canvas.toDataURL(
          mimeType,
          thumbnailConfig.quality,
        );

        setThumbnailImage(thumbnailDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success("Thumbnail created successfully");
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error("Failed to load image");
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create thumbnail";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the thumbnail image
   */
  const downloadThumbnail = () => {
    if (!thumbnailImage) return;
    const link = document.createElement("a");
    link.href = thumbnailImage;
    const extension =
      thumbnailConfig.format === "jpeg" ? "jpg" : thumbnailConfig.format;
    link.download = `thumbnail-${selectedFile?.name.replace(/\.[^/.]+$/, "") || "image"}.${extension}`;
    link.click();
    toast.success("Thumbnail downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setThumbnailImage(null);
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
    <ToolLayout toolId="image-thumbnail">
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
                Select an image to create thumbnail
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

        {selectedFile && (
          <MotionDiv
            ref={configSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? configSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Thumbnail Settings
                </CardTitle>
                <CardDescription>
                  Configure thumbnail size and format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail-width">Width (px)</Label>
                    <Input
                      id="thumbnail-width"
                      type="number"
                      min="1"
                      max="1000"
                      value={thumbnailConfig.width}
                      onChange={(e) =>
                        updateConfig("width", parseInt(e.target.value) || 0)
                      }
                      placeholder="Width..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail-height">Height (px)</Label>
                    <Input
                      id="thumbnail-height"
                      type="number"
                      min="1"
                      max="1000"
                      value={thumbnailConfig.height}
                      onChange={(e) =>
                        updateConfig("height", parseInt(e.target.value) || 0)
                      }
                      placeholder="Height..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Quality: {Math.round(thumbnailConfig.quality * 100)}%
                  </Label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={thumbnailConfig.quality}
                    onChange={(e) =>
                      updateConfig("quality", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail-format">Format</Label>
                  <select
                    id="thumbnail-format"
                    value={thumbnailConfig.format}
                    onChange={(e) => updateConfig("format", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>

                <ActionButtons
                  onGenerate={createThumbnail}
                  generateLabel="Create Thumbnail"
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

        {thumbnailImage && (
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
                  Thumbnail Preview
                </CardTitle>
                <CardDescription>Download your thumbnail image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={thumbnailImage}
                  alt="Thumbnail"
                  className="max-w-full h-auto rounded-lg border"
                />
                <ActionButtons
                  onGenerate={downloadThumbnail}
                  generateLabel="Download Thumbnail"
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
            processingText="Creating thumbnail..."
            completeText="Thumbnail created successfully!"
            errorText="Failed to create thumbnail"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
