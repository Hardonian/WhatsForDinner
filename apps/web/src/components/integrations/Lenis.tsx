"use client";
import { useEffect } from "react";
import { isIntegrationEnabled } from "@/lib/integrations-config";

export function LenisIntegration() {
  const enabled = isIntegrationEnabled("lenis");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    // Lenis smooth scroll optional integration
  }, [enabled]);

  if (!enabled) return null;

  return null;
}

export default LenisIntegration;
