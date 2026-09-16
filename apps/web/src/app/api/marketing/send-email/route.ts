import { trackConversion } from '@/lib/marketing/conversion-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      subject,
      html,
      text,
      type = 'transactional', // 'transactional' | 'marketing'
      userId,
      campaignId,
    } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const from =
      type === 'marketing'
        ? EMAIL_CONFIG.from.hello
        : EMAIL_CONFIG.from.noreply;

    const result = await sendEmail({
      to,
      from,
      subject,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Track email sent event
    if (userId) {
      trackConversion({
        userId,
        event: 'email_sent',
        properties: {
          type,
          campaignId,
          messageId: result.messageId,
        },
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
