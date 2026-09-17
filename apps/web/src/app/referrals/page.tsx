'use client';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Copy, Share2, Gift, Users } from 'lucide-react';
import { toast } from '@/lib/ux/toast';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  rewardsEarned: number;
}

export default function ReferralsPage() {
  const [user, setUser] = useState<unknown>(null);
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setError('Please sign in to access referrals');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/referrals');
        if (!response.ok) {
          throw new Error('Failed to fetch referral data');
        }

        const referralData = await response.json();
        setData(referralData);
      } catch (err: any) {
        setError(err.message || 'Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyReferralLink = async () => {
    if (data?.referralLink) {
      await navigator.clipboard.writeText(data.referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const shareReferralLink = async () => {
    if (data?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: 'Try What\'s for Dinner',
          text: 'Get personalized meal suggestions based on what you have in your pantry!',
          url: data.referralLink,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="border-destructive max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'No referral data available'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground mt-2">
            Share What's for Dinner with friends and earn rewards!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends. You both get 1 month free Pro when they sign up!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={data.referralLink}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={shareReferralLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Referral Code: <code className="px-2 py-1 bg-muted rounded">{data.referralCode}</code>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalReferrals}</div>
              <p className="text-sm text-muted-foreground mt-2">People you've referred</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.activeReferrals}</div>
              <p className="text-sm text-muted-foreground mt-2">Currently using the app</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Rewards Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.rewardsEarned}</div>
              <p className="text-sm text-muted-foreground mt-2">Months of Pro earned</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Copy your referral link and share it with friends via email, social media, or text.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">They Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  When your friend signs up using your link, they get 1 month free Pro.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">You Get Rewarded</h3>
                <p className="text-sm text-muted-foreground">
                  You also get 1 month free Pro for each friend who signs up!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}