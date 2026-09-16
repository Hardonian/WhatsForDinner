import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { country: string; plan: string } },
) {
  return GET_ELASTICITY(request, params);
}

export const dynamic = "force-dynamic";
