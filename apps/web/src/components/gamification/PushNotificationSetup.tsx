"use client";
import { useState, useEffect } from "react"
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('pushnotificationsetup');

;
import { supabase } from "@/lib/supabase/client";
import { hapticTap } from "@/components/gamification/Haptics";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
    setSubscription(sub);
  }

  async function subscribe() {
    if (!isSupported) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ? (urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) as unknown as BufferSource)
          : undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user && sub) {
        const key = sub.getKey("p256dh");
        const auth = sub.getKey("auth");

        await supabase.from("push_subscriptions").insert({
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: arrayBufferToBase64(key),
          auth: arrayBufferToBase64(auth),
        });

        setIsSubscribed(true);
        setSubscription(sub);
        hapticTap();
      }
    } catch (err) {
      _logger.error('Push subscription failed:', { err });
    }
  }

  async function unsubscribe() {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      setSubscription(null);
    } catch (err) {
      _logger.error('Push unsubscription failed:', { err });
    }
  }

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null | undefined): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function PushNotificationSetup() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="rounded-xl border p-4 bg-card">
        <div className="text-sm text-muted-foreground">
          Push notifications are not supported in your browser.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-sm">Push Notifications</div>
          <div className="text-xs text-muted-foreground">
            Get notified about streak reminders, achievements, and more
          </div>
        </div>
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`px-4 py-2 rounded-lg text-sm ${
            isSubscribed ? "bg-secondary" : "bg-primary text-primary-fg"
          }`}
        >
          {isSubscribed ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
