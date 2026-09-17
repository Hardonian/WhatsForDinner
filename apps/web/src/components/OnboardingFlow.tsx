'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  ShoppingCart, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import { analytics } from '@/lib/analytics';
import type { PantryItem } from '@/types/pantry';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingFlowProps {
  userId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function OnboardingFlow({ userId, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to What\'s for Dinner?',
      description: 'Get AI-powered meal suggestions in 30 seconds based on ingredients you already have.',
      completed: false,
    },
    {
      id: 'add_pantry',
      title: 'Add Your Pantry',
      description: 'Tell us what ingredients you have. You can add items manually or try our sample pantry.',
      completed: false,
      action: () => {
        window.location.href = '/pantry';
      },
    },
    {
      id: 'generate_recipe',
      title: 'Generate Your First Recipe',
      description: 'Get personalized recipe suggestions based on your pantry. Takes just 30 seconds!',
      completed: false,
      action: () => {
        window.location.href = '/';
      },
    },
  ]);

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [hasGeneratedRecipe, setHasGeneratedRecipe] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId]);

  const loadProgress = async () => {
    if (!userId) return;

    try {
      // Check pantry items
      const { data: pantry } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      const hasPantry = (pantry?.length || 0) > 0;

      // Check if recipe generated (check favorites or recent activity)
      const { data: favorites } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      const hasRecipe = (favorites?.length || 0) > 0;

      setPantryItems((pantry as any) || []);
      setHasGeneratedRecipe(hasRecipe);

      // Update step completion
      const updatedSteps = steps.map((step, index) => {
        if (index === 0) return { ...step, completed: true };
        if (index === 1) return { ...step, completed: hasPantry };
        if (index === 2) return { ...step, completed: hasRecipe };
        return step;
      });

      setSteps(updatedSteps);

      // Auto-advance if step is completed
      if (hasPantry && currentStep === 1) {
        setCurrentStep(2);
      }
      if (hasRecipe && currentStep === 2) {
        // All steps completed
        handleComplete();
      }
    } catch (error) {
      // Error handled: Error loading progress:
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      analytics.trackEvent('onboarding_step_completed', {
        step_id: steps[currentStep].id,
        step_number: currentStep + 1,
        total_steps: steps.length,
      });

      // Execute step action if available
      if (steps[nextStep].action) {
        steps[nextStep].action?.();
      }
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await analytics.trackEvent('onboarding_skipped', {
      step: currentStep,
      step_id: steps[currentStep].id,
    });

    if (onSkip) {
      onSkip();
    }

    // Save skip state
    if (userId) {
      await supabase
        .from('onboarding_state')
        .upsert({
          user_id: userId,
          onboarding_completed: false,
          onboarding_skipped: true,
          updated_at: new Date().toISOString(),
        });
    }
  };

  const handleComplete = async () => {
    await analytics.trackEvent('onboarding_completed', {
      total_steps: steps.length,
      completion_time: Date.now(),
    });

    if (userId) {
      await supabase
        .from('onboarding_state')
        .upsert({
          user_id: userId,
          onboarding_completed: true,
          onboarding_skipped: false,
          updated_at: new Date().toISOString(),
        });
    }

    if (onComplete) {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 border-2 shadow-2xl">
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Getting Started</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      index < currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-[80px] truncate">
                    {step.title.split(' ')[0]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="space-y-4 min-h-[200px]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {currentStep === 0 && <ChefHat className="h-8 w-8 text-primary" />}
                {currentStep === 1 && <ShoppingCart className="h-8 w-8 text-primary" />}
                {currentStep === 2 && <Sparkles className="h-8 w-8 text-primary" />}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{currentStepData.title}</h3>
                <p className="text-muted-foreground">{currentStepData.description}</p>
              </div>
            </div>

            {/* Step-specific content */}
            {currentStep === 0 && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">AI-powered recipe suggestions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">30-second meal planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Reduce food waste</span>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  {pantryItems.length > 0
                    ? `Great! You have ${pantryItems.length} item(s) in your pantry.`
                    : 'Add ingredients manually or try our sample pantry to get started.'}
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {hasGeneratedRecipe
                    ? "Perfect! You've generated your first recipe. Keep exploring!"
                    : 'Generate your first recipe based on your pantry items.'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
