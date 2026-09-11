import { useAuth, AuthUser } from '../auth';
import { hasPermission, hasAnyPermission } from '../permissions/usePermission';
import { CENTRALIZED_NAVIGATION, AppNavItem, NavCategoryKey } from './navigation.config';
import { WorkspaceId, WORKSPACES } from './workspaces.types';

/**
 * Returns all navigation items that the user is authorized to view based on their effective permissions.
 */
export function getAuthorizedNavigation(
  user: AuthUser | null | undefined,
  activeWorkspace?: WorkspaceId
): AppNavItem[] {
  if (!user) return [];

  return CENTRALIZED_NAVIGATION.filter((item) => {
    // Optional workspace filter
    if (activeWorkspace && item.workspace !== activeWorkspace) {
      return false;
    }

    // Permission check
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
    CUSTOMERS: [],
    LENDING: [],
    SERVICING: [],
    INSIGHTS: [],
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

  // Root dashboard is always accessible to authenticated users
  if (pathname === '/dashboard') return true;

  // Match against centralized navigation
  const matchingItem = CENTRALIZED_NAVIGATION.find(
    (item) => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))
  );

  if (!matchingItem) {
    // If not explicitly restricted in navigation, allow or default to true for nested subviews
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
 * React Hook for dynamic navigation in the UI.
 */
export function useNavigation(activeWorkspace?: WorkspaceId) {
  const { user } = useAuth();
  const authorizedItems = getAuthorizedNavigation(user, activeWorkspace);
  const groupedItems = getGroupedNavigation(user, activeWorkspace);

  return {
    authorizedItems,
    groupedItems,
    workspaces: WORKSPACES,
    canAccess: (pathname: string) => canAccessRoute(user, pathname),
  };
}
