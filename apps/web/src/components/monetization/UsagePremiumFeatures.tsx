'use client';

import { useState, useEffect } from 'react';
import { createComponentLogger } from '@whats-for-dinner/utils';
import Link from 'next/link';

const _logger = createComponentLogger('UsagePremiumFeatures');

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: {
    type: string;
    pricePerUse?: number;
    creditPackSize?: number;
    creditPackPrice?: number;
  };
  valueMultiplier: number;
}

interface UsageCredits {
  credits: number;
}

interface UsagePremiumFeaturesProps {
  userId: string;
  tenantId: string;
}

export default function UsagePremiumFeatures({ userId, tenantId }: UsagePremiumFeaturesProps) {
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [credits, setCredits] = useState<UsageCredits>({ credits: 0 });
  const [recommendations, setRecommendations] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, tenantId]);

  async function loadData() {
    try {
      setLoading(true);
      const [featuresRes, creditsRes, recommendationsRes] = await Promise.all([
        fetch('/api/monetization/usage-premium'),
        fetch('/api/monetization/usage-premium?action=credits'),
        fetch('/api/monetization/usage-premium?action=recommendations'),
      ]);

      const featuresData = await featuresRes.json();
      const creditsData = await creditsRes.json();
      const recommendationsData = await recommendationsRes.json();

      setFeatures(featuresData.features || []);
      setCredits(creditsData);
      setRecommendations(recommendationsData.recommendations || []);
    } catch (error) {
      _logger.error('Failed to load premium features', { error });
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(featureId: string, quantity: number = 1) {
    try {
      const response = await fetch('/api/monetization/usage-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          featureId,
          quantity,
        }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      _logger.error('Failed to purchase credits', { error });
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading premium features...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Credits Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Credits</h3>
            <p className="text-2xl font-bold text-blue-600">{credits.credits}</p>
          </div>
          <Link
            href="/credits"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buy More
          </Link>
        </div>
      </div>

      {/* Recommended Features */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recommended for You</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((feature) => (
              <div
                key={feature.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{feature.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                {feature.pricing.type === 'credit_pack' && (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold">
                        ${feature.pricing.creditPackPrice?.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        for {feature.pricing.creditPackSize} credits
                      </span>
                    </div>
                    <button
                      onClick={() => handlePurchase(feature.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Buy Pack
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Features */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Premium Features</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {feature.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              
              {feature.pricing.type === 'credit_pack' && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    ${feature.pricing.pricePerUse?.toFixed(2)} per use
                  </div>
                  <button
                    onClick={() => handlePurchase(feature.id)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Buy {feature.pricing.creditPackSize} Credits - $
                    {feature.pricing.creditPackPrice?.toFixed(2)}
                  </button>
                </div>
              )}
              
              {feature.pricing.type === 'per_use' && (
                <div>
                  <div className="text-lg font-bold mb-2">
                    ${feature.pricing.pricePerUse?.toFixed(2)} per use
                  </div>
                  <button
                    onClick={() => handlePurchase(feature.id, 10)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Buy 10 Uses
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
