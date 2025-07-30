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
import { Download, RotateCw } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function RotatePdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState("90");
  const [pageRange, setPageRange] = useState("all");
  const [customPages, setCustomPages] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [rotatedPdf, setRotatedPdf] = useState<Uint8Array | null>(null);
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

  const rotatePdf = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      let pagesToRotate: number[] = [];

      if (pageRange === "all") {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
      } else if (pageRange === "custom" && customPages) {
        pagesToRotate = parsePageRange(customPages, totalPages).map(
          (p) => p - 1,
        );
      }

      const rotation = Number.parseInt(rotationAngle);

      for (const pageIndex of pagesToRotate) {
        if (pageIndex >= 0 && pageIndex < pages.length) {
          pages[pageIndex].setRotation(degrees(rotation));
        }
      }

      const pdfBytes = await pdfDoc.save();
      setRotatedPdf(pdfBytes);

      toast.success(`Rotated ${pagesToRotate.length} pages by ${rotation}°`);
    } catch (error) {
      toast.error("Failed to rotate PDF pages");
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePageRange = (range: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = range.split(",");

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part
          .split("-")
          .map((n) => Number.parseInt(n.trim()));
        for (let i = start; i <= Math.min(end, maxPages); i++) {
          if (i >= 1) pages.push(i);
        }
      } else {
        const pageNum = Number.parseInt(part.trim());
        if (pageNum >= 1 && pageNum <= maxPages) {
          pages.push(pageNum);
        }
      }
    }

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const downloadRotatedPdf = () => {
    if (!rotatedPdf) return;

    const blob = new Blob([rotatedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotated-${selectedFile?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="pdf-rotate">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to rotate pages
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
                <CardTitle>Rotation Settings</CardTitle>
                <CardDescription>Total pages: {totalPages}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="angle">Rotation Angle</Label>
                  <Select
                    value={rotationAngle}
                    onValueChange={setRotationAngle}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90° Clockwise</SelectItem>
                      <SelectItem value="180">180° (Upside Down)</SelectItem>
                      <SelectItem value="270">
                        270° (90° Counter-clockwise)
                      </SelectItem>
                      <SelectItem value="-90">90° Counter-clockwise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageRange">Pages to Rotate</Label>
                  <Select value={pageRange} onValueChange={setPageRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pageRange === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customPages">Page Range</Label>
                    <Input
                      id="customPages"
                      placeholder="e.g., 1-3,5,7-9"
                      value={customPages}
                      onChange={(e) => setCustomPages(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter page numbers separated by commas. Use hyphens for
                      ranges.
                    </p>
                  </div>
                )}

                <Button
                  onClick={rotatePdf}
                  className="w-full"
                  disabled={
                    isProcessing || (pageRange === "custom" && !customPages)
                  }
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {isProcessing ? "Rotating..." : "Rotate Pages"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Rotated PDF
              {rotatedPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadRotatedPdf}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rotatedPdf ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                <div className="text-center">
                  <RotateCw className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">
                    PDF Rotated Successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pages rotated by {rotationAngle}°
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Rotated PDF will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
