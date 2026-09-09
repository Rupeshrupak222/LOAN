import argon2 from 'argon2';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';

export interface UserActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export async function listUsers(params: PageParams, roleName?: string, actor?: UserActorContext) {
  const where: any = {};
  if (roleName) {
    where.roles = { some: { role: { name: roleName } } };
  }

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId) {
      where.branchId = actor.branchId;
    }
  }

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { employeeId: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
      include: {
        branch: { select: { name: true, code: true } },
        roles: { include: { role: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: rows.map((u) => ({
      id: u.id,
      email: u.email,
      employeeId: u.employeeId,
      name: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      branch: u.branch?.name,
      branchId: u.branchId,
      roles: u.roles.map((r) => r.role.name),
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    })),
    pagination: buildPagination(params.page, params.pageSize, total),
  };
}

export async function createUser(
  data: {
    email: string;
    firstName: string;
    lastName: string;
    roleName: string;
    branchId?: string;
    employeeId?: string;
  },
  actor?: UserActorContext
) {
  if (actor) {
    const isSuperAdmin = actor.roles?.includes('SUPER_ADMIN');
    const isCompanyAdmin = actor.roles?.includes('COMPANY_ADMIN') || actor.roles?.includes('ADMIN');
    const isBranchManager = actor.roles?.includes('BRANCH_MANAGER');

    if (!isSuperAdmin && !isCompanyAdmin && !isBranchManager) {
      throw new ForbiddenError('Access forbidden: You do not have permission to provision staff accounts');
    }

    if (!isSuperAdmin) {
      if (isCompanyAdmin) {
        if (data.roleName === 'SUPER_ADMIN') {
          throw new ForbiddenError('Access forbidden: Only Super Administrators can provision SUPER_ADMIN accounts');
        }
      } else if (isBranchManager) {
        const allowedRoles = ['LOAN_OFFICER', 'COLLECTION_OFFICER', 'COLLECTION_AGENT'];
        if (!allowedRoles.includes(data.roleName)) {
          throw new ForbiddenError(
            `Access forbidden: Branch Managers can only provision [${allowedRoles.join(', ')}] roles`
          );
        }
        if (actor.branchId && data.branchId && actor.branchId !== data.branchId) {
          throw new ForbiddenError('Access forbidden: Branch Managers can only provision staff within their own branch');
        }
        if (actor.branchId && !data.branchId) {
          data.branchId = actor.branchId;
        }
      }
    }

    if (data.branchId && actor.tenantId && !isSuperAdmin) {
      const targetBranch = await prisma.branch.findUnique({ where: { id: data.branchId } });
      if (targetBranch && targetBranch.tenantId && targetBranch.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access forbidden: Target branch belongs to another institution');
      }
    }
  }

  const role = await prisma.role.findUnique({ where: { name: data.roleName } });
  if (!role) throw new NotFoundError('Role not found');
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'TemporarySetup@2026';
  const passwordHash = await argon2.hash(defaultPassword, { type: argon2.argon2id });

  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId: data.employeeId,
      passwordHash,
      branchId: data.branchId,
      tenantId: actor?.tenantId,
      status: 'ACTIVE',
      roles: {
        create: { roleId: role.id },
      },
    },
    include: { roles: { include: { role: true } } },
  });
}

export async function updateUserStatus(
  userId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED' | 'BLOCKED',
  reason?: string,
  actor?: UserActorContext
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new NotFoundError('User not found');

  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');
  const isBranchManager = actor?.roles?.includes('BRANCH_MANAGER');

  if (actor && !isSuperAdmin && !isCompanyAdmin && !isBranchManager) {
    throw new ForbiddenError('Access forbidden: You do not have permission to modify user accounts');
  }

  // Tenant scope check
  if (!isSuperAdmin && actor?.tenantId && user.tenantId && user.tenantId !== actor.tenantId) {
    throw new ForbiddenError('Access forbidden: You cannot modify users belonging to another institution');
  }

  // Branch Manager branch and role boundary check
  if (isBranchManager && !isSuperAdmin) {
    if (actor?.branchId && user.branchId && user.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Branch Managers can only alter status of staff within their own branch');
    }
    const allowedStaffRoles = ['LOAN_OFFICER', 'COLLECTION_OFFICER', 'COLLECTION_AGENT'];
    const hasDisallowedRole = user.roles.some((r) => !allowedStaffRoles.includes(r.role.name));
    if (hasDisallowedRole) {
      throw new ForbiddenError('Access forbidden: Branch Managers cannot alter status of management or peer staff');
    }
  }

  // Prevent modifying Super Admin users if actor is not Super Admin
  const isTargetSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
  if (isTargetSuperAdmin && !isSuperAdmin) {
    throw new ForbiddenError('Access forbidden: Only Super Administrators can alter Super Admin user status');
  }

  // Guard against deactivating the last active Admin in the tenant
  if (status !== 'ACTIVE') {
    const isTargetAdmin = user.roles.some((r) => ['ADMIN', 'COMPANY_ADMIN'].includes(r.role.name));
    if (isTargetAdmin && user.tenantId) {
      const activeAdminsCount = await prisma.user.count({
        where: {
          tenantId: user.tenantId,
          status: 'ACTIVE',
          roles: { some: { role: { name: { in: ['ADMIN', 'COMPANY_ADMIN'] } } } },
          id: { not: user.id },
        },
      });
      if (activeAdminsCount === 0) {
        throw new BadRequestError('Cannot deactivate or block the only active administrator of this institution.');
      }
    }
  }

  const prismaStatus = (status === 'BLOCKED' || status === 'SUSPENDED') ? 'LOCKED' : status;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: prismaStatus as any },
    include: { roles: { include: { role: true } } },
  });

  return updated;
}

