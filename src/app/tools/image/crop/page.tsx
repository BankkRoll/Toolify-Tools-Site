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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Interface for crop area coordinates and dimensions
 */
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Image crop tool page
 */
export default function CropImagePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [aspectRatio, setAspectRatio] = useState('free');
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('image-crop-history', []);
  const animationsEnabled = useAnimations();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const previewSectionRef = useRef(null);
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
  const previewSectionInView = useInView(previewSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and initializes image processing
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFiles(files);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setError(null);
      setIsComplete(false);
      setCroppedImage(null);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setCropArea({
          x: 0,
          y: 0,
          width: Math.min(200, img.width),
          height: Math.min(200, img.height),
        });
      };
      img.src = url;
    }
  };

  /**
   * Updates crop area with aspect ratio constraints
   */
  const updateCropArea = (field: keyof CropArea, value: number) => {
    setCropArea(prev => {
      const newArea = { ...prev, [field]: value };

      // Apply aspect ratio constraints
      if (aspectRatio !== 'free' && originalDimensions) {
        const ratio = Number.parseFloat(aspectRatio);
        if (field === 'width') {
          newArea.height = Math.round(value / ratio);
        } else if (field === 'height') {
          newArea.width = Math.round(value * ratio);
        }
      }

      return newArea;
    });
  };

  /**
   * Crops the image using canvas
   */
  const cropImage = useCallback(async () => {
    if (selectedFiles.length === 0 || !originalDimensions) return;

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        ctx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height,
        );

        const dataUrl = canvas.toDataURL('image/png');
        setCroppedImage(dataUrl);
        setIsComplete(true);
        setIsProcessing(false);

        setHistory(
          [`Image cropped to ${cropArea.width}x${cropArea.height}px`, ...history].slice(0, 10),
        );
        toast.success(`Image cropped to ${cropArea.width}x${cropArea.height}px`);
      };

      img.onerror = () => {
        setError('Failed to load image');
        setIsProcessing(false);
        toast.error('Failed to load image');
      };

      img.src = imageUrl!;
    } catch (error) {
      setError('Failed to crop image');
      setIsProcessing(false);
      toast.error('Failed to crop image');
    }
  }, [selectedFiles, originalDimensions, cropArea, imageUrl, history]);

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFiles([]);
    setImageUrl(null);
    setCroppedImage(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Resets crop area to default values
   */
  const resetCrop = () => {
    if (originalDimensions) {
      setCropArea({
        x: 0,
        y: 0,
        width: Math.min(200, originalDimensions.width),
        height: Math.min(200, originalDimensions.height),
      });
    }
  };

  /**
   * Generates download filename for cropped image
   */
  const getDownloadFilename = () => {
    if (selectedFiles.length === 0) return 'cropped-image.png';
    const fileName = selectedFiles[0].name.replace(/\.[^/.]+$/, '');
    return `cropped-${fileName}.png`;
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
    <ToolLayout toolId='image-crop'>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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
                <CardDescription>Select an image file to crop</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFileSelect}
                  accept='image/*'
                  multiple={false}
                  files={selectedFiles}
                  onRemoveFile={index => {
                    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                    setImageUrl(null);
                    setCroppedImage(null);
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
                    Crop Settings
                    <ActionButtons
                      onReset={resetCrop}
                      resetLabel='Reset Crop'
                      variant='outline'
                      size='sm'
                    />
                  </CardTitle>
                  <CardDescription>
                    Original: {originalDimensions.width} × {originalDimensions.height}px
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='aspectRatio'>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='free'>Free</SelectItem>
                        <SelectItem value='1'>1:1 (Square)</SelectItem>
                        <SelectItem value='1.333'>4:3</SelectItem>
                        <SelectItem value='1.777'>16:9</SelectItem>
                        <SelectItem value='0.75'>3:4 (Portrait)</SelectItem>
                        <SelectItem value='0.5625'>9:16 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='x'>X Position</Label>
                      <Input
                        id='x'
                        type='number'
                        value={cropArea.x}
                        onChange={e => updateCropArea('x', Number(e.target.value))}
                        max={originalDimensions.width - cropArea.width}
                        min={0}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='y'>Y Position</Label>
                      <Input
                        id='y'
                        type='number'
                        value={cropArea.y}
                        onChange={e => updateCropArea('y', Number(e.target.value))}
                        max={originalDimensions.height - cropArea.height}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='width'>Width</Label>
                      <Input
                        id='width'
                        type='number'
                        value={cropArea.width}
                        onChange={e => updateCropArea('width', Number(e.target.value))}
                        max={originalDimensions.width - cropArea.x}
                        min={1}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='height'>Height</Label>
                      <Input
                        id='height'
                        type='number'
                        value={cropArea.height}
                        onChange={e => updateCropArea('height', Number(e.target.value))}
                        max={originalDimensions.height - cropArea.y}
                        min={1}
                      />
                    </div>
                  </div>

                  <ActionButtons
                    onGenerate={cropImage}
                    generateLabel='Crop Image'
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
              processingText='Cropping image...'
              completeText='Image cropped successfully!'
              errorText='Crop failed'
            />
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={previewSectionRef}
          className='space-y-6'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (previewSectionInView ? 'visible' : 'hidden') : undefined}
        >
          {imageUrl && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Original image with crop area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='relative inline-block'>
                    <img
                      src={imageUrl}
                      alt='Original'
                      className='max-w-full h-auto border rounded'
                      style={{ maxHeight: '300px' }}
                    />
                    <div
                      className='absolute border-2 border-red-500 bg-red-500/20'
                      style={{
                        left: `${(cropArea.x / originalDimensions!.width) * 100}%`,
                        top: `${(cropArea.y / originalDimensions!.height) * 100}%`,
                        width: `${(cropArea.width / originalDimensions!.width) * 100}%`,
                        height: `${(cropArea.height / originalDimensions!.height) * 100}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          )}

          <MotionDiv
            ref={outputSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (outputSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>Cropped Image</CardTitle>
                <CardDescription>Preview and download your cropped image</CardDescription>
              </CardHeader>
              <CardContent>
                {croppedImage ? (
                  <MotionDiv
                    className='space-y-4'
                    initial={animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, scale: 1 } : undefined}
                    transition={animationsEnabled ? { duration: 0.3 } : undefined}
                  >
                    <div className='border rounded-lg overflow-hidden'>
                      <img
                        src={croppedImage}
                        alt='Cropped'
                        className='w-full h-auto max-h-96 object-contain'
                      />
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Cropped dimensions: {cropArea.width} × {cropArea.height}px
                    </div>

                    <DownloadButton
                      data={croppedImage}
                      filename={getDownloadFilename()}
                      mimeType='image/png'
                      variant='outline'
                      size='sm'
                    >
                      Download Cropped Image
                    </DownloadButton>
                  </MotionDiv>
                ) : (
                  <div className='flex items-center justify-center h-64 border-2 border-dashed rounded-lg'>
                    <p className='text-muted-foreground'>
                      {selectedFiles.length > 0
                        ? "Click 'Crop Image' to process"
                        : 'Upload an image to get started'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
