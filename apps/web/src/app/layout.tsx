/**

export const dynamic = "force-dynamic";
 * Root Layout
 * 
 * Includes analytics initialization
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AnalyticsInitializer } from '@/components/analytics/AnalyticsInitializer';
import { CommandPalette } from '@/components/CommandPalette';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: "What's For Dinner - AI-Powered Meal Planning",
    template: "%s | What's For Dinner",
  },
  description: 'Never wonder what\'s for dinner again. Get personalized meal suggestions in seconds based on ingredients you already have.',
  keywords: [
    'meal planning',
    'recipe generator',
    'pantry recipes',
    'dinner ideas',
    'meal prep',
    'AI recipes',
    'what to cook',
    'ingredient-based recipes',
  ],
  authors: [{ name: "What's For Dinner Team" }],
  creator: "What's For Dinner",
  publisher: "What's For Dinner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://whatsfordinner.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://whatsfordinner.app',
    title: "What's For Dinner - AI-Powered Meal Planning",
    description: 'Never wonder what\'s for dinner again. Get personalized meal suggestions in seconds based on ingredients you already have.',
    siteName: "What's For Dinner",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "What's For Dinner - AI-Powered Meal Planning",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "What's For Dinner - AI-Powered Meal Planning",
    description: 'Never wonder what\'s for dinner again. Get personalized meal suggestions in seconds.',
    images: ['/og-image.png'],
    creator: '@whatsfordinner',
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsInitializer />
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