export async function updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    branchId?: string;
    roleName?: string;
  },
  actor?: UserActorContext
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new NotFoundError('User not found');

  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');
  const isBranchManager = actor?.roles?.includes('BRANCH_MANAGER');

  if (actor && !isSuperAdmin && !isCompanyAdmin && !isBranchManager) {
    throw new ForbiddenError('Access forbidden: You do not have permission to modify user accounts');
  }

  // Tenant scope check
  if (!isSuperAdmin && actor?.tenantId && user.tenantId && user.tenantId !== actor.tenantId) {
    throw new ForbiddenError('Access forbidden: You cannot modify users belonging to another institution');
  }

  // Branch Manager branch and role boundary check
  if (isBranchManager && !isSuperAdmin) {
    if (actor?.branchId && user.branchId && user.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Branch Managers can only modify staff within their own branch');
    }
    const allowedStaffRoles = ['LOAN_OFFICER', 'COLLECTION_OFFICER', 'COLLECTION_AGENT'];
    const hasDisallowedRole = user.roles.some((r) => !allowedStaffRoles.includes(r.role.name));
    if (hasDisallowedRole) {
      throw new ForbiddenError('Access forbidden: Branch Managers cannot modify management or peer staff');
    }
    if (data.roleName && !allowedStaffRoles.includes(data.roleName)) {
      throw new ForbiddenError(
        `Privilege escalation denied: Branch Managers can only assign [${allowedStaffRoles.join(', ')}] roles`
      );
    }
    if (data.branchId && actor?.branchId && data.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Branch Managers cannot reassign staff to another branch');
    }
  }

  // Cannot modify Super Admin users if not Super Admin
  const isTargetSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
  if (isTargetSuperAdmin && !isSuperAdmin) {
    throw new ForbiddenError('Access forbidden: Only Super Administrators can modify Super Admin accounts');
  }

  // If role change is requested
  if (data.roleName) {
    if (data.roleName === 'SUPER_ADMIN' && !isSuperAdmin) {
      throw new ForbiddenError('Privilege escalation denied: Only Super Administrators can assign the SUPER_ADMIN role');
    }

    const role = await prisma.role.findUnique({ where: { name: data.roleName } });
    if (!role) throw new NotFoundError(`Role '${data.roleName}' not found`);

    // Replace user roles
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  if (data.branchId && actor?.tenantId && !isSuperAdmin) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (branch && branch.tenantId && branch.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Branch belongs to another institution');
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId: data.employeeId,
      branchId: data.branchId,
    },
    include: { roles: { include: { role: true } }, branch: true },
  });

  return updated;
}

export async function resetUserPassword(
  userId: string,
  newPassword?: string,
  actor?: UserActorContext
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new NotFoundError('User not found');

  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');
  const isBranchManager = actor?.roles?.includes('BRANCH_MANAGER');

  if (actor && !isSuperAdmin && !isCompanyAdmin && !isBranchManager) {
    throw new ForbiddenError('Access forbidden: You do not have permission to reset user passwords');
  }

  // Tenant scope check
  if (!isSuperAdmin && actor?.tenantId && user.tenantId && user.tenantId !== actor.tenantId) {
    throw new ForbiddenError('Access forbidden: You cannot reset password for users belonging to another institution');
  }

  // Branch Manager branch and role boundary check
  if (isBranchManager && !isSuperAdmin) {
    if (actor?.branchId && user.branchId && user.branchId !== actor.branchId) {
      throw new ForbiddenError('Access forbidden: Branch Managers can only reset password for staff within their own branch');
    }
    const allowedStaffRoles = ['LOAN_OFFICER', 'COLLECTION_OFFICER', 'COLLECTION_AGENT'];
    const hasDisallowedRole = user.roles.some((r) => !allowedStaffRoles.includes(r.role.name));
    if (hasDisallowedRole) {
      throw new ForbiddenError('Access forbidden: Branch Managers cannot reset password for management or peer staff');
    }
  }

  // Cannot reset Super Admin's password if not Super Admin
  const isTargetSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
  if (isTargetSuperAdmin && !isSuperAdmin) {
    throw new ForbiddenError('Access forbidden: Only Super Administrators can reset Super Admin passwords');
  }

  const passwordToSet = newPassword || process.env.DEFAULT_USER_PASSWORD || 'TemporarySetup@2026';
  const passwordHash = await argon2.hash(passwordToSet, { type: argon2.argon2id });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password has been successfully reset.' };
}
