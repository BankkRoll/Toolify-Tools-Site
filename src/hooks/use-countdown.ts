'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownOptions {
  onComplete?: () => void;
  autoStart?: boolean;
}

/**
 * Hook for countdown timer functionality
 * @param initialTime - Initial time in milliseconds
 * @param options - Countdown configuration options
 * @returns Object with countdown state and control functions
 */
export function useCountdown(initialTime: number, options: CountdownOptions = {}) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(options.autoStart || false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Starts the countdown timer
   */
  const start = useCallback(() => {
    if (!isRunning && timeLeft > 0) {
      setIsRunning(true);
      setIsComplete(false);
      startTimeRef.current = Date.now() - (initialTime - timeLeft);
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, initialTime - elapsed);

        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsRunning(false);
          setIsComplete(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          options.onComplete?.();
        }
      }, 100);
    }
  }, [isRunning, timeLeft, initialTime, options]);

  /**
   * Pauses the countdown timer
   */
  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning]);

  /**
   * Resets the countdown to initial time
   */
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(false);
    setIsComplete(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [initialTime]);

  /**
   * Sets countdown to specific time
   * @param newTime - New time in milliseconds
   */
  const setTime = useCallback(
    (newTime: number) => {
      setTimeLeft(newTime);
      if (isRunning) {
        pause();
      }
    },
    [isRunning, pause],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Formats milliseconds to readable time string
   * @param ms - Time in milliseconds
   * @returns Formatted time string (HH:MM:SS or MM:SS)
   */
  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    setTime,
    formatTime,
  };
}
