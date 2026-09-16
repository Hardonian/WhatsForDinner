import { makeRecommendations, persistRecommendations } from "@/lib/agent/recommender";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userId, window = "7d" } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const signals = await computeSignalsForUser(userId, window);
  const recs = await makeRecommendations(userId);
  await persistRecommendations(userId, recs);

  return NextResponse.json({ signals, recommendations: recs }, { status: 200 });
}

export const dynamic = "force-dynamic";
