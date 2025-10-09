'use client';

import { ThemeProvider } from 'next-themes';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster richColors expand position="top-center" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
