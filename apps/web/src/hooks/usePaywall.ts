'use client';

import { useState, useEffect } from 'react';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('usePaywall');

interface PaywallResult {
  show: boolean;
  strategy: {
    id: string;
    name: string;
    placement: string;
    timing: string;
    design: string;
  } | null;
  reason: string;
}

export function usePaywall(page: string, featureAttempted?: string) {
  const [paywallResult, setPaywallResult] = useState<PaywallResult>({
    show: false,
    strategy: null,
    reason: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPaywall = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page,
        });
        if (featureAttempted) {
          params.set('feature', featureAttempted);
        }

        const response = await fetch(`/api/monetization/paywall?${params.toString()}`);
        const data = await response.json();
        setPaywallResult(data);
      } catch (error) {
        _logger.error('Failed to check paywall', { error });
        setPaywallResult({ show: false, strategy: null, reason: 'Error occurred' });
      } finally {
        setLoading(false);
      }
    };

    checkPaywall();
  }, [page, featureAttempted]);

  return { ...paywallResult, loading };
}
