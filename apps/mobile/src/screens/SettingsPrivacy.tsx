/**
 * Settings Privacy Screen
 * Manage consent, download data, delete account
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Switch } from 'react-native';
import { Text, Button, Card } from '@whats-for-dinner/ui';
import { ConsentStore } from '@whats-for-dinner/analytics-consent/store';
import { ConsentState } from '@whats-for-dinner/analytics-consent/model';

export function SettingsPrivacy() {
  const consentStore = new ConsentStore();
  const [consentState, setConsentState] = useState<ConsentState>(consentStore.getState());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = consentStore.subscribe((event) => {
      if (event.type === 'consent_state_changed') {
        setConsentState(event.state);
      }
    });

    return unsubscribe;
  }, []);

  const handleToggleConsent = async (purpose: 'analytics' | 'advertising' | 'personalization' | 'marketing') => {
    setLoading(true);
    try {
      if (consentState.purposes[purpose]) {
        await consentStore.declinePurpose(purpose);
      } else {
        const success = await consentStore.acceptPurpose(purpose);
        if (!success) {
          Alert.alert(
            'Cannot Enable',
            'This setting cannot be enabled due to age restrictions or tracking permissions.',
          );
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      
      if (data.downloadUrl) {
        // Open download URL
        Alert.alert(
          'Data Export',
          'Your data export is ready. Check your email for the download link.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Data Export', 'Your data export will be sent to your email address.');
      }
    } catch {
      Alert.alert('Error', 'Failed to export data. Please try again later.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('/api/privacy/erase', {
                method: 'POST',
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error('Deletion failed');
              }

              Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been deleted.',
                [{ text: 'OK', onPress: () => {
                  // Sign out and redirect to home
                }}]
              );
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again later.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 space-y-6">
        <Card className="p-6 space-y-4">
          <Text variant="h2" accessibilityRole="header">Privacy Preferences</Text>

          <View className="space-y-4">
            <View className="flex-row items-center justify-between p-3 border border-input rounded-md">
              <View className="flex-1">
                <Text variant="h5">Analytics</Text>
                <Text variant="small" className="text-muted-foreground">
                  Help us improve the app
                </Text>
              </View>
              <Switch
                value={consentState.purposes.analytics}
                onValueChange={() => handleToggleConsent('analytics')}
                disabled={loading}
                accessibilityLabel="Toggle analytics consent"
                accessibilityState={{ checked: consentState.purposes.analytics, disabled: loading }}
              />
            </View>

            <View className="flex-row items-center justify-between p-3 border border-input rounded-md">
              <View className="flex-1">
                <Text variant="h5">Advertising</Text>
                <Text variant="small" className="text-muted-foreground">
                  Personalized ads
                </Text>
              </View>
              <Switch
                value={consentState.purposes.advertising}
                onValueChange={() => handleToggleConsent('advertising')}
                disabled={loading || !consentStore.getModel().canAcceptAdvertising()}
                accessibilityLabel="Toggle advertising consent"
                accessibilityState={{ 
                  checked: consentState.purposes.advertising, 
                  disabled: loading || !consentStore.getModel().canAcceptAdvertising() 
                }}
              />
            </View>

            <View className="flex-row items-center justify-between p-3 border border-input rounded-md">
              <View className="flex-1">
                <Text variant="h5">Personalization</Text>
                <Text variant="small" className="text-muted-foreground">
                  Personalized content and recommendations
                </Text>
              </View>
              <Switch
                value={consentState.purposes.personalization}
                onValueChange={() => handleToggleConsent('personalization')}
                disabled={loading || !consentStore.getModel().canAcceptPersonalization()}
                accessibilityLabel="Toggle personalization consent"
                accessibilityState={{ 
                  checked: consentState.purposes.personalization, 
                  disabled: loading || !consentStore.getModel().canAcceptPersonalization() 
                }}
              />
            </View>

            <View className="flex-row items-center justify-between p-3 border border-input rounded-md">
              <View className="flex-1">
                <Text variant="h5">Marketing</Text>
                <Text variant="small" className="text-muted-foreground">
                  Marketing emails and notifications
                </Text>
              </View>
              <Switch
                value={consentState.purposes.marketing}
                onValueChange={() => handleToggleConsent('marketing')}
                disabled={loading}
                accessibilityLabel="Toggle marketing consent"
                accessibilityState={{ checked: consentState.purposes.marketing, disabled: loading }}
              />
            </View>
          </View>
        </Card>

        <Card className="p-6 space-y-4">
          <Text variant="h3" accessibilityRole="header">Data Management</Text>

          <Button
            onPress={handleDownloadData}
            variant="outline"
            disabled={downloading}
            className="w-full"
            accessibilityLabel="Download your data"
            accessibilityState={{ disabled: downloading }}
          >
            {downloading ? 'Preparing...' : 'Download My Data'}
          </Button>

          <Text variant="small" className="text-muted-foreground">
            Request a copy of all your personal data stored in our systems.
          </Text>
        </Card>

        <Card className="p-6 space-y-4">
          <Text variant="h3" accessibilityRole="header">Account</Text>

          <Button
            onPress={handleDeleteAccount}
            variant="destructive"
            className="w-full"
            accessibilityLabel="Delete account and all data"
          >
            Delete Account
          </Button>

          <Text variant="small" className="text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
