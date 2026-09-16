'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePaywall } from '@/hooks/usePaywall';
import PaywallModal from './PaywallModal';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('PremiumFeatureGate');

interface PremiumFeatureGateProps {
  featureId: string;
  page: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PremiumFeatureGate({
  featureId,
  page,
  children,
  fallback,
}: PremiumFeatureGateProps) {
  const { show, strategy, loading } = usePaywall(page, featureId);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (show && strategy) {
      setShowPaywall(true);
    }
  }, [show, strategy]);

  const handleUpgrade = () => {
    window.location.href = `/pricing?feature=${featureId}`;
  };

  const handleDismiss = () => {
    setShowPaywall(false);
  };

  if (loading) {
    return fallback || <div className="text-gray-500">Loading...</div>;
  }

  if (show && showPaywall && strategy) {
    return (
      <>
        {fallback || (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">This feature requires a Pro subscription</p>
            <button
              onClick={() => setShowPaywall(true)}
              className="text-sm text-green-600 hover:text-green-700 font-semibold"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
        <PaywallModal
          strategy={strategy}
          onDismiss={handleDismiss}
          onUpgrade={handleUpgrade}
        />
      </>
    );
  }

  return <>{children}</>;
}
