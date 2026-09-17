'use client';

export const dynamic = 'force-dynamic';
/**
 * Pricing Page - Optimized for Conversions
 * Clear value props, social proof, and conversion optimization
 */


import { useState } from 'react';
import { Check, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface PricingPlan {
  name: string;
  price: number;
  priceAnnual: number;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  savings?: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    description: 'Perfect for trying out meal planning',
    features: [
      'Basic meal planning',
      'Limited AI suggestions',
      'Manual pantry tracking',
      'Basic grocery lists',
      'Community recipes'
    ],
    cta: 'Get Started Free'
  },
  {
    name: 'Pro',
    price: 9.99,
    priceAnnual: 99.99,
    description: 'For individuals who want smarter planning',
    features: [
      'Unlimited AI meal suggestions',
      'Smart pantry tracking',
      'Auto-generated grocery lists',
      'Nutrition tracking',
      'Recipe collections',
      'Priority support',
      'Offline access'
    ],
    popular: true,
    cta: 'Start Pro Free Trial',
    savings: 'Save 17%'
  },
  {
    name: 'Family',
    price: 19.99,
    priceAnnual: 199.99,
    description: 'Perfect for families and households',
    features: [
      'Everything in Pro',
      'Shared meal plans',
      'Multiple dietary profiles',
      'Family calendar sync',
      'Kid-friendly recipes',
      'Budget tracking',
      'Unlimited family members'
    ],
    cta: 'Start Family Free Trial',
    savings: 'Save 17%'
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanSelect = async (plan: PricingPlan) => {
    if (plan.price === 0) {
      window.location.href = '/signup?plan=free';
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name.toLowerCase(),
          interval: billingCycle,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = `/signup?plan=${plan.name.toLowerCase()}`;
      }
    } catch {
      window.location.href = `/signup?plan=${plan.name.toLowerCase()}`;
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">
          <TrendingUp className="w-4 h-4 mr-2" />
          Join 12,847+ Happy Users
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Choose the plan that fits your needs. All plans include a free trial. 
          Cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md transition-colors ${
              billingCycle === 'annual'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Annual
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.popular
                ? 'border-2 border-primary shadow-xl scale-105'
                : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${billingCycle === 'annual' ? plan.priceAnnual : plan.price}
                  </span>
                  <span className="text-muted-foreground">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </div>
                {billingCycle === 'annual' && plan.savings && (
                  <div className="text-sm text-green-600 mt-1">{plan.savings}</div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full font-bold"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
                disabled={loadingPlan === plan.name}
                onClick={() => handlePlanSelect(plan)}
              >
                {loadingPlan === plan.name ? 'Connecting to Checkout...' : plan.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Proof */}
      <div className="bg-muted/50 rounded-2xl p-12 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Loved by Real Users</h2>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-lg font-semibold">4.8/5</span>
          </div>
          <p className="text-muted-foreground">Based on 2,847 reviews</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: 'This app gave me my evenings back. Planning meals used to take 2 hours, now it takes 2 minutes.',
              author: 'Sarah M.',
              role: 'Mom of 2'
            },
            {
              quote: 'Finally have variety without the stress. The AI suggestions are spot-on.',
              author: 'Mike R.',
              role: 'Solo Professional'
            },
            {
              quote: 'Perfect for meal prep! The nutrition tracking makes it easy to meet my health goals.',
              author: 'Jessica L.',
              role: 'Health Enthusiast'
            }
          ].map((testimonial, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <p className="text-sm mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Can I change plans later?',
              a: 'Yes! You can upgrade, downgrade, or cancel anytime. Changes take effect at your next billing cycle.'
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! All paid plans include a 14-day free trial. No credit card required.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
            },
            {
              q: 'Can I get a refund?',
              a: 'Yes, we offer a 30-day money-back guarantee. If you are not satisfied, we will refund you in full.'
            }
          ].map((faq, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of users who&apos;ve made meal planning effortless.
        </p>
        <Button size="lg" className="text-lg px-8 py-6" asChild>
          <Link href="/signup">
            Start Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}