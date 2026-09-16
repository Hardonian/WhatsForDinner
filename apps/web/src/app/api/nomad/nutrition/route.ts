import { getNutritionData } from '@/lib/nomad/external-apis';

// GET /api/nomad/nutrition - Get nutrition data for food item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // Food item name or barcode
    const barcode = searchParams.get('barcode');

    if (!query && !barcode) {
      return NextResponse.json({ error: 'Query or barcode required' }, { status: 400 });
    }

    // Use unified nutrition lookup (tries multiple sources)
    const nutritionData = await getNutritionData(query || '', barcode || undefined);

    if (!nutritionData) {
      return NextResponse.json(
        { error: 'Nutrition data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(nutritionData);
  } catch (error) {
    // Error handled: Error fetching nutrition data:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
