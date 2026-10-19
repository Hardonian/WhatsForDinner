# Billing and entitlement validation

## Implemented and tested with mocks

- Checkout accepts only known plan/billing-cycle combinations and derives identity from verified authentication.
- Portal and subscription lookup ignore spoofed user headers/body identifiers.
- Cancellation requires an existing locally owned subscription; arbitrary Stripe subscription IDs cannot be cancelled.
- Checkout success/cancel and portal-return URLs are constrained to the application origin.
- Stripe-unavailable paths fail explicitly instead of returning simulated success.
- Webhooks require a raw-body signature and a configured secret.
- A durable `stripe_webhook_events` ledger provides event claiming and completion/failure state; persistence failure is fail-closed.
- Handler database failures propagate so Stripe can retry.

Focused billing, webhook, and middleware suites are part of the 28/28 passing tests.

## Unverified / blocked

- The new ledger migration has not been applied or linted against a local database because Supabase is not running.
- No real Stripe test-mode checkout, portal, renewal, payment failure, refund, dispute, out-of-order event, or reconciliation run was performed.
- Tax configuration and market eligibility were not changed or approved.
- A route-by-route server entitlement audit remains incomplete.

No live prices, customers, subscriptions, or billing records were changed.
