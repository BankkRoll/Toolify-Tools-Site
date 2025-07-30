'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * HTML minifier tool for compressing HTML code
 */
export default function HtmlMinifierPage() {
  const animationsEnabled = useAnimations();
  const [inputHtml, setInputHtml] = useLocalStorage('html-minifier-input', '');
  const [minifiedHtml, setMinifiedHtml] = useState('');
  const [minifyLevel, setMinifyLevel] = useLocalStorage('html-minifier-level', 'basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [minifiedSize, setMinifiedSize] = useState(0);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; output: string; level: string; timestamp: number }>
  >('html-minifier-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Minify HTML with specified level
   */
  const minifyHtml = (html: string, level: string): string => {
    let minified = html;

    // Basic minification
    if (level === 'basic' || level === 'advanced' || level === 'extreme') {
      // Remove comments
      minified = minified.replace(/<!--[\s\S]*?-->/g, '');

      // Remove extra whitespace
      minified = minified.replace(/\s+/g, ' ');

      // Remove whitespace around tags
      minified = minified.replace(/>\s+</g, '><');

      // Remove leading/trailing whitespace
      minified = minified.trim();
    }

    // Advanced minification
    if (level === 'advanced' || level === 'extreme') {
      // Remove unnecessary quotes from attributes
      minified = minified.replace(/(\w+)="([^"]*)"([^>]*>)/g, (match, attr, value, rest) => {
        if (value.match(/^[a-zA-Z0-9_-]+$/)) {
          return `${attr}=${value}${rest}`;
        }
        return match;
      });

      // Remove empty attributes
      minified = minified.replace(/\s+\w+=""/g, '');
    }

    // Extreme minification
    if (level === 'extreme') {
      // Remove optional closing tags
      minified = minified.replace(/<\/(p|li|dt|dd|tr|td|th|thead|tbody|tfoot)>/g, '');

      // Remove optional opening tags
      minified = minified.replace(/<(tbody|thead|tfoot)>/g, '');

      // Remove DOCTYPE declaration
      minified = minified.replace(/<!DOCTYPE[^>]*>/gi, '');
    }

    return minified;
  };

  /**
   * Minify the HTML input
   */
  const minifyHtmlInput = () => {
    if (!inputHtml.trim()) {
      toast.error('Please enter HTML to minify');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const minified = minifyHtml(inputHtml, minifyLevel);
      setMinifiedHtml(minified);

      // Calculate sizes
      const original = new Blob([inputHtml]).size;
      const minifiedBlob = new Blob([minified]).size;
      setOriginalSize(original);
      setMinifiedSize(minifiedBlob);

      setIsComplete(true);

      // Add to history
      const newEntry = {
        input: inputHtml.length > 100 ? inputHtml.substring(0, 100) + '...' : inputHtml,
        output: minified.length > 100 ? minified.substring(0, 100) + '...' : minified,
        level: minifyLevel,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      const reduction = (((original - minifiedBlob) / original) * 100).toFixed(1);
      toast.success(`HTML minified successfully! Size reduced by ${reduction}%`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to minify HTML';
      setError(errorMessage);
      toast.error('Failed to minify HTML');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy minified HTML to clipboard
   */
  const copyMinifiedHtml = () => {
    navigator.clipboard.writeText(minifiedHtml);
    toast.success('Minified HTML copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputHtml('');
    setMinifiedHtml('');
    setIsComplete(false);
    setError(null);
    setOriginalSize(0);
    setMinifiedSize(0);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-html-minifier'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='minify-level'>Minification Level</Label>
            <Select value={minifyLevel} onValueChange={setMinifyLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='basic'>Basic (Remove comments & whitespace)</SelectItem>
                <SelectItem value='advanced'>
                  Advanced (Remove quotes & empty attributes)
                </SelectItem>
                <SelectItem value='extreme'>Extreme (Remove optional tags)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue='input' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='input'>Input HTML</TabsTrigger>
              <TabsTrigger value='output' disabled={!minifiedHtml}>
                Minified HTML
              </TabsTrigger>
            </TabsList>

            <TabsContent value='input' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='input-html'>HTML Code</Label>
                <Textarea
                  id='input-html'
                  value={inputHtml}
                  onChange={e => setInputHtml(e.target.value)}
                  placeholder='Enter your HTML code here...'
                  className='min-h-[300px] font-mono text-sm'
                />
              </div>

              <ActionButtons
                onGenerate={minifyHtmlInput}
                onClear={clearAll}
                generateLabel='Minify HTML'
                clearLabel='Clear All'
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value='output' className='space-y-4'>
              {minifiedHtml && (
                <>
                  <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                    <div className='text-sm'>
                      <span className='font-medium'>Original:</span> {originalSize} bytes
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>Minified:</span> {minifiedSize} bytes
                    </div>
                    <div className='text-sm'>
                      <span className='font-medium'>Reduction:</span>{' '}
                      {(((originalSize - minifiedSize) / originalSize) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='minified-html'>Minified HTML</Label>
                      <button
                        onClick={copyMinifiedHtml}
                        className='text-sm text-blue-600 hover:text-blue-800'
                      >
                        Copy
                      </button>
                    </div>
                    <Textarea
                      id='minified-html'
                      value={minifiedHtml}
                      readOnly
                      className='min-h-[300px] font-mono text-sm'
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='space-y-4'
          >
            <h3 className='text-lg font-semibold'>Recent History</h3>
            <div className='space-y-2'>
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium truncate'>{entry.input}</p>
                          <Badge variant='secondary'>{entry.level}</Badge>
                        </div>
                        <p className='text-gray-500 mt-1'>{entry.output}</p>
                        <p className='text-gray-400 text-xs mt-1'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputHtml(entry.input);
                          setMinifyLevel(entry.level);
                          toast.success('Settings restored from history');
                        }}
                        className='ml-2 text-blue-600 hover:text-blue-800'
                      >
                        Restore
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
