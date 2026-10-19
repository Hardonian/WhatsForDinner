# Performance and capacity report

## Measured evidence

- Web production build completed successfully on 2026-10-19.
- The build reported 586 kB shared first-load JavaScript and 94.5 kB middleware.
- No Lighthouse, real-user Core Web Vitals, API latency, database query-plan, cache-hit, or load-test result was produced in this environment.

## Interpretation

The shared JavaScript size is a concrete optimization signal, but it is not a Core Web Vitals measurement. No claim is made for LCP, INP, CLS, throughput, concurrent users, or availability.

## Required next measurement

Use a protected preview with production-like non-sensitive data. Capture mobile and desktop Lighthouse traces, Web Vitals at the 75th percentile when traffic permits, route-level bundle attribution, API p50/p95/p99 latency, database slow queries and connection use, AI latency/cost, and a rate-limited safe load test. Establish budgets only after the baseline is reproducible.
