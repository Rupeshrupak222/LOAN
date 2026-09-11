# Centralized Navigation Architecture

## 1. Single Source of Truth

All navigation in Adyapan Lending OS is defined in:
[`src/lib/navigation/navigation.config.ts`](file:///f:/LOAN/frontend/src/lib/navigation/navigation.config.ts)

Every menu item implements the `AppNavItem` interface:

```typescript
export interface AppNavItem {
  key: string;
  label: string;
  href: string;
  iconName: string;
  workspace: WorkspaceId;
  group: NavCategoryKey;
  requiredPermission?: PermissionKey;
  requiredAnyPermissions?: PermissionKey[];
  description?: string;
}
```

---

## 2. Dynamic Resolution Flow

```text
User Logs In (JWT with roles: ['LOAN_OFFICER', 'BRANCH_MANAGER'])
    ↓
auth.tsx loads user context
    ↓
useNavigation() calls getAuthorizedNavigation(user)
    ↓
getEffectivePermissions(user.roles) aggregates distinct permissions
    ↓
Filter CENTRALIZED_NAVIGATION:
- Item requires 'application.view' → User has it → ALLOWED
- Item requires 'approval.approve' → User has it (from BRANCH_MANAGER) → ALLOWED
- Item requires 'disbursement.execute' → User lacks it → FILTERED OUT
    ↓
Group into Categories (OVERVIEW, CUSTOMERS, LENDING, SERVICING, INSIGHTS, ADMINISTRATION)
    ↓
AppShell.tsx renders exact permitted sidebar menu items with active route highlighting
```

---

## 3. Route Guard Integration

The route guard in `AppShell.tsx` evaluates:

```typescript
export function canAccessRoute(user: AuthUser | null, pathname: string): boolean
```

If a user navigates directly via URL to an unauthorized route (e.g. `/disbursements` as a Loan Officer), `AppShell` displays a structured **403 Access Restricted** state with clear role context and a button to return to `/dashboard`.
