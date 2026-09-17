'use client';

import { useEffect, useRef } from 'react';
import { initAdMob, loadAdMobBanner, isAPIConfigured } from '@/lib/nomad/external-apis';

interface AdMobIntegrationProps {
  adUnitId: string;
  type?: 'banner' | 'interstitial';
  className?: string;
}

/**
 * AdMob Integration Component
 * Displays ads from Google AdMob (with fallback to house ads)
 */
export function AdMobIntegration({
  adUnitId,
  type = 'banner',
  className = '',
}: AdMobIntegrationProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAPIConfigured('admob')) {
      // Show fallback house ad if AdMob not configured
      return;
    }

    const appId = process.env.NEXT_PUBLIC_ADMOB_APP_ID;
    if (!appId) return;

    // Initialize AdMob
    initAdMob({
      appId,
      adUnitId,
      type,
    });

    if (type === 'banner' && adRef.current) {
      // Load banner ad
      loadAdMobBanner(adUnitId);
    }
  }, [adUnitId, type]);

  if (!isAPIConfigured('admob')) {
    // Fallback house ad
    return (
      <div className={`bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Advertisement</p>
          <p className="text-sm font-semibold mb-1">Upgrade to Premium</p>
          <p className="text-xs text-muted-foreground mb-3">
            Get AI recommendations, offline sync, and ad-free experience
          </p>
          <button
            onClick={() => {
              window.location.href = '/nomad/pricing';
            }}
            className="text-xs bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700 transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    );
  }

  if (type === 'banner') {
    return (
      <div ref={adRef} className={className}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={process.env.NEXT_PUBLIC_ADMOB_APP_ID}
          data-ad-slot={adUnitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Interstitial ads are typically triggered programmatically
  return null;
}

/**
 * AdMob Interstitial Trigger
 * Call this function to show an interstitial ad
 */
export async function showInterstitialAd(adUnitId: string): Promise<boolean> {
  if (!isAPIConfigured('admob')) {
    return false;
  }

  // Interstitial ads require mobile SDK
  // For web, return false or show custom modal
  return false;
}

export default AdMobIntegration;
