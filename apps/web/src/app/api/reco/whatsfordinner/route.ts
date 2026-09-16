import { recoForWhatsForDinner } from "@/lib/reco/whatsfordinner/engine";
export const runtime="edge";
export async function POST(req: NextRequest){
  const { userId } = await req.json();
  if(!userId) return NextResponse.json({ error:"missing userId"},{status:400});
  const recs=await recoForWhatsForDinner(userId);
  return NextResponse.json({ recs });
}

export const dynamic = "force-dynamic";
