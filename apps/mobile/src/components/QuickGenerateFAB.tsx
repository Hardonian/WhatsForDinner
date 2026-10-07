/**
 * Quick Generate FAB for Mobile
 * One-tap recipe generation
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@whats-for-dinner/ui';

interface QuickGenerateFABProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function QuickGenerateFAB({ onPress, disabled, loading }: QuickGenerateFABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.fab,
        (disabled || loading) && styles.fabDisabled
      ]}
      accessibilityLabel="Quick generate recipe"
      accessibilityRole="button"
    >
      <View style={styles.fabContent}>
        {loading ? (
          <Text className="text-white">...</Text>
        ) : (
          <Text className="text-2xl">✨</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981', // primary color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
