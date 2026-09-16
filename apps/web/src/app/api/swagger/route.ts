import { NextResponse } from 'next/server';
const readFileSync = typeof window === 'undefined' ? require('fs').readFileSync : null;
const join = typeof window === 'undefined' ? require('path').join : null;

// Simple swagger.json endpoint
// In production, generate this from Zod schemas using zod-to-openapi
export async function GET() {
  try {
    // For now, return a basic swagger.json
    // TODO: Auto-generate from Zod schemas
    const swagger = {
      openapi: '3.1.0',
      info: {
        title: 'Nomad API',
        version: '1.0.0',
        description: 'Nomad backend API - Meal planner + health tracker + cooking inspiration',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      ],
      paths: {
        '/api/healthz': {
          get: {
            summary: 'Health check',
            responses: {
              '200': { description: 'Service is healthy' },
              '503': { description: 'Service is degraded' },
            },
          },
        },
        '/api/user/me': {
          get: {
            summary: 'Get current user profile',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': { description: 'User profile' },
              '401': { description: 'Unauthorized' },
            },
          },
          patch: {
            summary: 'Update user preferences',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': { description: 'Updated' },
            },
          },
        },
        '/api/mealplan': {
          get: {
            summary: 'Get meal plan for a day',
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'day',
                in: 'query',
                schema: { type: 'string', format: 'date' },
              },
            ],
            responses: {
              '200': { description: 'Meal plan' },
            },
          },
          post: {
            summary: 'Create or update meal plan',
            security: [{ bearerAuth: [] }],
            responses: {
              '201': { description: 'Created' },
            },
          },
        },
        '/api/mealplan/ai-generate': {
          post: {
            summary: 'Generate meal plan with AI',
            security: [{ bearerAuth: [] }],
            responses: {
              '202': { description: 'Job queued' },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };

    return NextResponse.json(swagger);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate swagger' }, { status: 500 });
  }
}
