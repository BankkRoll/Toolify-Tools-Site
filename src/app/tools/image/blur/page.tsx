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
import { Slider } from "@/components/ui/slider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { CloudyIcon, Download, FileImage } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image blur tool page
 */
export default function ImageBlurPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [blurredImage, setBlurredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [blurRadius, setBlurRadius] = useState(5);

  const [history, setHistory] = useLocalStorage<string[]>(
    "image-blur-history",
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
      setBlurredImage(null);
      setError(null);
      setIsComplete(false);
      toast.success("Image loaded successfully");
    }
  };

  /**
   * Applies blur effect to the image
   */
  const applyBlur = async () => {
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
        ctx.drawImage(img, 0, 0);

        // Apply blur using CSS filter (simplified approach)
        // In a real implementation, you'd use a more sophisticated blur algorithm
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Simple box blur implementation
        const radius = Math.floor(blurRadius);
        const kernelSize = radius * 2 + 1;
        const kernel = new Array(kernelSize).fill(1 / kernelSize);

        // Apply horizontal blur
        const tempData = new Uint8ClampedArray(data);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0,
              g = 0,
              b = 0,
              a = 0;
            for (let i = -radius; i <= radius; i++) {
              const px = Math.max(0, Math.min(width - 1, x + i));
              const idx = (y * width + px) * 4;
              r += tempData[idx] * kernel[i + radius];
              g += tempData[idx + 1] * kernel[i + radius];
              b += tempData[idx + 2] * kernel[i + radius];
              a += tempData[idx + 3] * kernel[i + radius];
            }
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }

        // Apply vertical blur
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let r = 0,
              g = 0,
              b = 0,
              a = 0;
            for (let i = -radius; i <= radius; i++) {
              const py = Math.max(0, Math.min(height - 1, y + i));
              const idx = (py * width + x) * 4;
              r += data[idx] * kernel[i + radius];
              g += data[idx + 1] * kernel[i + radius];
              b += data[idx + 2] * kernel[i + radius];
              a += data[idx + 3] * kernel[i + radius];
            }
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const blurredDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setBlurredImage(blurredDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success("Blur effect applied successfully");
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error("Failed to load image");
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply blur effect";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the blurred image
   */
  const downloadBlurredImage = () => {
    if (!blurredImage) return;
    const link = document.createElement("a");
    link.href = blurredImage;
    link.download = `blurred-${selectedFile?.name || "image.jpg"}`;
    link.click();
    toast.success("Blurred image downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setBlurredImage(null);
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
    <ToolLayout toolId="image-blur">
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
                Select an image to apply blur effect
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
                  <CloudyIcon className="h-5 w-5" />
                  Blur Settings
                </CardTitle>
                <CardDescription>Adjust the blur intensity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Blur Radius: {blurRadius}</span>
                  </div>
                  <Slider
                    value={[blurRadius]}
                    onValueChange={(value) => setBlurRadius(value[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <ActionButtons
                  onGenerate={applyBlur}
                  generateLabel="Apply Blur"
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

        {blurredImage && (
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
                  Blurred Image
                </CardTitle>
                <CardDescription>Download your blurred image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={blurredImage}
                  alt="Blurred"
                  className="max-w-full h-auto rounded-lg border"
                />
                <ActionButtons
                  onGenerate={downloadBlurredImage}
                  generateLabel="Download Blurred Image"
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
            processingText="Applying blur effect..."
            completeText="Blur effect applied successfully!"
            errorText="Failed to apply blur effect"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
