'use client';

import { useCallback, useState } from 'react';

interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
  a?: number;
}

interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk';

/**
 * Hook for converting colors between different formats
 * @returns Object with color conversion functions and history
 */
export function useColorConverter() {
  const [conversionHistory, setConversionHistory] = useState<
    Array<{
      input: string;
      output: Record<ColorFormat, string>;
      timestamp: Date;
    }>
  >([]);

  /**
   * Converts hex color to RGB values
   * @param hex - Hex color string (with or without #)
   * @returns RGB color object
   */
  const hexToRgb = useCallback((hex: string): RGB => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const a = cleanHex.length === 8 ? parseInt(cleanHex.substr(6, 2), 16) / 255 : undefined;

    return { r, g, b, a };
  }, []);

  /**
   * Converts RGB values to hex color string
   * @param rgb - RGB color object
   * @returns Hex color string
   */
  const rgbToHex = useCallback((rgb: RGB): string => {
    const r = Math.round(rgb.r).toString(16).padStart(2, '0');
    const g = Math.round(rgb.g).toString(16).padStart(2, '0');
    const b = Math.round(rgb.b).toString(16).padStart(2, '0');
    const a =
      rgb.a !== undefined
        ? Math.round(rgb.a * 255)
            .toString(16)
            .padStart(2, '0')
        : '';

    return `#${r}${g}${b}${a}`;
  }, []);

  /**
   * Converts RGB values to HSL values
   * @param rgb - RGB color object
   * @returns HSL color object
   */
  const rgbToHsl = useCallback((rgb: RGB): HSL => {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: rgb.a,
    };
  }, []);

  /**
   * Converts HSL values to RGB values
   * @param hsl - HSL color object
   * @returns RGB color object
   */
  const hslToRgb = useCallback((hsl: HSL): RGB => {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: hsl.a,
    };
  }, []);

  /**
   * Converts RGB values to HSV values
   * @param rgb - RGB color object
   * @returns HSV color object
   */
  const rgbToHsv = useCallback((rgb: RGB): HSV => {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
      a: rgb.a,
    };
  }, []);

  /**
   * Converts HSV values to RGB values
   * @param hsv - HSV color object
   * @returns RGB color object
   */
  const hsvToRgb = useCallback((hsv: HSV): RGB => {
    const h = hsv.h / 360;
    const s = hsv.s / 100;
    const v = hsv.v / 100;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r, g, b;

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
      default:
        r = g = b = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: hsv.a,
    };
  }, []);

  /**
   * Converts RGB values to CMYK values
   * @param rgb - RGB color object
   * @returns CMYK color object
   */
  const rgbToCmyk = useCallback((rgb: RGB): CMYK => {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  }, []);

  /**
   * Converts CMYK values to RGB values
   * @param cmyk - CMYK color object
   * @returns RGB color object
   */
  const cmykToRgb = useCallback((cmyk: CMYK): RGB => {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
    };
  }, []);

  /**
   * Parses color string to RGB object
   * @param color - Color string in various formats
   * @returns RGB color object or null if invalid
   */
  const parseColor = useCallback(
    (color: string): RGB | null => {
      const hexMatch = color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/);
      if (hexMatch) {
        return hexToRgb(color);
      }

      const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1]),
          g: parseInt(rgbMatch[2]),
          b: parseInt(rgbMatch[3]),
        };
      }

      const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
      if (rgbaMatch) {
        return {
          r: parseInt(rgbaMatch[1]),
          g: parseInt(rgbaMatch[2]),
          b: parseInt(rgbaMatch[3]),
          a: parseFloat(rgbaMatch[4]),
        };
      }

      const hslMatch = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
      if (hslMatch) {
        const hsl: HSL = {
          h: parseInt(hslMatch[1]),
          s: parseInt(hslMatch[2]),
          l: parseInt(hslMatch[3]),
        };
        return hslToRgb(hsl);
      }

      return null;
    },
    [hexToRgb, hslToRgb],
  );

  /**
   * Converts color to all supported formats
   * @param input - Color string in any supported format
   * @returns Object with all color format conversions
   */
  const convertColor = useCallback(
    (input: string): Record<ColorFormat, string> => {
      const rgb = parseColor(input);
      if (!rgb) {
        throw new Error('Invalid color format');
      }

      const hsl = rgbToHsl(rgb);
      const hsv = rgbToHsv(rgb);
      const cmyk = rgbToCmyk(rgb);

      const result = {
        hex: rgbToHex(rgb),
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
        cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      };

      setConversionHistory(prev => [
        { input, output: result, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);

      return result;
    },
    [parseColor, rgbToHex, rgbToHsl, rgbToHsv, rgbToCmyk],
  );

  /**
   * Clears conversion history
   */
  const clearHistory = useCallback(() => {
    setConversionHistory([]);
  }, []);

  return {
    convertColor,
    parseColor,
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    rgbToHsv,
    hsvToRgb,
    rgbToCmyk,
    cmykToRgb,
    clearHistory,
    conversionHistory,
  };
}
