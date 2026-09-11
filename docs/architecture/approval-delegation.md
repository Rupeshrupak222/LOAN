# Adyapan Lending OS — Approval Delegation Architecture

## Overview
The Approval Delegation subsystem allows institutional approvers (such as Branch Managers or Senior Underwriters) on temporary leave or deployment to delegate their specific approval authority to eligible peers without credential sharing or permanent permission elevation.

---

## 1. Delegation Model

Delegations are explicitly configured and time-bounded:

```typescript
interface AuthorityDelegation {
  id: string;
  tenantId: string;
  delegatorUserId: string;
  delegatorName: string;
  delegatorRole: string;
  delegateUserId: string;
  delegateName: string;
  delegateRole: string;
  scope: 'ALL_PRODUCTS' | 'PRODUCT_SPECIFIC' | 'BRANCH_SPECIFIC';
  targetProductId?: string;
  targetBranchId?: string;
  maxAmountLimit?: string;
  startDate: string;      // ISO UTC timestamp
  endDate: string;        // ISO UTC timestamp
  reason: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
}
```

---

## 2. Validation & Security Checks

Before an approval task can be executed by a delegate:
1. **Active Time Window**: `startDate <= now <= endDate`.
2. **Status**: Delegation record must be `ACTIVE` (not `REVOKED` or `EXPIRED`).
3. **Scope Match**: If delegated with `targetProductId`, the application must match that product.
4. **Amount Ceiling**: The loan amount must not exceed `maxAmountLimit` of the delegation contract.
5. **No Delegation of Delegations**: A delegate cannot sub-delegate authority.
6. **Immutable Audit Trail**: Every approval performed under delegation records `delegatedBy: delegatorUserId` in the approval task and AuditLog.

---

## 3. Delegation Management & APIs

- `GET /api/v1/delegations`: List active delegations for tenant / current user.
- `POST /api/v1/delegations`: Create new time-bound delegation request.
- `POST /api/v1/delegations/:id/revoke`: Immediate manual revocation of active delegation.
