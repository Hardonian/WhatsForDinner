# Deployment and rollback runbook

## Release candidate

1. Require green lint, type check, unit/integration tests, dependency/security gates, and production build.
2. Apply and validate migrations only in an isolated/local database, then staging. Capture schema diff and rollback/recovery evidence.
3. Push the review branch and use a Vercel preview; do not merge to `main` until approved because `main` auto-deploys production.
4. Validate `/api/health` and `/api/ready` response schema/status, then execute the complete browser journey with test accounts and Stripe test mode.
5. Confirm monitoring receives the exact preview/production domain and rejects 404, malformed, degraded, and dependency-failed responses.
6. Review error logs, billing events, data isolation, and migration state before promotion.

## Rollback

- Application: promote the last known-good Vercel deployment or revert the release commit through the normal protected-branch workflow.
- Database: prefer forward-fix migrations. Before any destructive change, take and verify a restorable backup and document an explicit recovery migration.
- Stripe: do not roll back by mutating customer records. Disable affected entry points and reconcile from signed events/provider state.
- Incident: freeze promotion, preserve logs/event IDs, notify owners, and publish scoped customer communication when impact is understood.

## Current gate

Do not deploy this branch to production. Deployed health is not proven, the webhook migration is unapplied, and security/dependency/database gates are red or blocked.
