// @ts-nocheck
/**
 * CRM Adapter Factory
 * Switches between SendGrid, Klaviyo, or No-op based on env
 */

import { sendGridAdapter, SendGridAdapter } from './sendgrid';
import { klaviyoAdapter, KlaviyoAdapter } from './klaviyo';
import { noopAdapter, NoopAdapter } from './noop';
import type { CRMAdapter } from './types';

const provider = process.env.CRM_PROVIDER || 'noop';

export function getCRMAdapter(): CRMAdapter {
  switch (provider) {
    case 'sendgrid':
      return sendGridAdapter;
    case 'klaviyo':
      return klaviyoAdapter;
    case 'noop':
    default:
      return noopAdapter;
  }
}

export const crmAdapter = getCRMAdapter();

export * from './types';
export * from './sendgrid';
export * from './klaviyo';
export * from './noop';
