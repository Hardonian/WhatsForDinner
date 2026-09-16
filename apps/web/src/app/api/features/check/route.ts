import { z } from 'zod';

const CheckSchema = z.object({
  featureName: z.string(),
});

/**
 * POST /api/features/check
 * Checks if a feature is available for the user's plan
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { featureName } = CheckSchema.parse(body);

    // Get user and tenant
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    let plan: PlanType = 'free';
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user's tenant plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();
          
          if (profile?.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('plan')
              .eq('id', profile.tenant_id)
              .single();
            
            if (tenant?.plan) {
              plan = tenant.plan as PlanType;
            }
          }
        }
      } catch {
        // Not authenticated or error, default to free
      }
    }

    const available = hasFeature(featureName, plan);

    return NextResponse.json({
      featureName,
      available,
      plan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Error handled: Error checking feature:
    return NextResponse.json(
      { error: 'Failed to check feature' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
