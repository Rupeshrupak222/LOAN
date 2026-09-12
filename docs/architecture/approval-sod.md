# Adyapan Lending OS — Segregation of Duties (SoD) & Four-Eyes Governance

## Overview
Segregation of Duties (SoD) is enforced deterministically at the service and API gateway level to prevent fraud, conflicts of interest, and unauthorized loan sanctions.

---

## 1. Core SoD Rules

| Rule | Enforcement | Rejection Message |
|------|-------------|-------------------|
| **Self-Approval Prohibition** | Applicant userId !== Approver userId | `APPROVAL_BLOCKED: Segregation of Duties - You cannot approve your own loan application.` |
| **Originator Separation** | SourcedBy userId !== Approver userId | `APPROVAL_BLOCKED: Segregation of Duties - Originating loan officer cannot sanction this loan.` |
| **Maker-Checker Separation** | Credit Assessment Maker !== Sanction Authority | `APPROVAL_BLOCKED: Maker-checker conflict - Assessing analyst cannot execute final sanction.` |
| **Audit Role Isolation** | Auditor / Compliance roles cannot approve | `APPROVAL_BLOCKED: Compliance and Audit users are barred from operational approvals.` |
| **Branch Scope Isolation** | Approver branchId === Application branchId (for branch-scoped levels) | `APPROVAL_BLOCKED: Approver branch scope does not match application branch.` |
| **Tenant Scope Isolation** | Approver tenantId === Application tenantId | `FORBIDDEN: Cross-tenant approval violation.` |

---

## 2. Dynamic SoD Resolution Engine

When an approval action is requested:
1. System validates that the caller possesses active `approval.approve` permission.
2. System checks the caller against the application's history:
   - Was the caller the applicant (`borrowerId`)?
   - Was the caller the originator / loan officer (`assignedTo` / initial creation audit record)?
   - Did the caller perform previous assessment actions that are flagged as conflicting?
3. If any conflict exists, execution aborts with `403 Forbidden` and logs a security audit event: `SOD_VIOLATION_BLOCKED`.

---

## 3. Four-Eyes Principle

For high-ticket loans (above tenant-configured threshold, e.g., ₹5,00,000), minimum two distinct individuals must inspect and sign off on the facility:
1. **First Eye**: Verification / Credit Assessment Analyst.
2. **Second Eye**: Branch Manager / Underwriter.
3. **Third Eye (Multi-level)**: Credit Head / Sanction Committee for corporate or jumbo tickets.
