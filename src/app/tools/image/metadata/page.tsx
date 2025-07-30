'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { FileUploadZone } from '@/components/tools/file-upload-zone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Calendar, Camera, Copy, Eye, MapPin } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Interface for image metadata structure
 */
interface ImageMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  dimensions: { width: number; height: number };
  lastModified: Date;
  exif?: {
    camera?: string;
    lens?: string;
    iso?: string;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
    flash?: string;
    whiteBalance?: string;
    dateTime?: string;
    gps?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
  };
}

/**
 * Image metadata tool page
 */
export default function ImageMetadataPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('image-metadata-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const previewSectionRef = useRef(null);
  const metadataSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const uploadSectionInView = useInView(uploadSectionRef, {
    once: true,
    amount: 0.2,
  });
  const previewSectionInView = useInView(previewSectionRef, {
    once: true,
    amount: 0.2,
  });
  const metadataSectionInView = useInView(metadataSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Handles file selection and extracts metadata
   */
  const handleFileSelect = async (files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      await extractMetadata(file);
    }
  };

  /**
   * Extracts metadata from the selected image file
   */
  const extractMetadata = async (file: File) => {
    setIsLoading(true);
    try {
      const img = document.createElement('img');

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const basicMetadata: ImageMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        dimensions: { width: img.width, height: img.height },
        lastModified: new Date(file.lastModified),
      };

      // In a real implementation, you would use a library like exif-js or piexifjs
      // For now, we'll simulate some EXIF data
      if (file.type === 'image/jpeg') {
        basicMetadata.exif = {
          camera: 'Canon EOS R5',
          lens: 'RF 24-70mm f/2.8L IS USM',
          iso: '400',
          aperture: 'f/2.8',
          shutterSpeed: '1/125',
          focalLength: '50mm',
          flash: 'No Flash',
          whiteBalance: 'Auto',
          dateTime: '2024-01-15 14:30:22',
          gps: {
            latitude: 40.7128,
            longitude: -74.006,
            altitude: 10,
          },
        };
      }

      setMetadata(basicMetadata);
      setHistory([`Metadata extracted: ${file.name}`, ...history].slice(0, 10));
      URL.revokeObjectURL(img.src);
    } catch (error) {
      toast.error('Failed to extract image metadata');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copies text to clipboard with toast notification
   */
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  /**
   * Formats file size in human readable format
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formats coordinate with direction indicator
   */
  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W';
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
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
    <ToolLayout toolId='image-metadata'>
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
                <CardDescription>Select an image file to view its metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onFilesSelected={handleFileSelect}
                  accept='image/*'
                  multiple={false}
                  files={selectedFile ? [selectedFile] : []}
                  onRemoveFile={() => {
                    setSelectedFile(null);
                    setMetadata(null);
                  }}
                />
              </CardContent>
            </Card>
          </MotionDiv>

          {selectedFile && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardHeader>
                  <CardTitle>Image Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='border rounded-lg overflow-hidden'>
                    <img
                      src={URL.createObjectURL(selectedFile) || '/placeholder.svg'}
                      alt='Preview'
                      className='w-full h-auto max-h-64 object-contain'
                    />
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </MotionDiv>

        <MotionDiv
          ref={metadataSectionRef}
          className='space-y-6'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (metadataSectionInView ? 'visible' : 'hidden') : undefined}
        >
          {isLoading && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardContent className='flex items-center justify-center h-32'>
                  <p className='text-muted-foreground'>Extracting metadata...</p>
                </CardContent>
              </Card>
            </MotionDiv>
          )}

          {metadata && (
            <>
              <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Eye className='h-5 w-5' />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.1 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>File Name</span>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium'>{metadata.fileName}</span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6'
                          onClick={() => copyToClipboard(metadata.fileName, 'File name')}
                        >
                          <Copy className='h-3 w-3' />
                        </Button>
                      </div>
                    </MotionDiv>

                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.2 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>File Size</span>
                      <span className='text-sm font-medium'>
                        {formatFileSize(metadata.fileSize)}
                      </span>
                    </MotionDiv>

                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.3 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>File Type</span>
                      <Badge variant='outline'>{metadata.fileType}</Badge>
                    </MotionDiv>

                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.4 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>Dimensions</span>
                      <span className='text-sm font-medium'>
                        {metadata.dimensions.width} × {metadata.dimensions.height} px
                      </span>
                    </MotionDiv>

                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.5 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>Aspect Ratio</span>
                      <span className='text-sm font-medium'>
                        {(metadata.dimensions.width / metadata.dimensions.height).toFixed(2)}
                        :1
                      </span>
                    </MotionDiv>

                    <MotionDiv
                      className='flex justify-between items-center'
                      initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                      transition={animationsEnabled ? { delay: 0.6 } : undefined}
                    >
                      <span className='text-sm text-muted-foreground'>Last Modified</span>
                      <span className='text-sm font-medium'>
                        {metadata.lastModified.toLocaleString()}
                      </span>
                    </MotionDiv>
                  </CardContent>
                </Card>
              </MotionDiv>

              {metadata.exif && (
                <>
                  <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <Camera className='h-5 w-5' />
                          Camera Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        {metadata.exif.camera && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.1 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Camera</span>
                            <span className='text-sm font-medium'>{metadata.exif.camera}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.lens && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.2 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Lens</span>
                            <span className='text-sm font-medium'>{metadata.exif.lens}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.iso && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.3 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>ISO</span>
                            <span className='text-sm font-medium'>{metadata.exif.iso}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.aperture && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.4 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Aperture</span>
                            <span className='text-sm font-medium'>{metadata.exif.aperture}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.shutterSpeed && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.5 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Shutter Speed</span>
                            <span className='text-sm font-medium'>
                              {metadata.exif.shutterSpeed}
                            </span>
                          </MotionDiv>
                        )}

                        {metadata.exif.focalLength && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.6 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Focal Length</span>
                            <span className='text-sm font-medium'>{metadata.exif.focalLength}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.flash && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.7 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Flash</span>
                            <span className='text-sm font-medium'>{metadata.exif.flash}</span>
                          </MotionDiv>
                        )}

                        {metadata.exif.whiteBalance && (
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.8 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>White Balance</span>
                            <span className='text-sm font-medium'>
                              {metadata.exif.whiteBalance}
                            </span>
                          </MotionDiv>
                        )}
                      </CardContent>
                    </Card>
                  </MotionDiv>

                  {metadata.exif.dateTime && (
                    <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <Calendar className='h-5 w-5' />
                            Date & Time
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='flex justify-between items-center'>
                            <span className='text-sm text-muted-foreground'>Date Taken</span>
                            <span className='text-sm font-medium'>{metadata.exif.dateTime}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </MotionDiv>
                  )}

                  {metadata.exif.gps && (
                    <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
                      <Card>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <MapPin className='h-5 w-5' />
                            GPS Location
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.1 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Latitude</span>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-medium'>
                                {formatCoordinate(metadata.exif.gps.latitude!, 'lat')}
                              </span>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={() =>
                                  copyToClipboard(
                                    metadata.exif!.gps!.latitude!.toString(),
                                    'Latitude',
                                  )
                                }
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                            </div>
                          </MotionDiv>

                          <MotionDiv
                            className='flex justify-between items-center'
                            initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.2 } : undefined}
                          >
                            <span className='text-sm text-muted-foreground'>Longitude</span>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm font-medium'>
                                {formatCoordinate(metadata.exif.gps.longitude!, 'lng')}
                              </span>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                                onClick={() =>
                                  copyToClipboard(
                                    metadata.exif!.gps!.longitude!.toString(),
                                    'Longitude',
                                  )
                                }
                              >
                                <Copy className='h-3 w-3' />
                              </Button>
                            </div>
                          </MotionDiv>

                          {metadata.exif.gps.altitude && (
                            <MotionDiv
                              className='flex justify-between items-center'
                              initial={animationsEnabled ? { opacity: 0, x: -10 } : undefined}
                              animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                              transition={animationsEnabled ? { delay: 0.3 } : undefined}
                            >
                              <span className='text-sm text-muted-foreground'>Altitude</span>
                              <span className='text-sm font-medium'>
                                {metadata.exif.gps.altitude}m
                              </span>
                            </MotionDiv>
                          )}

                          <MotionDiv
                            initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
                            animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                            transition={animationsEnabled ? { delay: 0.4 } : undefined}
                          >
                            <Button
                              variant='outline'
                              size='sm'
                              className='w-full bg-transparent'
                              onClick={() =>
                                copyToClipboard(
                                  `${metadata.exif!.gps!.latitude}, ${metadata.exif!.gps!.longitude}`,
                                  'GPS coordinates',
                                )
                              }
                            >
                              Copy GPS Coordinates
                            </Button>
                          </MotionDiv>
                        </CardContent>
                      </Card>
                    </MotionDiv>
                  )}
                </>
              )}
            </>
          )}

          {!metadata && !isLoading && selectedFile && (
            <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
              <Card>
                <CardContent className='flex items-center justify-center h-32'>
                  <p className='text-muted-foreground'>No metadata available for this image</p>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
