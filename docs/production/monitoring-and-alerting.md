# Observability, Monitoring & Alerting Guide

This document describes the observability telemetry, Prometheus metrics, and automated alert rules configured in Adyapan Lending OS.

---

## 1. Metrics Endpoint (`/metrics`)

The application exposes Prometheus metrics formatted via OpenMetrics standard at `/metrics`:

```text
# HELP adyapan_http_requests_total Total number of HTTP requests processed
# TYPE adyapan_http_requests_total counter
adyapan_http_requests_total{method="POST",status="200",route="/api/v1/direct-lending/apply-instant"} 1420

# HELP adyapan_http_request_duration_seconds HTTP request latency histogram
# TYPE adyapan_http_request_duration_seconds histogram
adyapan_http_request_duration_seconds_bucket{le="0.1"} 950
adyapan_http_request_duration_seconds_bucket{le="0.5"} 1380

# HELP adyapan_active_loans_count Total number of active performing loans
# TYPE adyapan_active_loans_count gauge
adyapan_active_loans_count 8450
```

---

## 2. Core Alerting Thresholds

- **API Error Spike**: HTTP 5xx rate > 2% over a 5-minute rolling window -> Alert `PlatformOps`.
- **Database Connection Saturation**: Pool usage > 85% for > 2 minutes -> Alert `DBA`.
- **Pre-Disbursement Gate Failures**: > 5 consecutive gate blocks -> Alert `CreditRiskDesk`.
- **Reconciliation Exception**: Unbalanced GL posting detected -> Alert `FinanceLead`.
- **Webhook Ingestion Drop**: Zero webhooks received during peak hours -> Alert `IntegrationLead`.
