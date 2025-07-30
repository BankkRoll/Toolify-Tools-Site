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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * SQL formatting tool for beautifying and standardizing SQL queries
 */
export default function SqlFormatterPage() {
  const animationsEnabled = useAnimations();
  const [inputSql, setInputSql] = useLocalStorage('sql-formatter-input', '');
  const [formattedSql, setFormattedSql] = useState('');
  const [formatStyle, setFormatStyle] = useLocalStorage('sql-formatter-style', 'uppercase');
  const [indentSize, setIndentSize] = useLocalStorage('sql-formatter-indent', '2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ input: string; output: string; timestamp: number }>
  >('sql-formatter-history', []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  // SQL keywords for highlighting
  const sqlKeywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
    'ALTER',
    'TABLE',
    'INDEX',
    'VIEW',
    'PROCEDURE',
    'FUNCTION',
    'TRIGGER',
    'DATABASE',
    'SCHEMA',
    'JOIN',
    'LEFT',
    'RIGHT',
    'INNER',
    'OUTER',
    'ON',
    'AND',
    'OR',
    'NOT',
    'IN',
    'EXISTS',
    'GROUP',
    'BY',
    'ORDER',
    'HAVING',
    'UNION',
    'ALL',
    'DISTINCT',
    'AS',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'IF',
    'NULL',
    'IS',
    'LIKE',
    'BETWEEN',
    'LIMIT',
    'OFFSET',
    'COUNT',
    'SUM',
    'AVG',
    'MAX',
    'MIN',
    'COALESCE',
    'NULLIF',
    'CAST',
    'CONVERT',
  ];

  /**
   * Format SQL query with specified style
   */
  const formatSql = (sql: string, style: string, indent: string): string => {
    let formatted = sql.trim();

    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');

    // Handle different formatting styles
    if (style === 'uppercase') {
      // Convert keywords to uppercase
      sqlKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, keyword.toUpperCase());
      });
    } else if (style === 'lowercase') {
      // Convert keywords to lowercase
      sqlKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, keyword.toLowerCase());
      });
    }

    // Add line breaks and indentation
    const indentSize = parseInt(indent);
    const indentStr = ' '.repeat(indentSize);

    // Add line breaks after common SQL clauses
    const clauses = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'OUTER JOIN',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'UNION',
      'INSERT INTO',
      'UPDATE',
      'DELETE FROM',
      'CREATE TABLE',
      'ALTER TABLE',
      'DROP TABLE',
    ];

    clauses.forEach(clause => {
      const regex = new RegExp(`\\b${clause}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${clause}`);
    });

    // Add indentation
    const lines = formatted.split('\n');
    const indentedLines = lines.map((line, index) => {
      if (index === 0) return line.trim();
      return indentStr + line.trim();
    });

    return indentedLines.join('\n');
  };

  /**
   * Validate SQL syntax (basic validation)
   */
  const validateSql = (sql: string): boolean => {
    const trimmed = sql.trim();
    if (!trimmed) return false;

    // Basic checks for common SQL patterns
    const hasSelect = /\bSELECT\b/i.test(trimmed);
    const hasFrom = /\bFROM\b/i.test(trimmed);
    const hasInsert = /\bINSERT\b/i.test(trimmed);
    const hasUpdate = /\bUPDATE\b/i.test(trimmed);
    const hasDelete = /\bDELETE\b/i.test(trimmed);
    const hasCreate = /\bCREATE\b/i.test(trimmed);

    return hasSelect || hasInsert || hasUpdate || hasDelete || hasCreate;
  };

  /**
   * Format the SQL query
   */
  const formatSqlQuery = () => {
    if (!inputSql.trim()) {
      toast.error('Please enter SQL query to format');
      return;
    }

    if (!validateSql(inputSql)) {
      toast.error('Invalid SQL query format');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const formatted = formatSql(inputSql, formatStyle, indentSize);
      setFormattedSql(formatted);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        input: inputSql.length > 100 ? inputSql.substring(0, 100) + '...' : inputSql,
        output: formatted.length > 100 ? formatted.substring(0, 100) + '...' : formatted,
        timestamp: Date.now(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);

      toast.success('SQL formatted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to format SQL';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy formatted SQL to clipboard
   */
  const copyFormattedSql = () => {
    navigator.clipboard.writeText(formattedSql);
    toast.success('Formatted SQL copied to clipboard');
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setInputSql('');
    setFormattedSql('');
    setIsComplete(false);
    setError(null);
    toast.success('All data cleared');
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId='dev-sql-formatter'>
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
              <Label htmlFor='format-style'>Format Style</Label>
              <Select value={formatStyle} onValueChange={setFormatStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='uppercase'>Uppercase Keywords</SelectItem>
                  <SelectItem value='lowercase'>Lowercase Keywords</SelectItem>
                  <SelectItem value='preserve'>Preserve Case</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className='space-y-2'>
            <Label htmlFor='input-sql'>SQL Query</Label>
            <textarea
              id='input-sql'
              value={inputSql}
              onChange={e => setInputSql(e.target.value)}
              placeholder='Enter your SQL query here...'
              className='w-full min-h-[200px] p-3 border rounded-md resize-none font-mono text-sm'
              rows={10}
            />
          </div>

          <ActionButtons
            onGenerate={formatSqlQuery}
            onClear={clearAll}
            generateLabel='Format SQL'
            clearLabel='Clear All'
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus isProcessing={isProcessing} isComplete={isComplete} error={error} />

        {formattedSql && (
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
                  Formatted SQL
                  <button
                    onClick={copyFormattedSql}
                    className='text-sm text-blue-600 hover:text-blue-800'
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className='bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap font-mono'>
                  {formattedSql}
                </pre>
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
                        <p className='text-gray-500 mt-1'>{entry.output}</p>
                        <p className='text-gray-400 text-xs mt-1'>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setInputSql(entry.input);
                          toast.success('Query loaded from history');
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
