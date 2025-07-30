"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { FileUploadSection } from "@/components/tools/shared/file-upload-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUtils } from "@/utils/file-utils";
import { ArrowDown, ArrowUp, FileText, Trash2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

export default function MergePdfPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedPdf, setMergedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === selectedFiles.length - 1)
    ) {
      return;
    }

    const newFiles = [...selectedFiles];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [
      newFiles[targetIndex],
      newFiles[index],
    ];

    setSelectedFiles(newFiles);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  const mergePdfs = async () => {
    if (selectedFiles.length < 2) {
      setError("Please select at least 2 PDF files to merge");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const mergedPdfDoc = await PDFDocument.create();

      for (const file of selectedFiles) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = await mergedPdfDoc.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices(),
          );
          pages.forEach((page) => mergedPdfDoc.addPage(page));
        } catch (err) {
          throw new Error(
            `Failed to process ${file.name}. Please ensure it's a valid PDF file.`,
          );
        }
      }

      const mergedPdfBytes = await mergedPdfDoc.save();
      setMergedPdf(mergedPdfBytes);
      setIsComplete(true);
      toast.success("PDFs merged successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to merge PDFs";
      setError(errorMessage);
      toast.error("Failed to merge PDFs");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedPdf = () => {
    if (!mergedPdf) return;

    const blob = new Blob([mergedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merged-${selectedFiles.length}-files.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setMergedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  const getDownloadData = () => {
    if (!mergedPdf) return null;
    return new Blob([mergedPdf], { type: "application/pdf" });
  };

  const getDownloadFilename = () => {
    return `merged-${selectedFiles.length}-files.pdf`;
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <ToolLayout toolId="pdf-merge">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>PDF Merge</CardTitle>
                <CardDescription>
                  Combine multiple PDF files into a single document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadSection
                  title="Upload PDF Files"
                  description="Select multiple PDF files to merge (drag to reorder)"
                  accept=".pdf,application/pdf"
                  multiple={true}
                  onFilesChange={handleFilesSelect}
                  files={selectedFiles}
                  showCard={false}
                  compact={true}
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Files:
                      </span>
                      <Badge variant="outline">{selectedFiles.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Size:</span>
                      <span className="font-medium">
                        {FileUtils.formatFileSize(totalSize)}
                      </span>
                    </div>
                  </div>
                )}

                <ActionButtons
                  onGenerate={mergePdfs}
                  generateLabel="Merge PDFs"
                  onReset={clearAll}
                  resetLabel="Clear All"
                  variant="outline"
                  size="sm"
                  disabled={selectedFiles.length < 2 || isProcessing}
                />
              </CardContent>
            </Card>

            <ProcessingStatus
              isProcessing={isProcessing}
              isComplete={isComplete}
              error={error}
              onReset={clearAll}
              processingText="Merging PDF files..."
              completeText="PDF files merged successfully!"
              errorText="Merge failed"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>File Order</CardTitle>
              <CardDescription>
                Files will be merged in the order shown below
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedFiles.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium text-sm">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {FileUtils.formatFileSize(file.size)}
                          </div>
                        </div>
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
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Upload PDF files to get started
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {mergedPdf && (
          <Card>
            <CardHeader>
              <CardTitle>Merged PDF</CardTitle>
              <CardDescription>
                Your merged PDF is ready for download
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium text-green-600">
                      PDF Merged Successfully
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FileUtils.formatFileSize(mergedPdf.length)}
                    </p>
                  </div>
                </div>

                <ActionButtons
                  downloadData={getDownloadData()!}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="application/pdf"
                  variant="outline"
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>About PDF Merging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">How it works:</h4>
                <p className="text-muted-foreground">
                  PDF merging combines multiple PDF files into a single
                  document, preserving the original formatting and content of
                  each file.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tips:</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Drag files to reorder them</li>
                  <li>• Files are merged in the order shown</li>
                  <li>• All files must be valid PDFs</li>
                  <li>• Maximum file size may be limited</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
