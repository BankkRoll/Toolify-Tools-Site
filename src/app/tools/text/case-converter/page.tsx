'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { Type } from 'lucide-react';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Text case converter tool page
 */
export default function CaseConverterPage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const [history, setHistory] = useLocalStorage<string[]>('text-case-converter-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const inputSectionRef = useRef(null);
  const outputSectionRef = useRef(null);

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

  /**
   * Converts text to different cases
   */
  const convertText = () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to convert');
      return;
    }

    const converted = inputText
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    setOutputText(converted);
    setHistory([`Text converted: ${inputText.substring(0, 20)}...`, ...history].slice(0, 10));
    toast.success('Text converted successfully');
  };

  /**
   * Clears all text
   */
  const clearAll = () => {
    setInputText('');
    setOutputText('');
  };

  /**
   * Gets word count of text
   */
  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  /**
   * Gets character count of text
   */
  const getCharCount = (text: string) => {
    return text.length;
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
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='text-case-converter'>
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
                <Type className='h-5 w-5' />
                Text Input
              </CardTitle>
              <CardDescription>Enter text to convert to different cases</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='input'>Input Text</Label>
                <Textarea
                  id='input'
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder='Enter text to convert...'
                  className='min-h-[120px]'
                />
                <div className='flex justify-between text-sm text-muted-foreground'>
                  <span>{getWordCount(inputText)} words</span>
                  <span>{getCharCount(inputText)} characters</span>
                </div>
              </div>

              <ActionButtons
                onGenerate={convertText}
                generateLabel='Convert to Title Case'
                onReset={clearAll}
                resetLabel='Clear All'
                variant='outline'
                size='sm'
                disabled={!inputText.trim()}
              />
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv
          ref={outputSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (outputSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle>Converted Text</CardTitle>
              <CardDescription>Different case variations of your text</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='title' className='w-full'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='title'>Title Case</TabsTrigger>
                  <TabsTrigger value='upper'>UPPERCASE</TabsTrigger>
                  <TabsTrigger value='lower'>lowercase</TabsTrigger>
                  <TabsTrigger value='camel'>camelCase</TabsTrigger>
                </TabsList>

                <TabsContent value='title' className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Title Case</Label>
                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='font-medium'>
                        {inputText
                          .split(' ')
                          .map(word => {
                            if (word.length === 0) return word;
                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                          })
                          .join(' ')}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='upper' className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>UPPERCASE</Label>
                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='font-medium'>{inputText.toUpperCase()}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='lower' className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>lowercase</Label>
                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='font-medium'>{inputText.toLowerCase()}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='camel' className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>camelCase</Label>
                    <div className='p-3 bg-muted rounded-lg'>
                      <p className='font-medium'>
                        {inputText
                          .split(' ')
                          .map((word, index) => {
                            if (word.length === 0) return word;
                            if (index === 0) {
                              return word.toLowerCase();
                            }
                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                          })
                          .join('')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {outputText && (
                <MotionDiv
                  className='space-y-2'
                  initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
                  animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={animationsEnabled ? { duration: 0.3 } : undefined}
                >
                  <Label>Converted Output</Label>
                  <div className='p-3 bg-muted rounded-lg'>
                    <p className='font-medium'>{outputText}</p>
                  </div>
                  <ActionButtons copyText={outputText} variant='outline' size='sm' />
                </MotionDiv>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
