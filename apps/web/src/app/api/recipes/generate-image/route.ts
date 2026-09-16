import { z } from 'zod';

const imageSchema = z.object({
  recipeTitle: z.string(),
  ingredients: z.array(z.string()).optional(),
  style: z.enum(['realistic', 'artistic', 'minimal']).optional(),
});

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipeTitle, ingredients, style = 'realistic' } = imageSchema.parse(body);

    // TODO: Integrate with image generation API (OpenAI DALL-E, Stability AI, etc.)
    // For now, return Unsplash placeholder
    const searchQuery = encodeURIComponent(recipeTitle);
    const unsplashUrl = `https://source.unsplash.com/800x600/?${searchQuery},food`;

    // In production, call AI image generation:
    // const imageUrl = await generateRecipeImage(recipeTitle, ingredients, style);

    return NextResponse.json({
      imageUrl: unsplashUrl,
      source: 'unsplash', // or 'ai-generated'
      cached: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
