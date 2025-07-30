"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * Props for the CopyButton component
 */
interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Callback when copy action is triggered */
  onCopy?: () => void;
  /** Button variant */
  variant?: "default" | "outline" | "ghost";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
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
 * Button component for copying text to clipboard with loading and success states
 */
export function CopyButton({
  text,
  onCopy,
  variant = "outline",
  size = "icon",
  disabled = false,
  className,
  children,
  showSuccessState = true,
}: CopyButtonProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!text || isCopying) return;

    setIsCopying(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      // Call the onCopy callback if provided
      if (onCopy) {
        onCopy();
      }

      if (showSuccessState) {
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      }
    } catch (err) {
      setError("Failed to copy to clipboard");
      console.error("Copy failed:", err);
    } finally {
      setIsCopying(false);
    }
  };

  const getIcon = () => {
    if (isCopying) {
      return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    }
    if (isCopied && showSuccessState) {
      return <Check className="h-4 w-4 mr-1 text-green-500" />;
    }
    return <Copy className="h-4 w-4 mr-1" />;
  };

  const getButtonText = () => {
    if (isCopying) return "Copying...";
    if (isCopied && showSuccessState) return "Copied!";
    return children || "Copy";
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        onClick={handleCopy}
        disabled={disabled || !text || isCopying}
        className={cn(
          isCopied &&
            showSuccessState &&
            "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
          error && "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
          className,
        )}
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      {error && (
        <div className="absolute -bottom-8 left-0 text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
