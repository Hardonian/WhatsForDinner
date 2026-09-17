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

declare namespace React {
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES {
    bigint: bigint;
    react19Element: {
      type: any;
      props: any;
      key: any;
    };
    iterable: Iterable<any>;
    promise: Promise<any>;
  }
}

declare module 'lucide-react-native' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
  }

  export type LucideIcon = React.FC<LucideProps>;

  export const Clock: LucideIcon;
  export const Users: LucideIcon;
  export const ChefHat: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Menu: LucideIcon;
  export const User: LucideIcon;
  export const Plus: LucideIcon;
  export const X: LucideIcon;
  export const Settings: LucideIcon;
  export const LogOut: LucideIcon;
  export const Heart: LucideIcon;
}


