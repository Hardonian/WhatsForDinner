export const dynamic = 'force-dynamic';

/**
 * Credits Purchase Success Page
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreditsSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Verify purchase and get credits
      fetch(`/api/marketplace/verify?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.type === 'credits') {
            setCredits(parseInt(data.creditPack || '0'));
          }
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
          <CardTitle className="text-3xl mb-2">Credits Purchased!</CardTitle>
          <p className="text-muted-foreground">
            {credits ? `You now have ${credits} credits available.` : 'Your credits have been added to your account.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{credits || 'Credits'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ready to use for recipe generation and customization
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard')} className="w-full" size="lg">
            Start Using Credits
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/credits">Buy More Credits</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
