/**
 * Offers & Paywalls - Feature-flagged pricing + A/B framework
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { secretsManager } from './secrets-manager-unified.mjs';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('offers-paywalls-ts');
const SUPABASE_URL = (await secretsManager.getSecret('NEXT_PUBLIC_SUPABASE_URL')) || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = (await secretsManager.getSecret('SUPABASE_SERVICE_ROLE_KEY')) || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

interface PricingOffer {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  enabled: boolean;
  abTest?: {
    variant: string;
    percentage: number;
  };
}

async function syncPricingFromSupabase(): Promise<PricingOffer[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch pricing offers from Supabase table
  const { data: offers, error } = await supabase
    .from('pricing_offers')
    .select('*')
    .eq('enabled', true);

  if (error) {
    logger.warn('Pricing offers table not found, using defaults');
    return getDefaultOffers();
  }

  return offers || getDefaultOffers();
}

function getDefaultOffers(): PricingOffer[] {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: ['Basic recipes', 'Limited pantry'],
      enabled: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: ['Unlimited recipes', 'Full pantry', 'Meal planning'],
      enabled: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      currency: 'USD',
      interval: 'month',
      features: ['Everything in Pro', 'AI meal generation', 'Priority support'],
      enabled: true
    }
  ];
}

async function toggleOffer(offerId: string, enabled: boolean): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from('pricing_offers')
    .update({ enabled })
    .eq('id', offerId);

  if (error) {
    throw new Error(`Failed to toggle offer: ${error.message}`);
  }

  }

// Admin UI would be at /admin/pricing
// This is just the backend logic

export { syncPricingFromSupabase, toggleOffer, getDefaultOffers };
