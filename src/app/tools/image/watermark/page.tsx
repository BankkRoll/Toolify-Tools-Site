'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Download, Droplets, FileImage } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Watermark configuration interface
 */
interface WatermarkConfig {
  text: string;
  fontSize: number;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  color: string;
}

/**
 * Image watermark tool page
 */
export default function ImageWatermarkPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    text: 'WATERMARK',
    fontSize: 24,
    opacity: 0.5,
    position: 'bottom-right',
    color: '#000000',
  });

  const [history, setHistory] = useLocalStorage<string[]>('image-watermark-history', []);
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
      setWatermarkedImage(null);
      setError(null);
      setIsComplete(false);
      toast.success('Image loaded successfully');
    }
  };

  /**
   * Updates watermark configuration
   */
  const updateConfig = (key: keyof WatermarkConfig, value: any) => {
    setWatermarkConfig(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Adds watermark to the image
   */
  const addWatermark = async () => {
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

        // Add watermark text
        ctx.font = `${watermarkConfig.fontSize}px Arial`;
        ctx.fillStyle = watermarkConfig.color;
        ctx.globalAlpha = watermarkConfig.opacity;

        const textWidth = ctx.measureText(watermarkConfig.text).width;
        const textHeight = watermarkConfig.fontSize;

        let x = 0;
        let y = 0;

        // Calculate position
        switch (watermarkConfig.position) {
          case 'top-left':
            x = 20;
            y = textHeight + 20;
            break;
          case 'top-right':
            x = canvas.width - textWidth - 20;
            y = textHeight + 20;
            break;
          case 'bottom-left':
            x = 20;
            y = canvas.height - 20;
            break;
          case 'bottom-right':
            x = canvas.width - textWidth - 20;
            y = canvas.height - 20;
            break;
          case 'center':
            x = (canvas.width - textWidth) / 2;
            y = (canvas.height + textHeight) / 2;
            break;
        }

        ctx.fillText(watermarkConfig.text, x, y);

        const watermarkedDataUrl = canvas.toDataURL('image/png');
        setWatermarkedImage(watermarkedDataUrl);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success('Watermark added successfully');
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add watermark';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the watermarked image
   */
  const downloadWatermarkedImage = () => {
    if (!watermarkedImage) return;
    const link = document.createElement('a');
    link.href = watermarkedImage;
    link.download = `watermarked-${selectedFile?.name || 'image.png'}`;
    link.click();
    toast.success('Image downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setWatermarkedImage(null);
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
    <ToolLayout toolId='image-watermark'>
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
              <CardDescription>Select an image to add watermark</CardDescription>
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
                  <Droplets className='h-5 w-5' />
                  Watermark Settings
                </CardTitle>
                <CardDescription>Configure your watermark text and appearance</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='watermark-text'>Watermark Text</Label>
                  <Input
                    id='watermark-text'
                    value={watermarkConfig.text}
                    onChange={e => updateConfig('text', e.target.value)}
                    placeholder='Enter watermark text...'
                    className='w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Font Size: {watermarkConfig.fontSize}px</Label>
                  <Slider
                    value={[watermarkConfig.fontSize]}
                    onValueChange={value => updateConfig('fontSize', value[0])}
                    min={12}
                    max={72}
                    step={1}
                    className='w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Opacity: {Math.round(watermarkConfig.opacity * 100)}%</Label>
                  <Slider
                    value={[watermarkConfig.opacity]}
                    onValueChange={value => updateConfig('opacity', value[0])}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className='w-full'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='watermark-color'>Color</Label>
                  <Input
                    id='watermark-color'
                    type='color'
                    value={watermarkConfig.color}
                    onChange={e => updateConfig('color', e.target.value)}
                    className='w-full h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='watermark-position'>Position</Label>
                  <select
                    id='watermark-position'
                    value={watermarkConfig.position}
                    onChange={e => updateConfig('position', e.target.value)}
                    className='w-full p-2 border rounded-md'
                  >
                    <option value='top-left'>Top Left</option>
                    <option value='top-right'>Top Right</option>
                    <option value='bottom-left'>Bottom Left</option>
                    <option value='bottom-right'>Bottom Right</option>
                    <option value='center'>Center</option>
                  </select>
                </div>

                <ActionButtons
                  onGenerate={addWatermark}
                  generateLabel='Add Watermark'
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

        {watermarkedImage && (
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
                  Watermarked Image
                </CardTitle>
                <CardDescription>Download your watermarked image</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <img
                  src={watermarkedImage}
                  alt='Watermarked'
                  className='max-w-full h-auto rounded-lg border'
                />
                <ActionButtons
                  onGenerate={downloadWatermarkedImage}
                  generateLabel='Download Image'
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
            processingText='Adding watermark to image...'
            completeText='Watermark added successfully!'
            errorText='Failed to add watermark'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
