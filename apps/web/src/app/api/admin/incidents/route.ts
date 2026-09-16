import { getAdminAuth } from '@whats-for-dinner/server/auth/admin';


export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createIncidentSchema.parse(body);

    const incidentId = await createIncident({
      ...data,
      openedBy: adminAuth.admin.id,
    });

    const incident = await getIncident(incidentId);

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    // Error handled: Incident create error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
