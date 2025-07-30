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
 * URL parser tool for analyzing and breaking down URLs into components
 */
export default function UrlParserPage() {
  const animationsEnabled = useAnimations();
  const [inputUrl, setInputUrl] = useLocalStorage('url-parser-input', '');
  const [parsedUrl, setParsedUrl] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<Array<{ url: string; timestamp: number }>>(
    'url-parser-history',
    [],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Parse URL into components
   */
  const parseUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      const params: Record<string, string> = {};

      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || 'default',
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        origin: urlObj.origin,
        href: urlObj.href,
        searchParams: params,
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid URL',
      };
    }
  };

  /**
   * Parse the input URL
   */
  const parseInputUrl = () => {
    if (!inputUrl.trim()) {
      toast.error('Please enter a URL to parse');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const parsed = parseUrl(inputUrl);
      setParsedUrl(parsed);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        url: inputUrl,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      if (parsed.isValid) {
        toast.success('URL parsed successfully');
      } else {
        toast.error('Invalid URL format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse URL';
      setError(errorMessage);
      toast.error('Failed to parse URL');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy parsed URL data to clipboard
   */
  const copyParsedData = () => {
    const data = JSON.stringify(parsedUrl, null, 2);
    navigator.clipboard.writeText(data);
    toast.success('Parsed data copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputUrl('');
    setParsedUrl(null);
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-url-parser'>
      <div ref={containerRef} className='space-y-6'>
        <MotionDiv
          variants={variants}
          initial='hidden'
          animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
          transition={{ duration: 0.5 }}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='input-url'>URL to Parse</Label>
            <Input
              id='input-url'
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder='https://example.com/path?param=value#fragment'
              className='font-mono'
            />
          </div>

          <ActionButtons
            onGenerate={parseInputUrl}
            onClear={clearAll}
            generateLabel='Parse URL'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {parsedUrl && (
          <MotionDiv
            variants={variants}
            initial='hidden'
            animate={isInView && animationsEnabled ? 'visible' : 'hidden'}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='space-y-4'
          >
            {parsedUrl.isValid ? (
              <Tabs defaultValue='components' className='w-full'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='components'>Components</TabsTrigger>
                  <TabsTrigger value='params'>Query Parameters</TabsTrigger>
                  <TabsTrigger value='json'>JSON View</TabsTrigger>
                </TabsList>

                <TabsContent value='components' className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Protocol</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.protocol}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Hostname</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.hostname}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Port</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.port}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Pathname</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.pathname}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Search</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.search || 'none'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className='text-sm'>Hash</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.hash || 'none'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card className='md:col-span-2'>
                      <CardHeader>
                        <CardTitle className='text-sm'>Origin</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant='outline' className='font-mono'>
                          {parsedUrl.origin}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='params' className='space-y-4'>
                  {Object.keys(parsedUrl.searchParams).length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {Object.entries(parsedUrl.searchParams).map(([key, value]) => (
                        <Card key={key}>
                          <CardHeader>
                            <CardTitle className='text-sm'>{key}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant='outline' className='font-mono'>
                              {value as string}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className='p-6 text-center text-gray-500'>
                        No query parameters found
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value='json' className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label>Parsed URL Data</Label>
                    <button
                      onClick={copyParsedData}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      Copy JSON
                    </button>
                  </div>
                  <Card>
                    <CardContent className='p-4'>
                      <pre className='text-sm font-mono overflow-x-auto whitespace-pre-wrap'>
                        {JSON.stringify(parsedUrl, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className='p-6 text-center'>
                  <p className='text-red-600 font-medium'>Invalid URL</p>
                  <p className='text-gray-500 mt-2'>{parsedUrl.error}</p>
                </CardContent>
              </Card>
            )}
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
                        <p className='font-medium truncate font-mono'>{entry.url}</p>
                        <p className='text-gray-500'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputUrl(entry.url);
                          toast.success('URL loaded from history');
                        }}
                        className='ml-2 text-blue-600 hover:text-blue-800'
                      >
                        Load
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
