import { useState, useEffect } from 'react';
import { useAuth, AuthUser } from '../auth';
import { hasPermission, hasAnyPermission } from '../permissions/usePermission';
import { CENTRALIZED_NAVIGATION, AppNavItem, NavCategoryKey } from './navigation.config';
import { WorkspaceId, WORKSPACES, WorkspaceConfig, getAuthorizedWorkspacesForRoles } from './workspaces.types';
import { RoleName } from '../roles';

/**
 * Returns the default workspace ID for a user based on their primary role.
 */
export function getDefaultWorkspaceForUser(user: AuthUser | null | undefined): WorkspaceId {
  if (!user || !user.roles || user.roles.length === 0) return 'BORROWER';

  const primaryRole = user.roles[0] as RoleName;

  switch (primaryRole) {
    case 'CUSTOMER':
      return 'BORROWER';
    case 'LOAN_OFFICER':
      return 'ORIGINATION';
    case 'CREDIT_ANALYST':
    case 'UNDERWRITER':
      return 'CREDIT';
    case 'RISK_MANAGER':
    case 'RISK_ANALYST':
    case 'FRAUD_ANALYST':
      return 'RISK';
    case 'FINANCE_OFFICER':
      return 'FINANCE';
    case 'COLLECTION_OFFICER':
      return 'COLLECTIONS';
    case 'BRANCH_MANAGER':
      return 'ORIGINATION';
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'AUDITOR':
      return 'PLATFORM';
    default:
      return 'ORIGINATION';
  }
}

/**
 * Returns all navigation items that the user is authorized to view based on their effective permissions.
 */
export function getAuthorizedNavigation(
  user: AuthUser | null | undefined,
  activeWorkspace?: WorkspaceId
): AppNavItem[] {
  if (!user) return [];

  const effectiveWorkspace = activeWorkspace || getDefaultWorkspaceForUser(user);

  return CENTRALIZED_NAVIGATION.filter((item) => {
    // Workspace filter
    if (item.workspace !== effectiveWorkspace) {
      return false;
    }

    // Permission checks
    if (item.requiredPermission) {
      if (!hasPermission(user, item.requiredPermission)) return false;
    }

    if (item.requiredAnyPermissions && item.requiredAnyPermissions.length > 0) {
      if (!hasAnyPermission(user, item.requiredAnyPermissions)) return false;
    }

    return true;
  });
}

/**
 * Groups authorized navigation items by category.
 */
export function getGroupedNavigation(
  user: AuthUser | null | undefined,
  activeWorkspace?: WorkspaceId
): Record<NavCategoryKey, AppNavItem[]> {
  const authorized = getAuthorizedNavigation(user, activeWorkspace);

  const grouped: Record<NavCategoryKey, AppNavItem[]> = {
    OVERVIEW: [],
    ORIGINATION: [],
    CREDIT_ASSESSMENT: [],
    RISK_FRAUD: [],
    FINANCIAL_OPS: [],
    SERVICING: [],
    COLLECTIONS: [],
    PARTNERSHIP: [],
    SUPPORT: [],
    GOVERNANCE: [],
    ADMINISTRATION: [],
  };

  for (const item of authorized) {
    if (grouped[item.group]) {
      grouped[item.group].push(item);
    }
  }

  return grouped;
}

/**
 * Checks whether a user has permission to access a specific route pathname.
 */
export function canAccessRoute(
  user: AuthUser | null | undefined,
  pathname: string
): boolean {
  if (!user) return false;
  if (user.roles?.includes('SUPER_ADMIN')) return true;

  // Root dashboard is accessible to staff users
  if (pathname === '/dashboard') {
    return !user.roles?.includes('CUSTOMER') || user.roles.length > 1;
  }

  // Customer portal routes are only accessible to CUSTOMER role
  if (pathname.startsWith('/customer')) {
    return user.roles?.includes('CUSTOMER') || user.roles?.includes('SUPER_ADMIN');
  }

  // Customer cannot access staff internal routes
  if (user.roles?.length === 1 && user.roles[0] === 'CUSTOMER') {
    return false;
  }

  // Match against centralized navigation
  const matchingItem = CENTRALIZED_NAVIGATION.find(
    (item) => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
  );

  if (!matchingItem) {
    // If not explicitly defined, allow authenticated staff
    return true;
  }

  if (matchingItem.requiredPermission) {
    return hasPermission(user, matchingItem.requiredPermission);
  }

  if (matchingItem.requiredAnyPermissions) {
    return hasAnyPermission(user, matchingItem.requiredAnyPermissions);
  }

  return true;
}

/**
 * React Hook for dynamic navigation and active workspace state in the UI.
 */
export function useNavigation(initialWorkspace?: WorkspaceId) {
  const { user } = useAuth();
  const defaultWs = getDefaultWorkspaceForUser(user);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(initialWorkspace || defaultWs);

  // Keep active workspace in sync if user changes or role loads
  useEffect(() => {
    if (!initialWorkspace && user) {
      setActiveWorkspace(getDefaultWorkspaceForUser(user));
    }
  }, [user, initialWorkspace]);

  const userRoles = (user?.roles || []) as RoleName[];
  const authorizedWorkspaces = getAuthorizedWorkspacesForRoles(userRoles);
  const authorizedItems = getAuthorizedNavigation(user, activeWorkspace);
  const groupedItems = getGroupedNavigation(user, activeWorkspace);

  return {
    activeWorkspace,
    setActiveWorkspace,
    authorizedWorkspaces,
    authorizedItems,
    groupedItems,
    workspaces: WORKSPACES,
    canAccess: (pathname: string) => canAccessRoute(user, pathname),
  };
}
