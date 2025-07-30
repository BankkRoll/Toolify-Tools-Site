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
import { Download, FileText } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function ExtractPagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [extractedPdf, setExtractedPdf] = useState<Uint8Array | null>(null);
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

  const extractPages = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Parse page range (e.g., "1-3,5,7-9")
      const pages = parsePageRange(pageRange, totalPages);

      for (const pageNum of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      setExtractedPdf(pdfBytes);

      toast.success(`Extracted ${pages.length} pages from PDF`);
    } catch (error) {
      toast.error("Failed to extract pages");
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

  const downloadExtractedPdf = () => {
    if (!extractedPdf) return;

    const blob = new Blob([extractedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-${selectedFile?.name || "pages"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="pdf-extract-pages">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to extract pages from
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
                <CardTitle>Page Selection</CardTitle>
                <CardDescription>Total pages: {totalPages}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageRange">Page Range</Label>
                  <Input
                    id="pageRange"
                    placeholder="e.g., 1-3,5,7-9"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter page numbers separated by commas. Use hyphens for
                    ranges.
                  </p>
                </div>
                <Button
                  onClick={extractPages}
                  className="w-full"
                  disabled={isProcessing || !pageRange}
                >
                  {isProcessing ? "Extracting..." : "Extract Pages"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Extracted PDF
              {extractedPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadExtractedPdf}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extractedPdf ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">PDF Ready for Download</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Extracted PDF will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
