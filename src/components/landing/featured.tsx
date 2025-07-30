'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeaturedTools, getToolStats } from '@/lib/tools-config';
import { useAnimations } from '@/stores/settings-store';
import { ArrowRight, Star } from 'lucide-react';
import { m, useInView } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

export function Featured() {
  const stats = getToolStats();
  const featuredTools = getFeaturedTools();
  const animationsEnabled = useAnimations();
  const featuredRef = useRef(null);
  const featuredInView = useInView(featuredRef, { once: true, amount: 0.2 });

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
      ref={featuredRef}
      initial={animationsEnabled ? 'hidden' : undefined}
      animate={animationsEnabled ? (featuredInView ? 'visible' : 'hidden') : undefined}
      variants={animationsEnabled ? sectionVariants : undefined}
      className='py-16'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
            Featured Tools
          </h2>
          <p className='mt-4 text-lg text-muted-foreground'>
            Our most popular and powerful tools, ready to boost your productivity
          </p>
        </div>
        <MotionDiv
          variants={animationsEnabled ? staggerContainer : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (featuredInView ? 'visible' : 'hidden') : undefined}
          className='mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'
        >
          {featuredTools.slice(0, 6).map(tool => (
            <MotionDiv key={tool.id} variants={animationsEnabled ? itemVariants : undefined}>
              <Card className='group hover:shadow-lg transition-all duration-200 hover:-translate-y-1'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <Badge variant='outline' className='capitalize'>
                      {tool.category}
                    </Badge>
                    {tool.popular && (
                      <Badge variant='secondary' className='bg-accent text-accent-foreground'>
                        <Star className='mr-1 h-3 w-3' />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='group-hover:text-primary transition-colors'>
                    {tool.name}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className='w-full'>
                    <Link href={tool.href}>Try Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </MotionDiv>
          ))}
        </MotionDiv>
        <div className='mt-12 text-center'>
          <Button variant='outline' size='lg' asChild>
            <Link href='/tools'>
              View All {stats.activeTools} Tools
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </MotionSection>
  );
}
