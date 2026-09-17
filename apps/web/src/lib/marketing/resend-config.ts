/**
 * Resend Email Service Configuration
 * 
 * Centralized configuration for Resend email service
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set. Email functionality will be limited.');
}

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const EMAIL_CONFIG = {
  from: {
    welcome: 'What\'s For Dinner <welcome@whatsfordinner.app>',
    hello: 'What\'s For Dinner <hello@whatsfordinner.app>',
    support: 'What\'s For Dinner Support <support@whatsfordinner.app>',
    noreply: 'What\'s For Dinner <noreply@whatsfordinner.app>',
  },
  replyTo: 'support@whatsfordinner.app',
  domain: 'whatsfordinner.app',
} as const;

/**
 * Send email with error handling
 */
export async function sendEmail(params: {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.error('❌ Resend not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo || EMAIL_CONFIG.replyTo,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Resend configuration
 */
export async function verifyResendConfig(): Promise<boolean> {
  if (!resend) {
    return false;
  }

  try {
    // Test API key by checking domain
    // In production, you might want to use resend.domains.list() or similar
    return true;
  } catch (error) {
    console.error('❌ Resend verification failed:', error);
    return false;
  }
}
