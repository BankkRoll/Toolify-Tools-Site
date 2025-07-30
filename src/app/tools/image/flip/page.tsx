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
import { Download, FileImage, FlipHorizontal } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image flip tool page
 */
export default function ImageFlipPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [flippedImage, setFlippedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [flipDirection, setFlipDirection] = useState<
    "horizontal" | "vertical" | "both"
  >("horizontal");

  const [history, setHistory] = useLocalStorage<string[]>(
    "image-flip-history",
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
      setFlippedImage(null);
      setError(null);
      setIsComplete(false);
      toast.success("Image loaded successfully");
    }
  };

  /**
   * Flips image by specified direction
   */
  const flipImage = async () => {
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

        // Apply flip transformations
        ctx.save();

        if (flipDirection === "horizontal" || flipDirection === "both") {
          ctx.scale(-1, 1);
          ctx.translate(-img.width, 0);
        }

        if (flipDirection === "vertical" || flipDirection === "both") {
          ctx.scale(1, -1);
          ctx.translate(0, -img.height);
        }

        ctx.drawImage(img, 0, 0);
        ctx.restore();

        const flippedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setFlippedImage(flippedDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success("Image flipped successfully");
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error("Failed to load image");
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to flip image";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the flipped image
   */
  const downloadFlippedImage = () => {
    if (!flippedImage) return;
    const link = document.createElement("a");
    link.href = flippedImage;
    link.download = `flipped-${selectedFile?.name || "image.jpg"}`;
    link.click();
    toast.success("Flipped image downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setFlippedImage(null);
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
    <ToolLayout toolId="image-flip">
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
              <CardDescription>Select an image to flip</CardDescription>
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
                  <FlipHorizontal className="h-5 w-5" />
                  Flip Settings
                </CardTitle>
                <CardDescription>Choose the flip direction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <ActionButtons
                    onGenerate={() => setFlipDirection("horizontal")}
                    generateLabel="Horizontal Flip"
                    variant={
                      flipDirection === "horizontal" ? "default" : "outline"
                    }
                    size="sm"
                  />
                  <ActionButtons
                    onGenerate={() => setFlipDirection("vertical")}
                    generateLabel="Vertical Flip"
                    variant={
                      flipDirection === "vertical" ? "default" : "outline"
                    }
                    size="sm"
                  />
                  <ActionButtons
                    onGenerate={() => setFlipDirection("both")}
                    generateLabel="Both Directions"
                    variant={flipDirection === "both" ? "default" : "outline"}
                    size="sm"
                  />
                </div>

                <ActionButtons
                  onGenerate={flipImage}
                  generateLabel="Flip Image"
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

        {flippedImage && (
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
                  Flipped Image
                </CardTitle>
                <CardDescription>Download your flipped image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={flippedImage}
                  alt="Flipped"
                  className="max-w-full h-auto rounded-lg border"
                />
                <ActionButtons
                  onGenerate={downloadFlippedImage}
                  generateLabel="Download Flipped Image"
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
            processingText="Flipping image..."
            completeText="Image flipped successfully!"
            errorText="Failed to flip image"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
