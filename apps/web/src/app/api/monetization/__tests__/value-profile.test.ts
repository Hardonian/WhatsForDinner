const mockGetUser = jest.fn();
const mockSingle = jest.fn();
const mockAnalyzeCustomerValue = jest.fn();

jest.mock('@/lib/supabase/auth-helpers-compat', () => ({
  createRouteHandlerClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: () => ({ select: () => ({ eq: () => ({ single: (...args: unknown[]) => mockSingle(...args) }) }) }),
  }),
}));
jest.mock('@/lib/monetization/value-engine', () => ({
  valueEngine: {
    analyzeCustomerValue: (...args: unknown[]) => mockAnalyzeCustomerValue(...args),
  },
}));

import { GET } from '../value-profile/route';

describe('value profile API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when the user is unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await GET()).status).toBe(401);
  });

  it('returns 404 when the tenant is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    expect((await GET()).status).toBe(404);
  });

  it('returns the authenticated user value profile', async () => {
    const profile = { userId: 'user-123', tenantId: 'tenant-456', currentPlan: 'free' };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSingle.mockResolvedValue({ data: { tenant_id: 'tenant-456' }, error: null });
    mockAnalyzeCustomerValue.mockResolvedValue(profile);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(mockAnalyzeCustomerValue).toHaveBeenCalledWith('tenant-456', 'user-123');
  });
});
