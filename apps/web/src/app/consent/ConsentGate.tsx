/**
 * Web Consent Gate - CMP Integration
 * Handles IAB TCF 2.2 consent collection and cookie consent
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('consentgate');



import React, { useState, useEffect } from 'react';
import { ConsentStore } from '@whats-for-dinner/analytics-consent/store';
import { ConsentState } from '@whats-for-dinner/analytics-consent/model';
import Link from 'next/link';

interface ConsentGateProps {
  onConsentComplete: (state: ConsentState) => void;
  store?: ConsentStore;
}

export function ConsentGate({ onConsentComplete, store }: ConsentGateProps) {
  const consentStore = store || new ConsentStore();
  const [currentState, setCurrentState] = useState<ConsentState>(consentStore.getState());
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to consent state changes
    const unsubscribe = consentStore.subscribe((event) => {
      if (event.type === 'consent_state_changed') {
        setCurrentState(event.state);
        if (event.state.status === 'accepted' || event.state.status === 'declined') {
          setShowBanner(false);
          onConsentComplete(event.state);
        }
      }
    });

    // Check if consent is needed
    if (currentState.status === 'unknown' || currentState.status === 'pending') {
      setShowBanner(true);
      
      // Initialize CMP if available
      initializeCMP();
    } else {
      onConsentComplete(currentState);
    }

    return unsubscribe;
  }, []);

  const initializeCMP = async () => {
    try {
      // Try to load IAB TCF CMP
      // In production, use a proper CMP library like @iabtcf/cmpapi
      const CMP = await loadCMP();
      if (CMP) {
        // Get existing consent string
        const tcfString = CMP.getConsentString();
        if (tcfString) {
          await consentStore.setTCFString(tcfString);
        }

        // Listen for consent updates
        CMP.addEventListener('consent', (event: any) => {
          if (event.detail?.consentString) {
            consentStore.setTCFString(event.detail.consentString);
          }
        });
      } else {
        // No CMP available, show our own consent UI
        await consentStore.requestConsent();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('CMP initialization failed:', { error }); }
      await consentStore.requestConsent();
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    await consentStore.acceptAll();
    setLoading(false);
  };

  const handleDeclineAll = async () => {
    setLoading(true);
    await consentStore.declineAll();
    setLoading(false);
  };

  const handleCustomize = () => {
    // Show detailed consent modal
    // For now, just accept all
    handleAcceptAll();
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Privacy Preferences</h3>
          <p className="text-xs text-muted-foreground">
            We use cookies and similar technologies to improve your experience, analyze usage, and show personalized ads.
            By clicking "Accept All", you consent to our use of these technologies.{' '}
            <Link href="/privacy-policy" className="underline hover:text-primary">
              Learn more
            </Link>
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDeclineAll}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-accent disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={handleCustomize}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-accent disabled:opacity-50"
          >
            Customize
          </button>
          <button
            onClick={handleAcceptAll}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Load IAB TCF CMP
 */
async function loadCMP(): Promise<unknown> {
  try {
    // In production, use @iabtcf/cmpapi or load from CMP provider
    // For now, return null to use our own UI
    return null;
  } catch {
    return null;
  }
}
