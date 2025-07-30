'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for copying text to clipboard with toast notifications
 * @returns Object with copy function and copied state
 */
export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  /**
   * Copies text to clipboard and shows success/error toast
   * @param text - Text to copy to clipboard
   * @param successMessage - Custom success message (optional)
   * @returns Promise resolving to success status
   */
  const copyToClipboard = async (text: string, successMessage?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(successMessage || 'Text copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
      return true;
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      return false;
    }
  };

  return { copyToClipboard, isCopied };
}
