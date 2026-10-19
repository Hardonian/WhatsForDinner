import { NextRequest } from 'next/server';

const mockGetAvailableFeatures = jest.fn();
const mockPurchaseCredits = jest.fn();

jest.mock('@/lib/monetization/usage-premium', () => ({
  usagePremium: {
    getAvailableFeatures: (...args: unknown[]) => mockGetAvailableFeatures(...args),
    purchaseCredits: (...args: unknown[]) => mockPurchaseCredits(...args),
  },
}));

import { GET, POST } from '../usage-premium/route';

describe('usage premium API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns available features', async () => {
    const features = [{ id: 'ai_recipe_generation', name: 'AI Recipe Generation' }];
    mockGetAvailableFeatures.mockReturnValue(features);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ features });
  });

  it('handles a purchase action', async () => {
    mockPurchaseCredits.mockResolvedValue({ checkoutUrl: 'https://checkout.stripe.com/test', credits: 100 });
    const request = new NextRequest('https://example.com/api/monetization/usage-premium', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ featureId: 'ai_recipe_generation', quantity: 1 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockPurchaseCredits).toHaveBeenCalledWith('tenant-456', 'ai_recipe_generation', 1);
  });
});
