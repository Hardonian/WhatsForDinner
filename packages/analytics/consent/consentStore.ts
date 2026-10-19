/**
 * Consent Store - Persistent storage and event emitter
 * Handles platform-specific storage (SecureStore on mobile, localStorage on web)
 */

import { ConsentModel, ConsentState } from './consentModel';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('consentstore-ts');
export type ConsentEvent = 
  | { type: 'consent_state_changed'; state: ConsentState }
  | { type: 'age_gate_completed'; isMinor: boolean }
  | { type: 'tracking_permission_changed'; permission: string }
  | { type: 'consent_reset' };

export type ConsentEventListener = (event: ConsentEvent) => void;

export class ConsentStore {
  private model: ConsentModel;
  private listeners: Set<ConsentEventListener> = new Set();
  private storage: ConsentStorage;
  
  constructor(storage?: ConsentStorage) {
    this.storage = storage || this.createPlatformStorage();
    this.model = new ConsentModel();
    
    // Load persisted state
    this.load();
  }
  
  getModel(): ConsentModel {
    return this.model;
  }
  
  getState(): Readonly<ConsentState> {
    return this.model.getState();
  }
  
  /**
   * Subscribe to consent events
   */
  subscribe(listener: ConsentEventListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Emit event to all listeners
   */
  private emit(event: ConsentEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // Error handled: Error in consent event listener:
      }
    });
  }
  
  /**
   * Set age gate and persist
   */
  async setAgeGate(birthYear: number): Promise<void> {
    this.model.setAgeGate(birthYear);
    await this.save();
    
    const state = this.model.getState();
    this.emit({
      type: 'age_gate_completed',
      isMinor: state.ageGate === 'minor',
    });
    
    this.emit({
      type: 'consent_state_changed',
      state: state,
    });
  }
  
  /**
   * Set tracking permission and persist
   */
  async setTrackingPermission(permission: 'authorized' | 'denied' | 'restricted' | 'not_determined'): Promise<void> {
    this.model.setTrackingPermission(permission);
    await this.save();
    
    this.emit({
      type: 'tracking_permission_changed',
      permission,
    });
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Set TCF string and persist
   */
  async setTCFString(tcfString: string): Promise<void> {
    this.model.setTCFString(tcfString);
    await this.save();
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Request consent (show UI)
   */
  async requestConsent(): Promise<void> {
    this.model.requestConsent();
    await this.save();
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Accept all consents
   */
  async acceptAll(): Promise<boolean> {
    const success = this.model.acceptAll();
    if (success) {
      await this.save();
      this.emit({
        type: 'consent_state_changed',
        state: this.model.getState(),
      });
    }
    return success;
  }
  
  /**
   * Decline all consents
   */
  async declineAll(): Promise<void> {
    this.model.declineAll();
    await this.save();
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Accept specific purpose
   */
  async acceptPurpose(purpose: 'necessary' | 'analytics' | 'advertising' | 'personalization' | 'marketing'): Promise<boolean> {
    const success = this.model.acceptPurpose(purpose);
    if (success) {
      await this.save();
      this.emit({
        type: 'consent_state_changed',
        state: this.model.getState(),
      });
    }
    return success;
  }
  
  /**
   * Decline specific purpose
   */
  async declinePurpose(purpose: 'necessary' | 'analytics' | 'advertising' | 'personalization' | 'marketing'): Promise<void> {
    this.model.declinePurpose(purpose);
    await this.save();
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Reset consent (for testing or re-prompting)
   */
  async reset(): Promise<void> {
    this.model.reset();
    await this.save();
    
    this.emit({
      type: 'consent_reset',
    });
    
    this.emit({
      type: 'consent_state_changed',
      state: this.model.getState(),
    });
  }
  
  /**
   * Load state from storage
   */
  private async load(): Promise<void> {
    try {
      const stored = await this.storage.get('consent_state');
      if (stored) {
        const state = JSON.parse(stored) as ConsentState;
        // Validate state structure
        if (state.status && state.purposes) {
          this.model = new ConsentModel(state);
          
          // Emit loaded state
          this.emit({
            type: 'consent_state_changed',
            state: this.model.getState(),
          });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('Failed to load consent state:', { error }); }
    }
  }
  
  /**
   * Save state to storage
   */
  private async save(): Promise<void> {
    try {
      const state = this.model.getState();
      await this.storage.set('consent_state', JSON.stringify(state));
    } catch (error) {
      // Error handled: Failed to save consent state:
    }
  }
  
  /**
   * Create platform-specific storage implementation
   */
  private createPlatformStorage(): ConsentStorage {
    // Avoid importing react-native into the web compilation. The presence of a
    // browser document is the capability this storage implementation needs.
    if (typeof document !== 'undefined') {
      return new WebConsentStorage();
    } else {
      return new MobileConsentStorage();
    }
  }
}

/**
 * Storage interface
 */
export interface ConsentStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Web storage (localStorage with cookie fallback)
 */
class WebConsentStorage implements ConsentStorage {
  async get(key: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      // Try localStorage first
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
      
      // Fallback to cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, ...rest] = cookie.trim().split('=');
        if (name === key) {
          return decodeURIComponent(rest.join('='));
        }
      }
      
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('Failed to read from storage:', { error }); }
      return null;
    }
  }
  
  async set(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Store in localStorage
      localStorage.setItem(key, value);
      
      // Also store in cookie (for SSR compatibility)
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
      document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } catch (error) {
      // Error handled: Failed to write to storage:
    }
  }
  
  async remove(key: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem(key);
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (error) {
      // Error handled: Failed to remove from storage:
    }
  }
}

/**
 * Mobile storage (SecureStore)
 */
class MobileConsentStorage implements ConsentStorage {
  private SecureStore: any;
  
  constructor() {
    // Dynamic import to avoid issues if not available
    try {
      this.SecureStore = require('expo-secure-store');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('expo-secure-store not available, using fallback'); }
    }
  }
  
  async get(key: string): Promise<string | null> {
    try {
      if (this.SecureStore) {
        return await this.SecureStore.getItemAsync(key);
      }
      
      // Fallback to AsyncStorage if available
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('Failed to read from secure storage:', { error }); }
      return null;
    }
  }
  
  async set(key: string, value: string): Promise<void> {
    try {
      if (this.SecureStore) {
        await this.SecureStore.setItemAsync(key, value);
        return;
      }
      
      // Fallback to AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      // Error handled: Failed to write to secure storage:
    }
  }
  
  async remove(key: string): Promise<void> {
    try {
      if (this.SecureStore) {
        await this.SecureStore.deleteItemAsync(key);
        return;
      }
      
      // Fallback to AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Error handled: Failed to remove from secure storage:
    }
  }
}
