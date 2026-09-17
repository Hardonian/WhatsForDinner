'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function GDPRConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem('gdpr_consent');
    if (!consent) {
      setShowBanner(true);
      // Load saved preferences if available
      const savedPrefs = localStorage.getItem('gdpr_preferences');
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch (e) {
          logger.error('Failed to parse GDPR preferences', { error: e });
        }
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const minimal: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(minimal);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (consentPrefs: ConsentPreferences) => {
    localStorage.setItem('gdpr_consent', 'true');
    localStorage.setItem('gdpr_preferences', JSON.stringify(consentPrefs));
    localStorage.setItem('gdpr_consent_date', new Date().toISOString());

    // Update analytics based on consent
    if (typeof window !== 'undefined' && window.gtag) {
      if (consentPrefs.analytics) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      } else {
        (window as any).gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }

    setShowBanner(false);
    logger.info('GDPR consent saved', { preferences: consentPrefs });
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container mx-auto p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience, analyze site usage, and
              assist in marketing efforts. You can customize your preferences below.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.necessary}
                disabled
                className="rounded"
              />
              <span className="text-sm">
                Necessary cookies (required for site functionality)
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({ ...preferences, analytics: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Analytics cookies</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({ ...preferences, marketing: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Marketing cookies</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) =>
                  setPreferences({ ...preferences, functional: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Functional cookies</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Save Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GDPRConsent;
