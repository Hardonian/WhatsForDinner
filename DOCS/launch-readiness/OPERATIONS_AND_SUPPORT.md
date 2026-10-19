# Operations and support

## Implemented controls

- Health/readiness handlers now return non-2xx for degraded dependencies.
- The uptime monitor validates URL, status, and response body and has five passing tests.
- The reliability workflow uses a separately supplied domain/URL and valid YAML.
- Billing writes and webhook persistence errors are observable failures rather than swallowed success.

## Required operating procedures

- Define on-call ownership and escalation for auth, database, AI, billing, privacy, and deployment incidents.
- Configure error monitoring and alerts for health, webhook backlog/failures, payment recovery, AI latency/cost, queue failures, and data-export/deletion jobs.
- Provide a customer-visible support route with account, billing, recommendation, food-safety, deletion, and incident guidance.
- Use minimal identifiers when investigating; do not expose dietary details, tokens, or payment data in logs/tickets.
- Exercise credential rotation, point-in-time recovery/restore, provider outage, duplicate webhook, and compromised-account runbooks.

Current production monitoring is not trusted until a deployed health endpoint passes validation and the repaired workflow completes successfully with artifacts.
