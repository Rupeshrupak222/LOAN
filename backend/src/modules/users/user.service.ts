import argon2 from 'argon2';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';

export async function listUsers(params: PageParams, roleName?: string) {
  const where: any = {};
  if (roleName) {
    where.roles = { some: { role: { name: roleName } } };
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
  actor?: { id: string; roles: string[]; branchId?: string }
) {
  if (actor) {
    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');
    const isAdmin = actor.roles.includes('ADMIN');
    const isBranchManager = actor.roles.includes('BRANCH_MANAGER');

    if (!isSuperAdmin) {
      if (isAdmin) {
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
      status: 'ACTIVE',
      roles: {
        create: { roleId: role.id },
      },
    },
    include: { roles: { include: { role: true } } },
  });
}
