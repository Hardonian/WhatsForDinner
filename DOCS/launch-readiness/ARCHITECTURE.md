# Architecture and dependency map

## Runtime path

`Browser / Expo client → Next.js middleware → app/API routes → shared services → Supabase, Stripe, AI providers`

- `apps/web`: Next.js App Router UI and API surface. Middleware owns cross-cutting origin, CORS, API-key, and sensitive-route authentication checks.
- `apps/mobile`: Expo/React Native client. It shares concepts and packages but was not built or device-tested in this slice.
- `packages/server`: additional backend/domain capabilities and tests.
- `packages/utils`: health handlers, logging, error handling, and cross-runtime utilities.
- Supabase: identity, Postgres, and RLS. Browser clients use only public credentials; the service-role client is isolated in a `server-only` lazy singleton.
- Stripe: checkout, portal, cancellation, and signed webhooks. Entitlement truth must remain server-side.
- Vercel: intended Next.js deployment and preview/production pipeline. `main` auto-deploys, so this branch was not merged or deployed.

## Trust boundaries

Cookie or Bearer token → verified with Supabase → resolved user and tenant → resource ownership check → privileged server client. Client-provided user IDs are not identity. Stripe events cross a separate signature boundary and are claimed in a durable event ledger before processing.

## Known architectural debt

- Multiple database/migration locations can drift.
- The API surface is too broad for middleware alone to prove object-level authorization.
- Some operational scripts and generated JavaScript duplicate TypeScript sources.
- The shared initial web JavaScript reported by the verified build is 586 kB, indicating substantial client/runtime coupling.
- The production health endpoint and deployment routing need preview verification.

Decisions in this slice preserve the existing stack and add fail-closed boundaries; no provider migration or topology rewrite was attempted.
