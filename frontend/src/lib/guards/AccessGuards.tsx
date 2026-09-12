'use client';

import React, { ReactNode } from 'react';
import { useWorkspace } from '../workspace/useWorkspace';
import { WorkspaceKey, PortalKey } from '../workspace/workspace.types';
import { UnauthorizedPage } from '../../components/workspace/UnauthorizedPage';

interface PermissionGuardProps {
  permission?: string;
  anyPermissions?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ permission, anyPermissions, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, loading } = useWorkspace();

  if (loading) return null;

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyPermissions && anyPermissions.length > 0 && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface WorkspaceGuardProps {
  workspace: WorkspaceKey;
  fallback?: ReactNode;
  children: ReactNode;
}

export function WorkspaceGuard({ workspace, fallback, children }: WorkspaceGuardProps) {
  const { availableWorkspaces, loading } = useWorkspace();

  if (loading) return null;

  const isAuthorized = availableWorkspaces.some((w) => w.key === workspace);

  if (!isAuthorized) {
    return <>{fallback || <UnauthorizedPage moduleName={workspace} />}</>;
  }

  return <>{children}</>;
}

interface PortalGuardProps {
  portal: PortalKey;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PortalGuard({ portal, fallback, children }: PortalGuardProps) {
  const { availablePortals, loading } = useWorkspace();

  if (loading) return null;

  const isAuthorized = availablePortals.some((p) => p.key === portal);

  if (!isAuthorized) {
    return <>{fallback || <UnauthorizedPage moduleName={portal} />}</>;
  }

  return <>{children}</>;
}
