"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Clock } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for timezone data
 */
interface TimezoneData {
  value: string;
  label: string;
}

/**
 * Array of available timezones
 */
const timezones: TimezoneData[] = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)" },
];

/**
 * Timezone converter tool page
 */
export default function TimezoneConverterPage() {
  const [fromTimezone, setFromTimezone] = useState("UTC");
  const [toTimezone, setToTimezone] = useState("America/New_York");
  const [inputTime, setInputTime] = useState("");
  const [convertedTime, setConvertedTime] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "time-timezone-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const timezonesSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const timezonesSectionInView = useInView(timezonesSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Converts time between timezones
   */
  const convertTimezone = () => {
    if (!inputTime.trim()) {
      setError("Please enter a time to convert");
      toast.error("Please enter a time to convert");
      return;
    }

    setIsProcessing(true);
    setError("");
    setIsComplete(false);

    try {
      const [hours, minutes] = inputTime.split(":").map(Number);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        throw new Error("Invalid time format");
      }

      const now = new Date();
      const inputDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
      );

      const fromTime = new Date(
        inputDate.toLocaleString("en-US", { timeZone: fromTimezone }),
      );
      const toTime = new Date(
        inputDate.toLocaleString("en-US", { timeZone: toTimezone }),
      );

      const timeDiff = toTime.getTime() - fromTime.getTime();
      const convertedDate = new Date(inputDate.getTime() + timeDiff);

      const convertedHours = convertedDate
        .getHours()
        .toString()
        .padStart(2, "0");
      const convertedMinutes = convertedDate
        .getMinutes()
        .toString()
        .padStart(2, "0");

      setConvertedTime(`${convertedHours}:${convertedMinutes}`);
      setIsComplete(true);
      setHistory(
        [
          `Converted ${inputTime} from ${fromTimezone} to ${toTimezone}`,
          ...history,
        ].slice(0, 10),
      );
      toast.success("Time converted successfully");
    } catch (err) {
      const errorMessage =
        "Invalid time format. Please use HH:MM format (e.g., 14:30)";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setInputTime("");
    setConvertedTime("");
    setError("");
    setIsComplete(false);
  };

  /**
   * Gets current time for a timezone
   */
  const getCurrentTime = (timezone: string) => {
    try {
      return new Date().toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid timezone";
    }
  };

  /**
   * Gets timezone offset from UTC
   */
  const getTimezoneOffset = (timezone: string) => {
    try {
      const now = new Date();
      const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
      const target = new Date(
        now.toLocaleString("en-US", { timeZone: timezone }),
      );
      const diff = (target.getTime() - utc.getTime()) / (1000 * 60 * 60);

      if (diff === 0) return "UTC";
      if (diff > 0) return `UTC+${diff}`;
      return `UTC${diff}`;
    } catch {
      return "Unknown";
    }
  };

  // Motion variants
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
    <ToolLayout toolId="time-timezone">
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
        <div className="grid gap-6 lg:grid-cols-2">
          <MotionDiv
            ref={inputSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? inputSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Conversion
                </CardTitle>
                <CardDescription>
                  Convert time between different timezones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="input-time">Time (HH:MM)</Label>
                  <Input
                    id="input-time"
                    type="time"
                    value={inputTime}
                    onChange={(e) => setInputTime(e.target.value)}
                    placeholder="14:30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-timezone">From Timezone</Label>
                    <Select
                      value={fromTimezone}
                      onValueChange={setFromTimezone}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Current: {getCurrentTime(fromTimezone)} (
                      {getTimezoneOffset(fromTimezone)})
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to-timezone">To Timezone</Label>
                    <Select value={toTimezone} onValueChange={setToTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Current: {getCurrentTime(toTimezone)} (
                      {getTimezoneOffset(toTimezone)})
                    </div>
                  </div>
                </div>

                <ActionButtons
                  onGenerate={convertTimezone}
                  generateLabel="Convert Time"
                  onReset={clearAll}
                  resetLabel="Clear"
                  variant="outline"
                  size="sm"
                  disabled={!inputTime.trim() || isProcessing}
                  isGenerating={isProcessing}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv
            ref={outputSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? outputSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Converted Time</CardTitle>
                <CardDescription>Time in the target timezone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {convertedTime ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-mono font-bold mb-2">
                        {convertedTime}
                      </div>
                      <Badge variant="outline">
                        {timezones.find((tz) => tz.value === toTimezone)?.label}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">Quick Reference</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From:</span>
                          <span className="font-mono">{inputTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">To:</span>
                          <span className="font-mono">{convertedTime}</span>
                        </div>
                      </div>
                    </div>

                    <ActionButtons
                      copyText={convertedTime}
                      copySuccessMessage="Converted time copied to clipboard"
                      variant="outline"
                      size="sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Enter a time and click "Convert Time" to see results
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </div>

        <MotionDiv
          ref={timezonesSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? timezonesSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Popular Timezones</CardTitle>
              <CardDescription>
                Current times in major timezones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {timezones.slice(0, 9).map((timezone) => (
                  <MotionDiv
                    key={timezone.value}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    initial={
                      animationsEnabled
                        ? { opacity: 0, scale: 0.95 }
                        : undefined
                    }
                    animate={
                      animationsEnabled ? { opacity: 1, scale: 1 } : undefined
                    }
                    transition={
                      animationsEnabled ? { duration: 0.3 } : undefined
                    }
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {timezone.label.split(" (")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getTimezoneOffset(timezone.value)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {getCurrentTime(timezone.value)}
                      </div>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText="Converting timezone..."
            completeText="Time converted successfully!"
            errorText="Failed to convert timezone"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
