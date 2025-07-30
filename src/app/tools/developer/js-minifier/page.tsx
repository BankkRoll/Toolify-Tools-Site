'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * JavaScript minifier tool for reducing code size and improving performance
 */
export default function JsMinifierPage() {
  const animationsEnabled = useAnimations();
  const [inputCode, setInputCode] = useLocalStorage('js-minifier-input', '');
  const [minifiedCode, setMinifiedCode] = useState('');
  const [minificationLevel, setMinificationLevel] = useLocalStorage('js-minifier-level', 'basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    originalSize: number;
    minifiedSize: number;
    reduction: number;
  } | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{
      input: string;
      output: string;
      reduction: number;
      timestamp: number;
    }>
  >('js-minifier-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Basic JavaScript minification
   */
  const basicMinify = (code: string): string => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1') // Remove spaces around operators and punctuation
      .replace(/\s*{\s*/g, '{') // Remove spaces around braces
      .replace(/\s*}\s*/g, '}') // Remove spaces around braces
      .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
      .replace(/\s*,\s*/g, ',') // Remove spaces around commas
      .replace(/\s*=\s*/g, '=') // Remove spaces around equals
      .replace(/\s*\+\s*/g, '+') // Remove spaces around plus
      .replace(/\s*-\s*/g, '-') // Remove spaces around minus
      .replace(/\s*\*\s*/g, '*') // Remove spaces around multiply
      .replace(/\s*\/\s*/g, '/') // Remove spaces around divide
      .replace(/\s*>\s*/g, '>') // Remove spaces around greater than
      .replace(/\s*<\s*/g, '<') // Remove spaces around less than
      .replace(/\s*!\s*/g, '!') // Remove spaces around exclamation
      .replace(/\s*&\s*/g, '&') // Remove spaces around ampersand
      .replace(/\s*\|\s*/g, '|') // Remove spaces around pipe
      .replace(/\s*\(\s*/g, '(') // Remove spaces around parentheses
      .replace(/\s*\)\s*/g, ')') // Remove spaces around parentheses
      .trim();
  };

  /**
   * Advanced JavaScript minification with variable name shortening
   */
  const advancedMinify = (code: string): string => {
    let minified = basicMinify(code);

    // Simple variable name shortening (basic implementation)
    const variableMap = new Map<string, string>();
    let varCounter = 0;

    // Find variable declarations and create short names
    const varRegex = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      if (!variableMap.has(varName) && varName.length > 2) {
        variableMap.set(varName, `_${varCounter++}`);
      }
    }

    // Replace variable names (basic implementation)
    variableMap.forEach((shortName, originalName) => {
      const regex = new RegExp(`\\b${originalName}\\b`, 'g');
      minified = minified.replace(regex, shortName);
    });

    return minified;
  };

  /**
   * Extreme JavaScript minification with aggressive optimizations
   */
  const extremeMinify = (code: string): string => {
    let minified = advancedMinify(code);

    // Remove unnecessary semicolons at the end
    minified = minified.replace(/;+$/, '');

    // Remove unnecessary parentheses in simple expressions
    minified = minified.replace(/\(([a-zA-Z0-9_$]+)\)/g, '$1');

    // Combine consecutive operators
    minified = minified.replace(/\+{2,}/g, '++');
    minified = minified.replace(/-{2,}/g, '--');

    return minified;
  };

  /**
   * Minify JavaScript code
   */
  const minifyCode = () => {
    if (!inputCode.trim()) {
      toast.error('Please enter JavaScript code to minify');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result = '';

      switch (minificationLevel) {
        case 'basic':
          result = basicMinify(inputCode);
          break;
        case 'advanced':
          result = advancedMinify(inputCode);
          break;
        case 'extreme':
          result = extremeMinify(inputCode);
          break;
        default:
          result = basicMinify(inputCode);
      }

      setMinifiedCode(result);

      // Calculate stats
      const originalSize = inputCode.length;
      const minifiedSize = result.length;
      const reduction = Math.round(((originalSize - minifiedSize) / originalSize) * 100);

      setStats({ originalSize, minifiedSize, reduction });
      setIsComplete(true);

      // Add to history
      const newEntry = {
        input: inputCode.length > 50 ? inputCode.substring(0, 50) + '...' : inputCode,
        output: result.length > 50 ? result.substring(0, 50) + '...' : result,
        reduction,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`JavaScript minified successfully! ${reduction}% size reduction`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to minify JavaScript';
      setError(errorMessage);
      toast.error('Failed to minify JavaScript');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy minified code to clipboard
   */
  const copyMinifiedCode = () => {
    navigator.clipboard.writeText(minifiedCode);
    toast.success('Minified code copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputCode('');
    setMinifiedCode('');
    setStats(null);
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-js-minifier'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='input-code'>JavaScript Code</Label>
            <textarea
              id='input-code'
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              placeholder="// Enter your JavaScript code here...
function example() {
  var message = 'Hello, World!';
  console.log(message);
  return message;
}"
              className='w-full min-h-[200px] p-3 border rounded-md resize-none font-mono text-sm'
              rows={10}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='minification-level'>Minification Level</Label>
            <Select value={minificationLevel} onValueChange={setMinificationLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='basic'>Basic (Remove comments & whitespace)</SelectItem>
                <SelectItem value='advanced'>Advanced (Basic + variable shortening)</SelectItem>
                <SelectItem value='extreme'>
                  Extreme (Advanced + aggressive optimizations)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ActionButtons
            onGenerate={minifyCode}
            onClear={clearAll}
            generateLabel='Minify Code'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {minifiedCode && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='space-y-4'
          >
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Minification Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-3 gap-4 text-center'>
                    <div>
                      <div className='text-2xl font-bold text-blue-600'>{stats.originalSize}</div>
                      <div className='text-sm text-gray-500'>Original Size (chars)</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-green-600'>{stats.minifiedSize}</div>
                      <div className='text-sm text-gray-500'>Minified Size (chars)</div>
                    </div>
                    <div>
                      <div className='text-2xl font-bold text-purple-600'>{stats.reduction}%</div>
                      <div className='text-sm text-gray-500'>Size Reduction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Minified Code
                  <button
                    onClick={copyMinifiedCode}
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='p-3 bg-gray-100 rounded border'>
                  <pre className='text-sm font-mono whitespace-pre-wrap break-all'>
                    {minifiedCode}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-4'
          >
            <h3 className='text-lg font-semibold'>Recent History</h3>
            <div className='space-y-2'>
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{entry.input}</p>
                        <p className='text-gray-500'>
                          {entry.reduction}% reduction •{' '}
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant='outline' className='ml-2'>
                        {entry.reduction}%
                      </Badge>
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
