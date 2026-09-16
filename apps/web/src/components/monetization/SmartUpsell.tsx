'use client';

import { useState, useEffect } from 'react';
import { createComponentLogger } from '@whats-for-dinner/utils';
import Link from 'next/link';

const _logger = createComponentLogger('SmartUpsell');

interface UpsellOpportunity {
  id: string;
  type: string;
  targetPlan?: string;
  trigger: string;
  urgency: string;
  estimatedValue: number;
  conversionProbability: number;
  personalizedMessage: string;
  offerDetails: {
    discount?: number;
    bonusCredits?: number;
    freeTrialDays?: number;
  };
}

interface SmartUpsellProps {
  userId: string;
  tenantId: string;
  onDismiss?: () => void;
}

export default function SmartUpsell({ userId, tenantId, onDismiss }: SmartUpsellProps) {
  const [opportunities, setOpportunities] = useState<UpsellOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<UpsellOpportunity | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, [userId, tenantId]);

  async function loadOpportunities() {
    try {
      setLoading(true);
      const response = await fetch(`/api/monetization/upsells`);
      const data = await response.json();
      setOpportunities(data.opportunities || []);
      
      // Auto-select top opportunity
      if (data.opportunities && data.opportunities.length > 0) {
        setSelectedOpportunity(data.opportunities[0]);
      }
    } catch (error) {
      _logger.error('Failed to load upsell opportunities', { error });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(opportunity: UpsellOpportunity) {
    try {
      // Redirect to pricing with offer
      const params = new URLSearchParams({
        plan: opportunity.targetPlan || 'pro',
        offer: opportunity.id,
      });
      if (opportunity.offerDetails.discount) {
        params.set('discount', opportunity.offerDetails.discount.toString());
      }
      window.location.href = `/pricing?${params.toString()}`;
    } catch (error) {
      _logger.error('Failed to process upgrade', { error });
    }
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">Loading personalized offers...</p>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return null;
  }

  const topOpportunity = opportunities[0];

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {topOpportunity.personalizedMessage}
          </h3>
          <p className="text-gray-600">
            Unlock more value with {topOpportunity.targetPlan?.toUpperCase()} plan
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {topOpportunity.offerDetails.discount && (
        <div className="bg-green-100 border border-green-300 rounded px-3 py-2 mb-4 inline-block">
          <span className="text-green-800 font-semibold">
            {topOpportunity.offerDetails.discount}% OFF
          </span>
          {topOpportunity.offerDetails.freeTrialDays && (
            <span className="text-green-700 ml-2">
              + {topOpportunity.offerDetails.freeTrialDays} days free trial
            </span>
          )}
        </div>
      )}

      {topOpportunity.offerDetails.bonusCredits && (
        <div className="text-gray-700 mb-4">
          <span className="font-semibold">Bonus:</span> {topOpportunity.offerDetails.bonusCredits} credits included
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleUpgrade(topOpportunity)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
        >
          Upgrade Now
        </button>
        <Link
          href="/pricing"
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
        >
          View Plans
        </Link>
      </div>

      {opportunities.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">More offers available:</p>
          <div className="space-y-2">
            {opportunities.slice(1, 3).map((opp) => (
              <button
                key={opp.id}
                onClick={() => handleUpgrade(opp)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {opp.personalizedMessage}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
