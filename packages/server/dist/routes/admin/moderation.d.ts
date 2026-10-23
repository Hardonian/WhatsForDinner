/**
 * Admin Moderation API Routes
 *
 * Handles moderation queue: assign, resolve, list, approve/reject campaigns & creatives
 */
import type { NextRequest } from 'next/server';
/**
 * GET /api/admin/moderation/queue
 * List moderation queue items
 */
export declare function GET_MODERATION_QUEUE(request: NextRequest): Promise<any>;
/**
 * POST /api/admin/moderation/assign
 * Assign moderation item to admin
 */
export declare function POST_MODERATION_ASSIGN(request: NextRequest): Promise<any>;
/**
 * PATCH /api/admin/moderation/resolve
 * Resolve moderation item (approve/reject)
 */
export declare function PATCH_MODERATION_RESOLVE(request: NextRequest): Promise<any>;
/**
 * POST /api/admin/moderation/create
 * Create moderation queue item (auto-flag)
 */
export declare function POST_MODERATION_CREATE(request: NextRequest): Promise<any>;
//# sourceMappingURL=moderation.d.ts.map