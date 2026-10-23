import { GET as live } from '../live/route';
import { GET as ready } from '../ready/route';
import { GET as healthz } from '../../healthz/route';

describe('public deployment probes', () => {
  it.each([
    ['liveness', live, 'ok'],
    ['readiness', ready, 'ready'],
    ['legacy healthz', healthz, 'ok'],
  ])(
    'returns a non-cacheable %s response',
    async (_name, handler, expectedStatus) => {
      const response = await handler();

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      await expect(response.json()).resolves.toMatchObject({
        status: expectedStatus,
        service: 'web',
      });
    }
  );
});
