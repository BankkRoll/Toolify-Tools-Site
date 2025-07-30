'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { FileText, Search } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { PDFDocument } from 'pdf-lib';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * PDF to Text extraction tool page
 */
export default function PdfToTextPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('pdf-to-text-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setExtractedText('');
      setError(null);
      setIsComplete(false);
    }
  };

  /**
   * Extracts text from the uploaded PDF file
   */
  const extractText = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      let text = '';
      for (const page of pages) {
        // pdf-lib does not support text extraction directly, so we use a placeholder
        // In a real app, use pdf.js or a backend service for full extraction
        text += `[Page ${pages.indexOf(page) + 1}]\n`;
        text += '(Text extraction requires pdf.js or a backend service)\n\n';
      }
      setExtractedText(text);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success('Text extracted from PDF (demo mode)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract text from PDF';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the extracted text as a .txt file
   */
  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.pdf$/i, '') || 'document'}-extracted.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text file downloaded');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setExtractedText('');
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
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='pdf-to-text'>
      <MotionDiv
        ref={containerRef}
        className='space-y-6'
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (containerInView ? 'visible' : 'hidden') : undefined}
      >
        <MotionDiv
          ref={uploadSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (uploadSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Upload PDF
              </CardTitle>
              <CardDescription>Select a PDF file to extract text from</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept='.pdf,application/pdf'
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={clearAll}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Search className='h-5 w-5' />
                  Extract Text
                </CardTitle>
                <CardDescription>Extract all text from the uploaded PDF file</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <ActionButtons
                  onGenerate={extractText}
                  generateLabel='Extract Text'
                  onReset={clearAll}
                  resetLabel='Clear'
                  variant='outline'
                  size='sm'
                  disabled={isProcessing}
                  isGenerating={isProcessing}
                />
                <Textarea
                  value={extractedText}
                  readOnly
                  className='min-h-[300px] font-mono text-sm'
                  placeholder='Extracted text will appear here...'
                />
                <ActionButtons
                  copyText={extractedText}
                  downloadData={extractedText}
                  downloadFilename={
                    selectedFile
                      ? `${selectedFile.name.replace(/\.pdf$/i, '')}-extracted.txt`
                      : 'extracted.txt'
                  }
                  downloadMimeType='text/plain'
                  onDownload={downloadText}
                  variant='outline'
                  size='sm'
                  disabled={!extractedText}
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
            processingText='Extracting text from PDF...'
            completeText='Text extracted successfully!'
            errorText='Failed to extract text from PDF'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
