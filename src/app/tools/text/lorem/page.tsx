"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Lorem ipsum words array
 */
const loremWords = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
];

/**
 * Type for generation options
 */
type GenerationType = "words" | "sentences" | "paragraphs";

/**
 * Lorem ipsum generator tool page
 */
export default function LoremGeneratorPage() {
  const [generationType, setGenerationType] =
    useState<GenerationType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [generatedText, setGeneratedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "text-lorem-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const configSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const featuresSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const configSectionInView = useInView(configSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const featuresSectionInView = useInView(featuresSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Generates a random word from the lorem words array
   */
  const generateRandomWord = () => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  /**
   * Generates a sentence with random word count
   */
  const generateSentence = (
    wordCount: number = Math.floor(Math.random() * 10) + 5,
  ) => {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(generateRandomWord());
    }
    return words.join(" ") + ".";
  };

  /**
   * Generates a paragraph with random sentence count
   */
  const generateParagraph = (
    sentenceCount: number = Math.floor(Math.random() * 4) + 3,
  ) => {
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(" ");
  };

  /**
   * Generates lorem ipsum text based on settings
   */
  const generateLorem = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result = "";

      switch (generationType) {
        case "words":
          const words = [];
          for (let i = 0; i < count; i++) {
            words.push(generateRandomWord());
          }
          result = words.join(" ");
          break;

        case "sentences":
          const sentences = [];
          for (let i = 0; i < count; i++) {
            sentences.push(generateSentence());
          }
          result = sentences.join(" ");
          break;

        case "paragraphs":
          const paragraphs = [];
          for (let i = 0; i < count; i++) {
            paragraphs.push(generateParagraph());
          }
          result = paragraphs.join("\n\n");
          break;
      }

      if (startWithLorem && generationType !== "words") {
        if (generationType === "sentences") {
          result =
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
            result.substring(result.indexOf(".") + 2);
        } else if (generationType === "paragraphs") {
          result =
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
            result.substring(result.indexOf(".") + 2);
        }
      }

      // Capitalize first letter
      result = result.charAt(0).toUpperCase() + result.slice(1);

      setGeneratedText(result);
      setIsComplete(true);
      setHistory(
        [`Generated ${count} ${generationType}`, ...history].slice(0, 10),
      );
      toast.success("Lorem ipsum text generated successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate lorem ipsum text";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clears generated text
   */
  const clearGenerated = () => {
    setGeneratedText("");
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets download filename for generated text
   */
  const getDownloadFilename = () => {
    return `lorem-ipsum-${generationType}-${count}.txt`;
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
    <ToolLayout toolId="text-lorem">
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
            ref={configSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? configSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Customize your Lorem Ipsum generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Generation Type</Label>
                  <Select
                    value={generationType}
                    onValueChange={(value: GenerationType) =>
                      setGenerationType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="words">Words</SelectItem>
                      <SelectItem value="sentences">Sentences</SelectItem>
                      <SelectItem value="paragraphs">Paragraphs</SelectItem>
                    </SelectContent>
                  </Select>
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
                          Math.min(100, Number.parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="start-lorem"
                    checked={startWithLorem}
                    onCheckedChange={setStartWithLorem}
                  />
                  <Label htmlFor="start-lorem">Start with "Lorem ipsum"</Label>
                </div>

                <ActionButtons
                  onGenerate={generateLorem}
                  generateLabel="Generate Lorem Ipsum"
                  onReset={clearGenerated}
                  resetLabel="Clear"
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
                <CardTitle>Generated Text</CardTitle>
                <CardDescription>
                  Your Lorem Ipsum placeholder text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={generatedText}
                  readOnly
                  placeholder="Generated Lorem Ipsum text will appear here..."
                  className="min-h-[300px] font-mono text-sm"
                />

                <ActionButtons
                  copyText={generatedText}
                  copySuccessMessage="Lorem ipsum text copied to clipboard"
                  downloadData={generatedText}
                  downloadFilename={getDownloadFilename()}
                  downloadMimeType="text/plain"
                  onClear={clearGenerated}
                  clearLabel="Clear"
                  variant="outline"
                  size="sm"
                  disabled={!generatedText}
                />
              </CardContent>
            </Card>
          </MotionDiv>
        </div>

        <MotionDiv
          ref={featuresSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? "hidden" : undefined}
          animate={
            animationsEnabled
              ? featuresSectionInView
                ? "visible"
                : "hidden"
              : undefined
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Multiple Types</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate words, sentences, or paragraphs
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Customizable Count</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose exactly how much text you need
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Classic Start</h4>
                  <p className="text-sm text-muted-foreground">
                    Option to start with traditional "Lorem ipsum"
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Easy Copy</h4>
                  <p className="text-sm text-muted-foreground">
                    One-click copying to clipboard
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Download Option</h4>
                  <p className="text-sm text-muted-foreground">
                    Save generated text as a file
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Instant Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate new text instantly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearGenerated}
            processingText="Generating lorem ipsum text..."
            completeText="Lorem ipsum text generated successfully!"
            errorText="Failed to generate lorem ipsum text"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
