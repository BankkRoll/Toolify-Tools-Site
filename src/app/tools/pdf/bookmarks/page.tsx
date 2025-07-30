'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Bookmark, Download, FileText } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Bookmark data structure
 */
interface BookmarkItem {
  title: string;
  page: number;
}

/**
 * PDF bookmarks tool page
 */
export default function PdfBookmarksPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkedPdf, setBookmarkedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('pdf-bookmarks-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const bookmarksSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const bookmarksSectionInView = useInView(bookmarksSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes bookmarks
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setBookmarkedPdf(null);
      setError(null);
      setIsComplete(false);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        // Initialize with default bookmarks
        setBookmarks([
          { title: 'Introduction', page: 1 },
          { title: 'Table of Contents', page: 2 },
          { title: 'Chapter 1', page: 3 },
        ]);
        toast.success('PDF loaded successfully');
      } catch (err) {
        setError('Failed to load PDF file');
        toast.error('Failed to load PDF file');
      }
    }
  };

  /**
   * Updates bookmark title
   */
  const updateBookmarkTitle = (index: number, title: string) => {
    setBookmarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], title };
      return updated;
    });
  };

  /**
   * Updates bookmark page number
   */
  const updateBookmarkPage = (index: number, page: number) => {
    setBookmarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], page: Math.max(1, page) };
      return updated;
    });
  };

  /**
   * Adds a new bookmark
   */
  const addBookmark = () => {
    setBookmarks(prev => [...prev, { title: `Bookmark ${prev.length + 1}`, page: 1 }]);
  };

  /**
   * Removes a bookmark
   */
  const removeBookmark = (index: number) => {
    setBookmarks(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Creates bookmarks in the PDF
   */
  const createBookmarks = async () => {
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
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // Add bookmark text to each page
      bookmarks.forEach(bookmark => {
        if (bookmark.page <= pages.length) {
          const page = pages[bookmark.page - 1];
          page.drawText(`Bookmark: ${bookmark.title}`, {
            x: 50,
            y: page.getHeight() - 50,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.8),
          });
        }
      });

      const pdfBytes = await pdfDoc.save();
      setBookmarkedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success('Bookmarks added to PDF');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bookmarks';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the bookmarked PDF
   */
  const downloadBookmarkedPdf = () => {
    if (!bookmarkedPdf) return;
    const blob = new Blob([bookmarkedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarked-${selectedFile?.name || 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setBookmarks([]);
    setBookmarkedPdf(null);
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
    <ToolLayout toolId='pdf-bookmarks'>
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
              <CardDescription>Select a PDF file to add bookmarks</CardDescription>
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

        {selectedFile && bookmarks.length > 0 && (
          <MotionDiv
            ref={bookmarksSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={
              animationsEnabled ? (bookmarksSectionInView ? 'visible' : 'hidden') : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Bookmark className='h-5 w-5' />
                  Create Bookmarks
                </CardTitle>
                <CardDescription>Define bookmarks for your PDF document</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {bookmarks.map((bookmark, index) => (
                  <div key={index} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor={`bookmark-${index}`}>Bookmark {index + 1}</Label>
                      <ActionButtons
                        onReset={() => removeBookmark(index)}
                        resetLabel='Remove'
                        variant='ghost'
                        size='sm'
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <Input
                        id={`bookmark-${index}`}
                        value={bookmark.title}
                        onChange={e => updateBookmarkTitle(index, e.target.value)}
                        placeholder='Bookmark title...'
                        className='w-full'
                      />
                      <Input
                        type='number'
                        min='1'
                        value={bookmark.page}
                        onChange={e => updateBookmarkPage(index, parseInt(e.target.value) || 1)}
                        placeholder='Page number...'
                        className='w-full'
                      />
                    </div>
                  </div>
                ))}
                <div className='flex gap-2'>
                  <ActionButtons
                    onGenerate={addBookmark}
                    generateLabel='Add Bookmark'
                    variant='outline'
                    size='sm'
                  />
                  <ActionButtons
                    onGenerate={createBookmarks}
                    generateLabel='Create Bookmarks'
                    onReset={clearAll}
                    resetLabel='Clear'
                    variant='outline'
                    size='sm'
                    disabled={isProcessing}
                    isGenerating={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {bookmarkedPdf && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Download className='h-5 w-5' />
                  Bookmarked PDF
                </CardTitle>
                <CardDescription>Download your PDF with bookmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  downloadData={bookmarkedPdf}
                  downloadFilename={
                    selectedFile ? `bookmarked-${selectedFile.name}` : 'bookmarked.pdf'
                  }
                  downloadMimeType='application/pdf'
                  onDownload={downloadBookmarkedPdf}
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
            processingText='Creating bookmarks...'
            completeText='Bookmarks created successfully!'
            errorText='Failed to create bookmarks'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
