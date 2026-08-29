import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { PageParams, buildPagination } from '../../common/pagination';
import { Money } from '../finance/money';
import type { CreateProductInput } from './product.schema';

function toDbData(input: Partial<CreateProductInput>) {
  const data: Record<string, unknown> = { ...input };
  if (input.minAmount != null) data.minAmount = Money.toDb(input.minAmount);
  if (input.maxAmount != null) data.maxAmount = Money.toDb(input.maxAmount);
  if (input.interestRate != null) data.interestRate = input.interestRate.toFixed(3);
  if (input.processingFeePct != null) data.processingFeePct = input.processingFeePct.toFixed(3);
  if (input.lateFeePct != null) data.lateFeePct = input.lateFeePct.toFixed(3);
  return data;
}

export async function listProducts(params: PageParams, activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
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

export async function getProduct(id: string) {
  const product = await prisma.loanProduct.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Loan product not found');
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.loanProduct.create({ data: toDbData(input) as never });
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  await getProduct(id);
  return prisma.loanProduct.update({ where: { id }, data: toDbData(input) as never });
}
