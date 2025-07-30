'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getToolStats } from '@/lib/tools-config';
import { useAnimations } from '@/stores/settings-store';
import { m, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

export function Categories() {
  const stats = getToolStats();
  const animationsEnabled = useAnimations();
  const categoriesRef = useRef(null);
  const categoriesInView = useInView(categoriesRef, {
    once: true,
    amount: 0.2,
  });

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const MotionSection = animationsEnabled ? m.section : 'section';
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <MotionSection
      ref={categoriesRef}
      initial={animationsEnabled ? 'hidden' : undefined}
      animate={animationsEnabled ? (categoriesInView ? 'visible' : 'hidden') : undefined}
      variants={animationsEnabled ? sectionVariants : undefined}
      className='py-16'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
            Tool Categories
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            Organized collections of tools for every workflow
          </p>
        </div>
        <MotionDiv
          variants={animationsEnabled ? staggerContainer : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (categoriesInView ? 'visible' : 'hidden') : undefined}
          className='mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-4'
        >
          {stats.categoryStats.map(category => (
            <MotionDiv key={category.id} variants={animationsEnabled ? itemVariants : undefined}>
              <Link href={category.href}>
                <Card className='group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full'>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div className={`h-4 w-4 rounded-full ${category.color}`} />
                      <Badge variant='outline'>
                        {category.activeTools}/{category.totalTools}
                      </Badge>
                    </div>
                    <CardTitle className='group-hover:text-primary transition-colors'>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </MotionDiv>
          ))}
        </MotionDiv>
      </div>
    </MotionSection>
  );
}
