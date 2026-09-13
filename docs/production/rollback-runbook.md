# Production Rollback Runbook

In the event of an unexpected release regression or operational anomaly, follow this structured rollback runbook.

---

## 1. Rollback Decision Matrix

| Anomaly Type | Severity | Immediate Action | Rollback Target |
| :--- | :--- | :--- | :--- |
| **Database Pool Exhaustion** | CRITICAL | Divert traffic to maintenance mode, restart pool | Current version restart |
| **Fatal API Error Spike (>5%)** | HIGH | Route traffic back to previous container image | Previous Git commit/image tag |
| **Financial Posting Discrepancy** | CRITICAL | Pause disbursement worker queues immediately | Previous version + financial audit |
| **Security / Auth Failure** | CRITICAL | Revoke active refresh tokens, revert deployment | Previous stable release |

---

## 2. Step-by-Step Rollback Procedure

1. **Traffic Re-route**: Switch the reverse proxy / load balancer (e.g. Nginx, Cloudflare, AWS ALB) to point to the blue/green standby instance running the previous stable version.
2. **Container Image Rollback**:
   ```bash
   docker-compose down
   docker-compose -f docker-compose.previous.yml up -d
   ```
3. **Database Forward-Fix Policy**: Never perform destructive table drops during rollbacks. Schema migrations are strictly designed to be forward-compatible. Use compensating data fix scripts if necessary.
4. **Post-Rollback Health Validation**:
   ```bash
   curl -f http://localhost:4000/health/ready
   ```
5. **Incident Audit**: Log an entry in the incident response desk with root-cause analysis (RCA) within 24 hours.
