'use client';

import { getToolStats, toolCategories } from '@/lib/tools-config';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import { useRef } from 'react';

export function Stats() {
  const stats = getToolStats();
  const animationsEnabled = useAnimations();
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.2 });

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const MotionSection = animationsEnabled ? m.section : 'section';

  return (
    <MotionSection
      ref={statsRef}
      initial={animationsEnabled ? 'hidden' : undefined}
      animate={animationsEnabled ? (statsInView ? 'visible' : 'hidden') : undefined}
      variants={animationsEnabled ? sectionVariants : undefined}
      className='py-16'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='text-center'>
            <div className='text-4xl font-bold text-primary'>{stats.totalTools}</div>
            <div className='text-sm font-medium text-muted-foreground'>Total Tools</div>
          </div>
          <div className='text-center'>
            <div className='text-4xl font-bold text-primary'>{stats.activeTools}</div>
            <div className='text-sm font-medium text-muted-foreground'>Ready to Use</div>
          </div>
          <div className='text-center'>
            <div className='text-4xl font-bold text-accent-foreground'>{toolCategories.length}</div>
            <div className='text-sm font-medium text-muted-foreground'>Categories</div>
          </div>
          <div className='text-center'>
            <div className='text-4xl font-bold text-primary'>100%</div>
            <div className='text-sm font-medium text-muted-foreground'>Browser-Based</div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
