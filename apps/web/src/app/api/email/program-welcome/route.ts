import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { program_type, user_id, program_code } = body;

    if (!program_type || !user_id || !program_code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user data
    const { data: user } = await supabase.auth.admin.getUserById(user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare email content
    const emailData = {
      to: user.email,
      subject: getEmailSubject(program_type),
      html: getEmailTemplate(program_type, program_code, user.email || ''),
    };

    // Send email (integrate with your email service)
    // Example: await sendEmail(emailData);

    // Log email sent
    await supabase.from('program_analytics').insert({
      program_type,
      program_id: program_code,
      event_type: 'visit',
      metadata: { action: 'welcome_email_sent' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Email error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getEmailSubject(programType: string): string {
  switch (programType) {
    case 'referral':
      return 'Welcome to What\'s for Dinner Referral Program!';
    case 'affiliate':
      return 'Your Affiliate Account is Ready';
    case 'partner':
      return 'Partnership Opportunity - What\'s for Dinner';
    default:
      return 'Welcome!';
  }
}

function getEmailTemplate(programType: string, code: string, email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whatsfordinner.com';
  
  if (programType === 'referral') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Referral Program</title>
      </head>
      <body>
        <h1>Welcome to What's for Dinner Referral Program!</h1>
        <p>Hi there,</p>
        <p>You're all set! Your referral code is: <strong>${code}</strong></p>
        <p>Share your link: <a href="${baseUrl}/signup?ref=${code}">${baseUrl}/signup?ref=${code}</a></p>
        <p>Every time someone signs up using your link and subscribes, you both get 30 days of premium free!</p>
        <p>Start sharing and earning rewards today!</p>
      </body>
      </html>
    `;
  }

  if (programType === 'affiliate') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Affiliate Account Ready</title>
      </head>
      <body>
        <h1>Your Affiliate Account is Ready!</h1>
        <p>Hi there,</p>
        <p>Your affiliate application has been approved!</p>
        <p>Your affiliate code: <strong>${code}</strong></p>
        <p>Start earning 20% recurring commission on every subscription you refer.</p>
        <p>Login to your dashboard: <a href="${baseUrl}/affiliate">${baseUrl}/affiliate</a></p>
      </body>
      </html>
    `;
  }

  return '';
}

export const dynamic = "force-dynamic";
