/**
 * Pricing Section Component
 * 
 * Clear pricing with value proposition
 * Optimized for conversion
 */

'use client';

import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out meal planning',
    features: [
      '5 meal suggestions per week',
      'Basic meal planning',
      'Grocery list generation',
      'Mobile app access',
      'Community support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'For families who want the best',
    features: [
      'Unlimited meal suggestions',
      'Advanced meal planning',
      'Nutrition tracking & goals',
      'Family collaboration',
      'Priority support',
      'Recipe customization',
      'Meal prep guides',
      'Export to calendar',
    ],
    cta: 'Start Free Trial',
    popular: true,
    savings: 'Save $20/year',
  },
  {
    name: 'Annual',
    price: '$79.99',
    period: 'per year',
    description: 'Best value for committed users',
    features: [
      'Everything in Premium',
      'Annual billing discount',
      'Early access to features',
      'Priority feature requests',
      'Dedicated support',
    ],
    cta: 'Save 33%',
    popular: false,
    savings: 'Save $40/year',
  },
];

export function PricingSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mb-2 text-xl text-muted-foreground">
            Start free, upgrade when you&apos;re ready
          </p>
          <p className="mb-16 text-sm text-muted-foreground">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-8 ${
                plan.popular
                  ? 'border-primary shadow-lg ring-2 ring-primary'
                  : 'bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full border bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {plan.savings && (
                <div className="mb-4 text-center">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {plan.savings}
                  </span>
                </div>
              )}

              <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>

              <Button
                asChild
                className="mb-6 w-full"
                variant={plan.popular ? 'default' : 'outline'}
                size="lg"
              >
                <Link href="/auth/signup">{plan.cta}</Link>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">30-day money-back guarantee</strong> • If you&apos;re not
            satisfied, we&apos;ll refund every penny. No questions asked.
          </p>
        </div>
      </div>
    </section>
  );
}
