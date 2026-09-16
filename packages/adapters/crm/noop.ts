/**
 * No-op CRM Adapter
 * Disabled mode for development/testing
 */

import type { EmailTemplate, EmailMessage, EmailSubscription } from './types.js';
import { logger } from '@whats-for-dinner/server/observability';

export class NoopAdapter {
  async sendTransactional(_message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    logger.debug({ to: _message.to }, 'Email send skipped (noop mode)');
    return { success: true, messageId: `noop_${Date.now()}` };
  }

  async sendMarketing(_messages: EmailMessage[]): Promise<{ success: number; failed: number; errors: string[] }> {
    logger.debug({ count: _messages.length }, 'Marketing emails skipped (noop mode)');
    return { success: _messages.length, failed: 0, errors: [] };
  }

  async identify(_user: { userId: string; email: string; attributes?: Record<string, unknown> }): Promise<void> {
    logger.debug('Identify skipped (noop mode)');
  }

  async subscribe(_subscription: EmailSubscription): Promise<{ success: boolean; error?: string }> {
    logger.debug('Subscribe skipped (noop mode)');
    return { success: true };
  }

  async unsubscribe(_email: string, _listId?: string): Promise<{ success: boolean; error?: string }> {
    logger.debug('Unsubscribe skipped (noop mode)');
    return { success: true };
  }

  async track(_event: { userId?: string; email?: string; event: string; properties?: Record<string, unknown> }): Promise<void> {
    logger.debug('Track skipped (noop mode)');
  }
}

export const noopAdapter = new NoopAdapter();
