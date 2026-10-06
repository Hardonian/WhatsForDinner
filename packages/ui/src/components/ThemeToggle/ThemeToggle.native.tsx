import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@whats-for-dinner/utils';
import { cn } from '@whats-for-dinner/utils';

type NativeWindTouchableOpacityProps = React.ComponentProps<typeof TouchableOpacity> & {
  className?: string;
};

const NativeWindTouchableOpacity =
  TouchableOpacity as React.ComponentType<NativeWindTouchableOpacityProps>;

export interface ThemeToggleProps {
  className?: string;
  testID?: string;
}

export function ThemeToggle({ className, testID }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const getIcon = () => {
    if (theme === 'system') return '🌓';
    return isDark ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (theme === 'system') return 'System';
    return isDark ? 'Dark' : 'Light';
  };

  return (
    <NativeWindTouchableOpacity
      className={cn(
        'flex-row items-center justify-center px-3 py-2 rounded-lg bg-transparent',
        className
      )}
      onPress={toggleTheme}
      testID={testID}
      activeOpacity={0.7}
    >
      <Text className="text-lg mr-2">{getIcon()}</Text>
      <Text className="text-sm font-medium text-primary-600">{getLabel()}</Text>
    </NativeWindTouchableOpacity>
  );
}
