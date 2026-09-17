export const dynamic = 'force-dynamic';

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

export default function ReferralLandingPage() {
  const router = useRouter();
  const params = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function applyReferral() {
      const code = (params.code as string)?.toUpperCase();
      if (!code) {
        setStatus("error");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store code for later if user isn't logged in
        localStorage.setItem("pending_referral", code);
        router.push("/auth");
        return;
      }

      // Find referrer by code
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", code)
        .single();

      if (!referrer) {
        setStatus("error");
        return;
      }

      // Apply referral code
      const { error } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrer.id,
          referral_code: code,
          referred_id: user.id,
          status: "completed"
        });

      if (!error) {
        // Award XP
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_xp: (profile.total_xp || 0) + 25 })
            .eq("id", user.id);
        }
        
        setStatus("success");
        setTimeout(() => router.push("/play"), 2000);
      } else {
        setStatus("error");
      }
    }

    applyReferral();
  }, [params.code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
            <p className="text-muted-foreground">Applying your referral code...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold mb-2">Referral Applied!</h1>
            <p className="text-muted-foreground">You earned 25 XP! Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2">Invalid Code</h1>
            <p className="text-muted-foreground">This referral code is invalid or expired.</p>
            <button
              onClick={() => router.push("/play")}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-fg"
            >
              Go to Play Hub
            </button>
          </>
        )}
      </div>
    </div>
  );
}
