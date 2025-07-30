'use client';

import { useCallback, useState } from 'react';

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

interface UseFileUploadOptions {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
}

/**
 * Hook for handling file uploads with validation
 * @param options - File upload configuration options
 * @returns Object with file upload state and functions
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Uploads and validates files
   * @param fileList - FileList or File array to upload
   */
  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setIsUploading(true);
      setError(null);

      try {
        const fileArray = Array.from(fileList);

        if (options.maxSize) {
          const oversizedFiles = fileArray.filter(file => file.size > options.maxSize!);
          if (oversizedFiles.length > 0) {
            throw new Error(`File size exceeds ${formatFileSize(options.maxSize)}`);
          }
        }

        if (options.accept) {
          const acceptedTypes = options.accept.split(',').map(type => type.trim());
          const invalidFiles = fileArray.filter(file => {
            const fileExtension = `.${getFileExtension(file.name)}`;
            return !acceptedTypes.some(
              type => type === file.type || type === fileExtension || type === '*',
            );
          });
          if (invalidFiles.length > 0) {
            throw new Error(`Invalid file type. Accepted: ${options.accept}`);
          }
        }

        setFiles(options.multiple ? fileArray : [fileArray[0]]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [options],
  );

  /**
   * Clears uploaded files and errors
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return {
    files,
    isUploading,
    error,
    uploadFiles,
    clearFiles,
  };
}
