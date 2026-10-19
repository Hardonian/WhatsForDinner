-- Durable Stripe webhook claim ledger. The application service role is the
-- only runtime principal permitted to access it; no Data API policy is added.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create index if not exists stripe_webhook_events_status_received_idx
  on public.stripe_webhook_events (status, received_at desc);
