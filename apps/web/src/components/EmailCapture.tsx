'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Check, Sparkles } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

interface EmailCaptureProps {
  title?: string;
  description?: string;
  cta?: string;
  variant?: 'default' | 'inline' | 'modal';
  source?: string;
  onSuccess?: () => void | Promise<void>;
}

export default function EmailCapture({
  title = "Get Recipe Ideas Delivered",
  description = "Join thousands getting AI-powered meal suggestions. No spam, unsubscribe anytime.",
  cta = "Get Started Free",
  variant = 'default',
  source = 'email_capture',
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Store email in database (waitlist or newsletter)
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email,
          source,
          created_at: new Date().toISOString(),
        });

      if (error && error.code !== '23505') { // Ignore duplicate email errors
        throw error;
      }

      // Track event
      await analytics.trackEvent('email_captured', {
        email,
        source,
        variant,
      });

      // Send welcome email (via Supabase Edge Function or external service)
      // This would typically call an API endpoint that sends the email

      setSubmitted(true);
      toast.success('Thanks! Check your email for next steps.');
      await onSuccess?.();

      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
      }, 3000);
    } catch (error) {
      // Error handled: Error capturing email:
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
            <Check className="h-5 w-5" />
            <div>
              <p className="font-semibold">Thanks for joining!</p>
              <p className="text-sm">Check your email for next steps.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : cta}
        </Button>
      </form>
    );
  }

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !email}>
              {loading ? (
                '...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {cta}
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
