// [STAKE+TRUST:BEGIN:trust_footer_links]
"use client";

import { useTrustFlags } from "@/hooks/useTrustFlags";
import { useEffect, useState } from "react";

const TRUST_FLAG_NAMES = ["privacy_center", "help_center", "export_portability", "audit_log"] as const;

/**
 * Footer links component that shows trust-related links based on feature flags
 */
export function TrustFooterLinks() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Get user ID from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Try to get user ID from various sources
      const storedUserId = localStorage.getItem("userId") || 
                          localStorage.getItem("user_id") ||
                          sessionStorage.getItem("userId");
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, []);

  // Check flags
  const flags = useTrustFlags(
    TRUST_FLAG_NAMES as unknown as Parameters<typeof useTrustFlags>[0],
    userId
  );

  return (
    <>
      {/* Trust Center link - gated by privacy_center flag */}
      {flags.privacy_center && (
        <a
          href="/trust"
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
        >
          Trust
        </a>
      )}
      {/* Help Center link - gated by help_center flag */}
      {flags.help_center && (
        <a
          href="/help"
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
        >
          Help
        </a>
      )}
      {/* Export Data link - gated by export_portability flag */}
      {flags.export_portability && (
        <a
          href="/account/export"
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
        >
          Export Data
        </a>
      )}
      {/* Audit Log link - gated by audit_log flag */}
      {flags.audit_log && (
        <a
          href="/account/audit-log"
          className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-1"
        >
          Audit Log
        </a>
      )}
    </>
  );
}
// [STAKE+TRUST:END:trust_footer_links]

export default TrustFooterLinks;
