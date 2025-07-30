'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Download, FileImage, Sun } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Brightness/contrast configuration interface
 */
interface BrightnessConfig {
  brightness: number;
  contrast: number;
}

/**
 * Image brightness/contrast tool page
 */
export default function ImageBrightnessPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adjustedImage, setAdjustedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [brightnessConfig, setBrightnessConfig] = useState<BrightnessConfig>({
    brightness: 0,
    contrast: 0,
  });

  const [history, setHistory] = useLocalStorage<string[]>('image-brightness-history', []);
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
      setAdjustedImage(null);
      setError(null);
      setIsComplete(false);
      toast.success('Image loaded successfully');
    }
  };

  /**
   * Updates brightness/contrast configuration
   */
  const updateConfig = (key: keyof BrightnessConfig, value: number) => {
    setBrightnessConfig(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Applies brightness and contrast adjustments
   */
  const adjustImage = async () => {
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

        // Apply brightness and contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const brightness = brightnessConfig.brightness;
        const contrast = brightnessConfig.contrast;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          // Apply brightness
          data[i] = Math.max(0, Math.min(255, data[i] + brightness));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));

          // Apply contrast
          data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }

        ctx.putImageData(imageData, 0, 0);
        const adjustedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setAdjustedImage(adjustedDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success('Image adjusted successfully');
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust image';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the adjusted image
   */
  const downloadAdjustedImage = () => {
    if (!adjustedImage) return;
    const link = document.createElement('a');
    link.href = adjustedImage;
    link.download = `adjusted-${selectedFile?.name || 'image.jpg'}`;
    link.click();
    toast.success('Adjusted image downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setAdjustedImage(null);
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
    <ToolLayout toolId='image-brightness'>
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
              <CardDescription>Select an image to adjust brightness and contrast</CardDescription>
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
                  <Sun className='h-5 w-5' />
                  Brightness & Contrast
                </CardTitle>
                <CardDescription>Adjust the brightness and contrast of your image</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>Brightness: {brightnessConfig.brightness}</span>
                  </div>
                  <Slider
                    value={[brightnessConfig.brightness]}
                    onValueChange={value => updateConfig('brightness', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className='w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>Contrast: {brightnessConfig.contrast}</span>
                  </div>
                  <Slider
                    value={[brightnessConfig.contrast]}
                    onValueChange={value => updateConfig('contrast', value[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className='w-full'
                  />
                </div>

                <ActionButtons
                  onGenerate={adjustImage}
                  generateLabel='Apply Adjustments'
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

        {adjustedImage && (
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
                  Adjusted Image
                </CardTitle>
                <CardDescription>
                  Download your brightness and contrast adjusted image
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <img
                  src={adjustedImage}
                  alt='Adjusted'
                  className='max-w-full h-auto rounded-lg border'
                />
                <ActionButtons
                  onGenerate={downloadAdjustedImage}
                  generateLabel='Download Adjusted Image'
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
            processingText='Adjusting image...'
            completeText='Image adjusted successfully!'
            errorText='Failed to adjust image'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
