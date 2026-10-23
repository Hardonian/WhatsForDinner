# Launch Readiness — Current Evidence

**Assessed:** 2026-10-22  
**Decision:** **Do not represent the application as Fortune 500 / enterprise launch-ready yet.**

This document supersedes unverified completion claims with checks run against the current checkout.

## Verified in this release-hardening pass

- `pnpm type-check` passed: 11 Turbo tasks completed successfully.
- `pnpm --filter @whats-for-dinner/web build` completed after removing the Next.js settings that ignored TypeScript and ESLint build errors.
- `pnpm --filter @whats-for-dinner/web lint` completed with zero errors (675 existing warnings remain).
- `pnpm test:e2e` passed: 5 Chromium browser tests cover the public landing page, security headers, marketing-to-onboarding navigation, a recipe-generation outage fallback, legal/status pages, and public deployment probes.
- `pnpm secrets:scan` found no hard-coded credentials.
- React and React DOM are both pinned to `19.2.0` in the web workspace, fixing the runtime mismatch that prevented Jest from starting.
- `/api/health/live`, `/api/health/ready`, and `/api/healthz` now provide unauthenticated, non-cacheable deployment responses. The former endpoints were authenticated placeholder implementations and could not be used by deployment platforms.
- The E2E workflow now invokes the real web suite and uses Node 22, matching the repository engine requirement.

## Release blockers

| Priority | Blocker                            | Evidence                                                                                                                                 | Required resolution                                                                                                         |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P0       | Product/API completion             | 160 of 192 web API route files contain `stub: true`.                                                                                     | Implement the routes required by the launch contract, or remove/gate every unsupported feature and its marketing claim.     |
| P0       | Production dependency validation   | Live Supabase, OpenAI, Stripe, retailer, email, APNs/FCM, and Vercel credentials are not available in this checkout.                     | Configure production secrets, apply migrations, run authenticated staging E2E, and retain deployment evidence.              |
| P0       | Enterprise assurance               | Security, privacy, data-processing, accessibility, incident-response, and vendor-review artifacts require business/legal owner approval. | Complete the customer security questionnaire/DPA process and obtain approvals; code alone cannot create these attestations. |
| P1       | Static-quality backlog             | Web lint has 675 warnings. The secrets scanner also reports 24 dynamic-code/process-execution patterns for review (no secrets found).    | Triage each warning and security pattern; remove, justify, or enforce with a documented exception.                          |
| P1       | Third-party commercial commitments | Grocery/affiliate and mobile-store agreements are external decisions.                                                                    | Execute agreements and validate every production integration with test accounts.                                            |

## Milestone gates

| Milestone             | Status                 | Exit criteria                                                                                                                               |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery integrity    | Verified for this pass | Build, type-check, E2E, and lint remain green in CI.                                                                                        |
| Public core loop      | Partially verified     | The guest onboarding route is E2E-tested, including the graceful recipe fallback. Implement and test every API it advertises before launch. |
| Security and privacy  | In progress            | Resolve the P1 scanner backlog; complete a production penetration test and privacy/retention review.                                        |
| Enterprise operations | Blocked                | Provision monitoring, on-call ownership, SLOs, backups/restore evidence, incident drills, and customer-facing status ownership.             |
| General availability  | Blocked                | All P0 gates above are closed with release evidence and an authorized production deployment.                                                |

## Required pre-launch command set

```bash
pnpm type-check
pnpm --filter @whats-for-dinner/web lint
pnpm test:e2e
pnpm --filter @whats-for-dinner/web build
pnpm secrets:scan
```

Run the same gates against a production-like staging environment with real, non-production credentials before promoting a release. Browser tests must use `PLAYWRIGHT_BASE_URL` only when that URL is intentionally the What's for Dinner web deployment.
