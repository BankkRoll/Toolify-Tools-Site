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
import { Slider } from "@/components/ui/slider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Image } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image compression tool page
 */
export default function CompressImagePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState("original");
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "image-compress-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const settingsSectionInView = useInView(settingsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutSectionInView = useInView(aboutSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes compression
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setOriginalSize(file.size);
      setError(null);
      setIsComplete(false);
      setCompressedImage(null);
    }
  };

  /**
   * Compresses the image using canvas
   */
  const compressImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);

        const format =
          outputFormat === "original"
            ? selectedFile.type
            : `image/${outputFormat}`;
        const dataUrl = canvas.toDataURL(format, quality / 100);

        // Calculate compressed size (approximate)
        const base64Length = dataUrl.split(",")[1].length;
        const sizeInBytes = (base64Length * 3) / 4;

        setCompressedImage(dataUrl);
        setCompressedSize(sizeInBytes);
        setIsComplete(true);

        const compressionRatio = (
          ((originalSize - sizeInBytes) / originalSize) *
          100
        ).toFixed(1);

        setHistory(
          [
            `Image compressed: ${compressionRatio}% reduction`,
            ...history,
          ].slice(0, 10),
        );
        toast.success(`Image compressed by ${compressionRatio}%`);
      };

      img.onerror = () => {
        setError(
          "Failed to load image. Please ensure it's a valid image file.",
        );
        toast.error("Failed to load image");
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      setError("Failed to compress image");
      toast.error("Failed to compress image");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setCompressedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for compressed image
   */
  const getDownloadData = () => {
    if (!compressedImage) return null;
    return compressedImage;
  };

  /**
   * Generates download filename for compressed image
   */
  const getDownloadFilename = () => {
    if (!selectedFile) return "compressed-image.jpg";
    const name = selectedFile.name.replace(/\.[^/.]+$/, "");
    const extension =
      outputFormat === "original"
        ? selectedFile.name.split(".").pop() || "jpg"
        : outputFormat;
    return `compressed-${name}.${extension}`;
  };

  /**
   * Gets MIME type for download
   */
  const getDownloadMimeType = () => {
    if (outputFormat === "original") {
      return selectedFile?.type || "image/jpeg";
    }
    return `image/${outputFormat}`;
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
    <ToolLayout toolId="image-compress">
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
          ref={settingsSectionRef}
          className="grid gap-6 lg:grid-cols-2"
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? settingsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Image Compression</CardTitle>
                <CardDescription>
                  Compress images to reduce file size while maintaining quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  onFilesSelected={handleFileSelect}
                  accept="image/*"
                  multiple={false}
                  files={selectedFile ? [selectedFile] : []}
                  onRemoveFile={() => {
                    setSelectedFile(null);
                    setCompressedImage(null);
                    setOriginalSize(0);
                    setCompressedSize(0);
                    setError(null);
                    setIsComplete(false);
                  }}
                />

                {selectedFile && (
                  <MotionDiv
                    className="space-y-4"
                    initial={
                      animationsEnabled ? { opacity: 0, height: 0 } : undefined
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
                    <div className="space-y-2">
                      <Label>Quality: {quality}%</Label>
                      <Slider
                        value={[quality]}
                        onValueChange={(value) => setQuality(value[0])}
                        max={100}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="output-format">Output Format</Label>
                      <Select
                        value={outputFormat}
                        onValueChange={setOutputFormat}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">
                            Original Format
                          </SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="webp">WebP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-width">
                          Max Width: {maxWidth}px
                        </Label>
                        <input
                          id="max-width"
                          type="range"
                          min="100"
                          max="4000"
                          step="100"
                          value={maxWidth}
                          onChange={(e) => setMaxWidth(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-height">
                          Max Height: {maxHeight}px
                        </Label>
                        <input
                          id="max-height"
                          type="range"
                          min="100"
                          max="4000"
                          step="100"
                          value={maxHeight}
                          onChange={(e) => setMaxHeight(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </MotionDiv>
                )}

                <ActionButtons
                  onGenerate={compressImage}
                  generateLabel="Compress Image"
                  onReset={clearAll}
                  resetLabel="Clear"
                  variant="outline"
                  size="sm"
                  disabled={!selectedFile || isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Compression Results</CardTitle>
                <CardDescription>
                  View compression statistics and download the result
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFile && (
                  <MotionDiv
                    className="space-y-3"
                    initial={
                      animationsEnabled ? { opacity: 0, x: 20 } : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, x: 0 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Original Size:
                        </span>
                        <div className="font-medium">
                          {(originalSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      {compressedSize > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            Compressed Size:
                          </span>
                          <div className="font-medium">
                            {(compressedSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      )}
                    </div>

                    {compressedSize > 0 && (
                      <MotionDiv
                        className="space-y-2"
                        initial={
                          animationsEnabled ? { opacity: 0, y: 10 } : undefined
                        }
                        animate={
                          animationsEnabled ? { opacity: 1, y: 0 } : undefined
                        }
                        transition={
                          animationsEnabled ? { delay: 0.2 } : undefined
                        }
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Compression Ratio:
                          </span>
                          <span className="font-medium">
                            {(
                              ((originalSize - compressedSize) / originalSize) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (compressedSize / originalSize) * 100)}%`,
                            }}
                          />
                        </div>
                      </MotionDiv>
                    )}
                  </MotionDiv>
                )}

                {compressedImage && (
                  <MotionDiv
                    className="space-y-4"
                    initial={
                      animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={compressedImage}
                        alt="Compressed Preview"
                        className="w-full h-auto max-h-48 object-contain"
                      />
                    </div>

                    <ActionButtons
                      downloadData={getDownloadData()!}
                      downloadFilename={getDownloadFilename()}
                      downloadMimeType={getDownloadMimeType()}
                      variant="outline"
                      size="sm"
                    />
                  </MotionDiv>
                )}

                {!selectedFile && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Upload an image file to get started
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={aboutSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? aboutSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>About Image Compression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <p className="text-muted-foreground">
                    Image compression reduces file size by optimizing quality
                    settings, resizing dimensions, and converting to more
                    efficient formats while maintaining visual quality.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">Compression Tips:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Lower quality = smaller file size</li>
                    <li>• JPEG is best for photos</li>
                    <li>• PNG is best for graphics with transparency</li>
                    <li>• WebP offers the best compression</li>
                  </ul>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText="Compressing image..."
            completeText="Image compression complete!"
            errorText="Compression failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
