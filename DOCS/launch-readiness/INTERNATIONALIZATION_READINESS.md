# Internationalization readiness

| Market | Technical readiness | Commercial/legal readiness | Launch verdict |
| --- | --- | --- | --- |
| Canada (English) | Partial; locale behavior unverified | Privacy, tax, subscription, food claims need review | Blocked |
| Canada (French) | No certified translation | Additional language/legal review required | Blocked |
| United States | Partial; units/currency journeys unverified | State privacy, tax, subscription terms need review | Blocked |
| United Kingdom | Partial; locale journey unverified | UK privacy/tax/subscription review required | Blocked |
| European Union | Partial; no certified locale | GDPR, consent, transfer, VAT and language review required | Blocked |
| RTL markets | Architecture not proven | Translation and regional review absent | Blocked |

The repository includes locale-related code, but no language is declared supported by this report. Required evidence includes string extraction coverage, persisted language choice, locale-aware dates/time zones/currency, metric and US-unit conversion tests, Unicode search, RTL layout checks, localized metadata, and human translation QA. Location must not be used to infer dietary or health attributes.
