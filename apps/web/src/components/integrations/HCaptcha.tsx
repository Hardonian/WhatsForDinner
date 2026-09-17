"use client";
import React from "react";
import ConsentGate from "@/components/integrations/ConsentGate";
import { isIntegrationEnabled } from "@/lib/integrations-config";

// Safe fallback for hCaptcha when external bundle is not installed
export function HCaptcha({ sitekey, onVerify, className, ...props }: any) {
  return (
    <div
      className={className}
      data-testid="hcaptcha-container"
      data-sitekey={sitekey}
      style={{ minHeight: "78px" }}
      {...props}
    />
  );
}

export function HCaptchaIntegration() {
  if (!isIntegrationEnabled("hcaptcha")) return null;
  
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;
  if (!siteKey) return null;

  // hCaptcha is functional, not analytics
  return (
    <ConsentGate requireKey="functional">
      <div id="hcaptcha-container" style={{ display: "none" }} />
    </ConsentGate>
  );
}

export default HCaptcha;
