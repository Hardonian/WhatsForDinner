/**
 * Lead Magnet Component
 * Captures emails with valuable free content
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('leadmagnet');



import { useState } from 'react';
import { Download, Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface LeadMagnetProps {
  title?: string;
  description?: string;
  offer?: string;
  cta?: string;
}

export function LeadMagnet({
  title = 'Get Your Free Meal Planning Guide',
  description = '7-Day Meal Planning Template + Grocery List System',
  offer = 'Free Download',
  cta = 'Get Free Guide'
}: LeadMagnetProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store email
      await supabase.from('email_leads').insert({
        email,
        source: 'lead_magnet',
        metadata: { offer: 'meal_planning_guide' },
        created_at: new Date().toISOString()
      });

      // Track conversion
      if (typeof window !== 'undefined') {
        window.gtag?.('event', 'lead_magnet_signup', {
          event_category: 'conversion',
          event_label: 'meal_planning_guide'
        });
      }

      setIsSuccess(true);
      
      // Redirect to download or send email
      // In production, integrate with email service to send guide
      setTimeout(() => {
        // Could download PDF or redirect
        window.location.href = '/downloads/meal-planning-guide.pdf';
      }, 1000);
    } catch (error) {
      _logger.error('Failed to capture lead:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="bg-green-50 dark:bg-green-950 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <Check className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Check Your Email!</h3>
            <p className="text-muted-foreground">
              We've sent your free guide to {email}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-lg"
          />
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {cta}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
