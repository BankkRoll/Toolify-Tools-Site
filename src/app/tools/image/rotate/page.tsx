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
import { Download, FileImage, RotateCw } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Image rotation tool page
 */
export default function ImageRotatePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rotatedImage, setRotatedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  const [history, setHistory] = useLocalStorage<string[]>('image-rotate-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const configSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const configSectionInView = useInView(configSectionRef, {
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
      setRotatedImage(null);
      setError(null);
      setIsComplete(false);
      toast.success('Image loaded successfully');
    }
  };

  /**
   * Rotates image by specified angle
   */
  const rotateImage = async () => {
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
        // Calculate new canvas dimensions for rotation
        const angleRad = (rotationAngle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(angleRad));
        const sin = Math.abs(Math.sin(angleRad));

        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Move to center of canvas
        ctx.translate(newWidth / 2, newHeight / 2);

        // Rotate
        ctx.rotate(angleRad);

        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setRotatedImage(rotatedDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success('Image rotated successfully');
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rotate image';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the rotated image
   */
  const downloadRotatedImage = () => {
    if (!rotatedImage) return;
    const link = document.createElement('a');
    link.href = rotatedImage;
    link.download = `rotated-${selectedFile?.name || 'image.jpg'}`;
    link.click();
    toast.success('Rotated image downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setRotatedImage(null);
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
    <ToolLayout toolId='image-rotate'>
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
              <CardDescription>Select an image to rotate</CardDescription>
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
          <MotionDiv
            ref={configSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (configSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <RotateCw className='h-5 w-5' />
                  Rotation Settings
                </CardTitle>
                <CardDescription>Set the rotation angle in degrees</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='rotation-angle'>Rotation Angle (degrees)</Label>
                  <Input
                    id='rotation-angle'
                    type='number'
                    min='-360'
                    max='360'
                    value={rotationAngle}
                    onChange={e => setRotationAngle(parseFloat(e.target.value) || 0)}
                    placeholder='0'
                    className='w-full'
                  />
                </div>

                <div className='flex gap-2'>
                  <ActionButtons
                    onGenerate={() => setRotationAngle(90)}
                    generateLabel='90°'
                    variant='outline'
                    size='sm'
                  />
                  <ActionButtons
                    onGenerate={() => setRotationAngle(180)}
                    generateLabel='180°'
                    variant='outline'
                    size='sm'
                  />
                  <ActionButtons
                    onGenerate={() => setRotationAngle(270)}
                    generateLabel='270°'
                    variant='outline'
                    size='sm'
                  />
                </div>

                <ActionButtons
                  onGenerate={rotateImage}
                  generateLabel='Rotate Image'
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

        {rotatedImage && (
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
                  Rotated Image
                </CardTitle>
                <CardDescription>Download your rotated image</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <img
                  src={rotatedImage}
                  alt='Rotated'
                  className='max-w-full h-auto rounded-lg border'
                />
                <ActionButtons
                  onGenerate={downloadRotatedImage}
                  generateLabel='Download Rotated Image'
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
            processingText='Rotating image...'
            completeText='Image rotated successfully!'
            errorText='Failed to rotate image'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
