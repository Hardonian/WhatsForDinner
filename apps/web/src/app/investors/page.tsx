'use client';

export const dynamic = 'force-dynamic';
/**
 * Investors Page
 * Financial metrics, growth projections, and investor materials
 */


import { TrendingUp, Users, DollarSign, BarChart3, Download, Target, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function InvestorsPage() {
  const metrics = {
    users: 12847,
    mrr: 15000,
    arr: 180000,
    growth_rate: 40,
    churn_rate: 5,
    ltv: 240,
    cac: 15,
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Investor Information</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transparency, growth, and opportunity. Here's what investors need to know.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Recurring Revenue</CardDescription>
            <CardTitle className="text-3xl">${(metrics.mrr / 1000).toFixed(1)}K</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{metrics.growth_rate}% MoM</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Annual Recurring Revenue</CardDescription>
            <CardTitle className="text-3xl">${(metrics.arr / 1000).toFixed(0)}K</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Projected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl">{metrics.users.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Users className="w-4 h-4" />
              <span>Growing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LTV:CAC Ratio</CardDescription>
            <CardTitle className="text-3xl">{Math.round(metrics.ltv / metrics.cac)}:1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              LTV: ${metrics.ltv} | CAC: ${metrics.cac}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Unit Economics</CardTitle>
          <CardDescription>Healthy unit economics with strong growth potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold mb-2">${metrics.ltv}</div>
              <div className="text-sm text-muted-foreground mb-1">Lifetime Value (LTV)</div>
              <div className="text-xs text-green-600">Strong LTV from recurring revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-2">${metrics.cac}</div>
              <div className="text-sm text-muted-foreground mb-1">Customer Acquisition Cost (CAC)</div>
              <div className="text-xs text-green-600">Low CAC through organic growth</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-2">{metrics.churn_rate}%</div>
              <div className="text-sm text-muted-foreground mb-1">Monthly Churn Rate</div>
              <div className="text-xs text-green-600">Industry-leading retention</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Opportunity */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Market Opportunity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Total Addressable Market (TAM)</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Meal Planning Apps</span>
                  <span className="font-semibold">$2.5B</span>
                </div>
                <div className="flex justify-between">
                  <span>Food Tech Market</span>
                  <span className="font-semibold">$250B</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Cooking Market</span>
                  <span className="font-semibold">$1.2T</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Growth Drivers</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <span>AI-powered personalization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <span>Viral referral program</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="w-5 h-5 text-primary mt-0.5" />
                  <span>Global market expansion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <span>Multiple revenue streams</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Projections */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Revenue Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Month 1</div>
                <div className="text-2xl font-bold">$1.5K</div>
                <div className="text-xs text-muted-foreground">MRR</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Month 3</div>
                <div className="text-2xl font-bold">$7.5K</div>
                <div className="text-xs text-muted-foreground">MRR</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Month 6</div>
                <div className="text-2xl font-bold">$22.5K</div>
                <div className="text-xs text-muted-foreground">MRR</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="text-sm text-muted-foreground mb-1">Year 1</div>
                <div className="text-2xl font-bold">$300K</div>
                <div className="text-xs text-muted-foreground">ARR</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Advantages */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Competitive Advantages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'AI-Powered Intelligence',
                desc: 'Advanced AI that learns user preferences and improves over time'
              },
              {
                title: 'Viral Growth Engine',
                desc: 'Referral and affiliate programs driving 30%+ of new users'
              },
              {
                title: 'Multiple Revenue Streams',
                desc: 'Subscriptions, partnerships, and enterprise deals'
              },
              {
                title: 'Strong Unit Economics',
                desc: 'High LTV:CAC ratio with low churn rate'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Interested in Investing?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're always looking for strategic partners who share our vision of making meal planning effortless.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="mailto:investors@whatsfordinner.com">
                Contact Investor Relations
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs/investor-deck.pdf" target="_blank">
                <Download className="w-4 h-4 mr-2" />
                Download Investor Deck
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}