# High Availability & Disaster Recovery (HADR) Plan

Adyapan Lending OS is designed to withstand infrastructure faults while guaranteeing financial consistency and zero ledger corruption.

---

## 1. RPO & RTO Objectives

- **Recovery Point Objective (RPO)**: < 5 Minutes (Continuous WAL replication).
- **Recovery Time Objective (RTO)**: < 30 Minutes (Automated container redeployment + database failover).

---

## 2. Disaster Recovery Scenarios

### A. Primary PostgreSQL Cluster Outage
1. Initiate automated promotion of Read Replica to Primary Master.
2. Update backend `DATABASE_URL` connection pool endpoint.
3. Backend connection pool automatically re-establishes active connections within 30 seconds.

### B. Redis Cache / Session Store Unavailable
- **Graceful Fallback Mode**: If Redis goes down, authentication sessions degrade safely to verified JWT signature checks, and job processing shifts to in-memory worker queues (`worker.service.ts`).
- **Zero Security Bypass**: Cache unavailability never bypasses authorization or tenant boundaries.

### C. Webhook Ingestion Outage
- Replay protection and deduplication cache store all inbound events for 7 days. Once the receiver comes back online, upstream payment gateway retries are processed safely without duplicate postings.
