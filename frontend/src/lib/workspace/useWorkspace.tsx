'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../auth';
import { api } from '../api';
import {
  UserAccessContext,
  WorkspaceKey,
  PortalKey,
  WorkspaceDefinition,
  PortalDefinition,
  NavigationItemModel,
  FeatureFlagConfig,
} from './workspace.types';
import {
  CLIENT_PORTALS,
  CLIENT_WORKSPACES,
  DEFAULT_CLIENT_FEATURE_FLAGS,
} from './workspace.config';

interface WorkspaceContextValue {
  context: UserAccessContext | null;
  loading: boolean;
  activeWorkspace: WorkspaceDefinition;
  activePortal: PortalDefinition;
  availableWorkspaces: WorkspaceDefinition[];
  availablePortals: PortalDefinition[];
  navigationItems: NavigationItemModel[];
  navigationGroups: Array<{ key: string; label: string; items: NavigationItemModel[] }>;
  permissions: string[];
  featureFlags: FeatureFlagConfig;
  switchWorkspace: (workspaceKey: WorkspaceKey) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  isFeatureEnabled: (flag: string) => boolean;
  refreshContext: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [context, setContext] = useState<UserAccessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchContext = useCallback(async () => {
    if (!user) {
      setContext(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/workspaces/context');
      if (res.data?.success && res.data?.data) {
        setContext(res.data.data);
      }
    } catch {
      // Create safe fallback context based on user roles
      const roles = user.roles || ['CUSTOMER'];
      const isSuperAdmin = roles.includes('SUPER_ADMIN');
      const primaryRole = roles[0] || 'CUSTOMER';

      let defaultWs = CLIENT_WORKSPACES.OPERATIONS_LENDING;
      if (roles.includes('CUSTOMER')) defaultWs = CLIENT_WORKSPACES.BORROWER_SELF_SERVICE;
      else if (roles.includes('PARTNER')) defaultWs = CLIENT_WORKSPACES.PARTNER_EMBEDDED_HUB;
      else if (isSuperAdmin || roles.includes('ADMIN')) defaultWs = CLIENT_WORKSPACES.ADMIN_ACCESS_CONTROL;
      else if (roles.includes('CREDIT_ANALYST') || roles.includes('UNDERWRITER')) defaultWs = CLIENT_WORKSPACES.CREDIT_ASSESSMENT;
      else if (roles.includes('COLLECTION_OFFICER')) defaultWs = CLIENT_WORKSPACES.COLLECTIONS_DELINQUENCY;
      else if (roles.includes('FINANCE_OFFICER')) defaultWs = CLIENT_WORKSPACES.FINANCE_GL;
      else if (roles.includes('BRANCH_MANAGER')) defaultWs = CLIENT_WORKSPACES.OPERATIONS_BRANCH;

      const fallbackContext: UserAccessContext = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organization: {
          id: user.tenantId || 'tenant-default',
          name: 'Adyapan Financial Services',
          code: 'ADYAPAN-HQ',
          status: 'ACTIVE',
        },
        department: {
          key: 'OPERATIONS',
          name: 'Operations',
        },
        roles,
        primaryRole,
        availablePortals: Object.values(CLIENT_PORTALS),
        availableWorkspaces: Object.values(CLIENT_WORKSPACES),
        activePortal: CLIENT_PORTALS[defaultWs.portal] || CLIENT_PORTALS.OPERATIONS,
        activeWorkspace: defaultWs,
        permissions: isSuperAdmin ? ['*'] : [],
        navigation: {
          items: [],
          groups: [],
        },
        featureFlags: DEFAULT_CLIENT_FEATURE_FLAGS,
      };

      setContext(fallbackContext);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchContext();
    }
  }, [authLoading, fetchContext]);

  const switchWorkspace = useCallback(async (workspaceKey: WorkspaceKey) => {
    try {
      setLoading(true);
      const res = await api.post('/workspaces/switch', { workspaceKey });
      if (res.data?.success && res.data?.data) {
        const updatedContext = res.data.data;
        setContext(updatedContext);
        // Automatically route to workspace default route if current page is not inside the new workspace
        if (updatedContext.activeWorkspace?.defaultRoute) {
          router.push(updatedContext.activeWorkspace.defaultRoute);
        }
      }
    } catch {
      // Local fallback switch
      if (context && CLIENT_WORKSPACES[workspaceKey]) {
        const targetWs = CLIENT_WORKSPACES[workspaceKey];
        setContext({
          ...context,
          activeWorkspace: targetWs,
          activePortal: CLIENT_PORTALS[targetWs.portal] || context.activePortal,
        });
        if (targetWs.defaultRoute) {
          router.push(targetWs.defaultRoute);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [context, router]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!context) return false;
    if (context.roles.includes('SUPER_ADMIN')) return true;
    if (context.permissions.includes('*')) return true;
    return context.permissions.includes(permission);
  }, [context]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    if (!context) return false;
    if (context.roles.includes('SUPER_ADMIN')) return true;
    if (context.permissions.includes('*')) return true;
    return perms.some((p) => context.permissions.includes(p));
  }, [context]);

  const isFeatureEnabled = useCallback((flag: string): boolean => {
    if (!context) return true;
    return context.featureFlags?.[flag] !== false;
  }, [context]);

  const activeWorkspace = context?.activeWorkspace || CLIENT_WORKSPACES.OPERATIONS_LENDING;
  const activePortal = context?.activePortal || CLIENT_PORTALS.OPERATIONS;
  const availableWorkspaces = context?.availableWorkspaces || Object.values(CLIENT_WORKSPACES);
  const availablePortals = context?.availablePortals || Object.values(CLIENT_PORTALS);
  const navigationItems = context?.navigation?.items || [];
  const navigationGroups = context?.navigation?.groups || [];
  const permissions = context?.permissions || [];
  const featureFlags = context?.featureFlags || DEFAULT_CLIENT_FEATURE_FLAGS;

  return (
    <WorkspaceContext.Provider
      value={{
        context,
        loading: authLoading || loading,
        activeWorkspace,
        activePortal,
        availableWorkspaces,
        availablePortals,
        navigationItems,
        navigationGroups,
        permissions,
        featureFlags,
        switchWorkspace,
        hasPermission,
        hasAnyPermission,
        isFeatureEnabled,
        refreshContext: fetchContext,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
