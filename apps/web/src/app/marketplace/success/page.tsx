export const dynamic = 'force-dynamic';

/**
 * Marketplace Purchase Success Page
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MarketplaceSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [purchaseType, setPurchaseType] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Verify purchase and unlock content
      fetch(`/api/marketplace/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setPurchaseType(data.type);
        });
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-primary/5">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl mb-2">Purchase Successful!</CardTitle>
          <p className="text-muted-foreground">
            {purchaseType === 'recipe_pack'
              ? 'Your recipe pack is now available in your library.'
              : purchaseType === 'credits'
              ? 'Your credits have been added to your account.'
              : 'Thank you for your purchase!'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
            Go to Dashboard
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/marketplace">Browse More Packs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
