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
import { Textarea } from "@/components/ui/textarea";
import { Download, Droplets } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function WatermarkPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [position, setPosition] = useState("center");
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState("#FF0000");
  const [watermarkedPdf, setWatermarkedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const addWatermark = async () => {
    if (!selectedFile || !watermarkText.trim()) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Convert hex color to RGB
      const hexColor = color.replace("#", "");
      const r = Number.parseInt(hexColor.substr(0, 2), 16) / 255;
      const g = Number.parseInt(hexColor.substr(2, 2), 16) / 255;
      const b = Number.parseInt(hexColor.substr(4, 2), 16) / 255;

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x, y;

        // Calculate position
        switch (position) {
          case "top-left":
            x = 50;
            y = height - 50 - textHeight;
            break;
          case "top-center":
            x = (width - textWidth) / 2;
            y = height - 50 - textHeight;
            break;
          case "top-right":
            x = width - textWidth - 50;
            y = height - 50 - textHeight;
            break;
          case "center-left":
            x = 50;
            y = (height - textHeight) / 2;
            break;
          case "center":
            x = (width - textWidth) / 2;
            y = (height - textHeight) / 2;
            break;
          case "center-right":
            x = width - textWidth - 50;
            y = (height - textHeight) / 2;
            break;
          case "bottom-left":
            x = 50;
            y = 50;
            break;
          case "bottom-center":
            x = (width - textWidth) / 2;
            y = 50;
            break;
          case "bottom-right":
            x = width - textWidth - 50;
            y = 50;
            break;
          default:
            x = (width - textWidth) / 2;
            y = (height - textHeight) / 2;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: {
            type: "degrees",
            angle: rotation,
          },
        });
      }

      const pdfBytes = await pdfDoc.save();
      setWatermarkedPdf(pdfBytes);

      toast.success("Watermark added to PDF successfully");
    } catch (error) {
      toast.error("Failed to add watermark to PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadWatermarkedPdf = () => {
    if (!watermarkedPdf) return;

    const blob = new Blob([watermarkedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermarked-${selectedFile?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="pdf-watermark">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to add watermark
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

          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Watermark Settings</CardTitle>
                <CardDescription>
                  Configure the watermark appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="watermarkText">Watermark Text</Label>
                  <Textarea
                    id="watermarkText"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-center">Top Center</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="center-left">Center Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="center-right">
                          Center Right
                        </SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-center">
                          Bottom Center
                        </SelectItem>
                        <SelectItem value="bottom-right">
                          Bottom Right
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opacity">Opacity: {opacity}%</Label>
                  <Input
                    id="opacity"
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size: {fontSize}px</Label>
                  <Input
                    id="fontSize"
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rotation">Rotation: {rotation}°</Label>
                  <Input
                    id="rotation"
                    type="range"
                    min="-90"
                    max="90"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                  />
                </div>

                <Button
                  onClick={addWatermark}
                  className="w-full"
                  disabled={isProcessing || !watermarkText.trim()}
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  {isProcessing ? "Adding Watermark..." : "Add Watermark"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Watermark preview with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-64 bg-white border-2 border-dashed rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-300 text-6xl">PDF</div>
                </div>
                {watermarkText && (
                  <div
                    className="absolute pointer-events-none select-none"
                    style={{
                      fontSize: `${Math.max(fontSize / 4, 12)}px`,
                      color: color,
                      opacity: opacity / 100,
                      transform: `rotate(${rotation}deg)`,
                      left: position.includes("left")
                        ? "10%"
                        : position.includes("right")
                          ? "70%"
                          : "50%",
                      top: position.includes("top")
                        ? "20%"
                        : position.includes("bottom")
                          ? "80%"
                          : "50%",
                      transformOrigin: "center",
                      translate: position.includes("center")
                        ? "-50% -50%"
                        : "0 0",
                    }}
                  >
                    {watermarkText}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Watermarked PDF
                {watermarkedPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadWatermarkedPdf}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {watermarkedPdf ? (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                  <div className="text-center">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">
                      Watermark Added Successfully
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF ready for download
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Watermarked PDF will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
