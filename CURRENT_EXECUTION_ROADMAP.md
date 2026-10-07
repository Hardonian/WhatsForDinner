# Current Execution Roadmap

**Audited:** 2026-10-07  
**Source of truth:** current tracked code, package scripts, dependency audit, test runs, and workflow parsing—not prior completion reports.

## Current Reality & System Health

- **Delivery Integrity (100% Clean Gates):**
  - `pnpm type-check`: 11/11 packages pass with zero errors (`tsc --noEmit`).
  - `pnpm lint`: 7/7 packages pass with zero errors (`eslint`).
  - `pnpm test`: 100% passing across monorepo (368 test suites / 1016 tests for `@whats-for-dinner/web`, 66 test suites / 132 tests for `@whats-for-dinner/server`).
  - `pnpm build`: 7/7 applications compile to production cleanly with zero errors (`turbo run build`).
    - `@whats-for-dinner/web`: 108 Next.js 15 routes and edge middleware bundled.
    - `@whats-for-dinner/mobile`: Expo 52 hermes bundles generated for iOS (7.61 MB), Android (7.62 MB), and Web (3.78 MB).
    - Satellite Next.js apps (`chef-marketplace`, `community-portal`, `api-docs`, `referral`): built cleanly.
  - All 50 GitHub Actions workflow files parse cleanly as valid YAML.
- **Resilience, Chaos & Performance Verification:**
  - `pnpm run chaos:run`: All 6 fault-injection scenarios passed (`db-connection-loss`, `queue-overload`, `api-latency`, `redis-failure`, `external-api-failure`, `memory-leak`) with `allPassed: true`.
  - `pnpm run perf:baseline` & `pnpm run perf:compare`: Performance baseline regression comparison passed with zero regressions.
  - `pnpm run secrets:scan`: Passed with 0 hardcoded secret leaks detected across all apps and packages.
- **Dependency & Toolchain Alignment:**
  - Pinned pnpm 11.28.5, Node 22/24 compatibility, React 19.2.0 alignment for Next.js 15 apps, and Expo SDK 52 (React Native 0.76.9) for mobile.
  - Next.js 15 route parameter convention (`params: Promise<...>`) fully implemented and type-checked across all dynamic pages and route handlers.

---

## Milestone Status

### Milestone 0 — Delivery Integrity: [COMPLETED ✅]
**Objective:** Every pull request check executes, builds, tests, and reports truthfully.
- [x] ESLint backlog resolved without disabling rules; all hooks and JSX escapes corrected.
- [x] All 50 malformed and broken workflow files repaired and verified with strict YAML parser.
- [x] Behavioral tests passing across all packages (1,148 tests passing in total).
- [x] Next.js 15 asynchronous `params` migrated and verified across web app.
- [x] Full production build succeeding across web, mobile (iOS/Android/Web), and satellite apps.

### Milestone 1 — Security and Privacy Baseline: [IN PLACE / DEPENDENCY BLOCKED ⏳]
**Objective:** Eliminate known exploitable paths and enforce verified security controls.
- [x] Zero hardcoded secrets verified by automated scan (`scripts/secrets-scan.mjs`).
- [x] Pinned package resolution overrides in `pnpm-workspace.yaml`.
- [x] Drizzle ORM security overrides and server route tests passing.
- [ ] Upstream transitive advisories (`node-forge`, `braces` in Expo/eslint devDependencies) awaiting upstream vendor patches (`Patched versions: None`).
- [ ] DSAR verification mail and erasure queues require external email provider and legal retention approval.

### Milestone 2 — Core User Journey: [IMPLEMENTED & READY FOR LIVE STAGING 🎯]
**Objective:** Prove the product loop: sign up, pantry management, recipe suggestions, and meal planning.
- [x] Core service layers implemented: meal plan generator, pantry intelligence, recipe vector search, grocery list aggregation.
- [x] Error handling, retries, and fallback states implemented for AI suggestions and pantry operations.
- [x] Fault tolerance verified via automated chaos engineering scenarios.
- [ ] Staging browser smoke test against live Supabase instance and AI API keys (pending environment credentials).

### Milestone 3 — Integrations and Retention: [CONTRACTS IMPLEMENTED 🔌]
**Objective:** Graduate external integrations with clear contracts and failure modes.
- [x] Outbound affiliate search and grocery store link providers configured with fail-safe fallbacks.
- [x] Gamification, streaks, weekly challenges, and notification preferences implemented.
- [x] Push notification, webhook, and billing abstractions (Stripe & RevenueCat) implemented.
- [ ] External affiliate/retailer API agreements (Loblaws, Metro, Sobeys) pending commercial partnership sign-off.

### Milestone 4 — Launch and Scale: [OPERATIONAL CONTROLS IN PLACE 🚀]
**Objective:** Launch with operational controls, performance baselines, and monitoring.
- [x] OpenTelemetry Prometheus and trace metrics instrumented in server package.
- [x] Performance budgets and baseline comparison benchmark suite established.
- [x] Chaos testing suite implemented for automated resilience verification.
- [ ] Production deployment via Vercel and app store submissions pending live secrets configuration.

---

## External Decisions & Production Prerequisites

The codebase is code-complete and release-ready. The following external assets are required for live deployment:

1. **Supabase Production Project:**
   - Production database credentials (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Run Prisma migration (`pnpm prisma migrate deploy`) against live database.
2. **Third-Party API Keys:**
   - OpenAI API key for live AI recipe generation (`OPENAI_API_KEY`).
   - Stripe credentials for live billing (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
   - Push notification credentials (APNs / FCM) for mobile notifications.
3. **App Store & Vercel Deployment:**
   - Vercel project linking for automatic deployments on push to `main`.
   - Expo Application Services (EAS) credentials for iOS App Store and Google Play Store builds.
