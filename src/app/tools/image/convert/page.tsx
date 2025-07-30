"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { DownloadButton } from "@/components/tools/download-button";
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
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image conversion tool page
 */
export default function ConvertImagePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history] = useLocalStorage<string[]>("image-convert-history", []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const outputSectionRef = useRef(null);

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
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes conversion
   */
  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    setError(null);
    setIsComplete(false);
    setConvertedImage(null);
  };

  /**
   * Converts the image to the selected format
   */
  const convertImage = async () => {
    if (selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Handle transparency for JPEG
        if (outputFormat === "jpeg") {
          ctx!.fillStyle = "#FFFFFF";
          ctx!.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx!.drawImage(img, 0, 0);

        const mimeType = `image/${outputFormat}`;
        const dataUrl = canvas.toDataURL(mimeType, quality / 100);
        setConvertedImage(dataUrl);
        setIsComplete(true);
        setIsProcessing(false);

        toast.success(`Image converted to ${outputFormat.toUpperCase()}`);
      };

      img.onerror = () => {
        setIsProcessing(false);
        setError("Failed to load image");
        toast.error("Failed to load image");
      };

      img.src = URL.createObjectURL(file);
    } catch (error) {
      setIsProcessing(false);
      setError("Failed to convert image");
      toast.error("Failed to convert image");
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFiles([]);
    setConvertedImage(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for converted image
   */
  const getDownloadData = () => {
    if (!convertedImage) return null;

    // Convert data URL to blob
    const response = fetch(convertedImage);
    return response.then((res) => res.blob());
  };

  /**
   * Generates download filename for converted image
   */
  const getDownloadFilename = () => {
    if (selectedFiles.length === 0) return `converted.${outputFormat}`;
    const fileName = selectedFiles[0].name.replace(/\.[^/.]+$/, "");
    return `${fileName}.${outputFormat}`;
  };

  /**
   * Gets file extension from filename
   */
  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

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
    <ToolLayout toolId="image-convert">
      <MotionDiv
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
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
          className="space-y-6"
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? uploadSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>
                  Select an image file to convert
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFilesSelect}
                  accept="image/*"
                  multiple={false}
                  files={selectedFiles}
                  onRemoveFile={(index) => {
                    setSelectedFiles(
                      selectedFiles.filter((_, i) => i !== index),
                    );
                    setConvertedImage(null);
                    setError(null);
                    setIsComplete(false);
                  }}
                />
              </CardContent>
            </Card>
          </MotionDiv>

          {selectedFiles.length > 0 && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Settings</CardTitle>
                  <CardDescription>
                    Current format:{" "}
                    {getFileExtension(selectedFiles[0].name).toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={outputFormat}
                      onValueChange={setOutputFormat}
                    >
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
                        <SelectItem value="bmp">
                          BMP (Uncompressed bitmap)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(outputFormat === "jpeg" || outputFormat === "webp") && (
                    <MotionDiv
                      className="space-y-2"
                      initial={
                        animationsEnabled
                          ? { opacity: 0, height: 0 }
                          : undefined
                      }
                      animate={
                        animationsEnabled
                          ? { opacity: 1, height: "auto" }
                          : undefined
                      }
                      transition={
                        animationsEnabled ? { duration: 0.3 } : undefined
                      }
                    >
                      <Label htmlFor="quality">Quality: {quality}%</Label>
                      <Input
                        id="quality"
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher quality = larger file size
                      </p>
                    </MotionDiv>
                  )}

                  <ActionButtons
                    onGenerate={convertImage}
                    generateLabel="Convert Image"
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
          )}

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <ProcessingStatus
              isProcessing={isProcessing}
              isComplete={isComplete}
              error={error}
              onReset={clearAll}
              processingText="Converting image..."
              completeText="Image converted successfully!"
              errorText="Conversion failed"
            />
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={outputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? outputSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Converted Image</CardTitle>
              <CardDescription>
                Preview and download your converted image
              </CardDescription>
            </CardHeader>
            <CardContent>
              {convertedImage ? (
                <MotionDiv
                  className="space-y-4"
                  initial={
                    animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                  }
                  animate={
                    animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                  }
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={convertedImage}
                      alt="Converted"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {outputFormat.toUpperCase()}
                    {(outputFormat === "jpeg" || outputFormat === "webp") &&
                      ` • Quality: ${quality}%`}
                  </div>

                  <DownloadButton
                    data={convertedImage}
                    filename={getDownloadFilename()}
                    mimeType={`image/${outputFormat}`}
                    variant="outline"
                    size="sm"
                  >
                    Download Converted Image
                  </DownloadButton>
                </MotionDiv>
              ) : (
                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    {selectedFiles.length > 0
                      ? "Click 'Convert Image' to process"
                      : "Upload an image to get started"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
