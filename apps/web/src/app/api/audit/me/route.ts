import { requireAuth } from "@/lib/auth-middleware";

export const runtime = "nodejs"; // Changed from edge to support auth middleware

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const userId = context.user.id;
    const supabase = context.supabase;

    // RLS will enforce that users can only see their own audit logs
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("user_id", userId)
      .order("ts", { ascending: false })
      .limit(100);

    if (error) {
      // Error handled: Error fetching audit log:
      return NextResponse.json(
        { error: "Failed to fetch audit log" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    // Error handled: Unexpected error:
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
// [STAKE+TRUST:END:audit_api]

export const dynamic = "force-dynamic";
