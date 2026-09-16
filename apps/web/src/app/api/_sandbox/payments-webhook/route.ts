import crypto from 'crypto';

const EVIDENCE_DIR = join(process.cwd(), 'reports', 'connectivity', 'evidence', 'webhooks');

mkdirSync(EVIDENCE_DIR, { recursive: true });

function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  // Simplified verification - in production use stripe.webhooks.constructEvent
  const elements = signature.split(',');
  const sigHash = elements.find(e => e.startsWith('v1='));
  
  if (!sigHash) return false;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return sigHash === `v1=${hash}`;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  
  const timestamp = Date.now();
  const evidenceFile = join(EVIDENCE_DIR, `payments-webhook-${timestamp}.json`);
  
  try {
    // Verify signature (simplified for sandbox)
    const isValid = verifyStripeSignature(body, signature, secret);
    
    const payload = JSON.parse(body);
    const eventType = payload.type || 'unknown';
    
    const evidence = {
      timestamp: new Date().toISOString(),
      isValid,
      signature: signature.substring(0, 50) + '...', // Mask signature
      eventType,
      payload: {
        id: payload.id,
        type: payload.type,
        data: payload.data,
      },
      headers: {
        'stripe-signature': signature.substring(0, 50) + '...',
        'content-type': request.headers.get('content-type'),
      },
    };
    
    writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
    
    // Simulate entitlement update for premium purchases
    if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
      const customerId = payload.data?.object?.customer;
            
      // In real flow, this would update user.plan = 'premium' and disable ads
    }
    
    return NextResponse.json({
      received: true,
      eventType,
      timestamp: new Date().toISOString(),
      evidenceFile,
    });
  } catch (error) {
    const errorEvidence = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      body: body.substring(0, 500), // Truncate
      signature: signature.substring(0, 50) + '...',
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
    endpoint: '/api/_sandbox/payments-webhook',
    description: 'Payments webhook sandbox receiver (Stripe)',
  });
}

export const dynamic = "force-dynamic";
