import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user data (GDPR right to deletion)
    const tables = [
      'analytics_events',
      'user_preferences',
      'recipes',
      'users',
    ];

    const deletions = await Promise.all(
      tables.map((table) =>
        supabase.from(table).delete().eq('user_id', userId)
      )
    );

    const errors = deletions.filter((d) => d.error);
    if (errors.length > 0) {
      logger.error('GDPR deletion partial failure', { errors });
      return NextResponse.json(
        { error: 'Partial deletion failure', details: errors },
        { status: 500 }
      );
    }

    logger.info('GDPR deletion completed', { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('GDPR deletion failed', { error });
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
