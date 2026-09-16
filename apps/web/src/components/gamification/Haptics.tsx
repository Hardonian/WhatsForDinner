"use client";

export function hapticTap() {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}
