'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, ShoppingCart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { analytics } from '@/lib/analytics';

interface EmptyStateGuideProps {
  onAddIngredients: () => void;
  onTrySample: () => Promise<void>;
  onImport?: () => void;
  onConnectGrocery?: () => void;
}

export default function EmptyStateGuide({
  onAddIngredients,
  onTrySample,
  onImport,
  onConnectGrocery,
}: EmptyStateGuideProps) {
  const [loading, setLoading] = useState(false);

  const handleTrySample = async () => {
    setLoading(true);
    try {
      await analytics.trackEvent('empty_state_action_taken', {
        action: 'try_sample',
      });
      await onTrySample();
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredients = () => {
    analytics.trackEvent('empty_state_action_taken', {
      action: 'add_ingredients',
    });
    onAddIngredients();
  };

  const handleImport = () => {
    analytics.trackEvent('empty_state_action_taken', {
      action: 'import',
    });
    if (onImport) {
      onImport();
    }
  };

  const handleConnectGrocery = () => {
    analytics.trackEvent('empty_state_action_taken', {
      action: 'connect_grocery',
    });
    if (onConnectGrocery) {
      onConnectGrocery();
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Illustration/Icon */}
        <div className="flex justify-center">
          <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-16 w-16 text-primary" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">What&apos;s in your pantry?</h2>
          <p className="text-lg text-muted-foreground">
            Let&apos;s find recipes you can make right now with the ingredients you already have.
          </p>
        </div>

        {/* CTA Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleAddIngredients}>
            <CardHeader>
              <Plus className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Add Ingredients</CardTitle>
              <CardDescription>
                Manually add ingredients to your pantry
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleTrySample}>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Try Sample Pantry</CardTitle>
              <CardDescription>
                Get started with common ingredients
              </CardDescription>
            </CardHeader>
          </Card>

          {onImport && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleImport}>
              <CardHeader>
                <Upload className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Import from File</CardTitle>
                <CardDescription>
                  Upload a CSV with your ingredients
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {onConnectGrocery && (
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleConnectGrocery}>
              <CardHeader>
                <ShoppingCart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Connect Grocery App</CardTitle>
                <CardDescription>
                  Sync ingredients from your grocery service (Coming Soon)
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-sm text-muted-foreground">
          Don&apos;t worry, you can always add more ingredients later
        </p>
      </div>
    </div>
  );
}
