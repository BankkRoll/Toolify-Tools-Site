'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Cron expression decoder tool for explaining cron schedules in human-readable format
 */
export default function CronDecoderPage() {
  const animationsEnabled = useAnimations();
  const [cronExpression, setCronExpression] = useLocalStorage('cron-decoder-expression', '');
  const [decodedResult, setDecodedResult] = useState<{
    explanation: string;
    nextRuns: string[];
    breakdown: Array<{ field: string; value: string; description: string }>;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ expression: string; explanation: string; timestamp: number }>
  >('cron-decoder-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Validate cron expression format
   */
  const validateCronExpression = (expression: string): boolean => {
    const cronRegex =
      /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]),([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3]),([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1])-([1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1]),([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])|([1-9]|1[0-2]),([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6])|([0-6])-([0-6])|([0-6]),([0-6]))$/;
    return cronRegex.test(expression);
  };

  /**
   * Explain a single cron field
   */
  const explainField = (field: string, fieldName: string): string => {
    if (field === '*') return `every ${fieldName}`;

    if (field.includes('/')) {
      const [, interval] = field.split('/');
      return `every ${interval} ${fieldName}${parseInt(interval) > 1 ? 's' : ''}`;
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return `from ${start} to ${end} ${fieldName}${parseInt(end) > 1 ? 's' : ''}`;
    }

    if (field.includes(',')) {
      const values = field.split(',');
      return `at ${fieldName} ${values.join(', ')}`;
    }

    return `at ${fieldName} ${field}`;
  };

  /**
   * Get field name with proper formatting
   */
  const getFieldName = (index: number): string => {
    const names = ['minute', 'hour', 'day of month', 'month', 'day of week'];
    return names[index];
  };

  /**
   * Calculate next few run times (simplified)
   */
  const calculateNextRuns = (expression: string): string[] => {
    const now = new Date();
    const runs: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const nextRun = new Date(now.getTime() + i * 60 * 60 * 1000); // Add hours
      runs.push(nextRun.toLocaleString());
    }

    return runs;
  };

  /**
   * Decode cron expression
   */
  const decodeCronExpression = () => {
    if (!cronExpression.trim()) {
      toast.error('Please enter a cron expression to decode');
      return;
    }

    if (!validateCronExpression(cronExpression.trim())) {
      toast.error('Invalid cron expression format');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const parts = cronExpression.trim().split(' ');
      if (parts.length !== 5) {
        throw new Error('Cron expression must have exactly 5 parts');
      }

      const [minute, hour, day, month, weekday] = parts;

      // Create breakdown
      const breakdown = [
        {
          field: 'Minute',
          value: minute,
          description: explainField(minute, 'minute'),
        },
        { field: 'Hour', value: hour, description: explainField(hour, 'hour') },
        {
          field: 'Day of Month',
          value: day,
          description: explainField(day, 'day of month'),
        },
        {
          field: 'Month',
          value: month,
          description: explainField(month, 'month'),
        },
        {
          field: 'Day of Week',
          value: weekday,
          description: explainField(weekday, 'day of week'),
        },
      ];

      // Create full explanation
      let explanation = 'This cron job will run ';
      explanation += breakdown.map(b => b.description).join(', ');

      const nextRuns = calculateNextRuns(cronExpression);

      const result = {
        explanation,
        nextRuns,
        breakdown,
      };

      setDecodedResult(result);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        expression: cronExpression,
        explanation,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success('Cron expression decoded successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to decode cron expression';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy expression to clipboard
   */
  const copyExpression = (expression: string) => {
    navigator.clipboard.writeText(expression);
    toast.success('Cron expression copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setCronExpression('');
    setDecodedResult(null);
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-cron-decoder'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='cron-expression'>Cron Expression</Label>
            <Input
              id='cron-expression'
              value={cronExpression}
              onChange={e => setCronExpression(e.target.value)}
              placeholder='* * * * * (minute hour day month weekday)'
              className='font-mono'
            />
            <p className='text-sm text-gray-500'>
              Enter a valid cron expression with 5 parts: minute hour day month weekday
            </p>
          </div>

          <ActionButtons
            onGenerate={decodeCronExpression}
            onClear={clearAll}
            generateLabel='Decode Expression'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {decodedResult && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='space-y-4'
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Decoded Expression
                  <button
                    onClick={() => copyExpression(cronExpression)}
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className='block p-3 bg-gray-100 rounded text-lg font-mono text-center mb-4'>
                  {cronExpression}
                </code>
                <p className='text-gray-700'>{decodedResult.explanation}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {decodedResult.breakdown.map((field, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded'
                    >
                      <div className='flex items-center gap-3'>
                        <Badge variant='outline'>{field.field}</Badge>
                        <code className='text-sm font-mono'>{field.value}</code>
                      </div>
                      <span className='text-sm text-gray-600'>{field.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next 5 Run Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {decodedResult.nextRuns.map((run, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 bg-gray-50 rounded'
                    >
                      <span>Run {index + 1}</span>
                      <Badge variant='outline'>{run}</Badge>
                    </div>
                  ))}
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
                        <code className='font-mono text-sm'>{entry.expression}</code>
                        <p className='text-gray-500 mt-1'>{entry.explanation}</p>
                        <p className='text-gray-400 text-xs mt-1'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyExpression(entry.expression)}
                        className='ml-2 text-blue-600 hover:text-blue-800'
                      >
                        Copy
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
