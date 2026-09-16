// @ts-nocheck
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '../auth/index';
import { mealPlansRepo } from '../db/index';
import { addSecurityHeaders, setCORSHeaders } from '../security/helmet';
import { queue } from '../queue/index';

const mealPlanItemSchema = z.object({
  slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  recipe_id: z.string().uuid(),
  macros: z
    .object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
    .optional(),
});

const mealPlanSchema = z.object({
  day: z.coerce.date(),
  household_id: z.string().uuid().optional(),
  items: z.array(mealPlanItemSchema),
});

// GET /api/mealplan?day=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get('day');
    const day = dayParam ? new Date(dayParam) : new Date();

    const plan = await mealPlansRepo.findByUserAndDay(ctx.user.id, day);

    if (!plan) {
      return NextResponse.json({ mealPlan: null });
    }

    const etag = `"${plan.id.substring(0, 16)}"`;
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    let res = NextResponse.json({ mealPlan: plan });
    res.headers.set('ETag', etag);
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    // Error handled: Error fetching meal plan:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mealplan
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = mealPlanSchema.parse(body);

    const plan = await mealPlansRepo.upsert({
      user_id: ctx.user.id,
      household_id: validated.household_id || null,
      day: validated.day,
      items: validated.items,
    });

    if (!plan) {
      return NextResponse.json({ error: 'Failed to create meal plan' }, { status: 500 });
    }

    let res = NextResponse.json({ mealPlan: plan }, { status: 201 });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    // Error handled: Error creating meal plan:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mealplan/ai-generate
const aiGenerateSchema = z.object({
  day: z.coerce.date(),
  household_id: z.string().uuid().optional(),
  preferences: z
    .object({
      calorie_target: z.number().optional(),
      macros: z
        .object({
          protein: z.number().optional(),
          carbs: z.number().optional(),
          fat: z.number().optional(),
        })
        .optional(),
      allergens: z.array(z.string()).optional(),
    })
    .optional(),
  pantry: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
      }),
    )
    .optional(),
});

export async function aiGenerate(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = aiGenerateSchema.parse(body);

    // Enqueue AI meal generation job
    const job = await queue.add(
      'mealgen',
      {
        userId: ctx.user.id,
        day: validated.day.toISOString(),
        householdId: validated.household_id,
        preferences: validated.preferences,
        pantry: validated.pantry,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    let res = NextResponse.json({ jobId: job.id, status: 'queued' }, { status: 202 });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    // Error handled: Error enqueueing AI meal generation:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
