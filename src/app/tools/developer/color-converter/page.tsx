"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Color converter tool for converting between different color formats
 */
export default function ColorConverterPage() {
  const animationsEnabled = useAnimations();
  const [inputColor, setInputColor] = useLocalStorage(
    "color-converter-input",
    "",
  );
  const [inputFormat, setInputFormat] = useLocalStorage(
    "color-converter-input-format",
    "hex",
  );
  const [convertedColors, setConvertedColors] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ color: string; format: string; timestamp: number }>
  >("color-converter-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  /**
   * Convert hex to RGB
   */
  const hexToRgb = (
    hex: string,
  ): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  /**
   * Convert RGB to hex
   */
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  /**
   * Convert RGB to HSL
   */
  const rgbToHsl = (
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  /**
   * Convert HSL to RGB
   */
  const hslToRgb = (
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  /**
   * Parse color input based on format
   */
  const parseColor = (
    color: string,
    format: string,
  ): { r: number; g: number; b: number } | null => {
    try {
      switch (format) {
        case "hex":
          return hexToRgb(color);
        case "rgb":
          const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          return rgbMatch
            ? {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3]),
              }
            : null;
        case "hsl":
          const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
          return hslMatch
            ? hslToRgb(
                parseInt(hslMatch[1]),
                parseInt(hslMatch[2]),
                parseInt(hslMatch[3]),
              )
            : null;
        default:
          return null;
      }
    } catch {
      return null;
    }
  };

  /**
   * Convert color to all formats
   */
  const convertColor = () => {
    if (!inputColor.trim()) {
      toast.error("Please enter a color to convert");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const rgb = parseColor(inputColor, inputFormat);

      if (!rgb) {
        throw new Error("Invalid color format");
      }

      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

      const converted = {
        hex: hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        rgbValues: rgb,
        hslValues: hsl,
        isValid: true,
      };

      setConvertedColors(converted);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        color: inputColor,
        format: inputFormat,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success("Color converted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid color format";
      setError(errorMessage);
      toast.error("Invalid color format");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy color value to clipboard
   */
  const copyColor = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Color copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputColor("");
    setConvertedColors(null);
    setIsComplete(false);
    setError(null);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-color-converter">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="input-format">Input Format</Label>
              <Select value={inputFormat} onValueChange={setInputFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hex">HEX (#ffffff)</SelectItem>
                  <SelectItem value="rgb">RGB (rgb(255, 255, 255))</SelectItem>
                  <SelectItem value="hsl">HSL (hsl(0, 0%, 100%))</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-color">Color Value</Label>
              <Input
                id="input-color"
                value={inputColor}
                onChange={(e) => setInputColor(e.target.value)}
                placeholder={
                  inputFormat === "hex"
                    ? "#ffffff"
                    : inputFormat === "rgb"
                      ? "rgb(255, 255, 255)"
                      : "hsl(0, 0%, 100%)"
                }
                className="font-mono"
              />
            </div>
          </div>

          <ActionButtons
            onGenerate={convertColor}
            onClear={clearAll}
            generateLabel="Convert Color"
            clearLabel="Clear All"
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={isComplete}
          error={error}
        />

        {convertedColors && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    HEX
                    <button
                      onClick={() => copyColor(convertedColors.hex)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: convertedColors.hex }}
                    />
                    <Badge variant="outline" className="font-mono">
                      {convertedColors.hex}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    RGB
                    <button
                      onClick={() => copyColor(convertedColors.rgb)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: convertedColors.rgb }}
                    />
                    <Badge variant="outline" className="font-mono">
                      {convertedColors.rgb}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    HSL
                    <button
                      onClick={() => copyColor(convertedColors.hsl)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: convertedColors.rgb }}
                    />
                    <Badge variant="outline" className="font-mono">
                      {convertedColors.hsl}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Color Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">RGB Values</h4>
                    <div className="space-y-1 text-sm">
                      <div>Red: {convertedColors.rgbValues.r}</div>
                      <div>Green: {convertedColors.rgbValues.g}</div>
                      <div>Blue: {convertedColors.rgbValues.b}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">HSL Values</h4>
                    <div className="space-y-1 text-sm">
                      <div>Hue: {convertedColors.hslValues.h}°</div>
                      <div>Saturation: {convertedColors.hslValues.s}%</div>
                      <div>Lightness: {convertedColors.hslValues.l}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Recent History</h3>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: entry.color }}
                          />
                          <p className="font-medium truncate font-mono">
                            {entry.color}
                          </p>
                          <Badge variant="secondary">
                            {entry.format.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputColor(entry.color);
                          setInputFormat(entry.format);
                          toast.success("Color loaded from history");
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Load
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}
      </div>
    </ToolLayout>
  );
}
