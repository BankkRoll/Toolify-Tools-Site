"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
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
import { Clock, FileText, Target } from "lucide-react";
import { useMemo, useState } from "react";

export default function WordCounterPage() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
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
  }, [text]);

  const getReadabilityScore = (avgWordsPerSentence: number) => {
    if (avgWordsPerSentence <= 15)
      return { score: "Easy", color: "bg-green-500" };
    if (avgWordsPerSentence <= 20)
      return { score: "Moderate", color: "bg-yellow-500" };
    return { score: "Difficult", color: "bg-red-500" };
  };

  const readability = getReadabilityScore(stats.averageWordsPerSentence);

  const clearText = () => {
    setText("");
  };

  const getStatsText = () => {
    return `Words: ${stats.words} | Characters: ${stats.characters} | Sentences: ${stats.sentences} | Paragraphs: ${stats.paragraphs}`;
  };

  return (
    <ToolLayout toolId="text-word-counter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
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
        </div>

        <div className="space-y-6">
          {/* Basic Stats */}
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
                  <div className="text-sm text-muted-foreground">Sentences</div>
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

          {/* Reading Time */}
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

          {/* Readability */}
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
                <Badge className={readability.color}>{readability.score}</Badge>
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

          {/* Top Words */}
          {stats.topWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Most Frequent Words</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topWords.map(([word, count], index) => (
                    <div
                      key={word}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium">{word}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
