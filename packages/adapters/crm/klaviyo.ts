/**
 * Klaviyo CRM Adapter
 * Handles identify, track, subscribe, and send flows via Klaviyo API
 */

import type { EmailTemplate, EmailMessage, EmailSubscription } from './types.js';
import { logger } from '@whats-for-dinner/server/observability';

const apiKey = process.env.KLAVIYO_API_KEY;
const listId = process.env.KLAVIYO_LIST_ID;

interface KlaviyoProfile {
  data: {
    type: 'profile';
    id?: string;
    attributes: {
      email?: string;
      phone_number?: string;
      external_id?: string;
      [key: string]: unknown;
    };
  };
}

interface KlaviyoEvent {
  data: {
    type: 'event';
    attributes: {
      metric: {
        data: {
          type: 'metric';
          attributes: {
            name: string;
          };
        };
      };
      properties?: Record<string, unknown>;
      profile?: {
        data: {
          type: 'profile';
          attributes: {
            email?: string;
            external_id?: string;
          };
        };
      };
      time?: string;
    };
  };
}

export class KlaviyoAdapter {
  private apiKey: string;
  private baseUrl = 'https://a.klaviyo.com/api';
  private listId?: string;

  constructor(config?: { apiKey?: string; listId?: string }) {
    this.apiKey = config?.apiKey || apiKey || '';
    this.listId = config?.listId || listId;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown) {
    if (!this.apiKey) {
      throw new Error('Klaviyo API key not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
        'revision': '2024-10-15',
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify({ data }) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Klaviyo API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Identify user
   */
  async identify(user: { userId: string; email: string; attributes?: Record<string, unknown> }): Promise<void> {
    try {
      const profile: KlaviyoProfile = {
        data: {
          type: 'profile',
          attributes: {
            email: user.email,
            external_id: user.userId,
            ...user.attributes,
          },
        },
      };

      await this.request('/profiles', 'POST', profile);
      logger.info({ userId: user.userId, email: user.email }, 'User identified in Klaviyo');
    } catch (error: any) {
      logger.error({ error, userId: user.userId }, 'Failed to identify user in Klaviyo');
      throw error;
    }
  }

  /**
   * Track event
   */
  async track(event: { userId?: string; email?: string; event: string; properties?: Record<string, unknown> }): Promise<void> {
    try {
      const klaviyoEvent: KlaviyoEvent = {
        data: {
          type: 'event',
          attributes: {
            metric: {
              data: {
                type: 'metric',
                attributes: {
                  name: event.event,
                },
              },
            },
            properties: event.properties,
            profile: event.userId || event.email ? {
              data: {
                type: 'profile',
                attributes: {
                  ...(event.email ? { email: event.email } : {}),
                  ...(event.userId ? { external_id: event.userId } : {}),
                },
              },
            } : undefined,
            time: new Date().toISOString(),
          },
        },
      };

      await this.request('/events', 'POST', klaviyoEvent);
      logger.debug({ event: event.event }, 'Event tracked in Klaviyo');
    } catch (error: any) {
      logger.error({ error, event: event.event }, 'Failed to track event in Klaviyo');
      // Don't throw - tracking failures shouldn't break flow
    }
  }

  /**
   * Subscribe user to list
   */
  async subscribe(subscription: EmailSubscription): Promise<{ success: boolean; error?: string }> {
    try {
      const list = subscription.listId || this.listId;
      if (!list) {
        return { success: false, error: 'List ID required' };
      }

      // First, ensure profile exists
      if (subscription.userId) {
        await this.identify({
          userId: subscription.userId,
          email: subscription.email,
        });
      }

      // Add profile to list
      const profile = {
        data: {
          type: 'profile',
          attributes: {
            email: subscription.email,
            ...(subscription.userId ? { external_id: subscription.userId } : {}),
          },
        },
      };

      await this.request(`/lists/${list}/relationships/profiles`, 'POST', { data: [profile] });

      logger.info({ email: subscription.email, listId: list }, 'User subscribed to Klaviyo list');
      return { success: true };
    } catch (error: any) {
      logger.error({ error, email: subscription.email }, 'Failed to subscribe via Klaviyo');
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsubscribe user from list
   */
  async unsubscribe(email: string, listId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const list = listId || this.listId;
      if (!list) {
        return { success: false, error: 'List ID required' };
      }

      // Get profile ID by email
      const profiles = await this.request(`/profiles?filter=equals(email,"${email}")`, 'GET');
      if (profiles.data && profiles.data.length > 0) {
        const profileId = profiles.data[0].id;
        await this.request(`/lists/${list}/relationships/profiles`, 'DELETE', {
          data: [{ type: 'profile', id: profileId }],
        });
      }

      logger.info({ email, listId: list }, 'User unsubscribed from Klaviyo list');
      return { success: true };
    } catch (error: any) {
      logger.error({ error, email }, 'Failed to unsubscribe via Klaviyo');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email via Klaviyo flow
   */
  async sendTransactional(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Klaviyo uses flows for sending emails
      // For transactional, use a flow trigger
      if (message.templateId) {
        // Trigger flow by template ID
        await this.track({
          email: message.to,
          event: `email_${message.templateId}`,
          properties: message.templateData,
        });

        return { success: true, messageId: `klaviyo_${Date.now()}` };
      }

      // For custom HTML, use Klaviyo's email sending API (requires campaign setup)
      logger.warn('Custom HTML emails require Klaviyo campaign setup');
      return { success: false, error: 'Template-based emails only' };
    } catch (error: any) {
      logger.error({ error, to: message.to }, 'Failed to send email via Klaviyo');
      return { success: false, error: error.message };
    }
  }

  /**
   * Send marketing email (batch)
   */
  async sendMarketing(messages: EmailMessage[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      messages.map((msg) => this.sendTransactional(msg)),
    );

    const success = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    const errors = results
      .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error))
      .map((r) => (r.status === 'rejected' ? r.reason?.message : (r.value as any).error))
      .filter(Boolean);

    return { success, failed, errors };
  }
}

export const klaviyoAdapter = new KlaviyoAdapter();
