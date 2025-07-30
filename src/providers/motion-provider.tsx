'use client';

import { useAnimations } from '@/stores/settings-store';
import { LazyMotion, domAnimation } from 'motion/react';
import { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Motion provider that conditionally enables Framer Motion animations
 */
export function MotionProvider({ children }: MotionProviderProps) {
  const animationsEnabled = useAnimations();

  if (!animationsEnabled) {
    return <>{children}</>;
  }

  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
