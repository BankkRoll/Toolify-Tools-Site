'use client';

import { useCallback, useState } from 'react';

interface RandomNumberOptions {
  min: number;
  max: number;
  count?: number;
  allowDuplicates?: boolean;
}

interface RandomStringOptions {
  length: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

interface RandomColorOptions {
  format?: 'hex' | 'rgb' | 'hsl';
  alpha?: boolean;
}

/**
 * Hook for generating various types of random data
 * @returns Object with random generation functions
 */
export function useRandomGenerator() {
  const [lastGenerated, setLastGenerated] = useState<string[]>([]);

  /**
   * Generates random numbers within specified range
   * @param options - Number generation options
   * @returns Array of random numbers
   */
  const generateRandomNumber = useCallback((options: RandomNumberOptions): number[] => {
    const { min, max, count = 1, allowDuplicates = false } = options;
    const numbers: number[] = [];

    if (count === 1) {
      return [Math.floor(Math.random() * (max - min + 1)) + min];
    }

    if (allowDuplicates) {
      for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
    } else {
      const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      for (let i = 0; i < Math.min(count, availableNumbers.length); i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        numbers.push(availableNumbers.splice(randomIndex, 1)[0]);
      }
    }

    return numbers;
  }, []);

  /**
   * Generates random string with specified options
   * @param options - String generation options
   * @returns Random string
   */
  const generateRandomString = useCallback((options: RandomStringOptions): string => {
    const {
      length,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = false,
      excludeSimilar = false,
    } = options;

    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      chars = chars.replace(/[0O1Il]/g, '');
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }, []);

  /**
   * Generates random color in specified format
   * @param options - Color generation options
   * @returns Random color string
   */
  const generateRandomColor = useCallback((options: RandomColorOptions = {}): string => {
    const { format = 'hex', alpha = false } = options;

    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = alpha ? Math.random() : 1;

    switch (format) {
      case 'rgb':
        return alpha ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
      case 'hsl':
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 100);
        const l = Math.floor(Math.random() * 100);
        return alpha ? `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(2)})` : `hsl(${h}, ${s}%, ${l}%)`;
      default:
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        return alpha
          ? hex +
              Math.floor(a * 255)
                .toString(16)
                .padStart(2, '0')
          : hex;
    }
  }, []);

  /**
   * Generates random UUID v4
   * @returns Random UUID string
   */
  const generateRandomUUID = useCallback((): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  /**
   * Generates secure random password
   * @param length - Password length
   * @returns Random password string
   */
  const generateRandomPassword = useCallback(
    (length: number = 12): string => {
      return generateRandomString({
        length,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true,
      });
    },
    [generateRandomString],
  );

  /**
   * Shuffles array using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns Shuffled array
   */
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  /**
   * Generates random data based on type
   * @param type - Type of data to generate
   * @param options - Generation options
   * @returns Random data of specified type
   */
  const generateRandomData = useCallback(
    (type: string, options: any = {}) => {
      let result: any;

      switch (type) {
        case 'number':
          result = generateRandomNumber(options);
          break;
        case 'string':
          result = generateRandomString(options);
          break;
        case 'color':
          result = generateRandomColor(options);
          break;
        case 'uuid':
          result = generateRandomUUID();
          break;
        case 'password':
          result = generateRandomPassword(options.length);
          break;
        default:
          result = generateRandomNumber({ min: 1, max: 100 });
      }

      const resultArray = Array.isArray(result) ? result : [result];
      setLastGenerated(resultArray.map(String));
      return result;
    },
    [
      generateRandomNumber,
      generateRandomString,
      generateRandomColor,
      generateRandomUUID,
      generateRandomPassword,
    ],
  );

  return {
    generateRandomNumber,
    generateRandomString,
    generateRandomColor,
    generateRandomUUID,
    generateRandomPassword,
    shuffleArray,
    generateRandomData,
    lastGenerated,
  };
}
