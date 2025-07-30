'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Copy, FileImage, Palette } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Color information interface
 */
interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  percentage: number;
}

/**
 * Image color palette tool page
 */
export default function ImagePalettePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('image-palette-history', []);
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
   * Converts RGB to HSL
   */
  const rgbToHsl = (r: number, g: number, b: number): string => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  };

  /**
   * Handles file selection
   */
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setColorPalette([]);
      setError(null);
      setIsComplete(false);
      toast.success('Image loaded successfully');
    }
  };

  /**
   * Extracts color palette from the image
   */
  const extractPalette = async () => {
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
        // Resize image for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Count colors
        const colorCount: { [key: string]: number } = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce noise
          const quantizedR = Math.round(r / 16) * 16;
          const quantizedG = Math.round(g / 16) * 16;
          const quantizedB = Math.round(b / 16) * 16;

          const hex = `#${quantizedR.toString(16).padStart(2, '0')}${quantizedG.toString(16).padStart(2, '0')}${quantizedB.toString(16).padStart(2, '0')}`;
          colorCount[hex] = (colorCount[hex] || 0) + 1;
        }

        // Convert to array and sort by frequency
        const totalPixels = canvas.width * canvas.height;
        const palette = Object.entries(colorCount)
          .map(([hex, count]) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return {
              hex,
              rgb: `${r}, ${g}, ${b}`,
              hsl: rgbToHsl(r, g, b),
              percentage: (count / totalPixels) * 100,
            };
          })
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 10); // Top 10 colors

        setColorPalette(palette);
        setIsComplete(true);
        setHistory([selectedFile.name, ...history].slice(0, 10));
        toast.success('Color palette extracted successfully');
        setIsProcessing(false);
      };

      img.onerror = () => {
        throw new Error('Failed to load image');
      };

      img.src = URL.createObjectURL(selectedFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract color palette';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  /**
   * Copies color value to clipboard
   */
  const copyColor = (color: string, format: string) => {
    navigator.clipboard.writeText(color);
    toast.success(`${format} color copied to clipboard`);
  };

  /**
   * Downloads palette as JSON
   */
  const downloadPalette = () => {
    const dataStr = JSON.stringify(colorPalette, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'image'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Palette downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setColorPalette([]);
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
    <ToolLayout toolId='image-palette'>
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
              <CardDescription>Select an image to extract color palette</CardDescription>
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
                  <Palette className='h-5 w-5' />
                  Extract Palette
                </CardTitle>
                <CardDescription>Extract the dominant colors from your image</CardDescription>
              </CardHeader>
              <CardContent>
                <ActionButtons
                  onGenerate={extractPalette}
                  generateLabel='Extract Palette'
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

        {colorPalette.length > 0 && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Palette className='h-5 w-5' />
                  Color Palette
                </CardTitle>
                <CardDescription>Dominant colors extracted from your image</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {colorPalette.map((color, index) => (
                    <div
                      key={index}
                      className='border rounded-lg p-4 space-y-2'
                      style={{ borderColor: color.hex }}
                    >
                      <div
                        className='w-full h-16 rounded-md border'
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium'>Color {index + 1}</span>
                          <Badge variant='secondary'>{color.percentage.toFixed(1)}%</Badge>
                        </div>
                        <div className='space-y-1 text-xs'>
                          <div className='flex items-center justify-between'>
                            <span>HEX:</span>
                            <div className='flex items-center gap-1'>
                              <span className='font-mono'>{color.hex}</span>
                              <button
                                onClick={() => copyColor(color.hex, 'HEX')}
                                className='p-1 hover:bg-gray-100 rounded'
                              >
                                <Copy className='h-3 w-3' />
                              </button>
                            </div>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span>RGB:</span>
                            <div className='flex items-center gap-1'>
                              <span className='font-mono'>{color.rgb}</span>
                              <button
                                onClick={() => copyColor(color.rgb, 'RGB')}
                                className='p-1 hover:bg-gray-100 rounded'
                              >
                                <Copy className='h-3 w-3' />
                              </button>
                            </div>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span>HSL:</span>
                            <div className='flex items-center gap-1'>
                              <span className='font-mono'>{color.hsl}</span>
                              <button
                                onClick={() => copyColor(color.hsl, 'HSL')}
                                className='p-1 hover:bg-gray-100 rounded'
                              >
                                <Copy className='h-3 w-3' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <ActionButtons
                  onGenerate={downloadPalette}
                  generateLabel='Download Palette'
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
            processingText='Extracting color palette...'
            completeText='Color palette extracted successfully!'
            errorText='Failed to extract color palette'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
