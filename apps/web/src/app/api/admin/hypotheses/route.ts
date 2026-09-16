import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load hypotheses from validation framework
    // In a real implementation, this would come from a database or config file
    const hypotheses = [
      {
        id: 'problem-time-waste',
        hypothesis: 'Users waste 15+ minutes daily deciding what to cook',
        status: 'validated' as const,
        evidence: 'User interviews: 18/20 confirmed 15-20 minutes wasted',
        test: 'Problem frequency survey',
        results: '80%+ confirm daily occurrence',
      },
      {
        id: 'customer-willingness-to-pay',
        hypothesis: 'Busy families will pay $9.99/month',
        status: 'testing' as const,
        evidence: 'User surveys: 60% would pay $9.99/month',
        test: 'Pricing A/B test (Week 6)',
        results: 'Testing in progress',
      },
      {
        id: 'feature-pantry-first',
        hypothesis: 'Pantry-first approach reduces decision time',
        status: 'validated' as const,
        evidence: 'Early feedback: 90% prefer pantry-first approach',
        test: 'Usage data, user feedback',
        results: 'Validated',
      },
      {
        id: 'revenue-subscription',
        hypothesis: 'Subscription model works better than one-time purchase',
        status: 'testing' as const,
        evidence: 'Market research, conversion data',
        test: 'Conversion rate tracking',
        results: 'Testing in progress',
      },
      {
        id: 'growth-referral',
        hypothesis: 'Referral program achieves 0.2 viral coefficient',
        status: 'testing' as const,
        evidence: 'Referral program launch (Week 1)',
        test: 'Referral tracking',
        results: 'Testing in progress',
      },
      {
        id: 'growth-seo',
        hypothesis: 'SEO landing pages drive 100+ organic signups/month',
        status: 'testing' as const,
        evidence: 'SEO landing page implementation (Week 3)',
        test: 'SEO traffic data',
        results: 'Testing in progress',
      },
    ];

    return NextResponse.json({ hypotheses });
  } catch (error: any) {
    console.error('Error fetching hypotheses:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch hypotheses' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
