"use client";
import React from "react";
import ConsentGate from "@/components/integrations/ConsentGate";
import { isIntegrationEnabled } from "@/lib/integrations-config";

export function VercelAnalyticsIntegration() {
  if (!isIntegrationEnabled("vercelAnalytics")) return null;
  
  return (
    <ConsentGate requireKey="analytics">
      {/* Vercel Analytics runtime placeholder */}
    </ConsentGate>
  );
}

export default VercelAnalyticsIntegration;
