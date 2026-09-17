'use client';

export const dynamic = 'force-dynamic';


/**
 * Beta User Onboarding Flow
 * 
 * Welcome flow for beta users with setup guide and progress tracking
 */

import { useState, useEffect } from 'react';
import { Check, ArrowRight, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';
import { referralTracker } from '@/lib/monetization/referral-tracker';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function BetaOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<unknown>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome Email Sent',
      description: 'Check your email for setup instructions',
      completed: false,
    },
    {
      id: 'pantry',
      title: 'Add Pantry Items',
      description: 'Add at least 3 ingredients to your pantry',
      completed: false,
    },
    {
      id: 'suggestion',
      title: 'Generate First Suggestion',
      description: 'Get your first AI-powered meal suggestion',
      completed: false,
    },
    {
      id: 'feedback',
      title: 'Provide Feedback',
      description: 'Share your experience to help us improve',
      completed: false,
    },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Track referral if present
        await referralTracker.initializeOnSignup(user.id);
        
        // Check progress
        checkProgress(user.id);
      }
    };

    fetchUser();
  }, []);

  const checkProgress = async (userId: string) => {
    // Check pantry items
    const { data: pantryItems } = await supabase
      .from('pantry_items')
      .select('id')
      .eq('user_id', userId);

    // Check suggestions generated
    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type')
      .eq('user_id', userId)
      .eq('event_type', 'MEAL_SUGGESTION_GENERATED');

    // Check feedback submitted
    const { data: feedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    setSteps(prev => prev.map(step => {
      if (step.id === 'pantry') {
        return { ...step, completed: (pantryItems?.length || 0) >= 3 };
      }
      if (step.id === 'suggestion') {
        return { ...step, completed: (events?.length || 0) > 0 };
      }
      if (step.id === 'feedback') {
        return { ...step, completed: (feedback?.length || 0) > 0 };
      }
      return step;
    }));
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Welcome, Beta Tester!</CardTitle>
                <CardDescription>
                  Thank you for helping us improve What's for Dinner
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Setup Progress</span>
                <span>{completedCount} / {steps.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${
                    step.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-muted'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {step.completed && (
                    <Badge variant="default" className="bg-green-500">
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {!steps.find(s => s.id === 'pantry')?.completed && (
                <Button
                  onClick={() => router.push('/pantry')}
                  variant="outline"
                  className="flex-1"
                >
                  Add Pantry Items
                </Button>
              )}
              {!steps.find(s => s.id === 'suggestion')?.completed && (
                <Button
                  onClick={() => router.push('/surprise-me')}
                  className="flex-1"
                >
                  Get First Suggestion
                </Button>
              )}
              {completedCount === steps.length && (
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Beta Benefits */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">Beta Tester Benefits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Free premium access during beta</li>
                <li>• Early access to new features</li>
                <li>• Direct line to product team</li>
                <li>• Your feedback shapes the product</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}