'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getToolStats } from '@/lib/tools-config';
import { useAnimations } from '@/stores/settings-store';
import { ArrowRight } from 'lucide-react';
import { m, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

export function Hero() {
  const stats = getToolStats();
  const animationsEnabled = useAnimations();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });

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
      ref={heroRef}
      initial={animationsEnabled ? 'hidden' : undefined}
      animate={animationsEnabled ? (heroInView ? 'visible' : 'hidden') : undefined}
      variants={animationsEnabled ? sectionVariants : undefined}
      className='flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-gradient-to-br from-muted via-background to-accent'
    >
      <div className='relative mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <Badge variant='outline' className='mb-4'>
            {stats.activeTools} Tools Available
          </Badge>
          <h1 className='text-4xl font-bold tracking-tight text-foreground sm:text-6xl'>
            All-in-One
            <span className='bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent'>
              {' '}
              Developer Toolkit
            </span>
          </h1>
          <p className='mt-6 text-lg leading-8 text-muted-foreground'>
            Professional browser-based tools for developers, designers, and content creators. No
            downloads, no installations - just powerful tools that work instantly.
          </p>
          <div className='mt-10 flex items-center justify-center gap-x-6'>
            <Button
              asChild
              size='lg'
              className='bg-gradient-to-r from-primary to-accent-foreground hover:from-primary/90 hover:to-accent-foreground/90'
            >
              <Link href='/tools'>
                Explore All Tools
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='#features'>Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
