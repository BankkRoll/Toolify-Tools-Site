"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useStopwatch } from "@/hooks/use-stopwatch";
import { useAnimations } from "@/stores/settings-store";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";

/**
 * Interface for lap time data
 */
interface LapTime {
  id: number;
  time: number;
  lapTime: number;
}

/**
 * Stopwatch tool page
 */
export default function StopwatchPage() {
  const [laps, setLaps] = useState<LapTime[]>([]);
  const [lapCounter, setLapCounter] = useState(1);

  const [history, setHistory] = useLocalStorage<string[]>(
    "time-stopwatch-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const timerSectionRef = useRef(null);
  const controlsSectionRef = useRef(null);
  const lapsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const timerSectionInView = useInView(timerSectionRef, {
    once: true,
    amount: 0.2,
  });
  const controlsSectionInView = useInView(controlsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const lapsSectionInView = useInView(lapsSectionRef, {
    once: true,
    amount: 0.2,
  });

  const { time, isRunning, start, stop, reset } = useStopwatch();

  /**
   * Adds a lap time
   */
  const addLap = () => {
    if (!isRunning) return;

    const newLap: LapTime = {
      id: lapCounter,
      time: time,
      lapTime: laps.length > 0 ? time - laps[laps.length - 1].time : time,
    };

    setLaps((prev) => [...prev, newLap]);
    setLapCounter((prev) => prev + 1);
    setHistory(
      [`Lap ${lapCounter}: ${formatTime(newLap.lapTime)}`, ...history].slice(
        0,
        10,
      ),
    );
  };

  /**
   * Formats time in milliseconds to MM:SS.mmm format
   */
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  /**
   * Gets CSV content for download
   */
  const getCsvContent = () => {
    const headers = "Lap,Total Time,Lap Time\n";
    const rows = laps
      .map(
        (lap) => `${lap.id},${formatTime(lap.time)},${formatTime(lap.lapTime)}`,
      )
      .join("\n");
    return headers + rows;
  };

  /**
   * Gets the best lap time
   */
  const getBestLap = () => {
    if (laps.length === 0) return null;
    return laps.reduce((best, lap) =>
      lap.lapTime < best.lapTime ? lap : best,
    );
  };

  /**
   * Gets the worst lap time
   */
  const getWorstLap = () => {
    if (laps.length === 0) return null;
    return laps.reduce((worst, lap) =>
      lap.lapTime > worst.lapTime ? lap : worst,
    );
  };

  /**
   * Clears all laps
   */
  const clearLaps = () => {
    setLaps([]);
    setLapCounter(1);
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
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="time-stopwatch">
      <MotionDiv
        ref={containerRef}
        className="space-y-6"
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={
          animationsEnabled
            ? containerInView
              ? "visible"
              : "hidden"
            : undefined
        }
      >
        <MotionDiv
          ref={timerSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? timerSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Stopwatch</CardTitle>
              <CardDescription>Track time with precision</CardDescription>
            </CardHeader>
            <CardContent>
              <MotionDiv
                className="text-center space-y-4"
                initial={
                  animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined
                }
                animate={
                  animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                }
                transition={animationsEnabled ? { duration: 0.5 } : undefined}
              >
                <div className="text-6xl font-mono font-bold tracking-wider">
                  {formatTime(time)}
                </div>
                <div className="flex justify-center gap-2">
                  {!isRunning ? (
                    <Button onClick={start} size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={stop} size="lg" variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={reset} size="lg" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </MotionDiv>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={controlsSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? controlsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Additional stopwatch functions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={addLap}
                  disabled={!isRunning}
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Lap
                </Button>
                <ActionButtons
                  downloadData={
                    new Blob([getCsvContent()], { type: "text/csv" })
                  }
                  downloadFilename="stopwatch-laps.csv"
                  downloadMimeType="text/csv"
                  onReset={clearLaps}
                  resetLabel="Clear Laps"
                  variant="outline"
                  size="sm"
                  disabled={laps.length === 0}
                />
              </div>

              {(getBestLap() || getWorstLap()) && (
                <MotionDiv
                  className="grid grid-cols-2 gap-4"
                  initial={
                    animationsEnabled ? { opacity: 0, y: 10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  {getBestLap() && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        Best Lap
                      </div>
                      <div className="text-lg font-mono text-green-600">
                        {formatTime(getBestLap()!.lapTime)}
                      </div>
                    </div>
                  )}
                  {getWorstLap() && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-800">
                        Worst Lap
                      </div>
                      <div className="text-lg font-mono text-red-600">
                        {formatTime(getWorstLap()!.lapTime)}
                      </div>
                    </div>
                  )}
                </MotionDiv>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={lapsSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? lapsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Lap Times</CardTitle>
              <CardDescription>
                {laps.length > 0
                  ? `${laps.length} laps recorded`
                  : "No laps recorded yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {laps.length > 0 ? (
                <MotionDiv
                  className="space-y-2 max-h-64 overflow-y-auto"
                  initial={animationsEnabled ? { opacity: 0 } : undefined}
                  animate={animationsEnabled ? { opacity: 1 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  {laps.map((lap, index) => (
                    <MotionDiv
                      key={lap.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      initial={
                        animationsEnabled ? { opacity: 0, x: -20 } : undefined
                      }
                      animate={
                        animationsEnabled ? { opacity: 1, x: 0 } : undefined
                      }
                      transition={
                        animationsEnabled ? { delay: index * 0.1 } : undefined
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">Lap {lap.id}</div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatTime(lap.time)}
                        </div>
                      </div>
                      <div className="font-mono font-medium">
                        {formatTime(lap.lapTime)}
                      </div>
                    </MotionDiv>
                  ))}
                </MotionDiv>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Square className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Start the stopwatch and click "Lap" to record lap times
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
