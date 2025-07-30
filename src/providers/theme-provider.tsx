'use client';

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import * as React from 'react';

type Coords = { x: number; y: number };

type ThemeProviderState = {
  toggleTheme: (coords?: Coords) => void;
};

const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined);

const TRANSITION_ANIMATIONS = ['circle-reveal-center-to-edge'] as const;

/**
 * Inner theme provider component with view transition support
 */
function ThemeProviderInner({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useNextTheme();

  const handleThemeToggle = React.useCallback(
    (coords?: Coords) => {
      const currentTheme = theme || 'system';

      let newTheme: string;
      if (currentTheme === 'system') {
        const isDark = document.documentElement.classList.contains('dark');
        newTheme = isDark ? 'light' : 'dark';
      } else {
        newTheme = currentTheme === 'light' ? 'dark' : 'light';
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!document.startViewTransition || prefersReducedMotion) {
        setTheme(newTheme);
        return;
      }

      if (coords) {
        document.documentElement.style.setProperty('--x', `${coords.x}px`);
        document.documentElement.style.setProperty('--y', `${coords.y}px`);
      }

      const randomAnimation =
        TRANSITION_ANIMATIONS[Math.floor(Math.random() * TRANSITION_ANIMATIONS.length)];

      document.documentElement.style.setProperty('--transition-type', randomAnimation);

      document.startViewTransition(() => {
        setTheme(newTheme);
      });
    },
    [theme, setTheme],
  );

  const value: ThemeProviderState = {
    toggleTheme: handleThemeToggle,
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

/**
 * Theme provider with view transition animations
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
}

/**
 * Hook to access theme toggle functionality with view transitions
 * @returns Theme toggle function with coordinate support
 */
export const useThemeToggle = () => {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useThemeToggle must be used within a ThemeProvider');
  }
  return context;
};
