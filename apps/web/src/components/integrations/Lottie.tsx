"use client";
import React from "react";
import { isIntegrationEnabled } from "@/lib/integrations-config";

// Safe fallback for Lottie player when optional package is absent
export function LottiePlayer({ src, autoplay, loop, className, style, ...props }: any) {
  return (
    <div
      className={className}
      data-testid="lottie-player-container"
      style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center", ...style }}
      {...props}
    />
  );
}

export function LottieIntegration() {
  if (!isIntegrationEnabled("lottie")) return null;
  return null;
}

export default LottiePlayer;
