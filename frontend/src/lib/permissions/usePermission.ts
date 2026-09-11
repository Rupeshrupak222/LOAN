import { useAuth } from '../auth';
import { PermissionKey } from './permissions.types';
import { getEffectivePermissions } from './role-permissions';

/**
 * Checks if a user has a specific permission.
 */
export function hasPermission(
  user: { roles?: string[] } | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  if (user.roles.includes('SUPER_ADMIN')) return true;

  const userPerms = getEffectivePermissions(user.roles);
  return userPerms.includes(permission);
}

/**
 * Checks if a user has at least one of the required permissions.
 */
export function hasAnyPermission(
  user: { roles?: string[] } | null | undefined,
  permissions: PermissionKey[]
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  if (user.roles.includes('SUPER_ADMIN')) return true;

  const userPerms = getEffectivePermissions(user.roles);
  return permissions.some((p) => userPerms.includes(p));
}

/**
 * Checks if a user has all of the required permissions.
 */
export function hasAllPermissions(
  user: { roles?: string[] } | null | undefined,
  permissions: PermissionKey[]
): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  if (user.roles.includes('SUPER_ADMIN')) return true;

  const userPerms = getEffectivePermissions(user.roles);
  return permissions.every((p) => userPerms.includes(p));
}

/**
 * React Hook for checking granular permissions in components.
 */
export function usePermission(permission: PermissionKey): boolean {
  const { user } = useAuth();
  return hasPermission(user, permission);
}

/**
 * React Hook for checking multiple permissions in components.
 */
export function usePermissions(permissions: PermissionKey[]): {
  hasAny: boolean;
  hasAll: boolean;
  userPermissions: PermissionKey[];
} {
  const { user } = useAuth();
  const userPermissions = getEffectivePermissions(user?.roles || []);
  return {
    hasAny: hasAnyPermission(user, permissions),
    hasAll: hasAllPermissions(user, permissions),
    userPermissions,
  };
}
