'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Cron expression generator tool for creating and explaining cron schedules
 */
export default function CronGeneratorPage() {
  const animationsEnabled = useAnimations();
  const [selectedPreset, setSelectedPreset] = useLocalStorage('cron-preset', 'custom');
  const [customExpression, setCustomExpression] = useLocalStorage('cron-expression', '');
  const [generatedExpression, setGeneratedExpression] = useState('');
  const [explanation, setExplanation] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ expression: string; description: string; timestamp: number }>
  >('cron-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  // Custom cron parameters
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');

  const presets = [
    { id: 'custom', name: 'Custom Expression', expression: '' },
    { id: 'every-minute', name: 'Every Minute', expression: '* * * * *' },
    { id: 'every-hour', name: 'Every Hour', expression: '0 * * * *' },
    { id: 'every-day', name: 'Every Day at Midnight', expression: '0 0 * * *' },
    { id: 'every-week', name: 'Every Week on Sunday', expression: '0 0 * * 0' },
    { id: 'every-month', name: 'Every Month on 1st', expression: '0 0 1 * *' },
    { id: 'weekdays', name: 'Weekdays at 9 AM', expression: '0 9 * * 1-5' },
    { id: 'weekends', name: 'Weekends at 10 AM', expression: '0 10 * * 6,0' },
    {
      id: 'every-5-minutes',
      name: 'Every 5 Minutes',
      expression: '*/5 * * * *',
    },
    {
      id: 'every-30-minutes',
      name: 'Every 30 Minutes',
      expression: '*/30 * * * *',
    },
    {
      id: 'twice-daily',
      name: 'Twice Daily (9 AM & 6 PM)',
      expression: '0 9,18 * * *',
    },
    {
      id: 'monthly-backup',
      name: 'Monthly Backup (1st at 2 AM)',
      expression: '0 2 1 * *',
    },
  ];

  /**
   * Generate cron expression from custom parameters
   */
  const generateCustomExpression = () => {
    return `${minute} ${hour} ${day} ${month} ${weekday}`;
  };

  /**
   * Validate cron expression format
   */
  const validateCronExpression = (expression: string): boolean => {
    const cronRegex =
      /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]),([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3]),([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1])-([1-9]|1[0-9]|2[0-9]|3[0-1])|([1-9]|1[0-9]|2[0-9]|3[0-1]),([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])|([1-9]|1[0-2]),([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6])|([0-6])-([0-6])|([0-6]),([0-6]))$/;
    return cronRegex.test(expression);
  };

  /**
   * Explain cron expression in human-readable format
   */
  const explainCronExpression = (expression: string): string => {
    const parts = expression.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression format';

    const [min, hr, day, month, weekday] = parts;

    let explanation = 'This cron job will run ';

    // Explain minute
    if (min === '*') explanation += 'every minute ';
    else if (min.includes('/')) explanation += `every ${min.split('/')[1]} minutes `;
    else if (min.includes('-'))
      explanation += `from minute ${min.split('-')[0]} to ${min.split('-')[1]} `;
    else if (min.includes(',')) explanation += `at minutes ${min.split(',').join(', ')} `;
    else explanation += `at minute ${min} `;

    // Explain hour
    if (hr === '*') explanation += 'of every hour ';
    else if (hr.includes('/')) explanation += `every ${hr.split('/')[1]} hours `;
    else if (hr.includes('-'))
      explanation += `from hour ${hr.split('-')[0]} to ${hr.split('-')[1]} `;
    else if (hr.includes(',')) explanation += `at hours ${hr.split(',').join(', ')} `;
    else explanation += `at hour ${hr} `;

    // Explain day
    if (day === '*') explanation += 'of every day ';
    else if (day.includes('/')) explanation += `every ${day.split('/')[1]} days `;
    else if (day.includes('-'))
      explanation += `from day ${day.split('-')[0]} to ${day.split('-')[1]} `;
    else if (day.includes(',')) explanation += `on days ${day.split(',').join(', ')} `;
    else explanation += `on day ${day} `;

    // Explain month
    if (month === '*') explanation += 'of every month ';
    else if (month.includes('/')) explanation += `every ${month.split('/')[1]} months `;
    else if (month.includes('-'))
      explanation += `from month ${month.split('-')[0]} to ${month.split('-')[1]} `;
    else if (month.includes(',')) explanation += `in months ${month.split(',').join(', ')} `;
    else explanation += `in month ${month} `;

    // Explain weekday
    if (weekday === '*') explanation += 'on any day of the week';
    else if (weekday.includes('/'))
      explanation += `every ${weekday.split('/')[1]} days of the week`;
    else if (weekday.includes('-'))
      explanation += `from day ${weekday.split('-')[0]} to ${weekday.split('-')[1]} of the week`;
    else if (weekday.includes(','))
      explanation += `on days ${weekday.split(',').join(', ')} of the week`;
    else explanation += `on day ${weekday} of the week`;

    return explanation;
  };

  /**
   * Calculate next few run times (simplified)
   */
  const calculateNextRuns = (expression: string): string[] => {
    // Simplified calculation - in production, use a proper cron library
    const now = new Date();
    const runs: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const nextRun = new Date(now.getTime() + i * 60 * 60 * 1000); // Add hours
      runs.push(nextRun.toLocaleString());
    }

    return runs;
  };

  /**
   * Generate cron expression
   */
  const generateCronExpression = () => {
    let expression = '';

    if (selectedPreset === 'custom') {
      if (customExpression.trim()) {
        expression = customExpression.trim();
      } else {
        expression = generateCustomExpression();
      }
    } else {
      const preset = presets.find(p => p.id === selectedPreset);
      expression = preset?.expression || '';
    }

    if (!validateCronExpression(expression)) {
      toast.error('Invalid cron expression format');
      return;
    }

    setIsProcessing(true);
    try {
      setGeneratedExpression(expression);
      setExplanation(explainCronExpression(expression));
      setNextRuns(calculateNextRuns(expression));

      // Add to history
      const newEntry = {
        expression,
        description: explainCronExpression(expression),
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success('Cron expression generated successfully');
    } catch (error) {
      toast.error('Failed to generate cron expression');
      console.error('Cron generation error:', error);
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
    setCustomExpression('');
    setGeneratedExpression('');
    setExplanation('');
    setNextRuns([]);
    setMinute('*');
    setHour('*');
    setDay('*');
    setMonth('*');
    setWeekday('*');
    setSelectedPreset('custom');
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-cron-generator'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <Tabs value={selectedPreset} onValueChange={setSelectedPreset}>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='custom'>Custom</TabsTrigger>
              <TabsTrigger value='presets'>Presets</TabsTrigger>
            </TabsList>

            <TabsContent value='custom' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='custom-expression'>Custom Cron Expression</Label>
                <Input
                  id='custom-expression'
                  value={customExpression}
                  onChange={e => setCustomExpression(e.target.value)}
                  placeholder='* * * * * (minute hour day month weekday)'
                  className='font-mono'
                />
              </div>

              <div className='grid grid-cols-5 gap-2'>
                <div className='space-y-2'>
                  <Label htmlFor='minute'>Minute</Label>
                  <Input
                    id='minute'
                    value={minute}
                    onChange={e => setMinute(e.target.value)}
                    placeholder='*'
                    className='font-mono'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='hour'>Hour</Label>
                  <Input
                    id='hour'
                    value={hour}
                    onChange={e => setHour(e.target.value)}
                    placeholder='*'
                    className='font-mono'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='day'>Day</Label>
                  <Input
                    id='day'
                    value={day}
                    onChange={e => setDay(e.target.value)}
                    placeholder='*'
                    className='font-mono'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='month'>Month</Label>
                  <Input
                    id='month'
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    placeholder='*'
                    className='font-mono'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='weekday'>Weekday</Label>
                  <Input
                    id='weekday'
                    value={weekday}
                    onChange={e => setWeekday(e.target.value)}
                    placeholder='*'
                    className='font-mono'
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value='presets' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {presets.slice(1).map(preset => (
                  <Card
                    key={preset.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPreset === preset.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <CardContent className='p-4'>
                      <div className='font-medium'>{preset.name}</div>
                      <code className='text-sm text-gray-600 font-mono'>{preset.expression}</code>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <ActionButtons
            onGenerate={generateCronExpression}
            onClear={clearAll}
            generateLabel='Generate Expression'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {generatedExpression && (
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
                  Generated Expression
                  <button
                    onClick={() => copyExpression(generatedExpression)}
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className='block p-3 bg-gray-100 rounded text-lg font-mono text-center'>
                  {generatedExpression}
                </code>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>{explanation}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next 5 Run Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {nextRuns.map((run, index) => (
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
                        <p className='text-gray-500 mt-1'>{entry.description}</p>
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
