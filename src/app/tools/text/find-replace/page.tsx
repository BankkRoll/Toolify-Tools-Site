"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { CopyButton } from "@/components/tools/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Replace, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FindReplacePage() {
  const [inputText, setInputText] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [options, setOptions] = useState({
    caseSensitive: false,
    wholeWords: false,
    useRegex: false,
    globalReplace: true,
  });
  const [matches, setMatches] = useState<{ index: number; text: string }[]>([]);

  const findMatches = () => {
    if (!inputText || !findText) {
      setMatches([]);
      return;
    }

    try {
      let searchPattern: RegExp;

      if (options.useRegex) {
        const flags = options.caseSensitive ? "g" : "gi";
        searchPattern = new RegExp(findText, flags);
      } else {
        let pattern = options.useRegex ? findText : escapeRegExp(findText);

        if (options.wholeWords) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive ? "g" : "gi";
        searchPattern = new RegExp(pattern, flags);
      }

      const foundMatches: { index: number; text: string }[] = [];
      let match;

      while ((match = searchPattern.exec(inputText)) !== null) {
        foundMatches.push({
          index: match.index,
          text: match[0],
        });

        if (!options.globalReplace) break;
      }

      setMatches(foundMatches);
      toast.success(
        `Found ${foundMatches.length} match${foundMatches.length !== 1 ? "es" : ""}`,
      );
    } catch (error) {
      toast.error("Invalid search pattern");
      setMatches([]);
    }
  };

  const performReplace = () => {
    if (!inputText || !findText) {
      setOutputText(inputText);
      return;
    }

    try {
      let searchPattern: RegExp;

      if (options.useRegex) {
        const flags = options.caseSensitive
          ? options.globalReplace
            ? "g"
            : ""
          : options.globalReplace
            ? "gi"
            : "i";
        searchPattern = new RegExp(findText, flags);
      } else {
        let pattern = escapeRegExp(findText);

        if (options.wholeWords) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive
          ? options.globalReplace
            ? "g"
            : ""
          : options.globalReplace
            ? "gi"
            : "i";
        searchPattern = new RegExp(pattern, flags);
      }

      const result = inputText.replace(searchPattern, replaceText);
      setOutputText(result);

      const replacementCount = (inputText.match(searchPattern) || []).length;
      toast.success(
        `Made ${replacementCount} replacement${replacementCount !== 1 ? "s" : ""}`,
      );
    } catch (error) {
      toast.error("Invalid search pattern");
      setOutputText(inputText);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const reset = () => {
    setInputText("");
    setFindText("");
    setReplaceText("");
    setOutputText("");
    setMatches([]);
  };

  const highlightMatches = (
    text: string,
    matches: { index: number; text: string }[],
  ) => {
    if (matches.length === 0) return text;

    let result = "";
    let lastIndex = 0;

    matches.forEach((match, index) => {
      result += text.slice(lastIndex, match.index);
      result += `<mark class="bg-yellow-200 px-1 rounded">${match.text}</mark>`;
      lastIndex = match.index + match.text.length;
    });

    result += text.slice(lastIndex);
    return result;
  };

  return (
    <ToolLayout toolId="text-find-replace">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Text</CardTitle>
              <CardDescription>
                Enter the text you want to search and replace in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Search & Replace
                <Button variant="outline" size="icon" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="findText">Find</Label>
                <Input
                  id="findText"
                  placeholder="Text to find..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="replaceText">Replace with</Label>
                <Input
                  id="replaceText"
                  placeholder="Replacement text..."
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseSensitive"
                      checked={options.caseSensitive}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          caseSensitive: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="caseSensitive" className="text-sm">
                      Case sensitive
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wholeWords"
                      checked={options.wholeWords}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          wholeWords: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="wholeWords" className="text-sm">
                      Match whole words only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useRegex"
                      checked={options.useRegex}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          useRegex: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="useRegex" className="text-sm">
                      Use regular expressions
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="globalReplace"
                      checked={options.globalReplace}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({
                          ...prev,
                          globalReplace: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="globalReplace" className="text-sm">
                      Replace all occurrences
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={findMatches}
                  variant="outline"
                  className="flex-1 bg-transparent"
                  disabled={!findText}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find
                </Button>
                <Button
                  onClick={performReplace}
                  className="flex-1"
                  disabled={!findText}
                >
                  <Replace className="h-4 w-4 mr-2" />
                  Replace
                </Button>
              </div>

              {matches.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Search Results</span>
                    <Badge variant="secondary">{matches.length} matches</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Found {matches.length} occurrence
                    {matches.length !== 1 ? "s" : ""} of "{findText}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview with Highlights</CardTitle>
              <CardDescription>
                Original text with search matches highlighted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] p-3 bg-muted rounded-lg">
                {inputText && matches.length > 0 ? (
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatches(inputText, matches),
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {inputText || "Enter text and search to see highlights"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Result
                {outputText && (
                  <CopyButton
                    text={outputText}
                    successMessage="Result copied to clipboard"
                    variant="outline"
                    size="sm"
                  />
                )}
              </CardTitle>
              <CardDescription>
                Text after find and replace operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={outputText || inputText}
                readOnly
                className="min-h-[200px]"
                placeholder="Result will appear here after replace operation..."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  );
}
