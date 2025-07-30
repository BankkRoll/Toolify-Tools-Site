'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { DownloadButton } from '@/components/tools/download-button';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Image resize tool page
 */
export default function ImageResizePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [quality, setQuality] = useState<number>(90);
  const [format, setFormat] = useState<string>('original');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('image-resize-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const outputSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const settingsSectionInView = useInView(settingsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes resizing
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFiles(files);
      setError(null);
      setIsComplete(false);
      setProcessedImage(null);

      // Get original dimensions
      const img = document.createElement('img');
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  /**
   * Handles width change with aspect ratio constraints
   */
  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(newWidth * aspectRatio));
    }
  };

  /**
   * Handles height change with aspect ratio constraints
   */
  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio && originalDimensions) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  /**
   * Resizes the image using canvas
   */
  const resizeImage = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        const outputFormat = format === 'original' ? selectedFiles[0].type : `image/${format}`;
        const dataUrl = canvas.toDataURL(outputFormat, quality / 100);
        setProcessedImage(dataUrl);
        setIsComplete(true);
        setIsProcessing(false);

        setHistory([`Image resized to ${width}x${height}px`, ...history].slice(0, 10));
        toast.success(`Successfully resized to ${width}x${height}px`);
      };

      img.onerror = () => {
        setError('Failed to load image');
        setIsProcessing(false);
        toast.error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFiles[0]);
    } catch (error) {
      setError('Failed to resize image');
      setIsProcessing(false);
      toast.error('Failed to resize image');
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFiles([]);
    setProcessedImage(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Resets settings to original dimensions
   */
  const resetSettings = () => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
    setQuality(90);
    setFormat('original');
    setMaintainAspectRatio(true);
  };

  /**
   * Generates download filename for resized image
   */
  const getDownloadFilename = () => {
    if (selectedFiles.length === 0) return 'resized-image.jpg';
    const fileName = selectedFiles[0].name.replace(/\.[^/.]+$/, '');
    const extension =
      format === 'original' ? selectedFiles[0].name.split('.').pop() || 'jpg' : format;
    return `resized-${fileName}.${extension}`;
  };

  /**
   * Gets MIME type for download
   */
  const getDownloadMimeType = () => {
    if (format === 'original') {
      return selectedFiles[0]?.type || 'image/jpeg';
    }
    return `image/${format}`;
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
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='image-resize'>
      <MotionDiv
        ref={containerRef}
        className='grid grid-cols-1 lg:grid-cols-2 gap-6'
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (containerInView ? 'visible' : 'hidden') : undefined}
      >
        <MotionDiv
          ref={uploadSectionRef}
          className='space-y-6'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (uploadSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>Select an image file to resize</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFileSelect}
                  accept='image/*'
                  multiple={false}
                  files={selectedFiles}
                  onRemoveFile={index => {
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                    setProcessedImage(null);
                    setError(null);
                    setIsComplete(false);
                  }}
                />
              </CardContent>
            </Card>
          </MotionDiv>

          {selectedFiles.length > 0 && originalDimensions && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    Resize Settings
                    <ActionButtons
                      onReset={resetSettings}
                      resetLabel='Reset Settings'
                      variant='outline'
                      size='sm'
                    />
                  </CardTitle>
                  <CardDescription>
                    Original: {originalDimensions.width} × {originalDimensions.height}px
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='width'>Width (px)</Label>
                      <Input
                        id='width'
                        type='number'
                        value={width}
                        onChange={e => handleWidthChange(Number(e.target.value))}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='height'>Height (px)</Label>
                      <Input
                        id='height'
                        type='number'
                        value={height}
                        onChange={e => handleHeightChange(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='aspect-ratio'
                      checked={maintainAspectRatio}
                      onCheckedChange={setMaintainAspectRatio}
                    />
                    <Label htmlFor='aspect-ratio'>Maintain aspect ratio</Label>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='quality'>Quality: {quality}%</Label>
                    <Input
                      id='quality'
                      type='range'
                      min='1'
                      max='100'
                      value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='format'>Output Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='original'>Original Format</SelectItem>
                        <SelectItem value='jpeg'>JPEG</SelectItem>
                        <SelectItem value='png'>PNG</SelectItem>
                        <SelectItem value='webp'>WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ActionButtons
                    onGenerate={resizeImage}
                    generateLabel='Resize Image'
                    onReset={clearAll}
                    resetLabel='Clear All'
                    variant='outline'
                    size='sm'
                    disabled={selectedFiles.length === 0 || isProcessing}
                    isGenerating={isProcessing}
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
              processingText='Resizing image...'
              completeText='Image resized successfully!'
              errorText='Resize failed'
            />
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={outputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (outputSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle>Resized Image</CardTitle>
              <CardDescription>Preview and download your resized image</CardDescription>
            </CardHeader>
            <CardContent>
              {processedImage ? (
                <MotionDiv
                  className='space-y-4'
                  initial={animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                  animate={animationsEnabled ? { opacity: 1, scale: 1 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <div className='border rounded-lg overflow-hidden'>
                    <img
                      src={processedImage}
                      alt='Resized'
                      className='w-full h-auto max-h-96 object-contain'
                    />
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    New dimensions: {width} × {height}px
                  </div>

                  <DownloadButton
                    data={processedImage}
                    filename={getDownloadFilename()}
                    mimeType={getDownloadMimeType()}
                    variant='outline'
                    size='sm'
                  >
                    Download Resized Image
                  </DownloadButton>
                </MotionDiv>
              ) : (
                <div className='flex items-center justify-center h-64 border-2 border-dashed rounded-lg'>
                  <p className='text-muted-foreground'>
                    {selectedFiles.length > 0
                      ? "Click 'Resize Image' to process"
                      : 'Upload an image to get started'}
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
