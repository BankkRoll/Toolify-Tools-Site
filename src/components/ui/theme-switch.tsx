'use client';

import { cn } from '@/lib/utils';
import { useThemeToggle } from '@/providers/theme-provider';
import { Monitor, Moon, Sun } from 'lucide-react';
import { m } from 'motion/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const themes = [
  {
    key: 'system',
    icon: Monitor,
    label: 'System theme',
  },
  {
    key: 'light',
    icon: Sun,
    label: 'Light theme',
  },
  {
    key: 'dark',
    icon: Moon,
    label: 'Dark theme',
  },
];

export type ThemeSwitcherProps = {
  className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const { toggleTheme } = useThemeToggle();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleThemeClick = (event: React.MouseEvent<HTMLButtonElement>, themeKey: string) => {
    const { clientX: x, clientY: y } = event;

    if (themeKey === 'system') {
      // For system theme, use the regular setTheme
      setTheme('system');
    } else {
      // For light/dark themes, use the view transition effect
      toggleTheme({ x, y });
    }
  };

  return (
    <div
      className={cn(
        'relative flex h-8 max-w-fit rounded-full bg-background p-1 ring-1 ring-border',
        className,
      )}
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;

        return (
          <button
            type='button'
            key={key}
            className='cursor-pointer relative h-6 w-6 rounded-full'
            onClick={e => handleThemeClick(e, key)}
            aria-label={label}
          >
            {isActive && (
              <m.div
                layoutId='activeTheme'
                className='absolute inset-0 rounded-full bg-secondary'
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <Icon
              className={cn(
                'relative m-auto h-4 w-4',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
