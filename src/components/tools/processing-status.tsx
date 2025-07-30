"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, RotateCcw, X } from "lucide-react";

/**
 * Props for the ProcessingStatus component
 */
interface ProcessingStatusProps {
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Whether processing is complete */
  isComplete: boolean;
  /** Error message if processing failed */
  error: string | null;
  /** Callback to reset processing */
  onReset?: () => void;
  /** Callback to retry processing */
  onRetry?: () => void;
  /** Text shown during processing */
  processingText?: string;
  /** Text shown when complete */
  completeText?: string;
  /** Text shown when error occurs */
  errorText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Component that displays processing status with loading, success, and error states
 */
export function ProcessingStatus({
  isProcessing,
  isComplete,
  error,
  onReset,
  onRetry,
  processingText = "Processing...",
  completeText = "Processing complete!",
  errorText = "An error occurred",
  className,
  showProgress = false,
  progress = 0,
}: ProcessingStatusProps) {
  if (isProcessing) {
    return (
      <Alert className={cn(className)}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>{processingText}</span>
          {showProgress && (
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </AlertDescription>
        {showProgress && (
          <div className="w-full bg-muted rounded-full h-1 mt-2">
            <div
              className="bg-blue-500 h-1 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={cn(className)}>
        <X className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            {errorText}: {error}
          </span>
          <div className="flex gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isComplete) {
    return (
      <Alert
        className={cn("border-green-200 bg-green-50 text-green-800", className)}
      >
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>{completeText}</span>
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
            >
              Reset
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
