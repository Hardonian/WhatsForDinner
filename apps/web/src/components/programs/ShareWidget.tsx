/**
 * Social Sharing Widget for Programs
 * Makes sharing referral/affiliate links easy and trackable
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('sharewidget');



import { useState } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trackProgramEvent } from '@/lib/programs/tracking';

interface ShareWidgetProps {
  url: string;
  title: string;
  description: string;
  programType: 'referral' | 'affiliate';
  programId: string;
}

export function ShareWidget({ url, title, description, programType, programId }: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: string) => {
    const shareUrl = encodeURIComponent(url);
    const shareText = encodeURIComponent(description);
    const shareTitle = encodeURIComponent(title);

    let shareLink = '';

    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${shareTitle}&body=${shareText}%20${shareUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${shareText}%20${shareUrl}`;
        break;
      default:
        return;
    }

    // Track share
    await trackProgramEvent({
      programType,
      programId,
      eventType: 'click',
      metadata: { platform, action: 'share' },
    });

    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        await trackProgramEvent({
          programType,
          programId,
          eventType: 'click',
          metadata: { platform: 'native', action: 'share' },
        });
      } catch (error) {
        // User cancelled
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      await trackProgramEvent({
        programType,
        programId,
        eventType: 'click',
        metadata: { action: 'copy' },
      });
    } catch (error) {
      _logger.error('Failed to copy:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="flex gap-2">
      {navigator.share && (
        <Button variant="outline" size="sm" onClick={handleNativeShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')}>
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
