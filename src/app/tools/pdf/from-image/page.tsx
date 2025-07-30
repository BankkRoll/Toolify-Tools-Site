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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Download, FileText, X } from "lucide-react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function ImageToPdfPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margin, setMargin] = useState("medium");
  const [generatedPdf, setGeneratedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newFiles = [...selectedFiles];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newFiles.length) {
      [newFiles[index], newFiles[targetIndex]] = [
        newFiles[targetIndex],
        newFiles[index],
      ];
      setSelectedFiles(newFiles);
    }
  };

  const getPageDimensions = () => {
    let dimensions = PageSizes.A4;

    switch (pageSize) {
      case "A3":
        dimensions = PageSizes.A3;
        break;
      case "A4":
        dimensions = PageSizes.A4;
        break;
      case "A5":
        dimensions = PageSizes.A5;
        break;
      case "Letter":
        dimensions = PageSizes.Letter;
        break;
      case "Legal":
        dimensions = PageSizes.Legal;
        break;
    }

    if (orientation === "landscape") {
      return [dimensions[1], dimensions[0]];
    }
    return dimensions;
  };

  const getMarginValue = () => {
    switch (margin) {
      case "none":
        return 0;
      case "small":
        return 20;
      case "medium":
        return 40;
      case "large":
        return 60;
      default:
        return 40;
    }
  };

  const createPdf = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const [pageWidth, pageHeight] = getPageDimensions();
      const marginValue = getMarginValue();

      for (const file of selectedFiles) {
        const imageBytes = await file.arrayBuffer();
        let image;

        if (file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // Convert other formats to PNG first (simplified)
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();

          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = URL.createObjectURL(file);
          });

          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const pngDataUrl = canvas.toDataURL("image/png");
          const pngBytes = await fetch(pngDataUrl).then((res) =>
            res.arrayBuffer(),
          );
          image = await pdfDoc.embedPng(pngBytes);
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions to fit within page margins
        const availableWidth = pageWidth - marginValue * 2;
        const availableHeight = pageHeight - marginValue * 2;

        const imageAspectRatio = image.width / image.height;
        const availableAspectRatio = availableWidth / availableHeight;

        let imageWidth, imageHeight;

        if (imageAspectRatio > availableAspectRatio) {
          // Image is wider, fit to width
          imageWidth = availableWidth;
          imageHeight = availableWidth / imageAspectRatio;
        } else {
          // Image is taller, fit to height
          imageHeight = availableHeight;
          imageWidth = availableHeight * imageAspectRatio;
        }

        // Center the image on the page
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      setGeneratedPdf(pdfBytes);

      toast.success(`Created PDF with ${selectedFiles.length} images`);
    } catch (error) {
      toast.error("Failed to create PDF from images");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = () => {
    if (!generatedPdf) return;

    const blob = new Blob([generatedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "images-to-pdf.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="pdf-from-image">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Select multiple image files to convert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFilesSelect}
                accept="image/*"
                multiple={true}
                files={selectedFiles}
              />
            </CardContent>
          </Card>

          {selectedFiles.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>PDF Settings</CardTitle>
                  <CardDescription>Configure the output PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageSize">Page Size</Label>
                      <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A5">A5</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orientation">Orientation</Label>
                      <Select
                        value={orientation}
                        onValueChange={setOrientation}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin">Margins</Label>
                    <Select value={margin} onValueChange={setMargin}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={createPdf}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isProcessing
                      ? "Creating PDF..."
                      : `Create PDF (${selectedFiles.length} images)`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Order</CardTitle>
                  <CardDescription>
                    Arrange images in the order they'll appear in the PDF
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {index + 1}.
                        </span>
                        <div className="w-8 h-8 border rounded overflow-hidden">
                          <img
                            src={
                              URL.createObjectURL(file) || "/placeholder.svg"
                            }
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm truncate max-w-32">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveFile(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveFile(index, "down")}
                          disabled={index === selectedFiles.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated PDF
              {generatedPdf && (
                <Button variant="outline" size="sm" onClick={downloadPdf}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPdf ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">
                    PDF Created Successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.length} images converted
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {selectedFiles.length === 0
                    ? "Upload images to get started"
                    : "Click 'Create PDF' to generate"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
