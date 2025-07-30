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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * HTML entity encoder/decoder tool for converting special characters
 */
export default function HtmlEntityPage() {
  const animationsEnabled = useAnimations();
  const [inputText, setInputText] = useLocalStorage('html-entity-input', '');
  const [operation, setOperation] = useLocalStorage('html-entity-operation', 'encode');
  const [entityType, setEntityType] = useLocalStorage('html-entity-type', 'named');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; operation: string; type: string; timestamp: number }>
  >('html-entity-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  // Common HTML entities
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '©': '&copy;',
    '®': '&reg;',
    '™': '&trade;',
    '€': '&euro;',
    '£': '&pound;',
    '¥': '&yen;',
    '¢': '&cent;',
    '§': '&sect;',
    '¶': '&para;',
    '†': '&dagger;',
    '‡': '&Dagger;',
    '–': '&ndash;',
    '—': '&mdash;',
    '…': '&hellip;',
    '°': '&deg;',
    '±': '&plusmn;',
    '×': '&times;',
    '÷': '&divide;',
    '¼': '&frac14;',
    '½': '&frac12;',
    '¾': '&frac34;',
    á: '&aacute;',
    é: '&eacute;',
    í: '&iacute;',
    ó: '&oacute;',
    ú: '&uacute;',
    ñ: '&ntilde;',
    ü: '&uuml;',
    ç: '&ccedil;',
  };

  // Reverse mapping for decoding
  const reverseEntities: Record<string, string> = Object.fromEntries(
    Object.entries(htmlEntities).map(([key, value]) => [value, key]),
  );

  /**
   * Encode text to HTML entities
   */
  const encodeText = (text: string, type: string): string => {
    if (type === 'named') {
      return text.replace(/[&<>"'©®™€£¥¢§¶†‡–—…°±×÷¼½¾áéíóúñüç]/g, char => {
        return htmlEntities[char] || char;
      });
    } else if (type === 'decimal') {
      return text.replace(/[&<>"'©®™€£¥¢§¶†‡–—…°±×÷¼½¾áéíóúñüç]/g, char => {
        return `&#${char.charCodeAt(0)};`;
      });
    } else if (type === 'hex') {
      return text.replace(/[&<>"'©®™€£¥¢§¶†‡–—…°±×÷¼½¾áéíóúñüç]/g, char => {
        return `&#x${char.charCodeAt(0).toString(16)};`;
      });
    }
    return text;
  };

  /**
   * Decode HTML entities to text
   */
  const decodeText = (text: string): string => {
    // First decode named entities
    let decoded = text.replace(/&[a-zA-Z]+;/g, entity => {
      return reverseEntities[entity] || entity;
    });

    // Then decode decimal entities
    decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code));
    });

    // Finally decode hex entities
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });

    return decoded;
  };

  /**
   * Process text based on operation
   */
  const processText = () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let processed = '';

      if (operation === 'encode') {
        processed = encodeText(inputText, entityType);
      } else {
        processed = decodeText(inputText);
      }

      setResult(processed);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        input: inputText.length > 100 ? inputText.substring(0, 100) + '...' : inputText,
        operation,
        type: entityType,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`Text ${operation}d successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process text';
      setError(errorMessage);
      toast.error('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy result to clipboard
   */
  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success('Result copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputText('');
    setResult('');
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-html-entity'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='operation'>Operation</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='encode'>Encode</SelectItem>
                  <SelectItem value='decode'>Decode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operation === 'encode' && (
              <div className='space-y-2'>
                <Label htmlFor='entity-type'>Entity Type</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='named'>Named (&amp;)</SelectItem>
                    <SelectItem value='decimal'>Decimal (&#38;)</SelectItem>
                    <SelectItem value='hex'>Hexadecimal (&#x26;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Tabs defaultValue='input' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='input'>Input Text</TabsTrigger>
              <TabsTrigger value='output' disabled={!result}>
                Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value='input' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='input-text'>Text</Label>
                <Textarea
                  id='input-text'
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={
                    operation === 'encode'
                      ? 'Enter text to encode...'
                      : 'Enter HTML entities to decode...'
                  }
                  className='min-h-[200px] font-mono text-sm'
                />
              </div>

              <ActionButtons
                onGenerate={processText}
                onClear={clearAll}
                generateLabel={operation === 'encode' ? 'Encode Text' : 'Decode Entities'}
                clearLabel='Clear All'
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value='output' className='space-y-4'>
              {result && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Result</Label>
                    <button
                      onClick={copyResult}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      Copy
                    </button>
                  </div>
                  <Textarea value={result} readOnly className='min-h-[200px] font-mono text-sm' />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5, delay: 0.1 }}
          className='space-y-4'
        >
          <Card>
            <CardHeader>
              <CardTitle>Common HTML Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
                {Object.entries(htmlEntities)
                  .slice(0, 20)
                  .map(([char, entity]) => (
                    <div
                      key={char}
                      className='flex items-center justify-between p-2 bg-gray-50 rounded'
                    >
                      <span className='font-mono'>{char}</span>
                      <Badge variant='outline' className='text-xs'>
                        {entity}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

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
                        <div className='flex items-center gap-2'>
                          <p className='font-medium truncate'>{entry.input}</p>
                          <Badge variant='secondary'>{entry.operation}</Badge>
                          {entry.operation === 'encode' && (
                            <Badge variant='outline'>{entry.type}</Badge>
                          )}
                        </div>
                        <p className='text-gray-500'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputText(entry.input);
                          setOperation(entry.operation);
                          setEntityType(entry.type);
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
