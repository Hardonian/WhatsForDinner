# Security and privacy review

## Corrected

- Sensitive API families now require a Supabase-verified cookie session or Bearer token in middleware.
- `Content-Type`, `x-user-id`, request bodies, and query strings no longer establish identity.
- Browser Supabase code cannot import or initialize the service-role client.
- Billing uses verified user/tenant identity, strict plan inputs, same-origin return locations, and ownership checks.
- Stripe webhooks always require the configured signing secret and valid signature; event claims are durable and database write failures surface.
- Authenticated cookie-based state changes enforce origin checks; CORS reflects only allowed origins.
- Global wildcard CORS and public caching for API responses were removed earlier on this branch.

## Evidence

- Focused security/billing tests: 28/28 pass.
- Secret scan: no secrets found; 24 dangerous-pattern warnings require triage.
- Dependency audit: failed with six high and one moderate transitive advisory; one unused vulnerable mobile dependency was removed.
- Security self-check: executes after repair; 26 passed, 14 failed, four critical in the local environment.

## Open release blockers

- Independently validate every RLS policy and cross-tenant read/write path against an isolated database.
- Reconcile migration drift and review `SECURITY DEFINER` functions and the public tables previously found without proven RLS.
- Remediate dependency advisories or document exposure-based exceptions with owner approval.
- Add CSRF/object authorization tests for every sensitive route, not only middleware families.
- Verify retention, deletion, consent, audit logging, and backup restoration with real non-production infrastructure.

Privacy/legal documents and code presence do not prove GDPR, PIPEDA, UK, or US-state compliance. Jurisdiction-specific counsel and operational validation are required.
