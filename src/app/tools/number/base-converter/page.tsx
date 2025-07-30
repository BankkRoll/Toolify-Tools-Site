"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { RefreshCw } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";

/**
 * Interface for base conversion options
 */
interface BaseOption {
  value: string;
  name: string;
  prefix: string;
}

/**
 * Interface for conversion result
 */
interface ConversionResult extends BaseOption {
  display: string;
}

/**
 * Base converter tool page
 */
export default function BaseConverterPage() {
  const [inputValue, setInputValue] = useState("");
  const [inputBase, setInputBase] = useState("10");
  const [error, setError] = useState("");

  const [history, setHistory] = useLocalStorage<string[]>(
    "number-base-converter-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const examplesSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const examplesSectionInView = useInView(examplesSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Available number bases for conversion
   */
  const bases: BaseOption[] = [
    { value: "2", name: "Binary", prefix: "0b" },
    { value: "8", name: "Octal", prefix: "0o" },
    { value: "10", name: "Decimal", prefix: "" },
    { value: "16", name: "Hexadecimal", prefix: "0x" },
  ];

  /**
   * Converts a number from one base to another
   */
  const convertToBase = (
    value: string,
    fromBase: number,
    toBase: number,
  ): string => {
    try {
      if (!value.trim()) return "";

      // Convert to decimal first
      const decimal = Number.parseInt(value, fromBase);

      if (isNaN(decimal)) {
        throw new Error("Invalid number for the selected base");
      }

      // Convert to target base
      return decimal.toString(toBase).toUpperCase();
    } catch (err) {
      throw new Error("Invalid input for the selected base");
    }
  };

  /**
   * Gets all conversions for the current input
   */
  const getConversions = (): ConversionResult[] => {
    if (!inputValue.trim()) return [];

    try {
      setError("");
      const fromBase = Number.parseInt(inputBase);

      return bases.map((base) => {
        const toBase = Number.parseInt(base.value);
        const converted = convertToBase(inputValue, fromBase, toBase);
        return {
          ...base,
          display: base.prefix + converted,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
      return [];
    }
  };

  const conversions = getConversions();

  /**
   * Clears the input and error state
   */
  const clearInput = () => {
    setInputValue("");
    setError("");
  };

  /**
   * Validates if a value is valid for the given base
   */
  const isValidForBase = (value: string, base: number): boolean => {
    if (!value.trim()) return true;

    const validChars = "0123456789ABCDEF".slice(0, base);
    return value
      .toUpperCase()
      .split("")
      .every((char) => validChars.includes(char));
  };

  /**
   * Handles input value changes with validation
   */
  const handleInputChange = (value: string) => {
    setInputValue(value);

    const base = Number.parseInt(inputBase);
    if (!isValidForBase(value, base)) {
      setError(`Invalid character for base ${base}`);
    } else {
      setError("");
      // Save to history when we have a valid input
      if (value.trim() && isValidForBase(value, base)) {
        const baseName =
          bases.find((b) => b.value === inputBase)?.name || "Unknown";
        setHistory(
          [`Converted: ${value} (${baseName})`, ...history].slice(0, 10),
        );
      }
    }
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

  const resultCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  return (
    <ToolLayout toolId="number-base-converter">
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
              <CardTitle>Input Number</CardTitle>
              <CardDescription>
                Enter a number to convert between different bases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inputBase">Input Base</Label>
                  <Select value={inputBase} onValueChange={setInputBase}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.value} value={base.value}>
                          {base.name} (Base {base.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="inputValue">Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="inputValue"
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={`Enter ${bases.find((b) => b.value === inputBase)?.name.toLowerCase()} number`}
                      className="font-mono"
                    />
                    <Button variant="outline" onClick={clearInput}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, y: -10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.2 } : undefined}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </MotionDiv>
              )}

              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Valid characters for each base:</strong>
                </p>
                <ul className="mt-1 space-y-1">
                  <li>Binary (Base 2): 0, 1</li>
                  <li>Octal (Base 8): 0-7</li>
                  <li>Decimal (Base 10): 0-9</li>
                  <li>Hexadecimal (Base 16): 0-9, A-F</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={resultsSectionRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? resultsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          {conversions.map((conversion, index) => (
            <MotionDiv
              key={conversion.value}
              variants={animationsEnabled ? resultCardVariants : undefined}
              custom={index}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{conversion.name}</CardTitle>
                    <ActionButtons
                      copyText={conversion.display}
                      copySuccessMessage={`${conversion.name} value copied to clipboard`}
                      variant="outline"
                      size="sm"
                      disabled={
                        !conversion.display ||
                        conversion.display === conversion.prefix
                      }
                    />
                  </div>
                  <CardDescription>Base {conversion.value}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[60px] p-3 bg-muted rounded-lg flex items-center">
                    <p className="text-lg font-mono break-all">
                      {conversion.display || "Enter a number to convert..."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          ))}
        </MotionDiv>

        <MotionDiv
          ref={examplesSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? examplesSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className="font-medium mb-2">Common Conversions:</h4>
                  <div className="space-y-1 font-mono">
                    <div>255 (Dec) = FF (Hex) = 377 (Oct) = 11111111 (Bin)</div>
                    <div>16 (Dec) = 10 (Hex) = 20 (Oct) = 10000 (Bin)</div>
                    <div>8 (Dec) = 8 (Hex) = 10 (Oct) = 1000 (Bin)</div>
                  </div>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">Powers of 2:</h4>
                  <div className="space-y-1 font-mono">
                    <div>2¹ = 2 (Dec) = 10 (Bin)</div>
                    <div>2⁴ = 16 (Dec) = 10000 (Bin)</div>
                    <div>2⁸ = 256 (Dec) = 100000000 (Bin)</div>
                  </div>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
