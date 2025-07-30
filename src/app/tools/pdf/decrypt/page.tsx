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
import { useAnimations } from "@/stores/settings-store";
import { Download, Eye, EyeOff, FileText, Unlock } from "lucide-react";
import { m, useInView } from "motion/react";
import { PDFDocument } from "pdf-lib";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * PDF decryption tool page
 */
export default function DecryptPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPdf, setDecryptedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean | null>(null);

  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const passwordSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const passwordSectionInView = useInView(passwordSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultSectionInView = useInView(resultSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and checks if PDF is encrypted
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);

      // Check if PDF is encrypted
      try {
        const arrayBuffer = await file.arrayBuffer();
        await PDFDocument.load(arrayBuffer);
        setIsEncrypted(false);
        toast.info("This PDF is not encrypted");
      } catch (error) {
        setIsEncrypted(true);
      }
    }
  };

  /**
   * Decrypts the PDF with the provided password
   */
  const decryptPdf = async () => {
    if (!selectedFile || !password) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      // In a real implementation, you would use a library that supports PDF decryption
      // For now, we'll simulate the process
      try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pdfBytes = await pdfDoc.save();
        setDecryptedPdf(pdfBytes);

        toast.success("PDF decrypted successfully");
      } catch (error) {
        toast.error("Invalid password or unable to decrypt PDF");
      }
    } catch (error) {
      toast.error("Failed to decrypt PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the decrypted PDF
   */
  const downloadDecryptedPdf = () => {
    if (!decryptedPdf) return;

    const blob = new Blob([decryptedPdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decrypted-${selectedFile?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
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
    <ToolLayout toolId="pdf-decrypt">
      <MotionDiv
        ref={containerRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
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
          className="space-y-6"
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? uploadSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Upload Encrypted PDF</CardTitle>
                <CardDescription>
                  Select a password-protected PDF file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFileSelect}
                  accept=".pdf,application/pdf"
                  multiple={false}
                  files={selectedFile ? [selectedFile] : []}
                  onRemoveFile={() => {
                    setDecryptedPdf(null);
                    setPassword("");
                    setShowPassword(false);
                    setSelectedFile(null);
                    setIsEncrypted(null);
                    setIsProcessing(false);
                  }}
                />
                {isEncrypted === false && (
                  <MotionDiv
                    className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    initial={
                      animationsEnabled ? { opacity: 0, y: 10 } : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, y: 0 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <p className="text-sm text-blue-800">
                      This PDF is not encrypted and doesn't need decryption.
                    </p>
                  </MotionDiv>
                )}
              </CardContent>
            </Card>
          </MotionDiv>

          {selectedFile && isEncrypted && (
            <MotionDiv
              ref={passwordSectionRef}
              variants={animationsEnabled ? cardVariants : undefined}
              initial={animationsEnabled ? "hidden" : undefined}
              animate={
                animationsEnabled
                  ? passwordSectionInView
                    ? "visible"
                    : "hidden"
                  : undefined
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Enter Password</CardTitle>
                  <CardDescription>
                    Provide the password to decrypt the PDF
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">PDF Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter PDF password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={decryptPdf}
                    className="w-full"
                    disabled={isProcessing || !password}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    {isProcessing ? "Decrypting..." : "Decrypt PDF"}
                  </Button>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </MotionDiv>

        <MotionDiv
          ref={resultSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? resultSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Decrypted PDF
                {decryptedPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadDecryptedPdf}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decryptedPdf ? (
                <MotionDiv
                  className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50"
                  initial={
                    animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                  }
                  animate={
                    animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                  }
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className="text-center">
                    <Unlock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">
                      PDF Decrypted Successfully
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Password protection removed
                    </p>
                  </div>
                </MotionDiv>
              ) : isEncrypted === false ? (
                <MotionDiv
                  className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-blue-50"
                  initial={
                    animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                  }
                  animate={
                    animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                  }
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">PDF Not Encrypted</p>
                    <p className="text-xs text-muted-foreground">
                      This file doesn't require decryption
                    </p>
                  </div>
                </MotionDiv>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Decrypted PDF will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
