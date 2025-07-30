'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { ProcessingStatus } from '@/components/tools/processing-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Flexbox generator tool for creating and visualizing CSS flexbox layouts
 */
export default function FlexboxPage() {
  const animationsEnabled = useAnimations();
  const [flexDirection, setFlexDirection] = useLocalStorage('flexbox-direction', 'row');
  const [justifyContent, setJustifyContent] = useLocalStorage('flexbox-justify', 'flex-start');
  const [alignItems, setAlignItems] = useLocalStorage('flexbox-align', 'stretch');
  const [flexWrap, setFlexWrap] = useLocalStorage('flexbox-wrap', 'nowrap');
  const [gap, setGap] = useLocalStorage('flexbox-gap', 10);
  const [itemCount, setItemCount] = useLocalStorage('flexbox-items', 3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCSS, setGeneratedCSS] = useState('');
  const [history, setHistory] = useLocalStorage<Array<{ css: string; timestamp: number }>>(
    'flexbox-history',
    [],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Generate CSS code for the current flexbox configuration
   */
  const generateCSS = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const css = `.flex-container {
  display: flex;
  flex-direction: ${flexDirection};
  justify-content: ${justifyContent};
  align-items: ${alignItems};
  flex-wrap: ${flexWrap};
  gap: ${gap}px;
  min-height: 200px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}

.flex-item {
  padding: 20px;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  text-align: center;
  min-width: 80px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}`;

      setGeneratedCSS(css);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        css,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success('Flexbox CSS generated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate CSS';
      setError(errorMessage);
      toast.error('Failed to generate CSS');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy CSS to clipboard
   */
  const copyCSS = () => {
    navigator.clipboard.writeText(generatedCSS);
    toast.success('CSS copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setFlexDirection('row');
    setJustifyContent('flex-start');
    setAlignItems('stretch');
    setFlexWrap('nowrap');
    setGap(10);
    setItemCount(3);
    setGeneratedCSS('');
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  /**
   * Get flexbox container style
   */
  const getContainerStyle = () => ({
    display: 'flex',
    flexDirection: flexDirection as any,
    justifyContent: justifyContent as any,
    alignItems: alignItems as any,
    flexWrap: flexWrap as any,
    gap: `${gap}px`,
    minHeight: '200px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
  });

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-flexbox'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='flex-direction'>Flex Direction</Label>
                <Select value={flexDirection} onValueChange={setFlexDirection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='row'>Row (Horizontal)</SelectItem>
                    <SelectItem value='row-reverse'>Row Reverse</SelectItem>
                    <SelectItem value='column'>Column (Vertical)</SelectItem>
                    <SelectItem value='column-reverse'>Column Reverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='justify-content'>Justify Content</Label>
                <Select value={justifyContent} onValueChange={setJustifyContent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='flex-start'>Flex Start</SelectItem>
                    <SelectItem value='flex-end'>Flex End</SelectItem>
                    <SelectItem value='center'>Center</SelectItem>
                    <SelectItem value='space-between'>Space Between</SelectItem>
                    <SelectItem value='space-around'>Space Around</SelectItem>
                    <SelectItem value='space-evenly'>Space Evenly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='align-items'>Align Items</Label>
                <Select value={alignItems} onValueChange={setAlignItems}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='stretch'>Stretch</SelectItem>
                    <SelectItem value='flex-start'>Flex Start</SelectItem>
                    <SelectItem value='flex-end'>Flex End</SelectItem>
                    <SelectItem value='center'>Center</SelectItem>
                    <SelectItem value='baseline'>Baseline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='flex-wrap'>Flex Wrap</Label>
                <Select value={flexWrap} onValueChange={setFlexWrap}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='nowrap'>No Wrap</SelectItem>
                    <SelectItem value='wrap'>Wrap</SelectItem>
                    <SelectItem value='wrap-reverse'>Wrap Reverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='gap'>Gap: {gap}px</Label>
                <Slider
                  value={[gap]}
                  onValueChange={value => setGap(value[0])}
                  max={50}
                  min={0}
                  step={1}
                  className='w-full'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='item-count'>Number of Items: {itemCount}</Label>
                <Slider
                  value={[itemCount]}
                  onValueChange={value => setItemCount(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className='w-full'
                />
              </div>
            </div>
          </div>

          <ActionButtons
            onGenerate={generateCSS}
            onClear={clearAll}
            generateLabel='Generate CSS'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
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
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={getContainerStyle()}>
                {Array.from({ length: itemCount }, (_, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '4px',
                      textAlign: 'center' as const,
                      minWidth: '80px',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        {generatedCSS && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-4'
          >
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Generated CSS
                  <button onClick={copyCSS} className='text-sm text-blue-600 hover:text-blue-800'>
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='p-3 bg-gray-100 rounded border'>
                  <pre className='text-sm font-mono whitespace-pre-wrap'>{generatedCSS}</pre>
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
            transition={{ duration: 0.5, delay: 0.3 }}
            className='space-y-4'
          >
            <h3 className='text-lg font-semibold'>Recent History</h3>
            <div className='space-y-2'>
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between text-sm'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium'>Flexbox Configuration</p>
                        <p className='text-gray-500'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setGeneratedCSS(entry.css);
                          toast.success('CSS restored from history');
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
