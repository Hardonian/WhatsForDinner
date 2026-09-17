'use client';


/**
 * Accessibility Statement Page
 * 
 * WCAG 2.1 AA compliance information
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Accessibility Statement</h1>
          <p className="text-muted-foreground">
            Our commitment to making What's for Dinner accessible to everyone
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>WCAG 2.1 AA Compliance</CardTitle>
            <CardDescription>
              We strive to meet WCAG 2.1 Level AA standards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Keyboard Navigation</h3>
                  <p className="text-sm text-muted-foreground">
                    All functionality is accessible via keyboard. Use Tab to navigate, Enter/Space to activate, and Escape to close modals.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Screen Reader Support</h3>
                  <p className="text-sm text-muted-foreground">
                    ARIA labels and semantic HTML ensure compatibility with screen readers like NVDA, JAWS, and VoiceOver.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Color Contrast</h3>
                  <p className="text-sm text-muted-foreground">
                    Text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Focus Indicators</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear focus indicators help users navigate with keyboard.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Ongoing Improvements</h3>
                  <p className="text-sm text-muted-foreground">
                    We continuously improve accessibility. If you encounter issues, please contact us.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Skip to main content link</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Alt text for images</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Form labels and error messages</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>ARIA landmarks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Semantic HTML structure</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Accessibility Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you encounter accessibility barriers, please contact us:
            </p>
            <div className="space-y-2">
              <div>
                <strong>Email:</strong> accessibility@whatsfordinner.com
              </div>
              <div>
                <strong>Feedback Form:</strong>{' '}
                <a href="/beta/feedback" className="text-primary hover:underline">
                  /beta/feedback
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
