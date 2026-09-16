#!/bin/bash
set -e
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-placeholder}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-placeholder}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_placeholder}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
export UPSTASH_REDIS_REST_URL="${UPSTASH_REDIS_REST_URL:-https://placeholder.upstash.io}"
export UPSTASH_REDIS_REST_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-placeholder}"
export SENDGRID_API_KEY="${SENDGRID_API_KEY:-SG.placeholder}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-placeholder}"
export CRM_PROVIDER="${CRM_PROVIDER:-noop}"
exec next build
