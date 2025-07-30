'use client';

import { CallToAction } from '@/components/landing/call-to-action';
import { Categories } from '@/components/landing/categories';
import { Featured } from '@/components/landing/featured';
import { Hero } from '@/components/landing/hero';
import { Stats } from '@/components/landing/stats';

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Stats />
      <Featured />
      <Categories />
      <CallToAction />
    </div>
  );
}
