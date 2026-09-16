/**
 * Enhanced Recipe Sharing Component
 * Social sharing with preview, customization, and analytics
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('enhancedrecipesharing');



import { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Instagram, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cookTime?: number;
  servings?: number;
}

interface EnhancedRecipeSharingProps {
  recipe: Recipe;
  onShare?: (platform: string) => void;
}

export function EnhancedRecipeSharing({ recipe, onShare }: EnhancedRecipeSharingProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/recipes/${recipe.id}`;
  const shareText = `Check out this recipe: ${recipe.title}`;
  const shareImage = recipe.imageUrl || '/og-image.png';

  const shareOptions = [
    {
      platform: 'copy',
      label: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'text-gray-600',
      onClick: async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({ title: 'Link copied!' });
        setTimeout(() => setCopied(false), 2000);
        onShare?.('copy');
      },
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        onShare?.('facebook');
      },
    },
    {
      platform: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        onShare?.('twitter');
      },
    },
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
          '_blank'
        );
        onShare?.('whatsapp');
      },
    },
    {
      platform: 'email',
      label: 'Email',
      icon: Mail,
      color: 'text-gray-600',
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        onShare?.('email');
      },
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: shareUrl,
        });
        onShare?.('native');
      } catch (error) {
        // User cancelled or error
        _logger.info('Share cancelled');
      }
    } else {
      setShowShareMenu(true);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleNativeShare}
        variant="outline"
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Recipe
      </Button>

      <AnimatePresence>
        {showShareMenu && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowShareMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t rounded-t-2xl p-6 safe-area-inset-bottom"
            >
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Share Recipe</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShareMenu(false)}
                  >
                    Close
                  </Button>
                </div>

                {/* Recipe Preview */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {recipe.imageUrl && (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{recipe.title}</h4>
                        {recipe.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {recipe.cookTime && (
                            <Badge variant="secondary" className="text-xs">
                              {recipe.cookTime} min
                            </Badge>
                          )}
                          {recipe.servings && (
                            <Badge variant="secondary" className="text-xs">
                              Serves {recipe.servings}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Share Options */}
                <div className="grid grid-cols-2 gap-3">
                  {shareOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.platform}
                        onClick={option.onClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary transition-colors"
                      >
                        <Icon className={`w-6 h-6 ${option.color}`} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
