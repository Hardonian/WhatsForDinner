// [STAKE+TRUST:BEGIN:trust_flags_hook]
"use client";

import { useState, useEffect } from "react";
import { isTrustFlagEnabled } from "@/lib/trust-flags";

/**
 * React hook for checking trust feature flags in client components
 * @param flagName - Name of the flag to check
 * @param userId - Optional user ID for user-specific flags
 * @returns true if flag is enabled, false otherwise
 */
export function useTrustFlag(
  flagName: Parameters<typeof isTrustFlagEnabled>[0],
  userId?: string
): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Try to get user ID from localStorage or session
    const storedUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") || undefined : undefined);
    setEnabled(isTrustFlagEnabled(flagName, storedUserId));
  }, [flagName, userId]);

  return enabled;
}

/**
 * Get multiple trust flags at once
 */
export function useTrustFlags(
  flagNames: Parameters<typeof isTrustFlagEnabled>[0][],
  userId?: string
): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const storedUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") || undefined : undefined);
    const initial: Record<string, boolean> = {};
    flagNames.forEach((name) => {
      initial[name] = isTrustFlagEnabled(name, storedUserId);
    });
    return initial;
  });

  const flagsKey = flagNames.join(',');

  useEffect(() => {
    const storedUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") || undefined : undefined);
    const result: Record<string, boolean> = {};
    flagNames.forEach((name) => {
      result[name] = isTrustFlagEnabled(name, storedUserId);
    });
    setFlags(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagsKey, userId]);

  return flags;
}
// [STAKE+TRUST:END:trust_flags_hook]
