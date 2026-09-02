import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';

export async function listBranches() {
  return prisma.branch.findMany({
    include: {
      _count: { select: { users: true, customers: true, loans: true } },
    },
    orderBy: { code: 'asc' },
  });
}

export async function createBranch(data: { code: string; name: string; city?: string; state?: string }) {
  return prisma.branch.create({ data });
}

export async function updateBranch(id: string, data: { name?: string; city?: string; state?: string; isActive?: boolean }) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) throw new NotFoundError('Branch not found');
  return prisma.branch.update({ where: { id }, data });
}
