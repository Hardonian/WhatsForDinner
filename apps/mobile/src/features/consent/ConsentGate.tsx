/**
 * ConsentGate - Mobile consent UI component
 * Handles age gating, ATT (iOS), and consent collection
 * Blocks app initialization until consent is collected
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Platform, Alert, TextInput } from 'react-native';
import { Text, Button, Card } from '@whats-for-dinner/ui';
import { ConsentStore } from '@whats-for-dinner/analytics-consent/store';
import type { ConsentState } from '@whats-for-dinner/analytics-consent/model';
import * as Linking from 'expo-linking';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('consentgate-tsx');
interface ConsentGateProps {
  onConsentComplete: (state: ConsentState) => void;
  store?: ConsentStore;
}

export function ConsentGate({ onConsentComplete, store }: ConsentGateProps) {
  const consentStore = store || new ConsentStore();
  const [currentState, setCurrentState] = useState<ConsentState>(consentStore.getState());
  const [step, setStep] = useState<'age_gate' | 'att' | 'consent'>('age_gate');
  const [birthYear, setBirthYear] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to consent state changes
    const unsubscribe = consentStore.subscribe((event) => {
      if (event.type === 'consent_state_changed') {
        setCurrentState(event.state);
      }
    });

    // Initialize based on current state
    if (currentState.status === 'unknown') {
      // Start with age gate
      setStep('age_gate');
    } else if (currentState.ageGate === 'unknown') {
      setStep('age_gate');
    } else if (currentState.ageGate === 'adult' && Platform.OS === 'ios' && !currentState.trackingPermission) {
      setStep('att');
    } else if (currentState.status === 'pending') {
      setStep('consent');
    } else if (currentState.status === 'accepted' || currentState.status === 'declined') {
      onConsentComplete(currentState);
    }

    return unsubscribe;
  }, [currentState.status]);

  const handleAgeGateSubmit = async () => {
    const year = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    
    if (!year || year < 1900 || year > currentYear) {
      Alert.alert('Invalid Year', 'Please enter a valid birth year.');
      return;
    }

    setLoading(true);
    await consentStore.setAgeGate(year);
    setLoading(false);

    const state = consentStore.getState();
    
    // If minor, skip ATT and consent, just save defaults
    if (state.ageGate === 'minor') {
      await consentStore.declineAll();
      onConsentComplete(consentStore.getState());
    } else {
      // Adult: proceed to ATT (iOS) or consent (Android)
      if (Platform.OS === 'ios') {
        setStep('att');
      } else {
        setStep('consent');
        await consentStore.requestConsent();
      }
    }
  };

  const handleATTRequest = async () => {
    setLoading(true);
    
    try {
      // Request ATT permission (iOS)
      // In a real implementation, this would use expo-tracking-transparency
      const permission = await requestTrackingPermission();
      await consentStore.setTrackingPermission(permission);
      
      // Proceed to consent UI
      setStep('consent');
      await consentStore.requestConsent();
    } catch (error) {
      logger.error('ATT request failed:', { error });
      // On error, proceed anyway with denied permission
      await consentStore.setTrackingPermission('denied');
      setStep('consent');
      await consentStore.requestConsent();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    const success = await consentStore.acceptAll();
    setLoading(false);
    
    if (!success) {
      Alert.alert(
        'Consent Restricted',
        'Some consents cannot be accepted due to age restrictions or tracking permissions.',
      );
    } else {
      onConsentComplete(consentStore.getState());
    }
  };

  const handleDeclineAll = async () => {
    setLoading(true);
    await consentStore.declineAll();
    setLoading(false);
    onConsentComplete(consentStore.getState());
  };

  const handleCustomConsent = async () => {
    // Show individual purpose toggles
    // For now, just accept all
    await handleAcceptAll();
  };

  // Age Gate Screen
  if (step === 'age_gate') {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Card className="p-6 space-y-6 max-w-md">
            <Text variant="h2" accessibilityRole="header" className="text-center">
              Welcome to Nomad
            </Text>
            
            <Text variant="body" className="text-center text-muted-foreground">
              To provide you with the best experience, we need to know your age to ensure we comply with privacy laws.
            </Text>

            <View className="space-y-4">
              <Text variant="h5" accessibilityRole="text">
                What year were you born?
              </Text>
              
              <View className="border border-input rounded-md">
                <TextInput
                  value={birthYear}
                  onChangeText={setBirthYear}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  maxLength={4}
                  accessibilityLabel="Enter your birth year"
                  className="px-4 py-3 text-base w-full"
                  style={{ 
                    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            <View className="space-y-2">
              <Button
                onPress={handleAgeGateSubmit}
                disabled={!birthYear || loading}
                className="w-full"
                accessibilityLabel="Continue with birth year"
                accessibilityState={{ disabled: !birthYear || loading }}
              >
                {loading ? 'Continuing...' : 'Continue'}
              </Button>
              
              <Text variant="small" className="text-center text-muted-foreground">
                We use this information only to provide age-appropriate content and comply with privacy regulations.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // ATT Request Screen (iOS only)
  if (step === 'att' && Platform.OS === 'ios') {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background">
        <Card className="p-6 space-y-6 max-w-md">
          <Text variant="h2" accessibilityRole="header" className="text-center">
            Help Us Improve
          </Text>
          
          <Text variant="body" className="text-center text-muted-foreground">
            We'd like to use your device's advertising identifier to show you personalized ads and measure app performance.
          </Text>

          <View className="space-y-3">
            <Button
              onPress={handleATTRequest}
              disabled={loading}
              className="w-full"
              accessibilityLabel="Allow tracking"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? 'Requesting...' : 'Allow Tracking'}
            </Button>
            
            <Button
              onPress={async () => {
                await consentStore.setTrackingPermission('denied');
                setStep('consent');
                await consentStore.requestConsent();
              }}
              variant="outline"
              disabled={loading}
              className="w-full"
              accessibilityLabel="Don't allow tracking"
              accessibilityState={{ disabled: loading }}
            >
              Don't Allow
            </Button>
          </View>

          <Text variant="small" className="text-center text-muted-foreground">
            You can change this later in Settings {'>'} Privacy & Security {'>'} Tracking.
          </Text>
        </Card>
      </View>
    );
  }

  // Consent Screen
  return (
    <View className="flex-1 justify-center items-center p-6 bg-background">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="p-6 space-y-6 max-w-md">
          <Text variant="h2" accessibilityRole="header" className="text-center">
            Privacy Preferences
          </Text>
          
          <Text variant="body" className="text-center text-muted-foreground">
            Choose how you'd like us to use your data to personalize your experience.
          </Text>

          <View className="space-y-4">
            <ConsentOption
              title="Necessary"
              description="Required for the app to function"
              enabled={currentState.purposes.necessary}
              disabled={true}
            />
            
            <ConsentOption
              title="Analytics"
              description="Help us understand how you use the app"
              enabled={currentState.purposes.analytics}
              disabled={false}
              onToggle={async () => {
                if (currentState.purposes.analytics) {
                  await consentStore.declinePurpose('analytics');
                } else {
                  await consentStore.acceptPurpose('analytics');
                }
              }}
            />
            
            <ConsentOption
              title="Advertising"
              description="Show you personalized ads"
              enabled={currentState.purposes.advertising}
              disabled={!consentStore.getModel().canAcceptAdvertising()}
              onToggle={async () => {
                if (currentState.purposes.advertising) {
                  await consentStore.declinePurpose('advertising');
                } else {
                  const success = await consentStore.acceptPurpose('advertising');
                  if (!success) {
                    Alert.alert(
                      'Cannot Enable',
                      'Advertising cannot be enabled due to age restrictions or tracking permissions.',
                    );
                  }
                }
              }}
            />
            
            <ConsentOption
              title="Personalization"
              description="Personalize content and recommendations"
              enabled={currentState.purposes.personalization}
              disabled={!consentStore.getModel().canAcceptPersonalization()}
              onToggle={async () => {
                if (currentState.purposes.personalization) {
                  await consentStore.declinePurpose('personalization');
                } else {
                  const success = await consentStore.acceptPurpose('personalization');
                  if (!success) {
                    Alert.alert(
                      'Cannot Enable',
                      'Personalization cannot be enabled due to age restrictions.',
                    );
                  }
                }
              }}
            />
          </View>

          <View className="space-y-3 pt-4">
            <Button
              onPress={handleAcceptAll}
              disabled={loading || !consentStore.getModel().canAcceptAdvertising()}
              className="w-full"
              accessibilityLabel="Accept all privacy preferences"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? 'Saving...' : 'Accept All'}
            </Button>
            
            <Button
              onPress={handleDeclineAll}
              variant="outline"
              disabled={loading}
              className="w-full"
              accessibilityLabel="Decline optional preferences"
              accessibilityState={{ disabled: loading }}
            >
              Decline Optional
            </Button>
          </View>

          <View className="flex-row justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://nomad.app/privacy-policy')}
              accessibilityLabel="Read privacy policy"
            >
              Privacy Policy
            </Button>
            <Text variant="small" className="text-muted-foreground">?</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://nomad.app/terms-of-service')}
              accessibilityLabel="Read terms of service"
            >
              Terms
            </Button>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

interface ConsentOptionProps {
  title: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  onToggle?: () => void;
}

function ConsentOption({ title, description, enabled, disabled, onToggle }: ConsentOptionProps) {
  return (
    <View className="flex-row items-start space-x-3 p-3 border border-input rounded-md">
      <View className="flex-1">
        <Text variant="h5" accessibilityRole="text">{title}</Text>
        <Text variant="small" className="text-muted-foreground">{description}</Text>
      </View>
      {!disabled && onToggle && (
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          onPress={onToggle}
          accessibilityLabel={`${enabled ? 'Disable' : 'Enable'} ${title}`}
          accessibilityState={{ checked: enabled }}
        >
          {enabled ? 'On' : 'Off'}
        </Button>
      )}
      {disabled && (
        <Text variant="small" className="text-muted-foreground italic">Required</Text>
      )}
    </View>
  );
}

/**
 * Request iOS ATT permission
 * In production, use expo-tracking-transparency
 */
async function requestTrackingPermission(): Promise<'authorized' | 'denied' | 'restricted' | 'not_determined'> {
  if (Platform.OS !== 'ios') {
    return 'not_determined';
  }

  try {
    // Use expo-tracking-transparency if available
    const { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    
    // Check current status
    const { status } = await getTrackingPermissionsAsync();
    
    if (status === 'granted') {
      return 'authorized';
    }
    
    if (status === 'denied' || status === 'restricted') {
      return status;
    }
    
    // Request permission
    const result = await requestTrackingPermissionsAsync();
    if (result.status === 'granted') return 'authorized';
    if (result.status === 'denied') return 'denied';
    if (result.status === 'restricted') return 'restricted';
    return 'not_determined';
  } catch (error) {
    // Fallback if module not available
    logger.warn('expo-tracking-transparency not available:', { error });
    return 'not_determined';
  }
}
