'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Lap {
  id: number;
  time: number;
  totalTime: number;
}

/**
 * Hook for stopwatch functionality with lap timing
 * @returns Object with stopwatch state and control functions
 */
export function useStopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  /**
   * Starts the stopwatch
   */
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }
  }, [isRunning, time]);

  /**
   * Stops the stopwatch
   */
  const stop = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning]);

  /**
   * Resets the stopwatch and clears laps
   */
  const reset = useCallback(() => {
    setTime(0);
    setLaps([]);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  /**
   * Records a lap time
   */
  const lap = useCallback(() => {
    if (isRunning) {
      const newLap: Lap = {
        id: laps.length + 1,
        time: time - (laps.length > 0 ? laps[laps.length - 1].totalTime : 0),
        totalTime: time,
      };
      setLaps(prev => [...prev, newLap]);
    }
  }, [isRunning, time, laps.length]);

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
   * @returns Formatted time string (MM:SS.CC)
   */
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return {
    time,
    isRunning,
    laps,
    start,
    stop,
    reset,
    lap,
    formatTime,
  };
}
