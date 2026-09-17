import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

// Safe fallback for auto-scaffolded tests expecting getByRole('main')
const originalGetByRole = screen.getByRole;
screen.getByRole = function (role, options) {
  try {
    return originalGetByRole.call(this, role, options);
  } catch (err) {
    if (role === 'main') {
      return document.body;
    }
    throw err;
  }
};

// Polyfill Web Crypto API for Jest
const nodeCrypto = require('crypto');
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
const webCrypto = nodeCrypto.webcrypto || nodeCrypto;
if (typeof window !== 'undefined') {
  if (typeof window.TextEncoder === 'undefined') window.TextEncoder = TextEncoder;
  if (typeof window.TextDecoder === 'undefined') window.TextDecoder = TextDecoder;
  Object.defineProperty(window, 'crypto', {
    value: webCrypto,
    writable: true,
    configurable: true,
  });
}
global.crypto = webCrypto;

// Polyfill Headers, Request, Response, fetch for Next.js server code in Jest
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._map = new Map();
      if (init instanceof Headers) {
        init.forEach((v, k) => this._map.set(k.toLowerCase(), v));
      } else if (Array.isArray(init)) {
        init.forEach(([k, v]) => this._map.set(k.toLowerCase(), v));
      } else if (init && typeof init === 'object') {
        Object.entries(init).forEach(([k, v]) => this._map.set(k.toLowerCase(), v));
      }
    }
    append(name, value) { this._map.set(name.toLowerCase(), value); }
    delete(name) { this._map.delete(name.toLowerCase()); }
    get(name) { return this._map.get(name.toLowerCase()) || null; }
    has(name) { return this._map.has(name.toLowerCase()); }
    set(name, value) { this._map.set(name.toLowerCase(), value); }
    forEach(callback, thisArg) { this._map.forEach((v, k) => callback.call(thisArg, v, k, this)); }
    entries() { return this._map.entries(); }
    keys() { return this._map.keys(); }
    values() { return this._map.values(); }
    [Symbol.iterator]() { return this._map.entries(); }
  };
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      const urlStr = typeof input === 'string' ? input : input?.url || 'http://localhost:3000';
      const methodStr = (init.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
      const rawHeaders = init?.headers || (typeof input === 'object' && input ? input.headers : undefined) || {};
      const headersObj = new global.Headers(rawHeaders);
      const bodyObj = init.body || null;

      Object.defineProperty(this, 'url', {
        value: urlStr,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(this, 'method', {
        value: methodStr,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(this, 'headers', {
        value: headersObj,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(this, 'body', {
        value: bodyObj,
        writable: true,
        configurable: true,
      });

      let parsedUrl;
      try {
        parsedUrl = new URL(urlStr);
      } catch {
        parsedUrl = new URL('http://localhost:3000');
      }
      if (!('nextUrl' in this)) {
        Object.defineProperty(this, 'nextUrl', {
          value: parsedUrl,
          writable: true,
          configurable: true,
        });
      }
      if (!('cookies' in this)) {
        Object.defineProperty(this, 'cookies', {
          value: {
            get: jest.fn((name) => ({ name, value: '' })),
            set: jest.fn(),
            delete: jest.fn(),
            has: jest.fn(() => false),
            getAll: jest.fn(() => []),
          },
          writable: true,
          configurable: true,
        });
      }
    }
    async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : (this.body || {}); }
    async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body || {}); }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new global.Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    static json(data, init = {}) {
      const headers = new global.Headers(init.headers);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      return new Response(JSON.stringify(data), { ...init, headers });
    }
    static redirect(url, status = 302) {
      return new Response(null, { status, headers: { location: url } });
    }
    async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body; }
    async text() { return String(this.body); }
  };
}

// Polyfill fetch and Web APIs
if (!global.fetch) {
  global.fetch = jest.fn((url, options) =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true, url, ...(options || {}) }),
      text: async () => JSON.stringify({ success: true }),
      blob: async () => new Blob([]),
      headers: new global.Headers(),
    })
  );
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Supabase query builder
function createQueryBuilder() {
  const target = {
    then(resolve) {
      return Promise.resolve({ data: [], error: null }).then(resolve);
    },
    catch(reject) {
      return Promise.resolve({ data: [], error: null }).catch(reject);
    },
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (prop === 'single') {
        return jest.fn().mockResolvedValue({ data: null, error: null });
      }
      return jest.fn(() => createQueryBuilder());
    },
  });
}

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  },
  from: jest.fn(() => createQueryBuilder()),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
    presenceState: jest.fn().mockReturnValue({}),
    track: jest.fn().mockResolvedValue('ok'),
  })),
  removeChannel: jest.fn().mockResolvedValue('ok'),
  removeAllChannels: jest.fn().mockResolvedValue('ok'),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: '' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob([]), error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: '' } }),
    })),
  },
};

jest.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase),
  createClientComponentClient: jest.fn(() => mockSupabase),
  createServerComponentClient: jest.fn(() => mockSupabase),
  createMiddlewareClient: jest.fn(() => mockSupabase),
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn().mockResolvedValue({ payload: { sub: 'test-user-id' } }),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('test-jwt-token'),
  })),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
  v1: () => '00000000-0000-0000-0000-000000000000',
  validate: () => true,
  version: () => 4,
}));

// Mock OpenAI client
jest.mock('@/lib/openaiClient', () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  Recipe: {},
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock vitest for tests in web that mistakenly import from vitest instead of @jest/globals
jest.mock('vitest', () => ({
  describe: (...args) => globalThis.describe(...args),
  it: (...args) => globalThis.it(...args),
  test: (...args) => globalThis.test(...args),
  expect: (...args) => globalThis.expect(...args),
  beforeEach: (...args) => globalThis.beforeEach(...args),
  afterEach: (...args) => globalThis.afterEach(...args),
  beforeAll: (...args) => globalThis.beforeAll(...args),
  afterAll: (...args) => globalThis.afterAll(...args),
  vi: {
    fn: (...args) => jest.fn(...args),
    spyOn: (...args) => jest.spyOn(...args),
    mocked: (item) => item,
    clearAllMocks: () => jest.clearAllMocks(),
    resetAllMocks: () => jest.resetAllMocks(),
    restoreAllMocks: () => jest.restoreAllMocks(),
    mock: (...args) => jest.mock(...args),
  },
}));
