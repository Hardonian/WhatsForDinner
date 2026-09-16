import { requireAuth } from "@/lib/auth-middleware";

export const runtime = "nodejs";

interface ExportData {
  account: {
    id: string;
    email: string;
    created_at: string;
    preferences: Record<string, unknown>;
  };
  pantry: Array<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
    added_at: string;
  }>;
  recipes: Array<{
    id: string;
    title: string;
    saved_at: string;
  }>;
  meal_plans: Array<{
    id: string;
    created_at: string;
    recipes: string[];
  }>;
  audit_log: Array<{
    id: number;
    action: string;
    ts: string;
    meta: Record<string, unknown>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const userId = context.user.id;
    const supabase = context.supabase;

    const body = await request.json();
    const { format = "json" } = body;

    // Collect all user data
    const exportData: ExportData = {
      account: {
        id: userId,
        email: context.user.email || "",
        created_at: "",
        preferences: {},
      },
      pantry: [],
      recipes: [],
      meal_plans: [],
      audit_log: [],
    };

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      exportData.account.created_at = profile.created_at || "";
      exportData.account.preferences = profile.preferences || {};
    }

    // Get pantry items (assuming pantry table exists)
    const { data: pantryItems } = await supabase
      .from("pantry")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (pantryItems) {
      exportData.pantry = pantryItems.map((item: any) => ({
        id: item.id,
        name: item.name || item.ingredient || "",
        quantity: item.quantity || "",
        unit: item.unit || "",
        added_at: item.created_at || item.added_at || "",
      }));
    }

    // Get saved recipes (assuming recipes table exists)
    const { data: recipes } = await supabase
      .from("saved_recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (recipes) {
      exportData.recipes = recipes.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title || recipe.name || "",
        saved_at: recipe.created_at || recipe.saved_at || "",
      }));
    }

    // Get meal plans (assuming meal_plans table exists)
    const { data: mealPlans } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (mealPlans) {
      exportData.meal_plans = mealPlans.map((plan: any) => ({
        id: plan.id,
        created_at: plan.created_at || "",
        recipes: plan.recipes || plan.recipe_ids || [],
      }));
    }

    // Get audit log (last 180 days as per retention policy)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: auditLogs } = await supabase
      .from("audit_log")
      .select("*")
      .eq("user_id", userId)
      .gte("ts", sixMonthsAgo.toISOString())
      .order("ts", { ascending: false });

    if (auditLogs) {
      exportData.audit_log = auditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        ts: log.ts,
        meta: log.meta || {},
      }));
    }

    // Format response based on requested format
    if (format === "csv") {
      // Convert to CSV format (simplified)
      const csv = [
        "Type,ID,Name,Value,Date",
        ...exportData.pantry.map(
          (item) =>
            `Pantry,${item.id},"${item.name}",${item.quantity} ${item.unit},"${item.added_at}"`
        ),
        ...exportData.recipes.map(
          (recipe) => `Recipe,${recipe.id},"${recipe.title}",,"${recipe.saved_at}"`
        ),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="export_${userId}_${Date.now()}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="export_${userId}_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    // Error handled: Error exporting data:
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
// [STAKE+TRUST:END:export_api]

export const dynamic = "force-dynamic";
