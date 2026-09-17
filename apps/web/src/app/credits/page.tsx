export const dynamic = 'force-dynamic';

/**
 * Pay-Per-Use Credits Page
 * Alternative to subscription model
 */

'use client';

import { useState } from 'react';
import { Zap, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const creditPacks = [
  {
    id: '10',
    credits: 10,
    price: 4.99,
    popular: false,
    bonus: 0,
  },
  {
    id: '25',
    credits: 25,
    price: 9.99,
    popular: true,
    bonus: 5, // 5 bonus credits
  },
  {
    id: '50',
    credits: 50,
    price: 19.99,
    popular: false,
    bonus: 10,
  },
  {
    id: '200',
    credits: 200,
    price: 69.99,
    popular: false,
    bonus: 50,
  },
];

export default function CreditsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Recipe Credits</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Pay only for what you use. Perfect for occasional meal planners.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {creditPacks.map(pack => (
          <Card
            key={pack.id}
            className={`relative ${pack.popular ? 'border-2 border-primary shadow-xl' : ''}`}
          >
            {pack.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl mb-2">
                {pack.credits} Credits
              </CardTitle>
              <CardDescription>
                {pack.bonus > 0 && (
                  <span className="text-green-600 font-semibold">
                    +{pack.bonus} bonus credits
                  </span>
                )}
              </CardDescription>
              <div className="mt-4">
                <div className="text-4xl font-bold">${pack.price}</div>
                <div className="text-sm text-muted-foreground">
                  ${(pack.price / (pack.credits + pack.bonus)).toFixed(2)} per credit
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  {pack.credits + pack.bonus} recipe generations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Never expires
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Use anytime
                </li>
              </ul>
              <Button className="w-full" variant={pack.popular ? 'default' : 'outline'} asChild>
                <a href={`/api/marketplace/purchase?type=credits&pack=${pack.id}`}>
                  Purchase
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Credits vs Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Credits (Pay-Per-Use)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Pay only when you use</li>
                <li>✓ No monthly commitment</li>
                <li>✓ Credits never expire</li>
                <li>✓ Perfect for occasional users</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Subscription (Pro)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Unlimited recipes</li>
                <li>✓ Advanced customization</li>
                <li>✓ Priority support</li>
                <li>✓ Best value for regular users</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link href="/pricing">Compare All Plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
