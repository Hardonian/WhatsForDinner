import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { cn } from '@whats-for-dinner/utils';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'brand' | 'accent' | 'destructive' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; [key: string]: any };
  accessibilityRole?: any;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  testID,
  accessibilityLabel,
  accessibilityState,
  accessibilityRole,
  ...props
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-lg font-medium transition-colors';
  
  const variantClasses = {
    default: 'bg-primary-500 active:bg-primary-600',
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-secondary-500 active:bg-secondary-600',
    brand: 'bg-brand-500 active:bg-brand-600',
    accent: 'bg-accent-500 active:bg-accent-600',
    outline: 'border border-primary-500 bg-transparent active:bg-primary-50',
    ghost: 'bg-transparent active:bg-primary-50',
    destructive: 'bg-error-500 active:bg-error-600',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2 text-base',
    lg: 'h-12 px-6 text-lg',
    xl: 'h-14 px-8 text-xl',
  };

  const textClasses = cn(
    'text-center font-semibold',
    variant === 'outline' ? 'text-primary-600' : 
    variant === 'ghost' ? 'text-primary-600' :
    'text-white'
  );

  return (
    <TouchableOpacity
      className={cn(
        baseClasses,
        variantClasses[variant || 'primary'],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityRole={accessibilityRole}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <Text className={cn(textClasses, 'opacity-70')}>Loading...</Text>
      ) : (
        <Text className={textClasses}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}