import { NextRequest } from 'next/server';

const mockShouldShowPaywall = jest.fn();

jest.mock('@/lib/monetization/freemium-converter', () => ({
  freemiumConverter: {
    shouldShowPaywall: (...args: unknown[]) => mockShouldShowPaywall(...args),
  },
}));

import { GET } from '../paywall/route';

describe('paywall API', () => {
  it('returns a paywall decision', async () => {
    const decision = { show: true, strategy: { id: 'urgency-modal' }, reason: 'Usage limit reached' };
    mockShouldShowPaywall.mockResolvedValue(decision);
    const response = await GET(new NextRequest('https://example.com/api/monetization/paywall?page=dashboard'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(decision);
    expect(mockShouldShowPaywall).toHaveBeenCalledWith('user-123', 'tenant-456', 'dashboard');
  });
});
