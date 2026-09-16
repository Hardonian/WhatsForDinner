// @ts-nocheck
/**
 * Referrals API Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST_CODE, POST_TRACK, POST_CLAIM, GET_ME } from '../routes/referrals';
import type { NextRequest } from 'next/server';
import { db } from '../db/index';
import { referralPrograms, referralCodes, referrals, users } from '../db/schema';

// Mock auth context
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockAuthContext = async () => ({ user: mockUser });

// Mock getAuthContext
vi.mock('../auth/index.js', () => ({
  getAuthContext: mockAuthContext,
}));

describe('Referrals API', () => {
  let testProgramId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      plan: 'free',
    }).returning();
    testUserId = user.id;

    // Create test program
    const [program] = await db.insert(referralPrograms).values({
      slug: 'test-program',
      active: true,
      reward_sender: { type: 'trial_days', value: 7 },
      reward_receiver: { type: 'trial_days', value: 7 },
    }).returning();
    testProgramId = program.id;
  });

  afterEach(async () => {
    await db.delete(referrals);
    await db.delete(referralCodes);
    await db.delete(referralPrograms);
    await db.delete(users);
  });

  describe('POST /api/referrals/code', () => {
    it('should generate a referral code for user', async () => {
      const request = new NextRequest('http://localhost/api/referrals/code', {
        method: 'POST',
        body: JSON.stringify({ program_slug: 'test-program' }),
      });

      const response = await POST_CODE(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.code).toBeDefined();
      expect(data.program_id).toBe(testProgramId);
    });

    it('should return existing code if user already has one', async () => {
      const code = 'TESTCODE123';
      await db.insert(referralCodes).values({
        program_id: testProgramId,
        code,
        owner_user_id: testUserId,
      });

      const request = new NextRequest('http://localhost/api/referrals/code', {
        method: 'POST',
        body: JSON.stringify({ program_slug: 'test-program' }),
      });

      const response = await POST_CODE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe(code);
    });
  });

  describe('POST /api/referrals/track', () => {
    it('should track referral click', async () => {
      const code = 'TESTCODE123';
      await db.insert(referralCodes).values({
        program_id: testProgramId,
        code,
        owner_user_id: testUserId,
      });

      const request = new NextRequest('http://localhost/api/referrals/track', {
        method: 'POST',
        body: JSON.stringify({
          code,
          referee_email: 'referee@example.com',
        }),
      });

      const response = await POST_TRACK(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tracked).toBe(true);
      expect(data.anon_id).toBeDefined();
    });

    it('should reject invalid referral code', async () => {
      const request = new NextRequest('http://localhost/api/referrals/track', {
        method: 'POST',
        body: JSON.stringify({
          code: 'INVALID',
          referee_email: 'referee@example.com',
        }),
      });

      const response = await POST_TRACK(request);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/referrals/claim', () => {
    it('should claim referral on signup', async () => {
      const code = 'TESTCODE123';
      await db.insert(referralCodes).values({
        program_id: testProgramId,
        code,
        owner_user_id: testUserId,
      });

      const [refereeUser] = await db.insert(users).values({
        email: 'referee@example.com',
        plan: 'free',
      }).returning();

      const request = new NextRequest('http://localhost/api/referrals/claim', {
        method: 'POST',
        body: JSON.stringify({
          code,
          referee_user_id: refereeUser.id,
        }),
      });

      const response = await POST_CLAIM(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.claimed).toBe(true);
      expect(data.referral_id).toBeDefined();
    });

    it('should prevent self-referral', async () => {
      const code = 'TESTCODE123';
      await db.insert(referralCodes).values({
        program_id: testProgramId,
        code,
        owner_user_id: testUserId,
      });

      const request = new NextRequest('http://localhost/api/referrals/claim', {
        method: 'POST',
        body: JSON.stringify({
          code,
          referee_user_id: testUserId,
        }),
      });

      const response = await POST_CLAIM(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/referrals/me', () => {
    it('should return user referral stats', async () => {
      const code = 'TESTCODE123';
      await db.insert(referralCodes).values({
        program_id: testProgramId,
        code,
        owner_user_id: testUserId,
      });

      await db.insert(referrals).values({
        program_id: testProgramId,
        code_id: (await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1))[0].id,
        referrer_user_id: testUserId,
        status: 'signed_up',
      });

      const request = new NextRequest('http://localhost/api/referrals/me');
      const response = await GET_ME(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.codes).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(data.stats.signed_up).toBeGreaterThan(0);
    });
  });
});
