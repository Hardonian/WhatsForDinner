'use client';
/**
 * Guardian Onboarding Walkthrough
 * Teaches users how Guardian works
 */


import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OnboardingStep {
  title: string;
  content: string;
  illustration?: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Guardian',
    content: 'Guardian is your privacy guardian that continuously monitors how your data is used and explains it to you in plain language.',
  },
  {
    title: 'How Guardian Works',
    content: 'Every time the app accesses your data (telemetry, location, audio, etc.), Guardian assesses the risk and takes action to protect your privacy.',
  },
  {
    title: 'Risk Levels',
    content: 'Guardian categorizes data access as Low Risk (routine operations), Medium Risk (sensitive data), or High Risk (credentials, biometrics).',
  },
  {
    title: 'Actions Taken',
    content: 'Based on risk level, Guardian can Allow (low risk), Mask (hide sensitive parts), Redact (remove sensitive content), or Block (prevent) operations.',
  },
  {
    title: 'Trust Dashboard',
    content: 'Visit the Trust Dashboard anytime to see what data was accessed, why, and by whom. All explained in plain language.',
  },
  {
    title: 'Privacy Insurance',
    content: 'Use Private Mode Pulse to instantly freeze telemetry. Emergency Lockdown wipes local data and pauses sync. MFA Bubble shortens elevated sessions when risk increases.',
  },
  {
    title: 'Guardian Learns',
    content: 'Guardian learns your privacy preferences and adapts recommendations. You can export your Trust Fabric model to use on other devices.',
  },
];

export default function GuardianOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleSkip = async () => {
    const supabase = createClientComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Mark onboarding as completed
      await supabase.from('privacy_prefs').upsert({
        user_id: user.id,
        guardian_onboarding_completed: true,
      });
    }
    
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">You&apos;re All Set!</h1>
          <p className="text-gray-600 mb-6">
            Guardian is now active and monitoring your data access. Visit the Trust Dashboard anytime to see what&apos;s happening.
          </p>
          <a
            href="/dashboard/trust"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Trust Dashboard
          </a>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  if (!step) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold mb-4">{step.title}</h1>
        <p className="text-gray-700 mb-6">{step.content}</p>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );
}
