'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SettingsDialog } from './settings-dialog';

export function ToolsHeader() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const isMobile = useIsMobile();
  const pathSegments = pathname.split('/').filter(Boolean);

  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: 'Tools', href: '/tools' }];

    if (pathSegments.length > 1) {
      // Add category
      const category = pathSegments[1];
      breadcrumbs.push({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        href: `/tools/${category}`,
      });

      // Add specific tool if exists
      if (pathSegments.length > 2) {
        const tool = pathSegments[2];
        breadcrumbs.push({
          label: tool
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          href: pathname,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Toolify Tools',
          text: 'Check out this amazing developer toolkit!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  return (
    <header className='bg-card flex h-16 shrink-0 items-center gap-2 border-b px-6'>
      <div
        className={cn(
          'items-center gap-2',
          isMobile || sidebarState === 'collapsed' ? 'flex' : 'hidden',
        )}
      >
        <SidebarTrigger className='-ml-1' />
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className='flex items-center'>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className='ml-auto flex items-center gap-2'>
        <Button variant='ghost' size='icon' onClick={handleShare}>
          <Share2 className='h-4 w-4' />
          <span className='sr-only'>Share tool</span>
        </Button>

        <SettingsDialog />
      </div>
    </header>
  );
}
