import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@whats-for-dinner/utils';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'brand';
  className?: string;
  testID?: string;
  accessibilityRole?: any;
  accessibilityLabel?: string;
}

export function Card({ 
  children, 
  title, 
  subtitle, 
  variant = 'default',
  className, 
  testID,
  accessibilityRole,
  accessibilityLabel,
  ...props 
}: CardProps) {
  const baseClasses = 'rounded-lg border p-4';
  
  const variantClasses = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-lg',
    outlined: 'bg-transparent border-2 border-primary-200',
    filled: 'bg-primary-50 border-primary-200',
    brand: 'bg-brand-50 border-brand-200',
  };

  return (
    <View
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {title && (
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text className="text-sm text-gray-600 mb-3">
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
}
