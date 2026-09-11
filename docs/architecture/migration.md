# Migration & Compatibility Guide

This document outlines the migration strategy, architectural principles, and compatibility safeguards implemented during **Phase 0** and guidelines for ongoing development.

---

## 1. Migration Philosophy & Zero-Downtime Guarantee

The **Adyapan Lending OS** upgrade follows an **incremental, non-destructive migration pattern**:

```text
Existing Implementation
        ↓
New Architecture Abstraction (Permissions, Workspaces, Features)
        ↓
Backward Compatibility Layer
        ↓
Validation & Zero-Regression Verification
        ↓
Progressive Migration of Internal Handlers
```

No existing backend endpoints, database models, or frontend operational routes were broken or deleted during Phase 0.

---

## 2. Key Refactoring & Architectural Changes

### 2.1 Role-Coupled Portals → Dynamic Permission Matrix
- **Before:** Sidebars and page access were determined by hardcoded `role === "LOAN_OFFICER"` or taking the first index `user.roles[0]`. Multi-role users had their secondary roles ignored.
- **After:** 
  - Centralized in `src/lib/permissions/` using standard `domain.action` taxonomy.
  - Multi-role users receive the union of all their roles via `getEffectivePermissions(user.roles)`.
  - Sidebars and route guards dynamically evaluate `hasPermission(user, requiredPermission)`.

### 2.2 Navigation Centralization
- **Before:** Dispersed navigation arrays hardcoded across multiple layout components.
- **After:** Single source of truth in `src/lib/navigation/navigation.config.ts`. Navigation items declare workspace, route, icon, and permission. The sidebar automatically adapts per user without hardcoded conditionals.

### 2.3 Route Guard Enforcement
- **Before:** Hidden sidebar items were treated as the primary access control.
- **After:** `canAccessRoute(user, pathname)` is evaluated inside `AppShell.tsx`. Direct URL navigation to an unauthorized page renders a secure, styled **403 Access Restricted** state with context and back-navigation.

### 2.4 Feature-First Directory Structure
- **Before:** Business components and state scattered across portal-specific subfolders.
- **After:** Modularized in `src/features/` (`applications/`, `credit/`, `underwriting/`, `finance/`, `borrower/`, `bre/`, etc.). Each feature module encapsulates its own types, API clients, hooks, and UI components.

---

## 3. Developer Guidelines for Future Features

When creating a new feature in the Lending OS:

1. **Define Permissions (`src/lib/permissions/permissions.types.ts`)**:
   - Register new permissions using `<domain>.<action>` syntax (e.g. `reports.export`, `fraud.review`).
   - Assign permissions to default roles in `src/lib/permissions/role-permissions.ts`.

2. **Register Navigation (`src/lib/navigation/navigation.config.ts`)**:
   - Add the menu item with its `workspace`, `category`, `href`, `icon`, and `permission`.

3. **Build Feature Module (`src/features/<feature-name>/`)**:
   - Create `types.ts`, `api.ts`, `hooks/`, `components/`, and export via `index.ts`.

4. **Add Page Route (`src/app/(app)/<route>/page.tsx`)**:
   - Implement the page by consuming components from `src/features/<feature-name>/`.
   - The route is automatically guarded by the central navigation and permission engine.

---

## 4. Compatibility Layer Checklist

- [x] All existing URL paths (`/applications`, `/credit-analyst`, `/underwriter`, `/finance`, `/admin`, `/customer`) remain operational.
- [x] Token decoding and user payload structure (`user.roles`, `user.tenantId`, `user.branchId`) preserved.
- [x] Segregation of Duties (SoD) policies strictly enforced across Credit Analyst, Underwriter, and Branch Manager roles.
- [x] API client interceptors continue attaching bearer tokens and tenant context headers seamlessly.
