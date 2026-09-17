'use client';

export const dynamic = 'force-dynamic';

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { Gift, Users, TrendingUp, Copy, Check, Share2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  total_rewards: number;
  pending_rewards: number;
}

interface Referral {
  referral_code: string;
  status: string;
}

interface ReferralReward {
  amount: number;
  status: string;
}

const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default function ReferralProgramPage() {
  const [user, setUser] = useState<User | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClientComponentClient();

  const loadStats = useCallback(async (userId: string) => {
    const [referralsResponse, rewardsResponse] = await Promise.all([
      supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId),
      supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId),
    ]);

    const referrals = referralsResponse.data || [];
    const rewards = rewardsResponse.data || [];

    const completed = referrals.filter((r) => r.status === 'completed').length;
    const totalRewards = rewards.reduce(
      (sum: number, r: ReferralReward) => sum + (r.amount || 0),
      0
    );
    const pendingRewards = rewards
      .filter((r) => r.status === 'pending')
      .reduce((sum: number, r: ReferralReward) => sum + (r.amount || 0), 0);

    setStats({
      total_referrals: referrals.length,
      completed_referrals: completed,
      total_rewards: totalRewards,
      pending_rewards: pendingRewards,
    });
  }, [supabase]);

  const loadUserData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    if (!authUser) {
      return;
    }

    // Get or create referral code
    const { data: referral } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', authUser.id)
      .limit(1)
      .single();

    let code = '';

    if (referral) {
      code = referral.referral_code;
      setReferralCode(code);
    } else {
      // Generate new referral code
      const newCode = generateReferralCode();
      const { data: newReferral } = await supabase
        .from('referrals')
        .insert({
          referrer_id: authUser.id,
          referral_code: newCode,
          referrer_reward_type: 'subscription_days',
          referrer_reward_amount: 30,
          referred_reward_type: 'subscription_days',
          referred_reward_amount: 30,
        })
        .select('referral_code')
        .single();

      if (newReferral) {
        code = newReferral.referral_code;
        setReferralCode(code);
      }
    }

    // Set referral link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setReferralLink(`${baseUrl}/signup?ref=${code || 'YOUR_CODE'}`);

    // Load stats
    await loadStats(authUser.id);
  }, [supabase, loadStats]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      _logger.error('Failed to copy to clipboard:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  const shareReferral = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join What\'s for Dinner - Get 30 Days Free!',
          text: 'I love using What\'s for Dinner for meal planning. Join me and we both get 30 days free!',
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          _logger.error('Error sharing:', { error: error instanceof Error ? error.message : String(error) });
        }
      }
    } else {
      await copyToClipboard(referralLink);
    }
  }, [referralLink, copyToClipboard]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Gift className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">
          Referral Program
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Invite friends to What's for Dinner and both of you get <strong>30 days of premium free</strong>! 
          Share your unique link and start earning rewards today.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Award className="w-4 h-4 mr-2" />
            Both Get 30 Days Free
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            Unlimited Referrals
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Instant Rewards
          </Badge>
        </div>
      </div>

      {/* Stats Section */}
      {user && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Referrals</CardDescription>
              <CardTitle className="text-3xl">{stats.total_referrals}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.completed_referrals}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Rewards</CardDescription>
              <CardTitle className="text-3xl">{stats.total_rewards}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">{stats.pending_rewards}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue="how-it-works" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="how-it-works" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How the Referral Program Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Get Your Referral Link</h3>
                  <p className="text-muted-foreground">
                    Sign up or log in to get your unique referral code. Share it with friends, family, or on social media.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Your Friend Signs Up</h3>
                  <p className="text-muted-foreground">
                    When someone uses your referral link to sign up and subscribes, they get 30 days of premium free.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">You Both Get Rewarded</h3>
                  <p className="text-muted-foreground">
                    Once they subscribe, you automatically receive 30 days of premium added to your account. 
                    No limits on how many friends you can refer!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Link Section */}
          {user ? (
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>
                  Share this link with friends to start earning rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    onClick={() => copyToClipboard(referralLink)}
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={shareReferral}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Or use your referral code: <code className="bg-muted px-2 py-1 rounded">{referralCode}</code>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Sign up or log in to get your referral link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button asChild>
                    <a href="/signup">Sign Up Free</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/login">Log In</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reward Structure</CardTitle>
              <CardDescription>
                Here's what you and your friends get
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      For You (Referrer)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>30 days</strong> of premium subscription free</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>Unlimited</strong> referrals - earn for every friend</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>Instant</strong> rewards when they subscribe</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>Stackable</strong> - rewards accumulate</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      For Your Friend (Referred)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>30 days</strong> of premium subscription free</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>Full access</strong> to all premium features</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>No credit card</strong> required for trial</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5" />
                        <span><strong>Cancel anytime</strong> - no commitment</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Example:</h3>
                <p className="text-sm text-muted-foreground">
                  Refer 5 friends → You get 150 days (5 months) of premium free! 
                  Refer 10 friends → You get 300 days (10 months) of premium free!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>My Referral Dashboard</CardTitle>
                <CardDescription>
                  Track your referrals and rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Dashboard coming soon. Track your referrals, see pending rewards, and manage your referral activity.
                  </p>
                  <Button asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>
                  Log in to view your referral dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href="/login">Log In</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How do I get my referral link?</h3>
            <p className="text-muted-foreground text-sm">
              Sign up or log in to your account and you'll automatically get a unique referral link. 
              You can find it on this page or in your account settings.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">When do I get my reward?</h3>
            <p className="text-muted-foreground text-sm">
              You receive your 30 days of premium free as soon as your friend signs up and subscribes to a paid plan.
              Rewards are applied automatically to your account.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Is there a limit on referrals?</h3>
            <p className="text-muted-foreground text-sm">
              No! There's no limit on how many friends you can refer. Each successful referral earns you 30 days of premium.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I use my referral code multiple times?</h3>
            <p className="text-muted-foreground text-sm">
              Yes! Your referral link can be used unlimited times. Every time someone signs up using your link and subscribes, 
              you both get rewarded.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do rewards expire?</h3>
            <p className="text-muted-foreground text-sm">
              Subscription day rewards never expire. They're added to your account and can be used whenever you have an active subscription.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="mt-12 text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of users who are earning free premium time by sharing What's for Dinner with their friends.
        </p>
        {user ? (
          <Button size="lg" onClick={shareReferral}>
            <Share2 className="w-5 h-5 mr-2" />
            Share Your Referral Link
          </Button>
        ) : (
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/signup?ref=home">Get Started Free</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/login">Log In</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
