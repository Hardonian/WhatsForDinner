import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { subject, category, message, email } = body;

    if (!subject || !category || !message || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        email: email,
        subject: subject,
        category: category,
        message: message,
        status: 'open',
        priority: category === 'billing' ? 'high' : 'medium',
      })
      .select()
      .single();

    if (error) {
      logger.error('Ticket creation error:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
      );
    }

    // Send confirmation email (integrate with email service)
    // await sendTicketConfirmationEmail(email, ticket.id);

    return NextResponse.json({
      success: true,
      ticket_id: ticket.id,
      message: 'Ticket created successfully',
    });
  } catch (error) {
    logger.error('Support ticket error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    logger.error('Ticket fetch error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
