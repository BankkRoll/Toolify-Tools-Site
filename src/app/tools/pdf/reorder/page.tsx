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
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

interface PageInfo {
  index: number;
  originalIndex: number;
}

export default function ReorderPagesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [reorderedPdf, setReorderedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        const pageList: PageInfo[] = Array.from(
          { length: pageCount },
          (_, i) => ({
            index: i,
            originalIndex: i,
          }),
        );
        setPages(pageList);
      } catch (error) {
        toast.error("Failed to load PDF file");
      }
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    const newPages = [...pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    setPages(newPages);
  };

  const movePageUp = (index: number) => {
    if (index > 0) {
      movePage(index, index - 1);
    }
  };

  const movePageDown = (index: number) => {
    if (index < pages.length - 1) {
      movePage(index, index + 1);
    }
  };

  const reorderPages = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      for (const page of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
          page.originalIndex,
        ]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      setReorderedPdf(pdfBytes);

      toast.success("PDF pages reordered successfully");
    } catch (error) {
      toast.error("Failed to reorder PDF pages");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReorderedPdf = () => {
    if (!reorderedPdf) return;

    const blob = new Blob([reorderedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reordered-${selectedFile?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="pdf-reorder">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>
                Select a PDF file to reorder pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept=".pdf"
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={() => {
                  setSelectedFile(null);
                  setPages([]);
                }}
              />
            </CardContent>
          </Card>

          {pages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Page Order</CardTitle>
                <CardDescription>Drag pages to reorder them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {pages.map((page, index) => (
                  <div
                    key={`${page.originalIndex}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="text-sm font-medium">
                        Page {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Originally page {page.originalIndex + 1})
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => movePageUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => movePageDown(index)}
                        disabled={index === pages.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={reorderPages}
                  className="w-full mt-4"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Reordering..." : "Apply New Order"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Reordered PDF
              {reorderedPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReorderedPdf}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reorderedPdf ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">
                    PDF Reordered Successfully
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pages.length} pages reordered
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Reordered PDF will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
