import { generateCSRFToken } from '@/lib/csrf';

export async function GET() {
  try {
    const token = await generateCSRFToken();
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
