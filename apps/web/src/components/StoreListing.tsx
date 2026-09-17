'use client';

import React from 'react';

interface AppStoreListingProps {
  platform: 'ios' | 'android' | 'web';
}

export function AppStoreListing({ platform = 'web' }: { platform?: 'ios' | 'android' | 'web' }) {
  const storeLinks = {
    ios: 'https://apps.apple.com/app/whats-for-dinner',
    android: 'https://play.google.com/store/apps/details?id=com.hardonia.whatsfordinner',
    web: '/',
  };

  const storeInfo = {
    ios: {
      name: 'App Store',
      icon: '??',
      description: 'Available on the App Store',
    },
    android: {
      name: 'Google Play',
      icon: '??',
      description: 'Get it on Google Play',
    },
    web: {
      name: 'Web App',
      icon: '??',
      description: 'Use in your browser',
    },
  };

  const info = storeInfo[platform];

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-lg">
      <div className="text-4xl">{info.icon}</div>
      <h3 className="text-xl font-semibold">{info.name}</h3>
      <p className="text-muted-foreground text-center">{info.description}</p>
      <a
        href={storeLinks[platform]}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        {platform === 'ios' ? 'Download on App Store' : platform === 'android' ? 'Get it on Google Play' : 'Open Web App'}
      </a>
    </div>
  );
}

// App Store metadata generator (for store listings)
export function generateAppStoreMetadata() {
  return {
    ios: {
      name: "What's for Dinner?",
      subtitle: 'AI-Powered Meal Planning',
      description:
        'Discover delicious meals based on what you have. AI-powered recipe suggestions tailored to your preferences.',
      keywords: ['recipes', 'cooking', 'meal planning', 'AI', 'food'],
      category: 'Food & Drink',
      screenshots: [
        '/screenshots/ios/screenshot1.png',
        '/screenshots/ios/screenshot2.png',
        '/screenshots/ios/screenshot3.png',
      ],
      icon: '/icon-1024x1024.png',
      version: '1.0.0',
      ageRating: '4+',
    },
    android: {
      name: "What's for Dinner?",
      shortDescription: 'AI-Powered Meal Planning',
      fullDescription:
        'Discover delicious meals based on what you have. AI-powered recipe suggestions tailored to your preferences and dietary needs.',
      keywords: ['recipes', 'cooking', 'meal planning', 'AI', 'food'],
      category: 'FOOD_AND_DRINK',
      screenshots: [
        '/screenshots/android/screenshot1.png',
        '/screenshots/android/screenshot2.png',
        '/screenshots/android/screenshot3.png',
      ],
      icon: '/icon-512x512.png',
      version: '1.0.0',
      contentRating: 'Everyone',
    },
  };
}

export default AppStoreListing;
