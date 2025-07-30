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
 * GraphQL formatter tool for formatting and validating GraphQL queries
 */
export default function GraphqlPage() {
  const animationsEnabled = useAnimations();
  const [inputGraphql, setInputGraphql] = useLocalStorage('graphql-input', '');
  const [formattedGraphql, setFormattedGraphql] = useState('');
  const [operation, setOperation] = useLocalStorage('graphql-operation', 'format');
  const [indentSize, setIndentSize] = useLocalStorage('graphql-indent', '2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; operation: string; timestamp: number }>
  >('graphql-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  /**
   * Format GraphQL query
   */
  const formatGraphql = (query: string, indent: string): string => {
    const indentSize = parseInt(indent);
    const indentStr = ' '.repeat(indentSize);

    let formatted = query.trim();

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');

    // Add line breaks after keywords
    const keywords = ['query', 'mutation', 'subscription', 'fragment'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Add line breaks after braces
    formatted = formatted.replace(/\{/g, ' {\n');
    formatted = formatted.replace(/\}/g, '\n}');

    // Add line breaks after parentheses
    formatted = formatted.replace(/\(/g, ' (\n');
    formatted = formatted.replace(/\)/g, '\n)');

    // Add indentation
    const lines = formatted.split('\n');
    let currentIndent = 0;
    const indentedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      if (trimmed.includes('}') || trimmed.includes(')')) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      const result = indentStr.repeat(currentIndent) + trimmed;

      if (trimmed.includes('{') || trimmed.includes('(')) {
        currentIndent++;
      }

      return result;
    });

    return indentedLines.join('\n');
  };

  /**
   * Validate GraphQL query structure
   */
  const validateGraphql = (query: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = query.split('\n');

    // Basic validation checks
    const hasQuery = /\bquery\b/i.test(query);
    const hasMutation = /\bmutation\b/i.test(query);
    const hasSubscription = /\bsubscription\b/i.test(query);

    if (!hasQuery && !hasMutation && !hasSubscription) {
      errors.push("Query must contain 'query', 'mutation', or 'subscription' keyword");
    }

    // Check for balanced braces
    const openBraces = (query.match(/\{/g) || []).length;
    const closeBraces = (query.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for balanced parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    // Check for field names
    const fieldPattern = /\b\w+\s*\{/g;
    const fields = query.match(fieldPattern);
    if (!fields || fields.length === 0) {
      errors.push('Query must contain at least one field');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Extract query information
   */
  const extractQueryInfo = (query: string) => {
    const operationMatch = query.match(/\b(query|mutation|subscription)\s+(\w+)/i);
    const operation = operationMatch ? operationMatch[1] : 'unknown';
    const operationName = operationMatch ? operationMatch[2] : 'unnamed';

    const fields = query.match(/\b\w+\s*\{/g) || [];
    const fieldNames = fields.map(field => field.replace(/\s*\{$/, ''));

    const variables = query.match(/\$(\w+):/g) || [];
    const variableNames = variables.map(variable => variable.replace(/[:\$]/g, ''));

    return {
      operation,
      operationName,
      fieldCount: fieldNames.length,
      fields: fieldNames,
      variableCount: variableNames.length,
      variables: variableNames,
    };
  };

  /**
   * Process GraphQL query
   */
  const processGraphql = () => {
    if (!inputGraphql.trim()) {
      toast.error('Please enter GraphQL query to process');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      let result = '';

      if (operation === 'format') {
        result = formatGraphql(inputGraphql, indentSize);
        setFormattedGraphql(result);
      } else if (operation === 'validate') {
        const validation = validateGraphql(inputGraphql);
        setValidationResult(validation);
        result = validation.isValid
          ? 'GraphQL query is valid'
          : `Query has ${validation.errors.length} errors`;
      } else if (operation === 'analyze') {
        const info = extractQueryInfo(inputGraphql);
        setValidationResult(info);
        result = `Analyzed ${info.operation} '${info.operationName}'`;
      }

      setIsComplete(true);

      // Add to history
      const newEntry = {
        input: inputGraphql.length > 100 ? inputGraphql.substring(0, 100) + '...' : inputGraphql,
        operation,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`GraphQL ${operation} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process GraphQL';
      setError(errorMessage);
      toast.error('Failed to process GraphQL');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy formatted GraphQL to clipboard
   */
  const copyGraphql = () => {
    navigator.clipboard.writeText(formattedGraphql);
    toast.success('GraphQL query copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputGraphql('');
    setFormattedGraphql('');
    setIsComplete(false);
    setError(null);
    setValidationResult(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-graphql'>
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
                  <SelectItem value='format'>Format Query</SelectItem>
                  <SelectItem value='validate'>Validate Query</SelectItem>
                  <SelectItem value='analyze'>Analyze Query</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operation === 'format' && (
              <div className='space-y-2'>
                <Label htmlFor='indent-size'>Indent Size</Label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2'>2 Spaces</SelectItem>
                    <SelectItem value='4'>4 Spaces</SelectItem>
                    <SelectItem value='8'>8 Spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Tabs defaultValue='input' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='input'>Input Query</TabsTrigger>
              <TabsTrigger value='output' disabled={!formattedGraphql && !validationResult}>
                Result
              </TabsTrigger>
            </TabsList>

            <TabsContent value='input' className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='input-graphql'>GraphQL Query</Label>
                <Textarea
                  id='input-graphql'
                  value={inputGraphql}
                  onChange={e => setInputGraphql(e.target.value)}
                  placeholder='Enter your GraphQL query here...'
                  className='min-h-[300px] font-mono text-sm'
                />
              </div>

              <ActionButtons
                onGenerate={processGraphql}
                onClear={clearAll}
                generateLabel={
                  operation === 'validate'
                    ? 'Validate Query'
                    : operation === 'analyze'
                      ? 'Analyze Query'
                      : 'Format Query'
                }
                clearLabel='Clear All'
                isGenerating={isProcessing}
              />
            </TabsContent>

            <TabsContent value='output' className='space-y-4'>
              {formattedGraphql && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Formatted Query</Label>
                    <button
                      onClick={copyGraphql}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      Copy
                    </button>
                  </div>
                  <Textarea
                    value={formattedGraphql}
                    readOnly
                    className='min-h-[300px] font-mono text-sm'
                  />
                </div>
              )}

              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      {operation === 'validate' ? 'Validation Result' : 'Query Analysis'}
                      {operation === 'validate' && (
                        <Badge variant={validationResult.isValid ? 'default' : 'destructive'}>
                          {validationResult.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {operation === 'validate' ? (
                      validationResult.isValid ? (
                        <p className='text-green-600'>GraphQL query is valid!</p>
                      ) : (
                        <div className='space-y-2'>
                          <p className='text-red-600 font-medium'>
                            Found {validationResult.errors.length} errors:
                          </p>
                          <ul className='list-disc list-inside space-y-1 text-sm'>
                            {validationResult.errors.map((error: string, index: number) => (
                              <li key={index} className='text-red-600'>
                                {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ) : (
                      <div className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <h4 className='font-medium text-sm mb-2'>Operation</h4>
                            <Badge variant='outline'>{validationResult.operation}</Badge>
                          </div>
                          <div>
                            <h4 className='font-medium text-sm mb-2'>Name</h4>
                            <Badge variant='outline'>{validationResult.operationName}</Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium text-sm mb-2'>
                            Fields ({validationResult.fieldCount})
                          </h4>
                          <div className='flex flex-wrap gap-1'>
                            {validationResult.fields.map((field: string, index: number) => (
                              <Badge key={index} variant='secondary' className='text-xs'>
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {validationResult.variableCount > 0 && (
                          <div>
                            <h4 className='font-medium text-sm mb-2'>
                              Variables ({validationResult.variableCount})
                            </h4>
                            <div className='flex flex-wrap gap-1'>
                              {validationResult.variables.map((variable: string, index: number) => (
                                <Badge key={index} variant='outline' className='text-xs'>
                                  ${variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                          <Badge variant='secondary'>{entry.operation}</Badge>
                        </div>
                        <p className='text-gray-500'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputGraphql(entry.input);
                          setOperation(entry.operation);
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
