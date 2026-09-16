// @ts-nocheck
/**
 * CRM Adapter Types
 */

export interface EmailMessage {
  to: string;
  from?: { email: string; name?: string };
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  categories?: string[];
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  // React Email or MJML compiled
  text?: string;
}

export interface EmailSubscription {
  email: string;
  userId?: string;
  listId?: string;
  attributes?: Record<string, unknown>;
}

export interface CRMAdapter {
  sendTransactional(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendMarketing(messages: EmailMessage[]): Promise<{ success: number; failed: number; errors: string[] }>;
  identify(user: { userId: string; email: string; attributes?: Record<string, unknown> }): Promise<void>;
  subscribe(subscription: EmailSubscription): Promise<{ success: boolean; error?: string }>;
  unsubscribe(email: string, listId?: string): Promise<{ success: boolean; error?: string }>;
  track(event: { userId?: string; email?: string; event: string; properties?: Record<string, unknown> }): Promise<void>;
}
