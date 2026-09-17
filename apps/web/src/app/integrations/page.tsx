export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { getIntegrationsConfig } from "@/lib/integrations-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VercelAnalyticsIntegration } from "@/components/integrations/VercelAnalytics";
import { MicrosoftClarityIntegration } from "@/components/integrations/MicrosoftClarity";
import { CloudinaryIntegration, CldImage } from "@/components/integrations/Cloudinary";
import { LottieIntegration, LottiePlayer } from "@/components/integrations/Lottie";
import { LenisIntegration } from "@/components/integrations/Lenis";
import { HCaptchaIntegration, HCaptcha } from "@/components/integrations/HCaptcha";

export const metadata: Metadata = {
  title: "Integrations Demo",
  description: "Front-end enrichment integrations showcase",
};

export default function IntegrationsPage() {
  const config = getIntegrationsConfig();
  const enabledIntegrations = Object.entries(config)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Front-End Integrations</h1>
        <p className="text-muted-foreground">
          Showcase of enabled enrichment integrations for trust, UX, performance, and analytics.
        </p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {enabledIntegrations.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vercel Analytics */}
        {config.vercelAnalytics && (
          <Card>
            <CardHeader>
              <CardTitle>Vercel Analytics</CardTitle>
              <CardDescription>Zero-config usage insights</CardDescription>
            </CardHeader>
            <CardContent>
              <VercelAnalyticsIntegration />
              <p className="text-sm text-muted-foreground mt-2">
                Analytics component loaded (requires analytics consent)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Microsoft Clarity */}
        {config.clarity && (
          <Card>
            <CardHeader>
              <CardTitle>Microsoft Clarity</CardTitle>
              <CardDescription>Session replay and heatmaps</CardDescription>
            </CardHeader>
            <CardContent>
              <MicrosoftClarityIntegration />
              <p className="text-sm text-muted-foreground mt-2">
                Clarity script loaded (requires analytics consent)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cloudinary */}
        {config.cloudinary && (
          <Card>
            <CardHeader>
              <CardTitle>Cloudinary</CardTitle>
              <CardDescription>Media optimization and CDN</CardDescription>
            </CardHeader>
            <CardContent>
              <CloudinaryIntegration />
              <p className="text-sm text-muted-foreground mt-2">
                Cloudinary components available for use. Example:
              </p>
              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
                <div className="mt-4">
                  <CldImage
                    src="sample"
                    alt="Sample"
                    width={400}
                    height={300}
                    className="rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lottie */}
        {config.lottie && (
          <Card>
            <CardHeader>
              <CardTitle>Lottie Animations</CardTitle>
              <CardDescription>High-quality vector animations</CardDescription>
            </CardHeader>
            <CardContent>
              <LottieIntegration />
              <p className="text-sm text-muted-foreground mt-2">
                Lottie player available. Load a JSON animation file to see it in action.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lenis */}
        {config.lenis && (
          <Card>
            <CardHeader>
              <CardTitle>Lenis Smooth Scroll</CardTitle>
              <CardDescription>Silky smooth scrolling experience</CardDescription>
            </CardHeader>
            <CardContent>
              <LenisIntegration />
              <p className="text-sm text-muted-foreground mt-2">
                Smooth scrolling enabled. Try scrolling on this page!
              </p>
            </CardContent>
          </Card>
        )}

        {/* hCaptcha */}
        {config.hcaptcha && (
          <Card>
            <CardHeader>
              <CardTitle>hCaptcha</CardTitle>
              <CardDescription>Bot protection without Google</CardDescription>
            </CardHeader>
            <CardContent>
              <HCaptchaIntegration />
              {process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ? (
                <div className="mt-4">
                  <HCaptcha sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Configure NEXT_PUBLIC_HCAPTCHA_SITEKEY to see the widget
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sentry */}
        {config.sentry && (
          <Card>
            <CardHeader>
              <CardTitle>Sentry</CardTitle>
              <CardDescription>Error tracking and performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sentry is configured at the Next.js level. Check console for error tracking.
              </p>
            </CardContent>
          </Card>
        )}

        {/* PostHog */}
        {config.posthog && (
          <Card>
            <CardHeader>
              <CardTitle>PostHog</CardTitle>
              <CardDescription>Product analytics and session replay</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                PostHog is integrated via the Analytics component. Check browser console for initialization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Framer Motion */}
        {config.framerMotion && (
          <Card>
            <CardHeader>
              <CardTitle>Framer Motion</CardTitle>
              <CardDescription>Production-grade motion primitives</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Framer Motion is available throughout the app. Check components for animated elements.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Integration Status</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>All integrations respect privacy consent</li>
          <li>Analytics integrations require "analytics" consent</li>
          <li>Functional integrations require "functional" consent</li>
          <li>All scripts are lazy-loaded to preserve performance</li>
          <li>Widget heights are reserved to prevent CLS</li>
        </ul>
      </div>
    </div>
  );
}
