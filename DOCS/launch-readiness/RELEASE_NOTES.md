# Release notes — global launch hardening candidate

Date: 2026-10-19. Branch: `codex/global-launch-hardening`.

## Security and identity

- Added verified Supabase session/Bearer authentication at sensitive API boundaries.
- Removed trust in spoofable identity headers and isolated service-role access to server-only code.
- Tightened origin/CORS behavior and protected sensitive API route families.

## Billing

- Enforced verified customer/subscription ownership for checkout, portal, lookup, credit purchase, streak purchase, and cancellation paths.
- Made Stripe configuration/integration failures explicit.
- Required webhook signatures and added a durable event-idempotency migration.

## Reliability

- Made degraded dependency health non-ready/non-healthy.
- Corrected reliability workflow interpolation/configuration and added uptime-monitor tests.
- Repaired the security self-check so it compiles, reports details, and exits on critical failures.

## Validation

- All 368 web suites (1,018 tests), type check, lint, production build, reliability tests, secret scan, and YAML parse pass.
- Dependency audit, environment/schema self-check, local migration lint, deployed health, browser/mobile, and performance gates remain unresolved. This is not a production release.
