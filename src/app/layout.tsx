import { Providers } from '@/providers';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Toolify - Ultimate Developer Toolkit',
    template: '%s | Toolify',
  },
  description:
    '144+ professional tools in your browser. No downloads, no installations. JSON formatter, image tools, PDF utilities, code generators, and more.',
  keywords: [
    'developer tools',
    'web tools',
    'JSON formatter',
    'image tools',
    'PDF tools',
    'code generator',
    'base64 converter',
    'color converter',
    'password generator',
    'QR generator',
    'text tools',
    'time tools',
    'unit converter',
    'web3 tools',
    'browser tools',
    'online tools',
    'free tools',
  ],
  authors: [{ name: 'BankkRoll' }],
  creator: 'BankkRoll',
  publisher: 'Toolify',
  metadataBase: new URL('https://toolify-tools-site.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://toolify-tools-site.vercel.app',
    title: 'Toolify - Ultimate Developer Toolkit',
    description:
      '144+ professional tools in your browser. No downloads, no installations. JSON formatter, image tools, PDF utilities, code generators, and more.',
    siteName: 'Toolify',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Toolify - Ultimate Developer Toolkit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toolify - Ultimate Developer Toolkit',
    description:
      '144+ professional tools in your browser. No downloads, no installations. JSON formatter, image tools, PDF utilities, code generators, and more.',
    images: ['/og-image.png'],
    creator: '@bankkroll_eth',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
