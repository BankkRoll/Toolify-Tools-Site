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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Download, Edit3, FileText } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Form field data structure
 */
interface FormField {
  name: string;
  value: string;
  type: "text" | "email" | "phone" | "date";
}

/**
 * PDF form filler tool page
 */
export default function PdfFormFillerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [filledPdf, setFilledPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "pdf-form-filler-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const formSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const formSectionInView = useInView(formSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes form fields
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setFilledPdf(null);
      setError(null);
      setIsComplete(false);
      // Initialize with common form fields
      setFormFields([
        { name: "Full Name", value: "", type: "text" },
        { name: "Email", value: "", type: "email" },
        { name: "Phone", value: "", type: "phone" },
        { name: "Date", value: "", type: "date" },
        { name: "Address", value: "", type: "text" },
      ]);
      toast.success("PDF loaded successfully");
    }
  };

  /**
   * Updates form field value
   */
  const updateField = (index: number, value: string) => {
    setFormFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  /**
   * Adds a new form field
   */
  const addField = () => {
    setFormFields((prev) => [
      ...prev,
      { name: `Field ${prev.length + 1}`, value: "", type: "text" },
    ]);
  };

  /**
   * Removes a form field
   */
  const removeField = (index: number) => {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Fills the PDF form with provided data
   */
  const fillForm = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // For demo, we'll add text to the first page
      if (pages.length > 0) {
        const page = pages[0];
        let yOffset = page.getHeight() - 100;

        formFields.forEach((field) => {
          if (field.value.trim()) {
            page.drawText(`${field.name}: ${field.value}`, {
              x: 50,
              y: yOffset,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });
            yOffset -= 30;
          }
        });
      }

      const pdfBytes = await pdfDoc.save();
      setFilledPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success("Form filled successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fill PDF form";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the filled PDF
   */
  const downloadFilledPdf = () => {
    if (!filledPdf) return;
    const blob = new Blob([filledPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filled-${selectedFile?.name || "form.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded successfully");
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setFormFields([]);
    setFilledPdf(null);
    setError(null);
    setIsComplete(false);
  };

  // Motion variants
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
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="pdf-form-filler">
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
          ref={uploadSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? uploadSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload PDF Form
              </CardTitle>
              <CardDescription>Select a PDF form to fill out</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept=".pdf,application/pdf"
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={clearAll}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && formFields.length > 0 && (
          <MotionDiv
            ref={formSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? formSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Fill Form Fields
                </CardTitle>
                <CardDescription>
                  Enter values for each form field
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formFields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`field-${index}`}>{field.name}</Label>
                      <ActionButtons
                        onReset={() => removeField(index)}
                        resetLabel="Remove"
                        variant="ghost"
                        size="sm"
                      />
                    </div>
                    <Input
                      id={`field-${index}`}
                      type={field.type === "date" ? "date" : "text"}
                      value={field.value}
                      onChange={(e) => updateField(index, e.target.value)}
                      placeholder={`Enter ${field.name.toLowerCase()}...`}
                      className="w-full"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <ActionButtons
                    onGenerate={addField}
                    generateLabel="Add Field"
                    variant="outline"
                    size="sm"
                  />
                  <ActionButtons
                    onGenerate={fillForm}
                    generateLabel="Fill Form"
                    onReset={clearAll}
                    resetLabel="Clear"
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    isGenerating={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {filledPdf && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? resultsSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Filled PDF Form
                </CardTitle>
                <CardDescription>Download your filled PDF form</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={filledPdf}
                  downloadFilename={
                    selectedFile
                      ? `filled-${selectedFile.name}`
                      : "filled-form.pdf"
                  }
                  downloadMimeType="application/pdf"
                  onDownload={downloadFilledPdf}
                  variant="outline"
                  size="sm"
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
            processingText="Filling PDF form..."
            completeText="Form filled successfully!"
            errorText="Failed to fill PDF form"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
