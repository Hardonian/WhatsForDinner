import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('enhanced-onboarding');

/**
 * Enhanced Onboarding System
 * Improves user retention through better onboarding experience
 */

import { supabase } from './supabaseClient';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
  action?: {
    type: 'navigate' | 'modal' | 'api';
    target: string;
  };
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  totalSteps: number;
  percentageComplete: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Default onboarding steps
 */
export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to What\'s for Dinner?',
    description: 'Get AI-powered meal suggestions based on your pantry',
    completed: false,
    required: true,
    order: 1,
    action: {
      type: 'modal',
      target: 'welcome-modal',
    },
  },
  {
    id: 'add-pantry',
    title: 'Add Items to Your Pantry',
    description: 'Start by adding a few ingredients you have at home',
    completed: false,
    required: true,
    order: 2,
    action: {
      type: 'navigate',
      target: '/pantry',
    },
  },
  {
    id: 'set-preferences',
    title: 'Set Your Preferences',
    description: 'Tell us about your dietary restrictions and preferences',
    completed: false,
    required: false,
    order: 3,
    action: {
      type: 'navigate',
      target: '/settings/preferences',
    },
  },
  {
    id: 'generate-first-recipe',
    title: 'Generate Your First Recipe',
    description: 'Get AI-powered recipe suggestions based on your pantry',
    completed: false,
    required: true,
    order: 4,
    action: {
      type: 'navigate',
      target: '/',
    },
  },
  {
    id: 'save-recipe',
    title: 'Save a Recipe',
    description: 'Save recipes you love to your favorites',
    completed: false,
    required: false,
    order: 5,
    action: {
      type: 'api',
      target: 'save-recipe',
    },
  },
  {
    id: 'explore-features',
    title: 'Explore Features',
    description: 'Discover meal planning, nutrition tracking, and more',
    completed: false,
    required: false,
    order: 6,
    action: {
      type: 'navigate',
      target: '/features',
    },
  },
];

/**
 * Get user onboarding progress
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Initialize onboarding for new user
      return await initializeOnboarding(userId);
    }

    return {
      userId: data.user_id,
      currentStep: data.current_step,
      completedSteps: data.completed_steps || [],
      totalSteps: DEFAULT_ONBOARDING_STEPS.length,
      percentageComplete: calculateProgress(data.completed_steps || []),
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error fetching onboarding progress:', { error: error instanceof Error ? error.message : String(error) });
    }
    return null;
  }
}

/**
 * Initialize onboarding for new user
 */
export async function initializeOnboarding(userId: string): Promise<OnboardingProgress> {
  const progress: OnboardingProgress = {
    userId,
    currentStep: 1,
    completedSteps: [],
    totalSteps: DEFAULT_ONBOARDING_STEPS.length,
    percentageComplete: 0,
    startedAt: new Date(),
  };

  try {
    const { error } = await supabase
      .from('onboarding_progress')
      .insert({
        user_id: userId,
        current_step: 1,
        completed_steps: [],
        started_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error initializing onboarding:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  return progress;
}

/**
 * Mark onboarding step as complete
 */
export async function completeOnboardingStep(
  userId: string,
  stepId: string
): Promise<boolean> {
  try {
    const progress = await getOnboardingProgress(userId);
    if (!progress) return false;

    const step = DEFAULT_ONBOARDING_STEPS.find(s => s.id === stepId);
    if (!step) return false;

    const updatedSteps = [...new Set([...progress.completedSteps, stepId])];
    const currentStep = Math.max(
      ...DEFAULT_ONBOARDING_STEPS
        .filter(s => !updatedSteps.includes(s.id))
        .map(s => s.order),
      progress.currentStep
    );

    const isComplete = updatedSteps.length === DEFAULT_ONBOARDING_STEPS.filter(s => s.required).length;

    const { error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: userId,
        current_step: currentStep,
        completed_steps: updatedSteps,
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Track completion event
    await trackOnboardingEvent(userId, 'step_completed', { stepId });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error completing onboarding step:', { error: error instanceof Error ? error.message : String(error) });
    }
    return false;
  }
}

/**
 * Get next onboarding step
 */
export async function getNextOnboardingStep(userId: string): Promise<OnboardingStep | null> {
  const progress = await getOnboardingProgress(userId);
  if (!progress) return null;

  const remainingSteps = DEFAULT_ONBOARDING_STEPS.filter(
    step => !progress.completedSteps.includes(step.id)
  );

  return remainingSteps.sort((a, b) => a.order - b.order)[0] || null;
}

/**
 * Calculate progress percentage
 */
function calculateProgress(completedSteps: string[]): number {
  const requiredSteps = DEFAULT_ONBOARDING_STEPS.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => completedSteps.includes(s.id)).length;
  return Math.round((completedRequired / requiredSteps.length) * 100);
}

/**
 * Track onboarding event
 */
async function trackOnboardingEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: `onboarding_${event}`,
      event_properties: properties || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Analytics tracking should not block user flow
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error tracking onboarding event:', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const progress = await getOnboardingProgress(userId);
  if (!progress) return false;

  const requiredSteps = DEFAULT_ONBOARDING_STEPS.filter(s => s.required);
  return requiredSteps.every(step => progress.completedSteps.includes(step.id));
}

/**
 * Get onboarding completion rate (for analytics)
 */
export async function getOnboardingCompletionRate(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('completed_at');

    if (error) throw error;

    const total = data?.length || 0;
    const completed = data?.filter(p => p.completed_at !== null).length || 0;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error calculating completion rate:', { error: error instanceof Error ? error.message : String(error) });
    }
    return 0;
  }
}
