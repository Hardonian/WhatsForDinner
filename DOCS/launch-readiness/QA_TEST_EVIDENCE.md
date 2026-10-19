# QA and test evidence

Evidence date: 2026-10-19.

| Command | Result |
| --- | --- |
| `pnpm --filter @whats-for-dinner/web exec tsc --noEmit --pretty false` | Pass |
| `pnpm --filter @whats-for-dinner/web lint` | Pass: 0 errors, 674 warnings |
| `pnpm --filter @whats-for-dinner/web test -- --runInBand --silent` | Pass: 368 suites, 1,018 tests |
| Focused Jest suites for subscription create/me/portal/cancel, webhook, health, readiness, middleware | 8 suites, 28 tests pass |
| `node --test scripts/reliability-modules/uptime-monitor.test.mjs` | 5/5 pass |
| `pnpm --filter @whats-for-dinner/web build` with non-secret test env | Pass |
| `pnpm secrets:scan` | Pass for secrets; 24 dangerous-pattern warnings |
| `pnpm audit --audit-level=moderate` | Fail: 6 high, 1 moderate advisories |
| `pnpm security:self-check` | Executes; fail: 26 pass, 14 fail, 4 critical local environment/schema checks |
| Workflow YAML parse with PyYAML | Pass; `orchestrate` job present |
| `pnpm exec supabase db lint --local` | Blocked: local Postgres refused connection on 127.0.0.1:6543 |

Browser E2E, real integrations, mobile, accessibility, performance, load, restore, and chaos evidence are not present. A green mocked/unit suite does not substitute for those layers.
