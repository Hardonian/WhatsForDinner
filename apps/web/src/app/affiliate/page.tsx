'use client';

export const dynamic = 'force-dynamic';

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Check, 
  ArrowRight, 
  Percent, 
  Calendar, 
  CreditCard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AffiliateStats {
  total_conversions: number;
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
  commission_rate: number;
}

interface AffiliateData {
  id: string;
  affiliate_code: string;
  status: string;
  commission_rate: number;
}

interface AffiliateConversion {
  commission_amount: number;
  status: string;
}

const DEFAULT_COMMISSION_RATE = 20;
const MINIMUM_PAYOUT = 50;

const generateAffiliateCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export default function AffiliateProgramPage() {
  const [user, setUser] = useState<User | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string>('');
  const [affiliateLink, setAffiliateLink] = useState<string>('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [calculatorAmount, setCalculatorAmount] = useState<number>(100);
  const supabase = createClientComponentClient();

  const loadAffiliateStats = useCallback(async (affiliateId: string) => {
    const [conversionsResponse, affiliateResponse] = await Promise.all([
      supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', affiliateId),
      supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single(),
    ]);

    const conversions = conversionsResponse.data || [];
    const affiliate = affiliateResponse.data;

    if (!affiliate) {
      return;
    }

    const completed = conversions.filter((c: AffiliateConversion) => c.status === 'paid').length;
    const totalEarnings = conversions.reduce(
      (sum: number, c: AffiliateConversion) => sum + (c.commission_amount || 0),
      0
    );
    const paidEarnings = conversions
      .filter((c: AffiliateConversion) => c.status === 'paid')
      .reduce((sum: number, c: AffiliateConversion) => sum + (c.commission_amount || 0), 0);

    setStats({
      total_conversions: completed,
      total_earnings: totalEarnings,
      paid_earnings: paidEarnings,
      pending_earnings: totalEarnings - paidEarnings,
      commission_rate: affiliate.commission_rate || DEFAULT_COMMISSION_RATE,
    });
  }, [supabase]);

  const loadUserData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);

    if (!authUser) {
      return;
    }

    // Check if user is an affiliate
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (affiliate) {
      setIsAffiliate(true);
      setAffiliateCode(affiliate.affiliate_code);
      setApplicationStatus(affiliate.status);
      await loadAffiliateStats(affiliate.id);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      setAffiliateLink(`${baseUrl}/signup?aff=${affiliate.affiliate_code}`);
    }
  }, [supabase, loadAffiliateStats]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const handleApply = useCallback(async () => {
    if (!user) {
      window.location.href = '/signup?redirect=/affiliate';
      return;
    }

    // Create affiliate application
    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: generateAffiliateCode(),
        contact_email: user.email || '',
        status: 'pending',
        commission_rate: DEFAULT_COMMISSION_RATE,
      })
      .select()
      .single();

    if (error) {
      _logger.error('Failed to create affiliate application:', { error: error instanceof Error ? error.message : String(error) });
      return;
    }

    if (data) {
      setIsAffiliate(true);
      setApplicationStatus('pending');
      alert('Application submitted! We\'ll review and approve your affiliate account within 24-48 hours.');
    }
  }, [user, supabase]);

  const calculateCommission = useCallback((revenue: number, rate: number = DEFAULT_COMMISSION_RATE): number => {
    return (revenue * rate) / 100;
  }, []);

  const commissionCalculations = useMemo(() => {
    const monthly = calculateCommission(calculatorAmount);
    const annual = monthly * 12;
    return { monthly, annual };
  }, [calculatorAmount, calculateCommission]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <DollarSign className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">
          Affiliate Program
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Earn <strong>20% recurring commission</strong> on every subscription you refer. 
          High conversion rates, competitive commissions, and monthly payouts.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Percent className="w-4 h-4 mr-2" />
            20% Recurring Commission
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly Payouts
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            High Conversion Rates
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <CreditCard className="w-4 h-4 mr-2" />
            $50 Minimum Payout
          </Badge>
        </div>
      </div>

      {/* Commission Calculator */}
      <Card className="mb-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate your potential earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Monthly Recurring Revenue (MRR) Referred
              </label>
              <div className="flex gap-4 items-center">
                <Input
                  type="number"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                  className="max-w-xs"
                />
                <span className="text-muted-foreground">USD</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 pt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Commission</CardDescription>
                  <CardTitle className="text-2xl">
                    ${commissionCalculations.monthly.toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Annual Commission</CardDescription>
                  <CardTitle className="text-2xl">
                    ${commissionCalculations.annual.toFixed(2)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>At 20% Commission Rate</CardDescription>
                  <CardTitle className="text-2xl text-muted-foreground">
                    20%
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Example:</strong> If you refer 10 customers paying $10/month each ($100 MRR), 
                  you earn ${commissionCalculations.monthly.toFixed(2)}/month (${commissionCalculations.annual.toFixed(2)}/year) in recurring commissions.
                </p>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      {isAffiliate && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Conversions</CardDescription>
              <CardTitle className="text-3xl">{stats.total_conversions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-3xl">${stats.total_earnings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid Out</CardDescription>
              <CardTitle className="text-3xl">${stats.paid_earnings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl">${stats.pending_earnings.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="mb-12">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Why Join Our Affiliate Program?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">High Conversion Rates</h4>
                    <p className="text-sm text-muted-foreground">
                      Our meal planning app has strong conversion rates from free to paid
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Recurring Commissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Earn 20% commission every month for as long as your referrals stay subscribed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Marketing Materials</h4>
                    <p className="text-sm text-muted-foreground">
                      Access banners, email templates, and promotional content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Real-Time Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Track clicks, conversions, and earnings in your dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Commission Structure</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>20% recurring</strong> on all subscription plans</li>
                    <li>• <strong>10% one-time</strong> on annual plans (in addition to recurring)</li>
                    <li>• <strong>5%</strong> on trial conversions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cookie Duration</h4>
                  <p className="text-sm text-muted-foreground">
                    90-day cookie window - you get credit for conversions within 90 days
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Minimum Payout</h4>
                  <p className="text-sm text-muted-foreground">
                    $50 minimum balance required for payout
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isAffiliate && (
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Ready to Start Earning?</CardTitle>
                <CardDescription>
                  Apply to join our affiliate program - approval typically takes 24-48 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" onClick={handleApply} className="w-full md:w-auto">
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {isAffiliate && applicationStatus === 'pending' && (
            <Card className="bg-yellow-50 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle>Application Pending</CardTitle>
                <CardDescription>
                  Your affiliate application is under review. We'll notify you via email once approved (usually within 24-48 hours).
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isAffiliate && applicationStatus === 'approved' && (
            <Card className="bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle>Your Affiliate Link</CardTitle>
                <CardDescription>
                  Share this link to start earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={affiliateLink} readOnly className="font-mono" />
                  <Button
                    onClick={() => navigator.clipboard.writeText(affiliateLink)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
              <CardDescription>
                Detailed breakdown of how commissions work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Monthly Subscriptions</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Earn 20% recurring commission on every monthly subscription you refer.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <strong>Example:</strong> Refer a Pro plan ($10/month) → Earn $2/month recurring
                    </p>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold mb-2">Annual Subscriptions</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Earn 20% recurring + 10% one-time bonus on annual plans.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <strong>Example:</strong> Refer an Annual Pro plan ($100/year) → Earn $20/year recurring + $10 one-time = $30 total
                    </p>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold mb-2">Trial Conversions</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Earn 5% commission when someone converts from a free trial to paid.
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <strong>Example:</strong> Refer a trial that converts to $10/month → Earn $0.50 one-time
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Commission Tiers</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>0-10 referrals</span>
                    <Badge>20%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>11-50 referrals</span>
                    <Badge>22%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>51-100 referrals</span>
                    <Badge>25%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>100+ referrals</span>
                    <Badge>30%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
              <CardDescription>
                How and when you get paid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Payout Methods</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• PayPal (instant, preferred)</li>
                    <li>• Bank Transfer (1-3 business days)</li>
                    <li>• Stripe (instant)</li>
                    <li>• Check (5-7 business days)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Payout Schedule</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Monthly:</strong> First business day of each month</li>
                    <li>• <strong>Minimum:</strong> $50 balance required</li>
                    <li>• <strong>Processing:</strong> 1-3 business days</li>
                    <li>• <strong>Reports:</strong> Detailed statements provided</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Note:</strong> Commissions are tracked in real-time but paid monthly. 
                  You'll receive a detailed payout report with each payment.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          {isAffiliate && applicationStatus === 'approved' ? (
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Dashboard</CardTitle>
                <CardDescription>
                  Track your performance and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Full dashboard coming soon. Track conversions, earnings, clicks, and performance metrics.
                  </p>
                  <Button asChild>
                    <a href="/dashboard/affiliate">View Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Access</CardTitle>
                <CardDescription>
                  Apply to become an affiliate to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleApply}>
                  Apply Now
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
            <h3 className="font-semibold mb-2">How do I get approved?</h3>
            <p className="text-muted-foreground text-sm">
              Submit an application and we'll review it within 24-48 hours. 
              We approve most legitimate affiliates automatically.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">When do I get paid?</h3>
            <p className="text-muted-foreground text-sm">
              Payouts are processed monthly on the first business day of each month for the previous month's earnings.
              Minimum payout is $50.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How long do commissions last?</h3>
            <p className="text-muted-foreground text-sm">
              You earn recurring commissions for as long as your referrals remain subscribed. 
              If they cancel and resubscribe, you continue earning.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I promote on social media?</h3>
            <p className="text-muted-foreground text-sm">
              Yes! You can promote on any platform. We provide marketing materials and guidelines to help you succeed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="mt-12 text-center bg-primary/5 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join our affiliate program and start earning recurring commissions today. 
          No experience required - we provide all the tools you need.
        </p>
        {!isAffiliate ? (
          <Button size="lg" onClick={handleApply}>
            Apply to Join Program
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        ) : applicationStatus === 'approved' ? (
          <Button size="lg" asChild>
            <a href="/dashboard/affiliate">Go to Dashboard</a>
          </Button>
        ) : (
          <p className="text-muted-foreground">Your application is pending approval</p>
        )}
      </div>
    </div>
  );
}