"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
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
import { Clock } from "lucide-react";
import { useState } from "react";

const timezones = [
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

export default function TimezoneConverterPage() {
  const [fromTimezone, setFromTimezone] = useState("UTC");
  const [toTimezone, setToTimezone] = useState("America/New_York");
  const [inputTime, setInputTime] = useState("");
  const [convertedTime, setConvertedTime] = useState("");
  const [error, setError] = useState("");

  const convertTimezone = () => {
    if (!inputTime.trim()) {
      setError("Please enter a time to convert");
      return;
    }

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
      setError("");
    } catch (err) {
      setError("Invalid time format. Please use HH:MM format (e.g., 14:30)");
    }
  };

  const clearAll = () => {
    setInputTime("");
    setConvertedTime("");
    setError("");
  };

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

  return (
    <ToolLayout toolId="time-timezone">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Time Conversion</CardTitle>
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
                  <Select value={fromTimezone} onValueChange={setFromTimezone}>
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
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
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
        </div>

        {/* Timezone Information */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Timezones</CardTitle>
            <CardDescription>Current times in major timezones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {timezones.slice(0, 9).map((timezone) => (
                <div
                  key={timezone.value}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  );
}
