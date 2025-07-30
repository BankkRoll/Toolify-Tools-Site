'use client';

import { useAnalytics } from '@/stores/settings-store';
import { Analytics } from '@vercel/analytics/react';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Analytics provider that conditionally renders Vercel Analytics
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const analyticsEnabled = useAnalytics();

  return (
    <>
      {children}
      {analyticsEnabled && <Analytics />}
    </>
  );
}
