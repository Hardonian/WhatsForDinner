# Guardian Trust Governance Scorecard

## Overview

This scorecard tracks Guardian system effectiveness and compliance metrics.

## Metrics

### Privacy Violations Prevented

- **High-Risk Blocks**: Number of high-risk operations blocked
- **Medium-Risk Masks**: Number of sensitive data masking operations
- **Credential Blocks**: Number of credential access attempts blocked
- **Biometric Blocks**: Number of biometric access attempts blocked

### Detection Latency

- **Average Detection Time**: Time from event to Guardian action (ms)
- **P95 Detection Time**: 95th percentile detection time (ms)
- **P99 Detection Time**: 99th percentile detection time (ms)

### Hash Integrity

- **Ledger Integrity Score**: Percentage of verified ledgers
- **Hash Chain Errors**: Number of hash chain verification failures
- **Tampering Attempts**: Number of detected tampering attempts

### User Satisfaction

- **Trust Score Average**: Average user trust score (0-100)
- **Confidence Score Average**: Average confidence score (%)
- **Privacy Mode Usage**: Percentage of users using Private Mode
- **Lockdown Usage**: Number of Emergency Lockdown activations

### System Health

- **Active Users**: Number of users with Guardian enabled
- **Events Processed**: Total events processed this week
- **Report Generation Success**: Percentage of successful weekly reports
- **API Uptime**: Guardian API availability percentage

## Reporting

### Weekly Reports

Weekly reports are automatically generated and stored in `guardian/reports/`.

### Monthly Governance Review

Monthly review should include:
1. Violations prevented summary
2. Detection latency trends
3. Hash integrity status
4. User satisfaction metrics
5. System health status

## Compliance

- ✅ RLS policies enforced
- ✅ No admin access to user telemetry
- ✅ Cryptographic verification active
- ✅ Ledger integrity verified
- ✅ Weekly reports generated

## Actions Required

- [ ] Review weekly reports
- [ ] Investigate any hash chain errors
- [ ] Analyze user satisfaction trends
- [ ] Update policies if needed
- [ ] Review anomaly patterns

---

**Generated**: Weekly via `guardian:weekly-report`
**Last Updated**: See individual report files
