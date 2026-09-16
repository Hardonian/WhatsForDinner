import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('recipe-fork');

export const dynamic = 'force-dynamic';

const ForkRecipeSchema = z.object({
  baseRecipeId: z.string(),
  baseRecipeTitle: z.string(),
  branchName: z.string().min(2),
  authorName: z.string().default('Community Chef'),
  changeSummary: z.string().default('Custom flavor tweaks'),
  addedIngredients: z.array(z.string()).default([]),
  removedIngredients: z.array(z.string()).default([]),
  steps: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validated = ForkRecipeSchema.parse(body);

    const forkId = `fork-${Math.random().toString(36).substring(2, 9)}`;
    const commitHash = Math.random().toString(16).substring(2, 10);

    _logger.info('Recipe forked successfully', {
      forkId,
      commitHash,
      baseRecipeId: validated.baseRecipeId,
      branchName: validated.branchName,
    });

    return NextResponse.json({
      success: true,
      fork: {
        id: forkId,
        commitHash,
        parentRecipeId: validated.baseRecipeId,
        title: `${validated.baseRecipeTitle} (${validated.branchName})`,
        branchName: validated.branchName,
        author: validated.authorName,
        changeSummary: validated.changeSummary,
        diff: {
          added: validated.addedIngredients,
          removed: validated.removedIngredients,
        },
        createdAt: new Date().toISOString(),
        royaltySharePercent: 30, // 30% of affiliate cart sales kick back to fork creator
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fork recipe';
    _logger.error('Error forking recipe', { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
