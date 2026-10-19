# Feature completeness matrix

| Area | Status | Evidence / gap |
| --- | --- | --- |
| Landing and demo CTA | Implemented, focused verification only | CTA routes were corrected earlier on this branch; no visual regression run. |
| Registration/login | Implemented, partially verified | Fail-open UI behavior was removed; end-to-end email/session lifecycle is untested. |
| Onboarding | Present, unverified | No complete browser journey or persisted-preference test. |
| Meal discovery/recipes | Present, unverified | Build coverage only; recommendation relevance and malformed-recipe evaluation are absent. |
| Saved meals/planning/grocery | Present, unverified | No complete state-propagation or concurrency journey was run. |
| Pantry/household | Present, security review incomplete | Sensitive route families are centrally protected; object-level/RLS tests remain required. |
| Billing checkout/portal | Hardened, mocked tests pass | Verified-user ownership and safe redirects tested; real Stripe test-mode exercise is outstanding. |
| Cancellation | Hardened, mocked tests pass | Cross-user cancellation is rejected; real subscription lifecycle remains untested. |
| Stripe webhooks | Hardened, mocked tests pass | Signature and durable claim failures are fail-closed; migration is unapplied/unlinted. |
| Export/deletion/privacy | Present, unverified | APIs are protected centrally; legal/process and end-to-end evidence are incomplete. |
| Mobile | Not verified | Expo client was not built or tested on devices. |
| Internationalization | Not launch-complete | Infrastructure fragments exist, but no language/market is quality-certified. |
| Operations | Partially repaired | Monitor logic and workflow syntax are tested locally; deployed health remains broken/unverified. |

“Present” means discoverable in source, not production-proven. No absent evidence is treated as success.
