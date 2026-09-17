/// <reference types="nativewind/types" />
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
}

declare module 'expo-tracking-transparency' {
  export enum PermissionStatus {
    UNDETERMINED = 'undetermined',
    GRANTED = 'granted',
    DENIED = 'denied',
    RESTRICTED = 'restricted',
  }
  export function requestTrackingPermissionsAsync(): Promise<{ status: PermissionStatus; granted: boolean }>;
  export function getTrackingPermissionsAsync(): Promise<{ status: PermissionStatus; granted: boolean }>;
  export function isAvailable(): boolean;
}
