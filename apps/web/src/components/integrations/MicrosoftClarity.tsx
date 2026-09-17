"use client";
import { useEffect } from "react";
import ConsentGate from "@/components/integrations/ConsentGate";
import { isIntegrationEnabled } from "@/lib/integrations-config";

export function MicrosoftClarityIntegration() {
  if (!isIntegrationEnabled("clarity")) return null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!clarityId) return;

    // Check if already loaded
    if ((window as any).clarity) return;

    // Load Clarity script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `;
    document.head.appendChild(script);
  }, []);

  return (
    <ConsentGate requireKey="analytics">
      <div id="clarity-script" />
    </ConsentGate>
  );
}

export default MicrosoftClarityIntegration;
