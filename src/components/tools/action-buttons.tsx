"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw, Save, Share2, Trash2 } from "lucide-react";
import { CopyButton } from "./copy-button";
import { DownloadButton } from "./download-button";

/**
 * Props for the ActionButtons component
 */
interface ActionButtonsProps {
  /** Text to copy to clipboard */
  copyText?: string;
  /** Success message shown after copying */
  copySuccessMessage?: string;
  /** Callback when copy action is triggered */
  onCopy?: () => void;
  /** Data to download */
  downloadData?: string | Blob | Uint8Array;
  /** Filename for download */
  downloadFilename?: string;
  /** MIME type for download */
  downloadMimeType?: string;
  /** Callback when download action is triggered */
  onDownload?: () => void;
  /** Callback when reset action is triggered */
  onReset?: () => void;
  /** Label for reset button */
  resetLabel?: string;
  /** Callback when clear action is triggered */
  onClear?: () => void;
  /** Label for clear button */
  clearLabel?: string;
  /** Callback when generate action is triggered */
  onGenerate?: () => void;
  /** Label for generate button */
  generateLabel?: string;
  /** Whether generation is in progress */
  isGenerating?: boolean;
  /** Callback when share action is triggered */
  onShare?: () => void;
  /** Label for share button */
  shareLabel?: string;
  /** Callback when save action is triggered */
  onSave?: () => void;
  /** Label for save button */
  saveLabel?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Whether buttons are disabled */
  disabled?: boolean;
}

/**
 * Component that renders a collection of action buttons for common operations
 */
export function ActionButtons({
  copyText,
  copySuccessMessage,
  onCopy,
  downloadData,
  downloadFilename,
  downloadMimeType,
  onDownload,
  onReset,
  resetLabel = "Reset",
  onClear,
  clearLabel = "Clear",
  onGenerate,
  generateLabel = "Generate",
  isGenerating = false,
  onShare,
  shareLabel = "Share",
  onSave,
  saveLabel = "Save",
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {onGenerate && (
        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          variant={variant}
          size={size}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isGenerating ? "animate-spin" : ""}`}
          />
          {generateLabel}
        </Button>
      )}

      {copyText && (
        <CopyButton
          text={copyText}
          successMessage={copySuccessMessage}
          variant={variant}
          size={size}
          disabled={disabled}
          showSuccessState={true}
        >
          Copy
        </CopyButton>
      )}

      {downloadData && downloadFilename && (
        <DownloadButton
          data={downloadData}
          filename={downloadFilename}
          mimeType={downloadMimeType}
          variant={variant}
          size={size}
          disabled={disabled}
          showSuccessState={true}
        >
          Download
        </DownloadButton>
      )}

      {onSave && (
        <Button
          onClick={onSave}
          disabled={disabled}
          variant={variant}
          size={size}
        >
          <Save className="h-4 w-4 mr-1" />
          {saveLabel}
        </Button>
      )}

      {onShare && (
        <Button
          onClick={onShare}
          disabled={disabled}
          variant={variant}
          size={size}
        >
          <Share2 className="h-4 w-4 mr-1" />
          {shareLabel}
        </Button>
      )}

      {onReset && (
        <Button
          onClick={onReset}
          disabled={disabled}
          variant={variant}
          size={size}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          {resetLabel}
        </Button>
      )}

      {onClear && (
        <Button
          onClick={onClear}
          disabled={disabled}
          variant={variant}
          size={size}
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
