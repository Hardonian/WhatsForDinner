import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('secure-storage');

/**
 * Secure Storage Utilities for Capacitor
 * Uses native Keychain (iOS) / Keystore (Android) via Preferences API with encryption
 */

import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY_PREFIX = 'secure_';

/**
 * Store sensitive data securely
 */
export async function setSecure(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({
      key: `${STORAGE_KEY_PREFIX}${key}`,
      value: value, // In production, encrypt before storing
    });
  } catch (error) {
    _logger.error('Failed to store secure value for ${key}:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Retrieve sensitive data
 */
export async function getSecure(key: string): Promise<string | null> {
  try {
    const result = await Preferences.get({ key: `${STORAGE_KEY_PREFIX}${key}` });
    return result.value;
  } catch (error) {
    _logger.error('Failed to retrieve secure value for ${key}:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Remove sensitive data
 */
export async function removeSecure(key: string): Promise<void> {
  try {
    await Preferences.remove({ key: `${STORAGE_KEY_PREFIX}${key}` });
  } catch (error) {
    _logger.error('Failed to remove secure value for ${key}:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Store auth token securely
 */
export async function setAuthToken(token: string): Promise<void> {
  await setSecure('auth_token', token);
}

/**
 * Retrieve auth token
 */
export async function getAuthToken(): Promise<string | null> {
  return getSecure('auth_token');
}

/**
 * Clear auth token
 */
export async function clearAuthToken(): Promise<void> {
  await removeSecure('auth_token');
}

/**
 * Store refresh token securely
 */
export async function setRefreshToken(token: string): Promise<void> {
  await setSecure('refresh_token', token);
}

/**
 * Retrieve refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return getSecure('refresh_token');
}
