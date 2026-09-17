// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

describe('API Route: apps/web/src/app/api/ai/recipe-vectors/route.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle GET vector similarity search', async () => {
    const req = new NextRequest('http://localhost/api/ai/recipe-vectors?query=crispy+salmon+mediterranean', {
      headers: { 'content-type': 'application/json' },
    });
    const response = await GET(req);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.totalIndexedRecipes).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('should handle POST RAG grounded generation', async () => {
    const req = new NextRequest('http://localhost/api/ai/recipe-vectors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'quick wok dinner with tofu',
        pantryItems: ['tofu', 'garlic', 'soy sauce'],
      }),
    });
    const response = await POST(req);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.recipe).toBeDefined();
    expect(data.recipe.vectorGrounding).toBeDefined();
  });

  it('should validate invalid JSON body on POST', async () => {
    const req = new NextRequest('http://localhost/api/ai/recipe-vectors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid-json-text',
    });
    const response = await POST(req);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
