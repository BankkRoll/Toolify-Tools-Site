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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { CheckCircle, FileText, Search, XCircle } from "lucide-react";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Interface for regex match results
 */
interface Match {
  match: string;
  index: number;
  groups: string[];
}

/**
 * Regex tester tool page
 */
export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [testText, setTestText] = useState("");
  const [flags, setFlags] = useState("g");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isValidRegex, setIsValidRegex] = useState<boolean | null>(null);

  const [history] = useLocalStorage<string[]>("regex-tester-history", []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const aboutRef = useRef(null);

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
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.2 });

  /**
   * Tests regex pattern against input text
   */
  const testRegex = () => {
    if (!pattern.trim()) {
      toast.error("Please enter a regex pattern");
      return;
    }

    if (!testText.trim()) {
      toast.error("Please enter test text");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      // Validate regex pattern
      new RegExp(pattern, flags);
      setIsValidRegex(true);

      // Test the regex
      const regex = new RegExp(pattern, flags);
      const matches: Match[] = [];
      let match;

      if (flags.includes("g")) {
        // Global flag - find all matches
        while ((match = regex.exec(testText)) !== null) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      } else {
        // No global flag - find first match only
        match = regex.exec(testText);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(matches);
      setIsComplete(true);
      toast.success(
        `Found ${matches.length} match${matches.length !== 1 ? "es" : ""}`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid regex pattern";
      setError(errorMessage);
      setIsValidRegex(false);
      setMatches([]);
      toast.error("Invalid regex pattern");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    setPattern("");
    setTestText("");
    setFlags("g");
    setMatches([]);
    setError(null);
    setIsComplete(false);
    setIsValidRegex(null);
  };

  /**
   * Highlights matches in the test text
   */
  const highlightMatches = (text: string, matches: Match[]) => {
    if (matches.length === 0) return text;

    let highlightedText = text;
    let offset = 0;

    matches.forEach((match, index) => {
      const start = match.index + offset;
      const end = start + match.match.length;
      const before = highlightedText.substring(0, start);
      const after = highlightedText.substring(end);
      const highlighted = `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">${match.match}</mark>`;

      highlightedText = before + highlighted + after;
      offset += highlighted.length - match.match.length;
    });

    return highlightedText;
  };

  /**
   * Gets copy text for the regex results
   */
  const getCopyText = () => {
    if (matches.length === 0) return "No matches found";

    return matches
      .map(
        (match, index) =>
          `Match ${index + 1}: "${match.match}" at position ${match.index}`,
      )
      .join("\n");
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
    <ToolLayout toolId="developer-regex">
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
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Regex Pattern & Test Text
              </CardTitle>
              <CardDescription>
                Enter a regex pattern and test text to find matches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Regex Pattern</Label>
                  <Input
                    id="pattern"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="[a-zA-Z]+"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flags">Flags</Label>
                  <Input
                    id="flags"
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    placeholder="g, i, m, s, u, y"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testText">Test Text</Label>
                <Textarea
                  id="testText"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to test against the regex pattern..."
                  className="min-h-[120px]"
                />
              </div>

              <ActionButtons
                onGenerate={testRegex}
                generateLabel="Test Regex"
                onReset={clearAll}
                resetLabel="Clear All"
                variant="outline"
                size="sm"
                disabled={!pattern.trim() || !testText.trim() || isProcessing}
                isGenerating={isProcessing}
              />

              {isValidRegex !== null && (
                <MotionDiv
                  className="flex items-center gap-2 p-3 rounded-lg border"
                  initial={
                    animationsEnabled ? { opacity: 0, x: -20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  {isValidRegex ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isValidRegex
                      ? "Valid regex pattern"
                      : "Invalid regex pattern"}
                  </span>
                  <Badge variant={isValidRegex ? "default" : "destructive"}>
                    {isValidRegex ? "Valid" : "Invalid"}
                  </Badge>
                </MotionDiv>
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Regex Results
                {matches.length > 0 && (
                  <Badge variant="secondary">
                    {matches.length} match{matches.length !== 1 ? "es" : ""}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Matches found and highlighted text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="matches" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matches">Matches</TabsTrigger>
                  <TabsTrigger value="highlighted">
                    Highlighted Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matches" className="space-y-4">
                  {matches.length > 0 ? (
                    <MotionDiv
                      className="space-y-3"
                      initial={
                        animationsEnabled ? { opacity: 0, y: 10 } : undefined
                      }
                      animate={
                        animationsEnabled ? { opacity: 1, y: 0 } : undefined
                      }
                      transition={
                        animationsEnabled ? { duration: 0.3 } : undefined
                      }
                    >
                      {matches.map((match, index) => (
                        <MotionDiv
                          key={index}
                          className="p-3 bg-muted rounded-lg"
                          initial={
                            animationsEnabled
                              ? { opacity: 0, x: -10 }
                              : undefined
                          }
                          animate={
                            animationsEnabled ? { opacity: 1, x: 0 } : undefined
                          }
                          transition={
                            animationsEnabled
                              ? { delay: index * 0.1 }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              Match {index + 1}
                            </span>
                            <Badge variant="outline">
                              Position {match.index}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm text-muted-foreground">
                                Text:
                              </span>
                              <p className="font-mono text-sm bg-background p-2 rounded border">
                                {match.match}
                              </p>
                            </div>
                            {match.groups.length > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground">
                                  Groups:
                                </span>
                                <div className="space-y-1">
                                  {match.groups.map((group, groupIndex) => (
                                    <p
                                      key={groupIndex}
                                      className="font-mono text-sm bg-background p-2 rounded border"
                                    >
                                      Group {groupIndex + 1}:{" "}
                                      {group || "(empty)"}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </MotionDiv>
                      ))}
                    </MotionDiv>
                  ) : (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No matches found. Try adjusting your regex pattern or
                        test text.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="highlighted" className="space-y-4">
                  {matches.length > 0 ? (
                    <MotionDiv
                      className="space-y-2"
                      initial={
                        animationsEnabled ? { opacity: 0, y: 10 } : undefined
                      }
                      animate={
                        animationsEnabled ? { opacity: 1, y: 0 } : undefined
                      }
                      transition={
                        animationsEnabled ? { duration: 0.3 } : undefined
                      }
                    >
                      <Label>Highlighted Text</Label>
                      <div
                        className="p-3 bg-muted rounded-lg max-h-64 overflow-auto border"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatches(testText, matches),
                        }}
                      />
                    </MotionDiv>
                  ) : (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No matches to highlight
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {matches.length > 0 && (
                <ActionButtons
                  copyText={getCopyText()}
                  copySuccessMessage="Regex results copied to clipboard"
                  variant="outline"
                  size="sm"
                />
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
              <CardTitle>About Regular Expressions</CardTitle>
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
                  <h4 className="font-medium mb-2">What are Regex?</h4>
                  <p className="text-muted-foreground">
                    Regular expressions are patterns used to match character
                    combinations in strings. They are powerful tools for text
                    processing, validation, and search operations.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={
                    animationsEnabled ? { opacity: 0, x: 20 } : undefined
                  }
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className="font-medium mb-2">Common Flags:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• g: Global search</li>
                    <li>• i: Case-insensitive</li>
                    <li>• m: Multiline</li>
                    <li>• s: Dot matches newlines</li>
                    <li>• u: Unicode</li>
                    <li>• y: Sticky</li>
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
            onReset={clearAll}
            processingText="Testing regex pattern..."
            completeText="Regex testing complete!"
            errorText="Regex testing failed"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
