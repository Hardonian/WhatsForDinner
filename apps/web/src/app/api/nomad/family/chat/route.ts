import { createClient } from '@/lib/supabase/server';

// GET /api/nomad/family/chat - Get chat messages
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('family_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!familyId) {
      return NextResponse.json({ error: 'Family ID required' }, { status: 400 });
    }

    // Verify user is member of family
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a family member' }, { status: 403 });
    }

    // Get chat messages
    const { data: messages, error } = await supabase
      .from('family_chat_messages')
      .select('*, user_profiles(*)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error?.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages?.reverse() || [] });
  } catch (error) {
    // Error handled: Error fetching chat messages:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/nomad/family/chat - Send chat message
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { familyId, message, type = 'text' } = body;

    if (!familyId || !message) {
      return NextResponse.json(
        { error: 'Family ID and message required' },
        { status: 400 }
      );
    }

    // Verify user is member of family
    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a family member' }, { status: 403 });
    }

    // Create message
    const { data: chatMessage, error } = await supabase
      .from('family_chat_messages')
      .insert({
        family_id: familyId,
        user_id: user.id,
        message,
        message_type: type,
      })
      .select('*, user_profiles(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch (error) {
    // Error handled: Error sending chat message:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
