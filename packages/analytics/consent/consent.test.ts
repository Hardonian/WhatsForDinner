// @ts-nocheck
/**
 * Consent Model Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentModel } from './consentModel';

describe('ConsentModel', () => {
  let model: ConsentModel;

  beforeEach(() => {
    model = new ConsentModel();
  });

  describe('Age Gating', () => {
    it('should set age gate for adult', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 25);
      
      expect(model.getState().ageGate).toBe('adult');
    });

    it('should set age gate for minor', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 10);
      
      expect(model.getState().ageGate).toBe('minor');
      expect(model.getState().purposes.advertising).toBe(false);
    });

    it('should disable advertising for minors', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 12);
      
      expect(model.canAcceptAdvertising()).toBe(false);
    });
  });

  describe('Consent Transitions', () => {
    it('should transition from unknown to pending', () => {
      model.requestConsent();
      expect(model.getState().status).toBe('pending');
    });

    it('should accept all consents', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 25);
      model.setTrackingPermission('authorized');
      
      const success = model.acceptAll();
      expect(success).toBe(true);
      expect(model.getState().status).toBe('accepted');
      expect(model.getState().purposes.analytics).toBe(true);
    });

    it('should decline all consents', () => {
      model.declineAll();
      expect(model.getState().status).toBe('declined');
      expect(model.getState().purposes.analytics).toBe(false);
    });
  });

  describe('Advertising Consent', () => {
    it('should require tracking permission for advertising (iOS)', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 25);
      model.setTrackingPermission('denied');
      
      expect(model.canAcceptAdvertising()).toBe(false);
    });

    it('should allow advertising with authorized tracking', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 25);
      model.setTrackingPermission('authorized');
      
      expect(model.canAcceptAdvertising()).toBe(true);
    });
  });

  describe('Permission Checks', () => {
    it('should check if analytics is allowed', () => {
      model.acceptPurpose('analytics');
      expect(model.isAnalyticsAllowed()).toBe(true);
    });

    it('should check if advertising is allowed', () => {
      const currentYear = new Date().getFullYear();
      model.setAgeGate(currentYear - 25);
      model.setTrackingPermission('authorized');
      model.acceptPurpose('advertising');
      
      expect(model.isAdvertisingAllowed()).toBe(true);
    });
  });
});
