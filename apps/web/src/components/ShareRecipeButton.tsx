/**
 * Share Recipe Button with Rewards
 * Encourages viral sharing with rewards
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('sharerecipebutton');



import { useState } from 'react';
import { Share2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShareRecipeButtonProps {
  recipe: {
    id: string;
    title: string;
    image?: string;
  };
  onShare?: () => void;
}

export function ShareRecipeButton({ recipe, onShare }: ShareRecipeButtonProps) {
  const [showReward, setShowReward] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: recipe.title,
      text: `Check out this recipe: ${recipe.title}`,
      url: `${window.location.origin}/recipes/${recipe.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
      }

      // Track share
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'share_recipe', {
          event_category: 'engagement',
          event_label: recipe.id
        });
      }

      // Show reward
      setShowReward(true);
      
      // Award reward (1 free Pro feature)
      await fetch('/api/share/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id })
      });

      onShare?.();
    } catch (error) {
      _logger.error('Share error:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <>
      <Button
        onClick={handleShare}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Recipe
      </Button>

      <Dialog open={showReward} onOpenChange={setShowReward}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Thanks for Sharing!
            </DialogTitle>
            <DialogDescription>
              You've earned 1 free Pro feature credit. Use it to unlock unlimited recipes or advanced customization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={() => setShowReward(false)} className="flex-1">
              Awesome!
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="/account/rewards">View Rewards</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
