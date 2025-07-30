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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { Clock, FileText, Target } from "lucide-react";
import { m, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";

/**
 * Interface for text statistics
 */
interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTime: number;
  speakingTime: number;
  topWords: [string, number][];
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
}

/**
 * Text word counter tool page
 */
export default function WordCounterPage() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>(
    "text-word-counter-history",
    [],
  );
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const statsSectionRef = useRef(null);
  const readingSectionRef = useRef(null);
  const readabilitySectionRef = useRef(null);
  const topWordsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const statsSectionInView = useInView(statsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const readingSectionInView = useInView(readingSectionRef, {
    once: true,
    amount: 0.2,
  });
  const readabilitySectionInView = useInView(readabilitySectionRef, {
    once: true,
    amount: 0.2,
  });
  const topWordsSectionInView = useInView(topWordsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Calculates text statistics using useMemo for performance
   */
  const stats = useMemo((): TextStats => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim()
      ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const paragraphs = text.trim()
      ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
      : 0;
    const lines = text ? text.split("\n").length : 0;

    // Reading time (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);

    // Speaking time (average 150 words per minute)
    const speakingTime = Math.ceil(words / 150);

    // Most frequent words
    const wordFrequency: { [key: string]: number } = {};
    if (text.trim()) {
      const cleanWords = text.toLowerCase().match(/\b\w+\b/g) || [];
      cleanWords.forEach((word) => {
        if (word.length > 2) {
          // Ignore very short words
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    }

    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Save to history when we have meaningful text
    if (text.trim() && words > 0) {
      setHistory(
        [
          `Analyzed text: ${words} words, ${characters} chars`,
          ...history,
        ].slice(0, 10),
      );
    }

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime,
      speakingTime,
      topWords,
      averageWordsPerSentence:
        sentences > 0 ? Math.round(words / sentences) : 0,
      averageSentencesPerParagraph:
        paragraphs > 0 ? Math.round(sentences / paragraphs) : 0,
    };
  }, [text, history]);

  /**
   * Gets readability score based on average words per sentence
   */
  const getReadabilityScore = (avgWordsPerSentence: number) => {
    if (avgWordsPerSentence <= 15)
      return { score: "Easy", color: "bg-green-500" };
    if (avgWordsPerSentence <= 20)
      return { score: "Moderate", color: "bg-yellow-500" };
    return { score: "Difficult", color: "bg-red-500" };
  };

  const readability = getReadabilityScore(stats.averageWordsPerSentence);

  /**
   * Clears all text
   */
  const clearText = () => {
    setText("");
    setError(null);
    setIsComplete(false);
  };

  /**
   * Gets formatted statistics text
   */
  const getStatsText = () => {
    return `Words: ${stats.words} | Characters: ${stats.characters} | Sentences: ${stats.sentences} | Paragraphs: ${stats.paragraphs}`;
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
    <ToolLayout toolId="text-word-counter">
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
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Input
              </CardTitle>
              <CardDescription>Type or paste your text here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Start typing or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[400px] resize-none"
              />

              <ActionButtons
                copyText={text}
                copySuccessMessage="Text copied to clipboard"
                onClear={clearText}
                clearLabel="Clear Text"
                variant="outline"
                size="sm"
                disabled={!text}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        <div className="space-y-6">
          <MotionDiv
            ref={statsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? statsSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Text Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.words}
                    </div>
                    <div className="text-sm text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.characters}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Characters
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.sentences}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sentences
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.paragraphs}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Paragraphs
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Characters (no spaces)</span>
                    <span className="font-medium">
                      {stats.charactersNoSpaces}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lines</span>
                    <span className="font-medium">{stats.lines}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv
            ref={readingSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? readingSectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reading Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reading</span>
                    <Badge variant="outline">{stats.readingTime} min</Badge>
                  </div>
                  <Progress
                    value={Math.min((stats.words / 1000) * 100, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on 200 words/minute
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Speaking</span>
                    <Badge variant="outline">{stats.speakingTime} min</Badge>
                  </div>
                  <Progress
                    value={Math.min((stats.words / 1000) * 100, 100)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on 150 words/minute
                  </p>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv
            ref={readabilitySectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? "hidden" : undefined}
            animate={
              animationsEnabled
                ? readabilitySectionInView
                  ? "visible"
                  : "hidden"
                : undefined
            }
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Readability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Difficulty Level</span>
                  <Badge className={readability.color}>
                    {readability.score}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg. words per sentence</span>
                    <span className="font-medium">
                      {stats.averageWordsPerSentence}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg. sentences per paragraph</span>
                    <span className="font-medium">
                      {stats.averageSentencesPerParagraph}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          {stats.topWords.length > 0 && (
            <MotionDiv
              ref={topWordsSectionRef}
              variants={animationsEnabled ? cardVariants : undefined}
              initial={animationsEnabled ? "hidden" : undefined}
              animate={
                animationsEnabled
                  ? topWordsSectionInView
                    ? "visible"
                    : "hidden"
                  : undefined
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Most Frequent Words</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topWords.map(([word, count], index) => (
                      <MotionDiv
                        key={word}
                        className="flex items-center justify-between"
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium">{word}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </MotionDiv>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </div>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={false}
            isComplete={isComplete}
            error={error}
            onReset={clearText}
            processingText=""
            completeText="Text analysis complete!"
            errorText="Error analyzing text"
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
