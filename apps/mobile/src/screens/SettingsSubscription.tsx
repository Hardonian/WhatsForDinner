/**
 * Settings Subscription Screen
 * Purchase, restore, and manage subscriptions
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Linking, Platform } from 'react-native';
import { Text, Button, Card } from '@whats-for-dinner/ui';
import { 
  getEntitlements, 
  purchase, 
  restore, 
  isPremium,
  type Entitlement 
} from '@whats-for-dinner/adapters-purchases';
import { getPlanDisplayName, type SubscriptionPlan } from '@whats-for-dinner/config/subscriptions';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('settingssubscription-tsx');
export function SettingsSubscription() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadEntitlements();
  }, []);

  const loadEntitlements = async () => {
    try {
      const currentEntitlements = await getEntitlements();
      setEntitlements(currentEntitlements);
      setIsPremiumUser(await isPremium());
    } catch (error) {
      logger.error('Failed to load entitlements:', { error });
    }
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      return;
    }

    setLoading(true);
    try {
      const result = await purchase(plan);
      
      if (result.success && result.entitlement) {
        Alert.alert('Success', 'Your subscription has been activated!');
        await loadEntitlements();
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restore();
      
      if (restored.length > 0) {
        Alert.alert('Success', `Restored ${restored.length} purchase(s)`);
        await loadEntitlements();
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any purchases to restore.');
      }
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const activeEntitlement = entitlements.find(e => e.isActive);
  const currentPlan = activeEntitlement?.plan || 'free';

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 space-y-6">
        <Card className="p-6 space-y-4">
          <Text variant="h2" accessibilityRole="header">Subscription</Text>
          
          {isPremiumUser && activeEntitlement ? (
            <View className="space-y-4">
              <View className="bg-primary/10 border border-primary rounded-md p-4">
                <Text variant="h5" className="text-primary font-semibold">
                  {getPlanDisplayName(activeEntitlement.plan)}
                </Text>
                <Text variant="small" className="text-muted-foreground mt-1">
                  {activeEntitlement.expiresAt
                    ? `Renews ${new Date(activeEntitlement.expiresAt).toLocaleDateString()}`
                    : 'Active'}
                </Text>
              </View>

              <Button
                onPress={handleManageSubscription}
                variant="outline"
                className="w-full"
                accessibilityLabel="Manage subscription in store"
              >
                Manage Subscription
              </Button>
            </View>
          ) : (
            <View className="space-y-4">
              <Text variant="body" className="text-muted-foreground">
                Upgrade to Premium for ad-free experience and exclusive features.
              </Text>

              <View className="space-y-3">
                <Card className="p-4 border border-input">
                  <View className="space-y-2">
                    <Text variant="h5">Premium Monthly</Text>
                    <Text variant="small" className="text-muted-foreground">
                      $9.99/month ? Auto-renewing
                    </Text>
                    <Button
                      onPress={() => handlePurchase('premium_monthly')}
                      disabled={loading || currentPlan !== 'free'}
                      className="mt-2"
                      accessibilityLabel="Purchase premium monthly subscription"
                      accessibilityState={{ disabled: loading || currentPlan !== 'free' }}
                    >
                      {loading ? 'Processing...' : 'Subscribe Monthly'}
                    </Button>
                  </View>
                </Card>

                <Card className="p-4 border border-primary">
                  <View className="space-y-2">
                    <View className="flex-row items-center gap-2">
                      <Text variant="h5">Premium Annual</Text>
                      <Text variant="small" className="bg-primary/20 px-2 py-1 rounded">
                        Save 20%
                      </Text>
                    </View>
                    <Text variant="small" className="text-muted-foreground">
                      $79.99/year ? Auto-renewing
                    </Text>
                    <Button
                      onPress={() => handlePurchase('premium_annual')}
                      disabled={loading || currentPlan !== 'free'}
                      variant="default"
                      className="mt-2"
                      accessibilityLabel="Purchase premium annual subscription"
                      accessibilityState={{ disabled: loading || currentPlan !== 'free' }}
                    >
                      {loading ? 'Processing...' : 'Subscribe Annual'}
                    </Button>
                  </View>
                </Card>
              </View>

              <Button
                onPress={handleRestore}
                variant="outline"
                disabled={restoring}
                className="w-full"
                accessibilityLabel="Restore previous purchases"
                accessibilityState={{ disabled: restoring }}
              >
                {restoring ? 'Restoring...' : 'Restore Purchases'}
              </Button>
            </View>
          )}
        </Card>

        <Card className="p-4 space-y-2">
          <Text variant="small" className="text-muted-foreground text-center">
            Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
          </Text>
          <View className="flex-row justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://nomad.app/terms-of-service')}
              accessibilityLabel="View terms of service"
            >
              Terms
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://nomad.app/subscriptions')}
              accessibilityLabel="View subscription policy"
            >
              Subscription Policy
            </Button>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
