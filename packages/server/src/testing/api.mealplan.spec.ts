// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mealPlansRepo, usersRepo } from '../db/index';
import { requireAuth } from '../auth/index';
import { addSecurityHeaders } from '../security/helmet';

// Mock auth middleware for testing
const app = express();
app.use(express.json());

app.get('/api/mealplan', requireAuth(), async (req: any, res) => {
  const { day } = req.query;
  const userId = req.ctx?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const date = day ? new Date(day) : new Date();
  const plan = await mealPlansRepo.findByUserAndDay(userId, date);
  res.json({ mealPlan: plan });
});

app.post('/api/mealplan', requireAuth(), async (req: any, res) => {
  const userId = req.ctx?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { day, items } = req.body;
  const plan = await mealPlansRepo.upsert({
    user_id: userId,
    day: new Date(day),
    items,
  });

  res.status(201).json({ mealPlan: plan });
});

describe('Meal Plan API', () => {
  let testUser1: any;
  let testUser2: any;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    // Create test users
    testUser1 = await usersRepo.create?.({
      email: 'test1@example.com',
      plan: 'free',
    });
    testUser2 = await usersRepo.create?.({
      email: 'test2@example.com',
      plan: 'free',
    });

    // Mock tokens (in real tests, generate JWT tokens)
    token1 = 'mock-token-1';
    token2 = 'mock-token-2';
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser1) await usersRepo.delete?.(testUser1.id);
    if (testUser2) await usersRepo.delete?.(testUser2.id);
  });

  it('should create a meal plan for authenticated user', async () => {
    const response = await request(app)
      .post('/api/mealplan')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        day: '2024-01-15',
        items: [
          {
            slot: 'breakfast',
            recipe_id: '550e8400-e29b-41d4-a716-446655440000',
            macros: { calories: 500, protein: 20, carbs: 60, fat: 15 },
          },
        ],
      })
      .expect(201);

    expect(response.body.mealPlan).toBeDefined();
    expect(response.body.mealPlan.items).toHaveLength(1);
  });

  it('should fetch meal plan for authenticated user', async () => {
    const day = '2024-01-15';
    const response = await request(app)
      .get(`/api/mealplan?day=${day}`)
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(response.body.mealPlan).toBeDefined();
  });

  it('should return 401 for unauthenticated requests', async () => {
    await request(app).get('/api/mealplan').expect(401);
    await request(app).post('/api/mealplan').expect(401);
  });

  it('should respect RLS - user cannot access other user plans', async () => {
    // Create plan for user 1
    await request(app)
      .post('/api/mealplan')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        day: '2024-01-15',
        items: [{ slot: 'breakfast', recipe_id: 'test-id' }],
      });

    // User 2 should not see user 1's plan (RLS enforced by DB)
    const response = await request(app)
      .get('/api/mealplan?day=2024-01-15')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    // Should return null or empty (RLS prevents access)
    expect(response.body.mealPlan).toBeNull();
  });
});
