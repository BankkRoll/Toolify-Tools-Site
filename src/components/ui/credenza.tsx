'use client';

import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import { ScrollArea } from './scroll-area';

interface BaseProps {
  children: React.ReactNode;
}

interface RootCredenzaProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CredenzaProps extends BaseProps {
  className?: string;
  asChild?: true;
}

const desktop = '(min-width: 768px)';

const Credenza = ({ children, ...props }: RootCredenzaProps) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery(desktop);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const Component = isDesktop ? Dialog : Drawer;

  return <Component {...props}>{children}</Component>;
};

const CredenzaTrigger = ({ className, children, ...props }: CredenzaProps) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery(desktop);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const Component = isDesktop ? DialogTrigger : DrawerTrigger;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaClose = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop);
  const Component = isDesktop ? DialogClose : DrawerClose;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaContent = ({ className, children, ...props }: CredenzaProps) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery(desktop);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const Component = isDesktop ? DialogContent : DrawerContent;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaDescription = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop);
  const Component = isDesktop ? DialogDescription : DrawerDescription;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaHeader = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop);
  const Component = isDesktop ? DialogHeader : DrawerHeader;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaTitle = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop);
  const Component = isDesktop ? DialogTitle : DrawerTitle;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

const CredenzaBody = ({ className, children, ...props }: CredenzaProps) => {
  return (
    <ScrollArea className={cn('px-4 md:px-0', className)} {...props}>
      {children}
    </ScrollArea>
  );
};

const CredenzaFooter = ({ className, children, ...props }: CredenzaProps) => {
  const isDesktop = useMediaQuery(desktop);
  const Component = isDesktop ? DialogFooter : DrawerFooter;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};

export {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
};
