import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';

export interface BranchActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}

export async function listBranches(actor?: BranchActorContext) {
  const where: any = {};
  if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId) {
    where.tenantId = actor.tenantId;
  }

  return prisma.branch.findMany({
    where,
    include: {
      _count: { select: { users: true, customers: true, loans: true } },
    },
    orderBy: { code: 'asc' },
  });
}

export async function createBranch(
  data: { code: string; name: string; city?: string; state?: string },
  actor?: BranchActorContext
) {
  const branchData: any = { ...data };
  if (actor?.tenantId) {
    branchData.tenantId = actor.tenantId;
  }
  return prisma.branch.create({ data: branchData });
}

export async function updateBranch(
  id: string,
  data: { name?: string; city?: string; state?: string; isActive?: boolean },
  actor?: BranchActorContext
) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new NotFoundError('Branch not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId) {
    if (branch.tenantId && branch.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Branch belongs to another institution');
    }
  }

  return prisma.branch.update({ where: { id }, data });
}
