'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
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
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Droplets, FileText } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Interface for watermark settings
 */
interface WatermarkSettings {
  text: string;
  position: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  color: string;
}

/**
 * PDF watermark tool page
 */
export default function WatermarkPdfPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState('center');
  const [opacity, setOpacity] = useState(30);
  const [fontSize, setFontSize] = useState(48);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#FF0000');
  const [watermarkedPdf, setWatermarkedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('pdf-watermark-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const previewSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

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
      setError(null);
      setIsComplete(false);
      setWatermarkedPdf(null);
      toast.success('PDF loaded successfully');
    }
  };

  /**
   * Adds watermark to the PDF
   */
  const addWatermark = async () => {
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

      // Convert hex color to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16) / 255,
              g: parseInt(result[2], 16) / 255,
              b: parseInt(result[3], 16) / 255,
            }
          : { r: 1, g: 0, b: 0 }; // Default to red
      };

      const colorRgb = hexToRgb(color);

      pages.forEach(page => {
        const { width, height } = page.getSize();
        let x = 0;
        let y = 0;

        // Calculate position
        switch (position) {
          case 'top-left':
            x = 50;
            y = height - 50;
            break;
          case 'top-right':
            x = width - 200;
            y = height - 50;
            break;
          case 'bottom-left':
            x = 50;
            y = 50;
            break;
          case 'bottom-right':
            x = width - 200;
            y = 50;
            break;
          case 'center':
          default:
            x = (width - 200) / 2;
            y = height / 2;
            break;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          opacity: opacity / 100,
          rotate: degrees(rotation),
        });
      });

      const pdfBytes = await pdfDoc.save();
      setWatermarkedPdf(pdfBytes);
      setIsComplete(true);
      setHistory([selectedFile.name, ...history].slice(0, 10));
      toast.success('Watermark added successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add watermark';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Downloads the watermarked PDF
   */
  const downloadWatermarkedPdf = () => {
    if (!watermarkedPdf) return;

    const blob = new Blob([watermarkedPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermarked-${selectedFile?.name || 'document.pdf'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded successfully');
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setSelectedFile(null);
    setWatermarkedPdf(null);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download data for the watermarked PDF
   */
  const getDownloadData = () => {
    return watermarkedPdf || new Uint8Array();
  };

  /**
   * Gets download filename for the watermarked PDF
   */
  const getDownloadFilename = () => {
    return `watermarked-${selectedFile?.name || 'document.pdf'}`;
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
    <ToolLayout toolId='pdf-watermark'>
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
              <CardDescription>Select a PDF file to add watermark</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                onFilesSelected={handleFileSelect}
                accept='.pdf,application/pdf'
                multiple={false}
                files={selectedFile ? [selectedFile] : []}
                onRemoveFile={() => {
                  setSelectedFile(null);
                  setWatermarkedPdf(null);
                  setError(null);
                  setIsComplete(false);
                }}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        {selectedFile && (
          <MotionDiv
            ref={settingsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (settingsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>Watermark Settings</CardTitle>
                <CardDescription>Configure the watermark appearance</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='watermarkText'>Watermark Text</Label>
                  <Textarea
                    id='watermarkText'
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder='Enter watermark text'
                    rows={2}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='position'>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='top-left'>Top Left</SelectItem>
                        <SelectItem value='top-center'>Top Center</SelectItem>
                        <SelectItem value='top-right'>Top Right</SelectItem>
                        <SelectItem value='center-left'>Center Left</SelectItem>
                        <SelectItem value='center'>Center</SelectItem>
                        <SelectItem value='center-right'>Center Right</SelectItem>
                        <SelectItem value='bottom-left'>Bottom Left</SelectItem>
                        <SelectItem value='bottom-center'>Bottom Center</SelectItem>
                        <SelectItem value='bottom-right'>Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='color'>Color</Label>
                    <Input
                      id='color'
                      type='color'
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className='h-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='opacity'>Opacity: {opacity}%</Label>
                  <Input
                    id='opacity'
                    type='range'
                    min='10'
                    max='100'
                    value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='fontSize'>Font Size: {fontSize}px</Label>
                  <Input
                    id='fontSize'
                    type='range'
                    min='12'
                    max='120'
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='rotation'>Rotation: {rotation}°</Label>
                  <Input
                    id='rotation'
                    type='range'
                    min='-90'
                    max='90'
                    value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                  />
                </div>

                <ActionButtons
                  onGenerate={addWatermark}
                  generateLabel='Add Watermark'
                  onReset={clearAll}
                  resetLabel='Clear All'
                  variant='outline'
                  size='sm'
                  disabled={!selectedFile || !watermarkText.trim() || isProcessing}
                  isGenerating={isProcessing}
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {selectedFile && (
          <MotionDiv
            ref={previewSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (previewSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Watermark preview with current settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='relative w-full h-64 bg-white border-2 border-dashed rounded-lg overflow-hidden'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='text-gray-300 text-6xl'>PDF</div>
                  </div>
                  {watermarkText && (
                    <div
                      className='absolute pointer-events-none select-none'
                      style={{
                        fontSize: `${Math.max(fontSize / 4, 12)}px`,
                        color: color,
                        opacity: opacity / 100,
                        transform: `rotate(${rotation}deg)`,
                        left: position.includes('left')
                          ? '10%'
                          : position.includes('right')
                            ? '70%'
                            : '50%',
                        top: position.includes('top')
                          ? '20%'
                          : position.includes('bottom')
                            ? '80%'
                            : '50%',
                        transformOrigin: 'center',
                        translate: position.includes('center') ? '-50% -50%' : '0 0',
                      }}
                    >
                      {watermarkText}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {watermarkedPdf && (
          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Watermarked PDF
                  <ActionButtons
                    downloadData={getDownloadData()}
                    downloadFilename={getDownloadFilename()}
                    downloadMimeType='application/pdf'
                    onDownload={downloadWatermarkedPdf}
                    variant='outline'
                    size='sm'
                  />
                </CardTitle>
                <CardDescription>Your watermarked PDF is ready for download</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-green-50'>
                  <div className='text-center'>
                    <Droplets className='h-8 w-8 mx-auto mb-2 text-green-600' />
                    <p className='text-sm font-medium'>Watermark Added Successfully</p>
                    <p className='text-xs text-muted-foreground'>PDF ready for download</p>
                  </div>
                </div>
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
            processingText='Adding watermark to PDF...'
            completeText='Watermark added successfully!'
            errorText='Failed to add watermark'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
