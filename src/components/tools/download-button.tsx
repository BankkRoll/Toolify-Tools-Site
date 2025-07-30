'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Download, Loader2, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Props for the DownloadButton component
 */
interface DownloadButtonProps {
  /** Data to download */
  data: string | Blob | Uint8Array;
  /** Filename for the download */
  filename: string;
  /** MIME type for the download */
  mimeType?: string;
  /** Callback when download action is triggered */
  onDownload?: () => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children?: React.ReactNode;
  /** Whether to show success state */
  showSuccessState?: boolean;
}

/**
 * Button component for downloading files with loading and success states
 */
export function DownloadButton({
  data,
  filename,
  mimeType = 'application/octet-stream',
  onDownload,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  className,
  children,
  showSuccessState = true,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!data || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      let blob: Blob;

      if (typeof data === 'string') {
        blob = new Blob([data], { type: mimeType });
      } else if (data instanceof Blob) {
        blob = data;
      } else {
        blob = new Blob([data], { type: mimeType });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDownloaded(true);

      // Call the onDownload callback if provided
      if (onDownload) {
        onDownload();
      }

      if (showSuccessState) {
        setTimeout(() => {
          setIsDownloaded(false);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to download file');
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getIcon = () => {
    if (isDownloading) {
      return <Loader2 className='h-4 w-4 mr-1 animate-spin' />;
    }
    if (isDownloaded && showSuccessState) {
      return <Check className='h-4 w-4 mr-1 text-green-500' />;
    }
    if (error) {
      return <X className='h-4 w-4 mr-1 text-red-500' />;
    }
    return <Download className='h-4 w-4 mr-1' />;
  };

  const getButtonText = () => {
    if (isDownloading) return 'Downloading...';
    if (isDownloaded && showSuccessState) return 'Downloaded!';
    if (error) return 'Error';
    return children || 'Download';
  };

  return (
    <div className='relative'>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={disabled || !data || isDownloading}
        className={cn(
          isDownloaded &&
            showSuccessState &&
            'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
          error && 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
          className,
        )}
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      {error && (
        <div className='absolute -bottom-8 left-0 text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200 whitespace-nowrap'>
          {error}
        </div>
      )}
    </div>
  );
}
