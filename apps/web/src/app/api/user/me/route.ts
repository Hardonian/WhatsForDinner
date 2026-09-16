import { withTelemetry } from '@/lib/telemetry/api-middleware';

const updatePreferencesSchema = z.object({
  diet: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

// GET /api/user/me
async function getHandler(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optimize: Fetch user and flags in parallel
    const [user, flags] = await Promise.all([
      usersRepo.findById(ctx.user.id),
      featureFlagsRepo.findByUser(ctx.user.id),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        preferences: user.preferences,
      },
      flags,
    });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    const { handleApiError } = await import('@whats-for-dinner/utils');
    return handleApiError(error, {
      component: 'user-me-api',
      context: { endpoint: '/api/user/me' },
    });
  }
}

export const GET = withTelemetry(getHandler);

// PATCH /api/user/me
async function patchHandler(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updatePreferencesSchema.parse(body);

    const currentUser = await usersRepo.findById(ctx.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedPreferences = {
      ...(currentUser.preferences || {}),
      ...validated,
    };

    const updated = await usersRepo.update(ctx.user.id, {
      preferences: updatedPreferences,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    let res = NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        plan: updated.plan,
        preferences: updated.preferences,
      },
    });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    const { handleApiError } = await import('@whats-for-dinner/utils');
    return handleApiError(error, {
      component: 'user-me-api',
      context: { endpoint: '/api/user/me', method: 'PATCH' },
    });
  }
}

export const PATCH = withTelemetry(patchHandler);

export const dynamic = "force-dynamic";
