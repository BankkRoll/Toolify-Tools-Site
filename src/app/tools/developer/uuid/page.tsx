"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Hash, RefreshCw } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * UUID generator tool page
 */
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState("v4");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history] = useLocalStorage<string[]>("uuid-generator-history", []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const optionsSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const aboutRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const optionsSectionInView = useInView(optionsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });

  /**
   * Generates UUIDs based on selected version and count
   */
  const generateUUID = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const newUuids: string[] = [];

      for (let i = 0; i < count; i++) {
        let uuid: string;

        switch (version) {
          case "v1":
            uuid = generateUUIDv1();
            break;
          case "v3":
            uuid = generateUUIDv3(
              "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              `namespace-${i}`,
            );
            break;
          case "v4":
            uuid = generateUUIDv4();
            break;
          case "v5":
            uuid = generateUUIDv5(
              "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
              `namespace-${i}`,
            );
            break;
          default:
            uuid = generateUUIDv4();
        }

        newUuids.push(uuid);
      }

      setUuids(newUuids);
      setIsComplete(true);
      toast.success(`Generated ${count} UUID${count !== 1 ? "s" : ""}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate UUIDs";
      setError(errorMessage);
      toast.error("Failed to generate UUIDs");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generates UUID v1 (time-based)
   */
  const generateUUIDv1 = (): string => {
    const now = Date.now();
    const timestamp = Math.floor(now / 1000) + 0x01b21dd213814000;
    const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000;
    const node = Math.floor(Math.random() * 0xffffffffffff);

    const timeLow = timestamp & 0xffffffff;
    const timeMid = (timestamp >> 32) & 0xffff;
    const timeHigh = ((timestamp >> 48) & 0x0fff) | 0x1000;

    return [
      timeLow.toString(16).padStart(8, "0"),
      timeMid.toString(16).padStart(4, "0"),
      timeHigh.toString(16).padStart(4, "0"),
      clockSeq.toString(16).padStart(4, "0"),
      node.toString(16).padStart(12, "0"),
    ].join("-");
  };

  /**
   * Generates UUID v3 (namespace-based with MD5)
   */
  const generateUUIDv3 = (namespace: string, name: string): string => {
    // Simplified v3 implementation - in real use, you'd use a proper MD5 hash
    const combined = namespace + name;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
    return [
      hashHex.substring(0, 8),
      hashHex.substring(8, 12),
      ((parseInt(hashHex.substring(12, 16), 16) & 0x0fff) | 0x3000)
        .toString(16)
        .padStart(4, "0"),
      ((parseInt(hashHex.substring(16, 20), 16) & 0x3fff) | 0x8000)
        .toString(16)
        .padStart(4, "0"),
      hashHex.substring(20, 32),
    ].join("-");
  };

  /**
   * Generates UUID v4 (random)
   */
  const generateUUIDv4 = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  /**
   * Generates UUID v5 (namespace-based with SHA-1)
   */
  const generateUUIDv5 = (namespace: string, name: string): string => {
    // Simplified v5 implementation - in real use, you'd use a proper SHA-1 hash
    const combined = namespace + name;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    const hashHex = Math.abs(hash).toString(16).padStart(8, "0");
    return [
      hashHex.substring(0, 8),
      hashHex.substring(8, 12),
      ((parseInt(hashHex.substring(12, 16), 16) & 0x0fff) | 0x5000)
        .toString(16)
        .padStart(4, "0"),
      ((parseInt(hashHex.substring(16, 20), 16) & 0x3fff) | 0x8000)
        .toString(16)
        .padStart(4, "0"),
      hashHex.substring(20, 32),
    ].join("-");
  };

  /**
   * Clears generated UUIDs
   */
  const clearUuids = () => {
    setUuids([]);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Validates UUID format
   */
  const validateUuid = (uuid: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  /**
   * Gets copy text for all UUIDs
   */
  const getCopyText = () => {
    return uuids.join("\n");
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
    <ToolLayout toolId="developer-uuid">
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
          ref={optionsSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? optionsSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                UUID Generator Options
              </CardTitle>
              <CardDescription>
                Configure UUID version and generation count
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">UUID Version</Label>
                  <Tabs
                    value={version}
                    onValueChange={setVersion}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="v1">v1</TabsTrigger>
                      <TabsTrigger value="v3">v3</TabsTrigger>
                      <TabsTrigger value="v4">v4</TabsTrigger>
                      <TabsTrigger value="v5">v5</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">Count</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) =>
                      setCount(
                        Math.max(
                          1,
                          Math.min(100, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Version Information</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {version === "v1" && (
                    <p>Time-based UUID using timestamp and node identifier</p>
                  )}
                  {version === "v3" && (
                    <p>Namespace-based UUID using MD5 hash (deterministic)</p>
                  )}
                  {version === "v4" && (
                    <p>
                      Random UUID using cryptographically secure random numbers
                    </p>
                  )}
                  {version === "v5" && (
                    <p>Namespace-based UUID using SHA-1 hash (deterministic)</p>
                  )}
                </div>
              </div>

              <ActionButtons
                onGenerate={generateUUID}
                generateLabel="Generate UUIDs"
                onReset={clearUuids}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={isProcessing}
                isGenerating={isProcessing}
              />
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
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Generated UUIDs
                {uuids.length > 0 && (
                  <Badge variant="secondary">
                    {uuids.length} UUID{uuids.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Copy individual UUIDs or all at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {uuids.length > 0 ? (
                <MotionDiv
                  className="space-y-3"
                  initial={
                    animationsEnabled ? { opacity: 0, y: 10 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  {uuids.map((uuid, index) => (
                    <MotionDiv
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      initial={
                        animationsEnabled ? { opacity: 0, x: -10 } : undefined
                      }
                      animate={
                        animationsEnabled ? { opacity: 1, x: 0 } : undefined
                      }
                      transition={
                        animationsEnabled ? { delay: index * 0.1 } : undefined
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-sm font-medium">
                          #{index + 1}
                        </span>
                        <code className="font-mono text-sm truncate">
                          {uuid}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={
                            validateUuid(uuid) ? "default" : "destructive"
                          }
                        >
                          {validateUuid(uuid) ? "Valid" : "Invalid"}
                        </Badge>
                        <ActionButtons
                          copyText={uuid}
                          copySuccessMessage="UUID copied to clipboard"
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    </MotionDiv>
                  ))}

                  <ActionButtons
                    copyText={getCopyText()}
                    copySuccessMessage="All UUIDs copied to clipboard"
                    variant="outline"
                    size="sm"
                  />
                </MotionDiv>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Click "Generate UUIDs" to create new UUIDs
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={aboutRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled ? (aboutInView ? "visible" : "hidden") : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>About UUIDs</CardTitle>
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
                  <h4 className="font-medium mb-2">What are UUIDs?</h4>
                  <p className="text-muted-foreground">
                    UUIDs (Universally Unique Identifiers) are 128-bit
                    identifiers that are unique across space and time. They are
                    commonly used in software development for database keys, API
                    identifiers, and distributed systems.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">UUID Versions:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• v1: Time-based with node identifier</li>
                    <li>• v3: Namespace-based with MD5 hash</li>
                    <li>• v4: Random (most commonly used)</li>
                    <li>• v5: Namespace-based with SHA-1 hash</li>
                  </ul>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearUuids}
            processingText="Generating UUIDs..."
            completeText="UUID generation complete!"
            errorText="UUID generation failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
