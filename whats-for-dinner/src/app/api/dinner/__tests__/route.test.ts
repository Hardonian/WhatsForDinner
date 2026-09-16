// @ts-nocheck
import { POST } from '../route';
import { openai } from '@/lib/openaiClient';

// Mock the OpenAI client
jest.mock('@/lib/openaiClient', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

const mockOpenai = openai as jest.Mocked<typeof openai>;

describe('/api/dinner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate recipes successfully', async () => {
    const mockRecipes = [
      {
        title: 'Pasta with Tomatoes',
        cookTime: '30 minutes',
        calories: 450,
        ingredients: ['pasta', 'tomatoes', 'garlic'],
        steps: ['Boil pasta', 'Sauté garlic', 'Add tomatoes'],
      },
    ];

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockRecipes),
          },
        },
      ],
    } as any);

    const request = new Request('http://localhost:3000/api/dinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients: ['pasta', 'tomatoes'],
        preferences: 'vegetarian',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toEqual(mockRecipes);
    expect(mockOpenai.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: expect.stringContaining('pasta, tomatoes'),
        },
      ],
      temperature: 0.7,
    });
  });

  it('should handle OpenAI API errors', async () => {
    mockOpenai.chat.completions.create.mockRejectedValue(
      new Error('API Error')
    );

    const request = new Request('http://localhost:3000/api/dinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients: ['pasta'],
        preferences: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate recipes');
  });

  it('should handle invalid JSON response from OpenAI', async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'invalid json',
          },
        },
      ],
    } as any);

    const request = new Request('http://localhost:3000/api/dinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients: ['pasta'],
        preferences: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate recipes');
  });

  it('should handle missing ingredients', async () => {
    const request = new Request('http://localhost:3000/api/dinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ingredients: [],
        preferences: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recipes).toEqual([]);
  });
});
