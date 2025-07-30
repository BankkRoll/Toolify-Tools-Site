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
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

type GenerationType = "words" | "sentences" | "paragraphs";

export default function LoremGeneratorPage() {
  const [generationType, setGenerationType] =
    useState<GenerationType>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [generatedText, setGeneratedText] = useState("");

  const generateRandomWord = () => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  const generateSentence = (
    wordCount: number = Math.floor(Math.random() * 10) + 5,
  ) => {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(generateRandomWord());
    }
    return words.join(" ") + ".";
  };

  const generateParagraph = (
    sentenceCount: number = Math.floor(Math.random() * 4) + 3,
  ) => {
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(" ");
  };

  const generateLorem = () => {
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
    toast.success("Lorem ipsum text generated successfully!");
  };

  const clearGenerated = () => {
    setGeneratedText("");
  };

  const getDownloadFilename = () => {
    return `lorem-ipsum-${generationType}-${count}.txt`;
  };

  return (
    <ToolLayout toolId="text-lorem">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
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

            <Button onClick={generateLorem} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Lorem Ipsum
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Text</CardTitle>
            <CardDescription>Your Lorem Ipsum placeholder text</CardDescription>
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
      </div>

      {/* Features */}
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
    </ToolLayout>
  );
}
