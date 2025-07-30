'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { ArrowDown, ArrowUp, FileText, Trash2 } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { PDFDocument } from 'pdf-lib';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * PDF merge tool page
 */
export default function MergePdfPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedPdf, setMergedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('pdf-merge-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const filesSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const filesSectionInView = useInView(filesSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection for PDFs
   */
  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  /**
   * Removes a file from the selection
   */
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  /**
   * Moves a file up or down in the list
   */
  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedFiles.length - 1)
    ) {
      return;
    }

    const newFiles = [...selectedFiles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];

    setSelectedFiles(newFiles);
    setError(null);
    setIsComplete(false);
    setMergedPdf(null);
  };

  /**
   * Merges multiple PDF files into a single document
   */
  const mergePdfs = async () => {
    if (selectedFiles.length < 2) {
      toast.error('Please select at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      setMergedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([`${selectedFiles.length} files merged`, ...history].slice(0, 10));
      toast.success('PDFs merged successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to merge PDFs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the merged PDF
   */
  const downloadMergedPdf = () => {
    if (!mergedPdf) return;

    const blob = new Blob([mergedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-pdfs.pdf';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFiles([]);
    setMergedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the merged PDF
   */
  const getDownloadData = () => {
    return mergedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the merged PDF
   */
  const getDownloadFilename = () => {
    return 'merged-pdfs.pdf';
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

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='pdf-merge'>
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
                Upload PDFs
              </CardTitle>
              <CardDescription>Select multiple PDF files to merge</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFilesSelect}
                accept='.pdf,application/pdf'
                multiple={true}
                files={selectedFiles}
                onRemoveFile={removeFile}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFiles.length > 0 && (
          <MotionDiv
            ref={filesSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (filesSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>File Order</CardTitle>
                <CardDescription>
                  Arrange files in the order they'll appear in the merged PDF
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge variant='secondary'>{index + 1}</Badge>
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm font-medium truncate max-w-48'>{file.name}</span>
                        </div>
                      </div>
                      <div className='flex items-center gap-1'>
                        <button
                          onClick={() => moveFile(index, 'up')}
                          disabled={index === 0}
                          className='p-1 hover:bg-muted rounded disabled:opacity-50'
                        >
                          <ArrowUp className='h-3 w-3' />
                        </button>
                        <button
                          onClick={() => moveFile(index, 'down')}
                          disabled={index === selectedFiles.length - 1}
                          className='p-1 hover:bg-muted rounded disabled:opacity-50'
                        >
                          <ArrowDown className='h-3 w-3' />
                        </button>
                        <button
                          onClick={() => removeFile(index)}
                          className='p-1 hover:bg-muted rounded text-red-500'
                        >
                          <Trash2 className='h-3 w-3' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <ActionButtons
                  onGenerate={mergePdfs}
                  generateLabel='Merge PDFs'
                  onReset={clearAll}
                  resetLabel='Clear All'
                  variant='outline'
                  size='sm'
                  disabled={selectedFiles.length < 2 || isProcessing}
                  isGenerating={isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {mergedPdf && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>Merged PDF</CardTitle>
                <CardDescription>Your merged PDF is ready for download</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={getDownloadData()}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType='application/pdf'
                  onDownload={downloadMergedPdf}
                  variant='outline'
                  size='sm'
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
            processingText='Merging PDFs...'
            completeText='PDFs merged successfully!'
            errorText='Failed to merge PDFs'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
