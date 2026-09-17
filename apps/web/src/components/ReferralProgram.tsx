'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  referral_code: string;
  referral_link: string;
}

export default function ReferralProgram() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadReferralStats(user.id);
      }

      setLoading(false);
    };

    getUser();
  }, []);

  const loadReferralStats = async (userId: string) => {
    try {
      // Get or create referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      let referralCode = profile?.referral_code;

      if (!referralCode) {
        // Generate unique referral code
        referralCode = `REF${userId.slice(0, 8).toUpperCase()}`;
        
        // Save to profile
        await supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('id', userId);
      }

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

      setStats({
        total_referrals: referrals?.length || 0,
        successful_referrals: referrals?.filter(r => r.status === 'completed').length || 0,
        pending_referrals: referrals?.filter(r => r.status === 'pending').length || 0,
        referral_code: referralCode,
        referral_link: referralLink,
      });
    } catch (error) {
      // Error handled: Error loading referral stats:
    }
  };

  const copyReferralLink = async () => {
    if (!stats) return;

    try {
      await navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      
      await analytics.trackEvent('referral_link_copied', {
        user_id: user?.id,
        referral_code: stats.referral_code,
      });

      toast.success('Referral link copied!');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Error handled: Error copying link:
      toast.error('Failed to copy link');
    }
  };

  const shareReferral = async () => {
    if (!stats) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Try What\'s for Dinner?',
          text: 'Get AI-powered recipe suggestions from your pantry!',
          url: stats.referral_link,
        });

        await analytics.trackEvent('referral_shared', {
          user_id: user?.id,
          method: 'native_share',
        });
      } else {
        // Fallback to copy
        await copyReferralLink();
      }
    } catch (error) {
      // Error handled: Error sharing:
    }
  };

  if (loading || !user || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Referral Program</CardTitle>
            <CardDescription>Share with friends and earn rewards</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total_referrals}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful_referrals}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending_referrals}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 bg-muted rounded-md font-mono text-sm">
              {stats.referral_code}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyReferralLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 bg-muted rounded-md text-sm truncate">
              {stats.referral_link}
            </div>
            <Button
              size="sm"
              onClick={shareReferral}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-semibold">You get:</div>
              <div className="text-sm text-muted-foreground">
                1 month free Pro for each successful referral
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-semibold">They get:</div>
              <div className="text-sm text-muted-foreground">
                14 days free Pro trial when they sign up
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full"
          onClick={shareReferral}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Referral Link
        </Button>
      </CardContent>
    </Card>
  );
}
