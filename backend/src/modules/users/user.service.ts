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
