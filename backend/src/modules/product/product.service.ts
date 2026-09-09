import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import type { CreateProductInput } from './product.schema';

export interface ProductActorContext {
  id?: string;
  roles?: string[];
  tenantId?: string;
}

function toDbData(input: Partial<CreateProductInput>) {
  const data: Record<string, unknown> = { ...input };
  if (input.minAmount != null) data.minAmount = Money.toDb(input.minAmount);
  if (input.maxAmount != null) data.maxAmount = Money.toDb(input.maxAmount);
  if (input.interestRate != null) data.interestRate = input.interestRate.toFixed(3);
  if (input.processingFeePct != null) data.processingFeePct = input.processingFeePct.toFixed(3);
  if (input.lateFeePct != null) data.lateFeePct = input.lateFeePct.toFixed(3);
  return data;
}

export async function listProducts(params: PageParams, activeOnly = false, actor?: ProductActorContext) {
  const where: any = activeOnly ? { isActive: true } : {};
  if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId) {
    where.OR = [
      { tenantId: actor.tenantId },
      { tenantId: null },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.loanProduct.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: params.sortDir },
    }),
    prisma.loanProduct.count({ where }),
  ]);
  return { data, pagination: buildPagination(params.page, params.pageSize, total) };
}

export async function getProduct(id: string, actor?: ProductActorContext) {
  const product = await prisma.loanProduct.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Loan product not found');

  if (actor && !actor.roles?.includes('SUPER_ADMIN') && actor.tenantId) {
    if (product.tenantId && product.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Product belongs to another institution');
    }
  }

  return product;
}

export async function createProduct(input: CreateProductInput, actor?: ProductActorContext) {
  const data = toDbData(input) as any;
  if (actor?.tenantId) {
    data.tenantId = actor.tenantId;
  }
  return prisma.loanProduct.create({ data });
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>, actor?: ProductActorContext) {
  await getProduct(id, actor);
  return prisma.loanProduct.update({ where: { id }, data: toDbData(input) as never });
}

export async function deleteProduct(id: string, actor?: ProductActorContext) {
  await getProduct(id, actor);
  const count = await prisma.loanApplication.count({ where: { productId: id } });
  if (count > 0) {
    return prisma.loanProduct.update({ where: { id }, data: { isActive: false } });
  }
  return prisma.loanProduct.delete({ where: { id } });
}
