/**
 * Phase 16: Workspace, Navigation & Portal Service
 */

import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import {
  PortalKey,
  DepartmentKey,
  WorkspaceKey,
  PortalDefinition,
  WorkspaceDefinition,
  NavigationItemModel,
  UserAccessContext,
} from './workspace.types';
import {
  MASTER_PORTALS,
  MASTER_WORKSPACES,
  MASTER_NAVIGATION,
  ROLE_DEPARTMENT_MAP,
  DEFAULT_FEATURE_FLAGS,
} from './workspace.config';

export class WorkspaceService {
  private static instance: WorkspaceService;

  // In-memory cache of user active workspace overrides
  private readonly userActiveWorkspaces = new Map<string, WorkspaceKey>();

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  /**
   * 1. Resolves Full User Access Context, Department, Workspaces, and Access-Aware Navigation
   */
  public async getUserAccessContext(userId: string, requestedTenantId?: string): Promise<UserAccessContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        tenant: true,
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Role extraction
    const roles = user.roles.map((r) => r.role.name);
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const primaryRole = roles[0] || 'CUSTOMER';

    // Tenant / Organization Context
    let tenant = user.tenant;
    if (!tenant && requestedTenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: requestedTenantId } });
    }
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' } });
    }

    const organization = {
      id: tenant?.id || 'tenant-default',
      name: tenant?.name || 'Adyapan Financial Services',
      code: tenant?.code || 'ADYAPAN-HQ',
      status: tenant?.status || 'ACTIVE',
    };

    // Department Context (Separate from role)
    const departmentKey: DepartmentKey = ROLE_DEPARTMENT_MAP[primaryRole] || 'OPERATIONS';
    const department = {
      key: departmentKey,
      name: departmentKey.replace('_', ' '),
    };

    // Compile effective permissions
    const permissionsSet = new Set<string>();
    for (const userRole of user.roles) {
      for (const rolePerm of userRole.role.permissions) {
        if (rolePerm.permission?.key) {
          permissionsSet.add(rolePerm.permission.key);
        }
      }
    }

    // Auto-grant administrative wildcard permissions for SUPER_ADMIN
    if (isSuperAdmin) {
      permissionsSet.add('*');
    }

    const permissions = Array.from(permissionsSet);

    // Filter Available Portals for user
    const availablePortals = Object.values(MASTER_PORTALS).filter((portal) => {
      if (!portal.isEnabled) return false;
      if (isSuperAdmin) return true;
      if (portal.allowedRoles.includes('*')) return true;
      return portal.allowedRoles.some((r) => roles.includes(r));
    });

    // Filter Available Workspaces for user
    const availableWorkspaces = Object.values(MASTER_WORKSPACES).filter((ws) => {
      if (ws.status !== 'ACTIVE') return false;
      if (isSuperAdmin) return true;
      return ws.allowedRoles.some((r) => roles.includes(r));
    });

    // Determine Active Workspace
    let activeWorkspaceKey = this.userActiveWorkspaces.get(user.id);
    let activeWorkspace = availableWorkspaces.find((w) => w.key === activeWorkspaceKey);

    if (!activeWorkspace) {
      // Default workspace selection
      if (roles.includes('CUSTOMER')) {
        activeWorkspace = MASTER_WORKSPACES.BORROWER_SELF_SERVICE;
      } else if (roles.includes('PARTNER')) {
        activeWorkspace = MASTER_WORKSPACES.PARTNER_EMBEDDED_HUB;
      } else if (isSuperAdmin || roles.includes('ADMIN')) {
        activeWorkspace = MASTER_WORKSPACES.ADMIN_ACCESS_CONTROL;
      } else if (roles.includes('CREDIT_ANALYST') || roles.includes('UNDERWRITER')) {
        activeWorkspace = MASTER_WORKSPACES.CREDIT_ASSESSMENT;
      } else if (roles.includes('COLLECTION_OFFICER') || roles.includes('COLLECTIONS_MANAGER')) {
        activeWorkspace = MASTER_WORKSPACES.COLLECTIONS_DELINQUENCY;
      } else if (roles.includes('FINANCE_OFFICER')) {
        activeWorkspace = MASTER_WORKSPACES.FINANCE_GL;
      } else if (roles.includes('BRANCH_MANAGER')) {
        activeWorkspace = MASTER_WORKSPACES.OPERATIONS_BRANCH;
      } else {
        activeWorkspace = availableWorkspaces[0] || MASTER_WORKSPACES.OPERATIONS_LENDING;
      }
    }

    const activePortal = MASTER_PORTALS[activeWorkspace.portal] || availablePortals[0] || MASTER_PORTALS.OPERATIONS;

    // Generate Dynamic Access-Aware Navigation Tree for Active Workspace / Portal
    const navigationItems = this.generateNavigationForUser(user.id, activeWorkspace, roles, permissions);

    // Group items for sidebar consumption
    const groupsMap = new Map<string, NavigationItemModel[]>();
    for (const item of navigationItems) {
      const g = item.group || 'OPERATIONS';
      if (!groupsMap.has(g)) {
        groupsMap.set(g, []);
      }
      groupsMap.get(g)!.push(item);
    }

    const groups = Array.from(groupsMap.entries()).map(([key, items]) => ({
      key,
      label: key,
      items: items.sort((a, b) => a.displayOrder - b.displayOrder),
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
      },
      organization,
      department,
      roles,
      primaryRole,
      availablePortals,
      availableWorkspaces,
      activePortal,
      activeWorkspace,
      permissions,
      navigation: {
        items: navigationItems,
        groups,
      },
      featureFlags: DEFAULT_FEATURE_FLAGS,
    };
  }

  /**
   * 2. Validate and Switch Active Workspace
   */
  public async switchActiveWorkspace(userId: string, targetWorkspaceKey: WorkspaceKey): Promise<UserAccessContext> {
    const targetWorkspace = MASTER_WORKSPACES[targetWorkspaceKey];
    if (!targetWorkspace) {
      throw new NotFoundError(`Workspace ${targetWorkspaceKey} does not exist`);
    }

    const context = await this.getUserAccessContext(userId);
    const isAuthorized = context.availableWorkspaces.some((w) => w.key === targetWorkspaceKey);

    if (!isAuthorized) {
      throw new ForbiddenError(`Access Restricted: You do not have permission to access workspace ${targetWorkspace.name}`);
    }

    this.userActiveWorkspaces.set(userId, targetWorkspaceKey);
    return this.getUserAccessContext(userId);
  }

  /**
   * 3. Helper: Generate Filtered Navigation Items
   */
  private generateNavigationForUser(
    _userId: string,
    activeWorkspace: WorkspaceDefinition,
    roles: string[],
    permissions: string[]
  ): NavigationItemModel[] {
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const permSet = new Set(permissions);

    // Filter master navigation by current workspace and user permissions
    return MASTER_NAVIGATION.filter((item) => {
      if (!item.enabled) return false;

      // Match workspace or portal scope
      const matchesWorkspace = item.workspace === activeWorkspace.key || item.portal === activeWorkspace.portal;
      if (!matchesWorkspace && !isSuperAdmin) return false;

      // Super admin sees all items
      if (isSuperAdmin) return true;

      // If specific permission required, enforce it
      if (item.permission && !permSet.has(item.permission) && !permSet.has('*')) {
        return false;
      }

      // If any of listed permissions required
      if (item.requiredAnyPermissions && item.requiredAnyPermissions.length > 0) {
        const hasAny = item.requiredAnyPermissions.some((p) => permSet.has(p) || permSet.has('*'));
        if (!hasAny) return false;
      }

      return true;
    });
  }
}

export const workspaceService = WorkspaceService.getInstance();
