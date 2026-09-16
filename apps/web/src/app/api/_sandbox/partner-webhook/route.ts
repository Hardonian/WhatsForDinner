/**
 * Partner Conversion Webhook Sandbox Receiver
 * 
 * Local webhook receiver for testing partner conversion flows.
 * Asserts HMAC signatures and stores evidence snapshots.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('route-ts');
const EVIDENCE_DIR = join(process.cwd(), 'reports', 'connectivity', 'evidence', 'webhooks');

mkdirSync(EVIDENCE_DIR, { recursive: true });

function verifyHMAC(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-partner-hmac-signature') || '';
  const secret = process.env.PARTNER_CONVERSION_HMAC_SECRET || 'test-hmac-secret-min-32-chars-required';
  
  const timestamp = Date.now();
  const evidenceFile = join(EVIDENCE_DIR, `partner-webhook-${timestamp}.json`);
  
  try {
    // Verify HMAC
    const isValid = verifyHMAC(body, signature, secret);
    
    const payload = JSON.parse(body);
    
    const evidence = {
      timestamp: new Date().toISOString(),
      isValid,
      signature,
      payload,
      headers: Object.fromEntries(request.headers.entries()),
    };
    
    writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 401 },
      );
    }
    
    // Store evidence
    _logger.info('Evidence stored at ${evidenceFile}');
    
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      evidenceFile,
    });
  } catch (error) {
    const errorEvidence = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      body,
      signature,
    };
    
    writeFileSync(evidenceFile, JSON.stringify(errorEvidence, null, 2));
    
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/_sandbox/partner-webhook',
    description: 'Partner conversion webhook sandbox receiver',
  });
}
