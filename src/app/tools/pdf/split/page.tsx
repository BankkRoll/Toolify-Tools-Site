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
import { Download, FileText, Scissors } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useState } from "react";
import { toast } from "sonner";

interface SplitFile {
  name: string;
  pages: number[];
  data: Uint8Array;
}

export default function SplitPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [splitMethod, setSplitMethod] = useState("pages");
  const [pagesPerFile, setPagesPerFile] = useState(1);
  const [customRanges, setCustomRanges] = useState("1-5,6-10");
  const [totalPages, setTotalPages] = useState(0);
  const [splitFiles, setSplitFiles] = useState<SplitFile[]>([]);
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

  const parsePageRanges = (ranges: string): number[][] => {
    const rangeGroups: number[][] = [];
    const parts = ranges.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed
          .split("-")
          .map((n) => Number.parseInt(n.trim()));
        if (start && end && start <= end && start >= 1 && end <= totalPages) {
          const pages = Array.from(
            { length: end - start + 1 },
            (_, i) => start + i - 1,
          ); // Convert to 0-based
          rangeGroups.push(pages);
        }
      } else {
        const pageNum = Number.parseInt(trimmed);
        if (pageNum >= 1 && pageNum <= totalPages) {
          rangeGroups.push([pageNum - 1]); // Convert to 0-based
        }
      }
    }

    return rangeGroups;
  };

  const splitPdf = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const files: SplitFile[] = [];

      let pageGroups: number[][] = [];

      if (splitMethod === "pages") {
        // Split by number of pages per file
        for (let i = 0; i < totalPages; i += pagesPerFile) {
          const endPage = Math.min(i + pagesPerFile, totalPages);
          const pages = Array.from(
            { length: endPage - i },
            (_, idx) => i + idx,
          );
          pageGroups.push(pages);
        }
      } else if (splitMethod === "individual") {
        // Split into individual pages
        pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
      } else if (splitMethod === "custom") {
        // Split by custom ranges
        pageGroups = parsePageRanges(customRanges);
      }

      for (let i = 0; i < pageGroups.length; i++) {
        const pageGroup = pageGroups[i];
        const newPdf = await PDFDocument.create();

        for (const pageIndex of pageGroup) {
          const [copiedPage] = await newPdf.copyPages(originalPdf, [pageIndex]);
          newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        const displayPages = pageGroup.map((p) => p + 1); // Convert back to 1-based for display

        files.push({
          name: `${selectedFile.name.replace(".pdf", "")}_part_${i + 1}.pdf`,
          pages: displayPages,
          data: pdfBytes,
        });
      }

      setSplitFiles(files);
      toast.success(`PDF split into ${files.length} files`);
    } catch (error) {
      toast.error("Failed to split PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFile = (file: SplitFile) => {
    const blob = new Blob([file.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    splitFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 100);
    });
  };

  return (
    <ToolLayout toolId="pdf-split">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF</CardTitle>
              <CardDescription>Select a PDF file to split</CardDescription>
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
                <CardTitle>Split Settings</CardTitle>
                <CardDescription>Total pages: {totalPages}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="splitMethod">Split Method</Label>
                  <Select value={splitMethod} onValueChange={setSplitMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        Individual Pages
                      </SelectItem>
                      <SelectItem value="pages">
                        Fixed Number of Pages
                      </SelectItem>
                      <SelectItem value="custom">Custom Ranges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {splitMethod === "pages" && (
                  <div className="space-y-2">
                    <Label htmlFor="pagesPerFile">Pages per File</Label>
                    <Input
                      id="pagesPerFile"
                      type="number"
                      min="1"
                      max={totalPages}
                      value={pagesPerFile}
                      onChange={(e) => setPagesPerFile(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Will create approximately{" "}
                      {Math.ceil(totalPages / pagesPerFile)} files
                    </p>
                  </div>
                )}

                {splitMethod === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customRanges">Page Ranges</Label>
                    <Input
                      id="customRanges"
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      placeholder="e.g., 1-5,6-10,11-15"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter page ranges separated by commas. Use hyphens for
                      ranges.
                    </p>
                  </div>
                )}

                <Button
                  onClick={splitPdf}
                  className="w-full"
                  disabled={
                    isProcessing || (splitMethod === "custom" && !customRanges)
                  }
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  {isProcessing ? "Splitting..." : "Split PDF"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Split Files
              {splitFiles.length > 0 && (
                <Button variant="outline" size="sm" onClick={downloadAllFiles}>
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {splitFiles.length > 0
                ? `${splitFiles.length} files created`
                : "Split files will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {splitFiles.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {splitFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Pages: {file.pages.join(", ")} ({file.pages.length}{" "}
                          page
                          {file.pages.length !== 1 ? "s" : ""})
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Split files will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
