'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Contrast, Download, FileImage } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Image grayscale tool page
 */
export default function ImageGrayscalePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('image-grayscale-history', []);
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
      setGrayscaleImage(null);
      setError(null);
      setIsComplete(false);
      toast.success('Image loaded successfully');
    }
  };

  /**
   * Converts image to grayscale
   */
  const convertToGrayscale = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray; // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue
          // Alpha channel remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);
        const grayscaleDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setGrayscaleImage(grayscaleDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success('Image converted to grayscale successfully');
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert to grayscale';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the grayscale image
   */
  const downloadGrayscaleImage = () => {
    if (!grayscaleImage) return;
    const link = document.createElement('a');
    link.href = grayscaleImage;
    link.download = `grayscale-${selectedFile?.name || 'image.jpg'}`;
    link.click();
    toast.success('Grayscale image downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setGrayscaleImage(null);
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
    <ToolLayout toolId='image-grayscale'>
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
                <FileImage className='h-5 w-5' />
                Upload Image
              </CardTitle>
              <CardDescription>Select an image to convert to grayscale</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept='image/*'
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={clearAll}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && (
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Contrast className='h-5 w-5' />
                  Convert to Grayscale
                </CardTitle>
                <CardDescription>Convert your image to black and white</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  onGenerate={convertToGrayscale}
                  generateLabel='Convert to Grayscale'
                  onReset={clearAll}
                  resetLabel='Clear'
                  variant='outline'
                  size='sm'
                  disabled={isProcessing}
                  isGenerating={isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {grayscaleImage && (
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
                  Grayscale Image
                </CardTitle>
                <CardDescription>Download your grayscale image</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <img
                  src={grayscaleImage}
                  alt='Grayscale'
                  className='max-w-full h-auto rounded-lg border'
                />
                <ActionButtons
                  onGenerate={downloadGrayscaleImage}
                  generateLabel='Download Grayscale Image'
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
            processingText='Converting to grayscale...'
            completeText='Image converted to grayscale successfully!'
            errorText='Failed to convert to grayscale'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
