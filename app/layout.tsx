import { Inter, JetBrains_Mono } from 'next/font/google';

import { Providers } from '@/components/providers';
import { cn } from '@/lib/utils';

import './globals.css';

import type { Metadata } from 'next';

const fontSans = Inter({
  variable: '--font-sans',
  display: 'swap',
  subsets: ['latin'],
});

const fontMono = JetBrains_Mono({
  variable: '--font-mono',
  display: 'swap',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kelas Live | InfoLive',
  description: 'Platform live streaming dan kelas interaktif untuk guru dan siswa SMA Informatika.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans text-foreground antialiased',
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
