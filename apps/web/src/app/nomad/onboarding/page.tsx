'use client';


import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DietaryPreference {
  id: string;
  label: string;
  emoji: string;
}

interface Allergen {
  id: string;
  label: string;
}

interface HealthGoal {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dietaryPreferences: [] as string[],
    allergens: [] as string[],
    healthGoals: [] as string[],
    householdSize: 1,
    theme: 'light' as 'light' | 'dark',
    notifications: true,
  });

  const dietaryPreferences: DietaryPreference[] = [
    { id: 'vegetarian', label: 'Vegetarian', emoji: '??' },
    { id: 'vegan', label: 'Vegan', emoji: '??' },
    { id: 'keto', label: 'Keto', emoji: '??' },
    { id: 'paleo', label: 'Paleo', emoji: '??' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '??' },
    { id: 'gluten-free', label: 'Gluten-Free', emoji: '??' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '??' },
    { id: 'halal', label: 'Halal', emoji: '??' },
  ];

  const allergens: Allergen[] = [
    { id: 'nuts', label: 'Tree Nuts' },
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'soy', label: 'Soy' },
    { id: 'shellfish', label: 'Shellfish' },
    { id: 'fish', label: 'Fish' },
    { id: 'wheat', label: 'Wheat' },
  ];

  const healthGoals: HealthGoal[] = [
    { id: 'weight-loss', label: 'Weight Loss', description: 'Maintain a calorie deficit', emoji: '??' },
    { id: 'muscle-gain', label: 'Muscle Gain', description: 'Increase protein intake', emoji: '??' },
    { id: 'heart-health', label: 'Heart Health', description: 'Lower cholesterol and blood pressure', emoji: '??' },
    { id: 'energy', label: 'More Energy', description: 'Balanced nutrition for daily activities', emoji: '?' },
    { id: 'digestive', label: 'Digestive Health', description: 'Improve gut health with fiber', emoji: '??' },
    { id: 'general', label: 'General Wellness', description: 'Maintain a balanced diet', emoji: '??' },
  ];

  const toggleSelection = (arrayKey: 'dietaryPreferences' | 'allergens' | 'healthGoals', id: string) => {
    setFormData((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].includes(id)
        ? prev[arrayKey].filter((item) => item !== id)
        : [...prev[arrayKey], id],
    }));
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Save onboarding data and redirect to dashboard
        window.location.href = '/nomad/dashboard';
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to Nomad! ???</h2>
              <p className="text-muted-foreground">Let's personalize your experience</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">What should we call you?</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Dietary Preferences</h2>
              <p className="text-muted-foreground">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dietaryPreferences.map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => toggleSelection('dietaryPreferences', pref.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.dietaryPreferences.includes(pref.id)
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-border hover:border-brand-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{pref.emoji}</div>
                  <div className="text-sm font-medium">{pref.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Allergies & Restrictions</h2>
              <p className="text-muted-foreground">We'll avoid these in your recommendations</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {allergens.map((allergen) => (
                <button
                  key={allergen.id}
                  onClick={() => toggleSelection('allergens', allergen.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.allergens.includes(allergen.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-border hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{allergen.label}</span>
                    {formData.allergens.includes(allergen.id) && (
                      <Check className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Health Goals</h2>
              <p className="text-muted-foreground">What are you aiming for?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleSelection('healthGoals', goal.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.healthGoals.includes(goal.id)
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                      : 'border-border hover:border-accent-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{goal.label}</div>
                      <div className="text-sm text-muted-foreground">{goal.description}</div>
                    </div>
                    {formData.healthGoals.includes(goal.id) && (
                      <Check className="w-5 h-5 text-accent-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Household Setup</h2>
              <p className="text-muted-foreground">How many people are you planning for?</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setFormData({
                    ...formData,
                    householdSize: Math.max(1, formData.householdSize - 1),
                  })
                }
              >
                -
              </Button>
              <div className="text-4xl font-bold w-20 text-center">
                {formData.householdSize}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setFormData({
                    ...formData,
                    householdSize: formData.householdSize + 1,
                  })
                }
              >
                +
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              You can add family members later in settings
            </p>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Preferences</h2>
              <p className="text-muted-foreground">Final touches</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Theme</Label>
                <div className="flex gap-3 mt-2">
                  {(['light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setFormData({ ...formData, theme })}
                      className={`flex-1 p-4 rounded-lg border-2 capitalize ${
                        formData.theme === theme
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-border'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Get reminders for meals, water, and goals
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) =>
                    setFormData({ ...formData, notifications: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {step} of 6
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / 6) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {step === 6 ? 'Complete Setup' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
