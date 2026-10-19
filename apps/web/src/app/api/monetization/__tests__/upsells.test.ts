const mockIdentifyUpsellOpportunities = jest.fn();

jest.mock('@/lib/monetization/value-engine', () => ({
  valueEngine: {
    identifyUpsellOpportunities: (...args: unknown[]) => mockIdentifyUpsellOpportunities(...args),
  },
}));

import { GET } from '../upsells/route';

describe('upsells API', () => {
  it('returns upsell opportunities', async () => {
    const opportunities = [{ id: 'upsell-1', type: 'plan_upgrade', targetPlan: 'pro' }];
    mockIdentifyUpsellOpportunities.mockResolvedValue(opportunities);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ opportunities });
    expect(mockIdentifyUpsellOpportunities).toHaveBeenCalledWith('tenant-456');
  });
});
