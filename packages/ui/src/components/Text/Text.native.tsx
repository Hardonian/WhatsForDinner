import React from 'react';
import { Text as RNText, TextStyle } from 'react-native';

export interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'small';
  className?: string;
  testID?: string;
  style?: TextStyle;
  accessibilityRole?: any;
  accessibilityLabel?: string;
}

export function Text({
  children,
  variant = 'body',
  className,
  testID,
  style,
  accessibilityRole,
  accessibilityLabel,
  ...props
}: TextProps) {
  const variantStyles: Record<string, TextStyle> = {
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 44,
    },
    h2: {
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 38,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 26,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      color: '#64748b',
    },
    small: {
      fontSize: 12,
      color: '#64748b',
    },
  };

  return (
    <RNText
      style={[variantStyles[variant], style]}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </RNText>
  );
}