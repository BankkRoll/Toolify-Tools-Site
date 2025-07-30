'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { File, Upload, X } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// File utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Props for the FileUploadZone component
 */
interface FileUploadZoneProps {
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Accepted file types */
  accept?: string;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Currently selected files */
  files?: File[];
  /** Callback to remove a file */
  onRemoveFile?: (index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the upload zone is disabled */
  disabled?: boolean;
}

/**
 * File upload zone component with drag and drop functionality
 */
export function FileUploadZone({
  onFilesSelected,
  accept,
  multiple = false,
  maxSize,
  files = [],
  onRemoveFile,
  className,
  disabled = false,
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple,
    maxSize,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        {...getRootProps()}
        className={cn(
          'cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-primary/5',
          isDragActive && 'border-primary bg-primary/10',
          disabled &&
            'opacity-50 cursor-not-allowed hover:border-muted-foreground/25 hover:bg-transparent',
        )}
      >
        <CardContent className='flex flex-col items-center justify-center py-8 px-4 text-center'>
          <Upload
            className={cn('h-8 w-8 text-muted-foreground mb-4', isDragActive && 'text-primary')}
          />
          <div className='space-y-2 max-w-sm'>
            <p className='text-sm font-medium'>
              {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              {accept && <span className='block sm:inline'>Accepted formats: {accept}</span>}
              {maxSize && (
                <span className='block sm:inline'>
                  {accept && ' • '}Max size: {formatFileSize(maxSize)}
                </span>
              )}
            </p>
          </div>
          <input {...getInputProps()} />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className='space-y-3'>
          <h4 className='text-sm font-medium flex items-center gap-2'>
            <span>Selected Files</span>
            <Badge variant='secondary' className='text-xs'>
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </Badge>
          </h4>
          <div className='space-y-2 max-h-64 overflow-y-auto'>
            {files.map((file, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80'
              >
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  <File className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium truncate'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <Badge variant='outline' className='text-xs hidden sm:inline-flex'>
                    {getFileExtension(file.name).toUpperCase()}
                  </Badge>
                  {onRemoveFile && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 hover:bg-destructive/10 hover:text-destructive'
                      onClick={() => onRemoveFile(index)}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
