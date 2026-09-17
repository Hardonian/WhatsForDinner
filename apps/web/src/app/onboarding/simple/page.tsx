'use client';

export const dynamic = 'force-dynamic';

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



/**
 * Simplified Onboarding Flow - 2 Steps Max
 * 
 * Step 1: Pantry Setup (with skip option)
 * Step 2: Preferences (with skip option)
 * Then: Instant recipe generation
 */

import { useState } from 'react';
import { ArrowRight, Sparkles, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { supabase } from '@/lib/supabaseClient';

type Step = 'pantry' | 'preferences' | 'generating';

const commonPantryItems = [
  'chicken', 'rice', 'tomatoes', 'onions', 'garlic', 
  'olive oil', 'salt', 'pepper', 'eggs', 'pasta'
];

const dietaryOptions = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
];

export default function SimpleOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('pantry');
  const [selectedPantryItems, setSelectedPantryItems] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePantryNext = () => {
    // Track onboarding step
    analytics.trackEvent('USER_ONBOARDING_STARTED', {
      step: 'pantry_setup',
    });
    
    // If no items selected, use common items
    const itemsToUse = selectedPantryItems.length > 0 
      ? selectedPantryItems 
      : commonPantryItems.slice(0, 5);
    
    setSelectedPantryItems(itemsToUse);
    setStep('preferences');
  };

  const handleSkipPantry = () => {
    // Use sample items for better activation
    setSelectedPantryItems(commonPantryItems.slice(0, 3));
    setStep('preferences');
  };

  const handlePreferencesNext = async () => {
    setLoading(true);
    setStep('generating');

    try {
      const user = await supabase.auth.getUser();
      
      // Save pantry items
      if (selectedPantryItems.length > 0 && user.data.user) {
        await fetch('/api/pantry/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: selectedPantryItems }),
        }).catch(() => {});
      }

      // Generate first suggestion
      const response = await fetch('/api/dinner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedPantryItems,
          preferences: preferences.join(', '),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Track activation
        await analytics.trackEvent('USER_ACTIVATED', {
          time_to_activation_seconds: 0, // Will be calculated properly
          suggestion_method: 'onboarding',
        });

        // Track onboarding completion
        await analytics.trackEvent('USER_ONBOARDING_COMPLETED', {
          time_to_complete_seconds: 0,
          steps_completed: ['pantry_setup', 'preferences', 'first_suggestion'],
        });

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Even if generation fails, complete onboarding
        router.push('/dashboard');
      }
    } catch (error) {
      _logger.error('Onboarding error:', { error: error instanceof Error ? error.message : String(error) });
      // Continue anyway
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPreferences = async () => {
    await handlePreferencesNext();
  };

  if (step === 'pantry') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-2xl">What's in your pantry?</CardTitle>
            <CardDescription>
              Select items you have (or skip to use common ingredients)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {commonPantryItems.map(item => (
                <button
                  key={item}
                  onClick={() => {
                    setSelectedPantryItems(prev =>
                      prev.includes(item)
                        ? prev.filter(i => i !== item)
                        : [...prev, item]
                    );
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    selectedPantryItems.includes(item)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSkipPantry}
                variant="ghost"
                className="flex-1"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handlePantryNext}
                className="flex-1"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Any dietary preferences?</CardTitle>
            <CardDescription>
              Select all that apply (or skip)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {dietaryOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => {
                    setPreferences(prev =>
                      prev.includes(option.id)
                        ? prev.filter(p => p !== option.id)
                        : [...prev, option.id]
                    );
                  }}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    preferences.includes(option.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSkipPreferences}
                variant="ghost"
                className="flex-1"
                disabled={loading}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handlePreferencesNext}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Get My Recipe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Finding Something Delicious...</h2>
            <p className="text-sm text-muted-foreground">This will only take a moment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}