'use client';

import { X, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AdMobIntegration } from './AdMobIntegration';

interface AdPlacementProps {
  tier?: 'free' | 'premium' | 'partner';
  type?: 'feed-tile' | 'banner' | 'interstitial' | 'sponsored';
}

export function AdPlacement({ tier = 'free', type = 'feed-tile' }: AdPlacementProps) {
  const [dismissed, setDismissed] = useState(false);

  // Premium and Partner tiers don't show ads
  if (tier !== 'free') {
    return null;
  }

  if (dismissed && type === 'interstitial') {
    return null;
  }

  // Mock ad content - in production, this would come from AdMob or similar
  const adContent = {
    title: 'Try Premium',
    description: 'Get AI recommendations, offline sync, and ad-free experience',
    cta: 'Upgrade Now',
    image: '/api/placeholder/400/250',
    sponsored: type === 'sponsored',
  };

  const handleAdClick = () => {
    // Track ad click
        // In production: window.location.href = adUrl;
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Track dismissal
      };

  if (type === 'banner') {
    const adUnitId = process.env.NEXT_PUBLIC_ADMOB_BANNER_UNIT_ID;
    
    if (adUnitId) {
      return (
        <AdMobIntegration
          adUnitId={adUnitId}
          type="banner"
          className="w-full"
        />
      );
    }
    
    // Fallback house ad
    return (
      <Card className="p-4 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 border-brand-200 dark:border-brand-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                Ad
              </Badge>
              {adContent.sponsored && (
                <Badge variant="outline" className="text-xs">
                  Sponsored
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-sm mb-1">{adContent.title}</h4>
            <p className="text-xs text-muted-foreground">{adContent.description}</p>
          </div>
          <Button size="sm" onClick={handleAdClick}>
            {adContent.cta}
          </Button>
        </div>
      </Card>
    );
  }

  if (type === 'interstitial') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="relative max-w-md w-full mx-4 overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="aspect-video bg-gradient-to-br from-brand-400 to-accent-500 relative">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge variant="secondary" className="mb-2">Ad</Badge>
              <h3 className="text-white font-bold text-xl mb-1">{adContent.title}</h3>
              <p className="text-white/90 text-sm">{adContent.description}</p>
            </div>
          </div>
          <div className="p-4">
            <Button className="w-full" onClick={handleAdClick}>
              {adContent.cta}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Feed tile (default)
  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow border-2 border-dashed">
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4">
            <Badge variant="secondary" className="mb-2">Advertisement</Badge>
            <h4 className="font-semibold mb-1">{adContent.title}</h4>
            <p className="text-xs text-muted-foreground mb-3">{adContent.description}</p>
            <Button size="sm" onClick={handleAdClick}>
              {adContent.cta}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AdPlacement;
