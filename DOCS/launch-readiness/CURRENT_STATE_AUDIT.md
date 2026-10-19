# Current-state audit

Evidence date: 2026-10-19. Working branch: `codex/global-launch-hardening`; audit baseline: `70460395b159a58d2e290384ac2a23d202d95809`.

## Inventory

- Monorepo managed by pnpm/Turborepo. The primary consumer web app is Next.js under `apps/web`; an Expo/React Native app exists under `apps/mobile`; shared server, analytics, UI, and utility packages live under `packages`.
- Supabase provides authentication/data access, Stripe provides subscriptions, and Vercel is the documented web deployment target. AI and recommendation modules span the web app and `ai/` scripts.
- The web application has approximately 192 API route modules. The repository contains 50 GitHub Actions workflow files, multiple migration roots, and a large body of operational scripts.

## Verified working in this slice

- Web TypeScript check passes.
- Web production build passes with non-secret test-only environment values.
- The complete web Jest suite passes: 368 suites and 1,018 tests, including focused auth, billing, webhook, middleware, health, and readiness coverage.
- Five reliability monitor tests pass.
- Secret scanning reports no leaked credentials.
- Reliability workflow YAML parses and the historical malformed URL interpolation is removed locally.

## Broken or unverified

- The deployed candidates inspected during the audit returned 404 for `/api/health`; no production deployment was performed.
- Dependency audit reports six high and one moderate transitive vulnerability after removal of an unused vulnerable mobile dependency.
- Security self-check reports four critical environment/schema failures in the credential-free local environment.
- Local Supabase schema lint is blocked because the isolated database is not running; production migrations and policies were not touched.
- Full browser journeys, mobile-device validation, accessibility automation, load testing, and real Stripe/Supabase integration tests remain unverified.
- A route audit found widespread legacy header-presence authentication patterns. Central middleware now protects sensitive route families, but each route still needs explicit authorization review.

## Risk priority

1. Prove database/RLS isolation and reconcile migration roots.
2. Remove or mitigate high dependency vulnerabilities.
3. Deploy to a protected preview and verify health plus complete user journeys.
4. Complete route-by-route authorization and entitlement review.
5. Establish browser, accessibility, performance, and capacity evidence.

The current state is a hardened release-candidate workstream, not a launch-ready product.
