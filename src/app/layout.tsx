import { AnalyticsProvider } from "@/providers/analytics-provider";
import { MotionProvider } from "@/providers/motion-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "Toolify",
  description: "A collection of tools for various tasks.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [
      {
        url: "https://toolify-tools-site.vercel.app/og-image.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
