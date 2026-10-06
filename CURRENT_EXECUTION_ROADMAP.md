# Current Execution Roadmap

**Audited:** 2026-10-06  
**Source of truth:** current tracked code, package scripts, dependency audit, and workflow parsing—not prior completion reports.

## Current reality

- The monorepo has a substantial product surface across web, mobile, commerce, community, and server packages.
- The ESLint/Next version mismatch no longer crashes linting. It now exposes the actual source backlog: 508 web errors and 16 mobile errors, plus warnings.
- The active CI workflow is valid and fail-closed. It now uses the repository's pnpm 11.28.5 toolchain and Node 22.
- Twenty-nine additional workflow files still contain malformed YAML and must be repaired or retired before GitHub Actions can be considered healthy.
- The previous pnpm 9 configuration was internally inconsistent: it ignored the security settings in `package.json` while not supporting their `pnpm-workspace.yaml` replacement. The repository now pins pnpm 11.28.5, Node 22, and a workspace-level override policy; the audit must be run against the freshly resolved lockfile.
- Tracked code has 42 files with implementation markers. Several represent real external dependencies rather than local coding tasks.

## Completed in this pass

- Replaced three no-op tests that imported nonexistent modules with behavior tests for meal planning, pantry expiration prioritization, and recipe mutation.
- Removed unused deprecated Supabase auth-helper context wiring from the community portal; its type check now passes.
- Fixed the UI package's React Native 0.87 `TouchableOpacity` type compatibility without weakening the component prop surface, and declared its NativeWind dependency.
- Aligned all Next ESLint configs with Next 15.5.25 and made the hooks plugin resolution explicit so lint runs instead of crashing.

## Milestone 0 — Delivery integrity

**Objective:** every required pull request check executes and reports truthfully.

1. Resolve the actual ESLint backlog without disabling rules. Prioritize the React Hooks violations and mobile's missing `expo-tracking-transparency` dependency, then remove unused code and invalid JSX escapes.
2. Repair or explicitly retire the 29 malformed workflow files. Start with `e2e.yml`, `security.yml`, `frontend-deploy.yml`, and `supabase-migrate.yml`; do not retain workflows that hide errors with `|| true`.
3. Expand the new behavioral tests to API and component integration coverage; do not add import-only or `expect(true)` tests.
4. Make mobile, referral, marketplace, community, and API-docs tests meaningful; their current `test` scripts only print success.

**Exit criteria:** `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build` pass from a clean install; all active workflow YAML parses.

## Milestone 1 — Security and privacy baseline

**Objective:** eliminate known exploitable dependency paths and avoid claiming compliance that the product does not enforce.

1. Verify the `drizzle-orm@0.45.2` security override with server type checks and route tests; make it a direct dependency upgrade when its API compatibility is confirmed.
2. Keep all override policy in `pnpm-workspace.yaml` and require the pinned pnpm 11.28.5/Node 22 toolchain in local and CI installs.
3. Upgrade or remove maintenance tools that retain unpatchable vulnerable transitive packages (`extract-zip`, `node-forge`, `braces`, and `sprintf-js`).
4. Implement DSAR verification mail, authenticated request lookup, legal-hold evaluation, and a real erasure queue only after the email provider, identity model, and retention policy are approved.

**Exit criteria:** no high-severity dependency findings in `pnpm audit`; DSAR flows are either fully service-backed and tested or unavailable to users.

## Milestone 2 — Core user journey

**Objective:** prove the product loop: sign up, maintain a pantry, receive a recipe suggestion, and save or plan a meal.

1. Run a browser-backed smoke test against an isolated Supabase project and a test AI provider key.
2. Add resilient empty, timeout, and retry states to pantry and suggestion paths.
3. Instrument consent-aware events for signup, pantry add, suggestion shown, recipe viewed, and recipe saved.
4. Validate the outcome with real beta users before expanding feature scope.

**Exit criteria:** CI runs the smoke test; telemetry confirms activation without collecting events before consent.

## Milestone 3 — Integrations and retention

**Objective:** graduate integrations only when their contracts and data ownership are real.

1. Choose approved product/affiliate APIs for Loblaws, Metro, and Sobeys. Until then, label links as outbound affiliate search rather than product search with fabricated inventory, prices, or cart state.
2. Add database persistence and authorization for grocery avatars, collaboration, gamification, quiz state, and notification preferences.
3. Provision push, email, and analytics providers, then implement expiration alerts, moderation notices, experiment guardrails, and daily reminders.

**Exit criteria:** each integration has a credential owner, tested sandbox contract, failure mode, privacy review, and monitoring.

## Milestone 4 — Launch and scale

**Objective:** launch only after the core loop has evidence of retention and operational controls.

1. Establish error monitoring, availability checks, and a tested incident/rollback runbook.
2. Meet accessibility, performance, and security gates with measured evidence—not static reports.
3. Run the beta recruitment, feedback, content, partner, paid acquisition, and app-store activities with owners and budget approval.
4. Scale caching, database, and queue capacity based on observed usage rather than a hypothetical 10K-user target.

## External decisions required

The following cannot be completed honestly by repository changes alone:

- Supabase project, migration authority, production credentials, and RLS policy sign-off.
- OpenAI, email, push, Sentry, analytics, Stripe, Vercel, and Codecov credentials/configuration.
- Loblaws, Metro, and Sobeys API or affiliate agreements and terms for product data/cart functionality.
- Beta participants, consent, marketing budget, store-account ownership, and legal/privacy retention decisions.

These are blockers, not completed work. Each should receive an owner and acceptance evidence before its corresponding milestone is marked done.
