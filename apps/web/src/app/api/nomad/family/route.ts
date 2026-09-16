import { createClient } from '@/lib/supabase/server';

// GET /api/nomad/family - Get family members and shared data
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's family group
    const { data: familyMembership } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!familyMembership) {
      return NextResponse.json({ family: null, members: [] });
    }

    // Get all family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*, user_profiles(*)')
      .eq('family_id', familyMembership.family_id);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Get shared grocery lists
    const { data: groceryLists } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('family_id', familyMembership.family_id);

    // Get recent family activity
    const { data: activities } = await supabase
      .from('family_activities')
      .select('*')
      .eq('family_id', familyMembership.family_id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      family: {
        id: familyMembership.family_id,
      },
      members: members || [],
      groceryLists: groceryLists || [],
      activities: activities || [],
    });
  } catch (error) {
    // Error handled: Error fetching family data:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/nomad/family - Create or join family
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, familyId, inviteCode } = body;

    if (action === 'create') {
      // Create new family group
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: body.name || 'My Family',
          created_by: user.id,
        })
        .select()
        .single();

      if (familyError) {
        return NextResponse.json({ error: familyError.message }, { status: 500 });
      }

      // Add creator as member
      await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: user.id,
        role: 'admin',
      });

      return NextResponse.json({ family }, { status: 201 });
    }

    if (action === 'join' && inviteCode) {
      // Join family by invite code
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (!family) {
        return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
      }

      // Add user as member
      const { error: joinError } = await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: user.id,
        role: 'member',
      });

      if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, familyId: family.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    // Error handled: Error with family operation:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
