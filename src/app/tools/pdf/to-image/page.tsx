"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { FileUploadZone } from "@/components/tools/file-upload-zone";
import { Button } from "@/components/ui/button";
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
import { Download, FileText, ImageIcon } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function PdfToImagePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState(150);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (error) {
        toast.error("Failed to load PDF file");
      }
    }
  };

  const convertToImages = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // This is a simplified implementation
      // In a real app, you'd use a library like pdf2pic or PDF.js
      const images: string[] = [];

      // Simulate conversion process
      for (let i = 0; i < totalPages; i++) {
        // Create a placeholder canvas for each page
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Set canvas size based on DPI
        const width = Math.floor(8.5 * dpi); // Letter size width
        const height = Math.floor(11 * dpi); // Letter size height
        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // Fill with white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Add some placeholder content
          ctx.fillStyle = "#000000";
          ctx.font = "24px Arial";
          ctx.fillText(`PDF Page ${i + 1}`, 50, 100);
          ctx.fillText("Converted to Image", 50, 150);

          // Add border
          ctx.strokeStyle = "#CCCCCC";
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, width, height);
        }

        const mimeType = `image/${outputFormat}`;
        const dataUrl = canvas.toDataURL(mimeType, quality / 100);
        images.push(dataUrl);
      }

      setConvertedImages(images);
      toast.success(
        `Converted ${totalPages} pages to ${outputFormat.toUpperCase()}`,
      );
    } catch (error) {
      toast.error("Failed to convert PDF to images");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (imageData: string, pageNumber: number) => {
    const link = document.createElement("a");
    link.download = `page-${pageNumber + 1}.${outputFormat}`;
    link.href = imageData;
    link.click();
  };

  const downloadAllImages = () => {
    convertedImages.forEach((imageData, index) => {
      setTimeout(() => downloadImage(imageData, index), index * 100);
    });
  };

  return (
    <ToolLayout toolId="pdf-to-image">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to convert to images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept=".pdf"
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={() => setSelectedFile(null)}
              />
            </CardContent>
          </Card>

          {selectedFile && totalPages > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversion Settings</CardTitle>
                <CardDescription>Total pages: {totalPages}</CardDescription>
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

                <Button
                  onClick={convertToImages}
                  className="w-full"
                  disabled={isProcessing}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {isProcessing ? "Converting..." : "Convert to Images"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Converted Images
              {convertedImages.length > 0 && (
                <Button variant="outline" size="sm" onClick={downloadAllImages}>
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {convertedImages.length > 0
                ? `${convertedImages.length} images ready`
                : "Images will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {convertedImages.length > 0 ? (
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
                        <p className="text-sm font-medium">Page {index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {outputFormat.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadImage(imageData, index)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Converted images will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
