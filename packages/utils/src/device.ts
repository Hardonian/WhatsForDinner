// @ts-nocheck
// Platform detection without React Native dependency
export const isWeb = typeof window !== 'undefined';
export const isIOS = isWeb ? /iPad|iPhone|iPod/.test(navigator.userAgent) : false;
export const isAndroid = isWeb ? /Android/.test(navigator.userAgent) : false;

export function useDeviceMode() {
  return {
    isWeb,
    isIOS,
    isAndroid,
    platform: isWeb ? 'web' : 'native',
  };
}

export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  // This would be implemented with actual responsive detection
  // For now, return mobile value
  return mobile;
}

export function getPlatformValue<T>(web: T, mobile: T): T {
  return isWeb ? web : mobile;
}