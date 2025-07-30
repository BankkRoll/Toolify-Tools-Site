'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Search } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Interface for search options
 */
interface SearchOptions {
  caseSensitive: boolean;
  wholeWords: boolean;
  useRegex: boolean;
  globalReplace: boolean;
}

/**
 * Interface for search match
 */
interface SearchMatch {
  index: number;
  text: string;
}

/**
 * Text find and replace tool page
 */
export default function FindReplacePage() {
  const [inputText, setInputText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWords: false,
    useRegex: false,
    globalReplace: true,
  });
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const [history, setHistory] = useLocalStorage<string[]>('text-find-replace-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const searchSectionRef = useRef(null);
  const previewSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const inputSectionInView = useInView(inputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const searchSectionInView = useInView(searchSectionRef, {
    once: true,
    amount: 0.2,
  });
  const previewSectionInView = useInView(previewSectionRef, {
    once: true,
    amount: 0.2,
  });
  const resultsSectionInView = useInView(resultsSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Finds matches in the input text
   */
  const findMatches = () => {
    if (!inputText || !findText) {
      setMatches([]);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let searchPattern: RegExp;

      if (options.useRegex) {
        const flags = options.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(findText, flags);
      } else {
        let pattern = options.useRegex ? findText : escapeRegExp(findText);

        if (options.wholeWords) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';
        searchPattern = new RegExp(pattern, flags);
      }

      const foundMatches: SearchMatch[] = [];
      let match;

      while ((match = searchPattern.exec(inputText)) !== null) {
        foundMatches.push({
          index: match.index,
          text: match[0],
        });

        if (!options.globalReplace) break;
      }

      setMatches(foundMatches);
      setIsComplete(true);
      setHistory(
        [`Found ${foundMatches.length} matches for "${findText}"`, ...history].slice(0, 10),
      );
      toast.success(`Found ${foundMatches.length} match${foundMatches.length !== 1 ? 'es' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid search pattern';
      setError(errorMessage);
      toast.error(errorMessage);
      setMatches([]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Performs find and replace operation
   */
  const performReplace = () => {
    if (!inputText || !findText) {
      setOutputText(inputText);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let searchPattern: RegExp;

      if (options.useRegex) {
        const flags = options.caseSensitive
          ? options.globalReplace
            ? 'g'
            : ''
          : options.globalReplace
            ? 'gi'
            : 'i';
        searchPattern = new RegExp(findText, flags);
      } else {
        let pattern = escapeRegExp(findText);

        if (options.wholeWords) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = options.caseSensitive
          ? options.globalReplace
            ? 'g'
            : ''
          : options.globalReplace
            ? 'gi'
            : 'i';
        searchPattern = new RegExp(pattern, flags);
      }

      const result = inputText.replace(searchPattern, replaceText);
      setOutputText(result);
      setIsComplete(true);

      const replacementCount = (inputText.match(searchPattern) || []).length;
      setHistory(
        [`Replaced ${replacementCount} occurrences of "${findText}"`, ...history].slice(0, 10),
      );
      toast.success(`Made ${replacementCount} replacement${replacementCount !== 1 ? 's' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid search pattern';
      setError(errorMessage);
      toast.error(errorMessage);
      setOutputText(inputText);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Escapes special regex characters
   */
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  /**
   * Resets all state
   */
  const reset = () => {
    setInputText('');
    setFindText('');
    setReplaceText('');
    setOutputText('');
    setMatches([]);
    setError(null);
    setIsComplete(false);
  };

  /**
   * Highlights matches in text
   */
  const highlightMatches = (text: string, matches: SearchMatch[]) => {
    if (matches.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    matches.forEach(match => {
      result += text.slice(lastIndex, match.index);
      result += `<mark class="bg-yellow-200 px-1 rounded">${match.text}</mark>`;
      lastIndex = match.index + match.text.length;
    });

    result += text.slice(lastIndex);
    return result;
  };

  /**
   * Clears all data and resets state
   */
  const clearAll = () => {
    reset();
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
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='text-find-replace'>
      <MotionDiv
        ref={containerRef}
        className='space-y-6'
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (containerInView ? 'visible' : 'hidden') : undefined}
      >
        <MotionDiv
          ref={inputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (inputSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5' />
                Input Text
              </CardTitle>
              <CardDescription>Enter the text you want to search and replace in</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder='Enter your text here...'
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className='min-h-[300px]'
              />
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={searchSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (searchSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                Search & Replace
                <ActionButtons onReset={reset} resetLabel='Reset' variant='outline' size='sm' />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='findText'>Find</Label>
                <Input
                  id='findText'
                  placeholder='Text to find...'
                  value={findText}
                  onChange={e => setFindText(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='replaceText'>Replace with</Label>
                <Input
                  id='replaceText'
                  placeholder='Replacement text...'
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                />
              </div>

              <div className='space-y-3'>
                <Label>Options</Label>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='caseSensitive'
                      checked={options.caseSensitive}
                      onCheckedChange={checked =>
                        setOptions(prev => ({
                          ...prev,
                          caseSensitive: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor='caseSensitive' className='text-sm'>
                      Case sensitive
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='wholeWords'
                      checked={options.wholeWords}
                      onCheckedChange={checked =>
                        setOptions(prev => ({
                          ...prev,
                          wholeWords: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor='wholeWords' className='text-sm'>
                      Match whole words only
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='useRegex'
                      checked={options.useRegex}
                      onCheckedChange={checked =>
                        setOptions(prev => ({
                          ...prev,
                          useRegex: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor='useRegex' className='text-sm'>
                      Use regular expressions
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='globalReplace'
                      checked={options.globalReplace}
                      onCheckedChange={checked =>
                        setOptions(prev => ({
                          ...prev,
                          globalReplace: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor='globalReplace' className='text-sm'>
                      Replace all occurrences
                    </Label>
                  </div>
                </div>
              </div>

              <div className='flex gap-2'>
                <ActionButtons
                  onGenerate={findMatches}
                  generateLabel='Find'
                  variant='outline'
                  size='sm'
                  disabled={!findText || isProcessing}
                  isGenerating={isProcessing}
                />
                <ActionButtons
                  onGenerate={performReplace}
                  generateLabel='Replace'
                  variant='outline'
                  size='sm'
                  disabled={!findText || isProcessing}
                  isGenerating={isProcessing}
                />
              </div>

              {matches.length > 0 && (
                <div className='p-3 bg-muted rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium'>Search Results</span>
                    <Badge variant='secondary'>{matches.length} matches</Badge>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Found {matches.length} occurrence
                    {matches.length !== 1 ? 's' : ''} of "{findText}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <MotionDiv
            ref={previewSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (previewSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle>Preview with Highlights</CardTitle>
                <CardDescription>Original text with search matches highlighted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='min-h-[200px] p-3 bg-muted rounded-lg'>
                  {inputText && matches.length > 0 ? (
                    <div
                      className='text-sm whitespace-pre-wrap'
                      dangerouslySetInnerHTML={{
                        __html: highlightMatches(inputText, matches),
                      }}
                    />
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      {inputText || 'Enter text and search to see highlights'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv
            ref={resultsSectionRef}
            variants={animationsEnabled ? cardVariants : undefined}
            initial={animationsEnabled ? 'hidden' : undefined}
            animate={animationsEnabled ? (resultsSectionInView ? 'visible' : 'hidden') : undefined}
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Result
                  {outputText && (
                    <ActionButtons copyText={outputText} variant='outline' size='sm' />
                  )}
                </CardTitle>
                <CardDescription>Text after find and replace operation</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={outputText || inputText}
                  readOnly
                  className='min-h-[200px]'
                  placeholder='Result will appear here after replace operation...'
                />
              </CardContent>
            </Card>
          </MotionDiv>
        </div>

        <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
          <ProcessingStatus
            isProcessing={isProcessing}
            isComplete={isComplete}
            error={error}
            onReset={clearAll}
            processingText='Processing search and replace...'
            completeText='Operation completed successfully!'
            errorText='Failed to process search and replace'
          />
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
