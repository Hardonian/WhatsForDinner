"use client";
import { useEffect } from "react";
import { isIntegrationEnabled } from "@/lib/integrations-config";

export function LenisIntegration() {
  if (!isIntegrationEnabled("lenis")) return null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Lenis smooth scroll optional integration
  }, []);

  return null;
}

export default LenisIntegration;
