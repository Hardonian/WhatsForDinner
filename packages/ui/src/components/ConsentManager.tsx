import React, { useState, useEffect } from 'react';
import PrivacyService from '@whats-for-dinner/utils/privacy-service';

interface ConsentManagerProps {
  userId: string;
  onConsentChange?: (consent: any) => void;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ 
  userId, 
  onConsentChange 
}) => {
  const [consent, setConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  const [privacyService] = useState(() => new PrivacyService());

  const handleConsentChange = (type: string, granted: boolean) => {
    const newConsent = { ...consent, [type]: granted };
    setConsent(newConsent);
    
    // Record consent
    privacyService.recordConsent({
      userId,
      purpose: type,
      granted,
      ipAddress: 'unknown',
      userAgent: navigator.userAgent,
      version: '1.0'
    });
    
    onConsentChange?.(newConsent);
  };

  return (
    <div className="consent-manager">
      <h3>Privacy Preferences</h3>
      
      <div className="consent-options">
        <label>
          <input
            type="checkbox"
            checked={consent.necessary}
            disabled
            readOnly
          />
          Necessary Cookies (Required)
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={consent.analytics}
            onChange={(e) => handleConsentChange('analytics', e.target.checked)}
          />
          Analytics Cookies
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={consent.marketing}
            onChange={(e) => handleConsentChange('marketing', e.target.checked)}
          />
          Marketing Cookies
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={consent.preferences}
            onChange={(e) => handleConsentChange('preferences', e.target.checked)}
          />
          Preference Cookies
        </label>
      </div>
      
      <div className="consent-actions">
        <button onClick={() => handleConsentChange('all', true)}>
          Accept All
        </button>
        <button onClick={() => handleConsentChange('all', false)}>
          Reject All
        </button>
        <button onClick={() => handleConsentChange('selected', true)}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default ConsentManager;
