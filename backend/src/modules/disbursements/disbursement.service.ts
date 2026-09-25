import { prisma } from '../../config/prisma';
import { ForbiddenError } from '../../common/errors';
import { financeService } from '../finance/finance.service';
import type { ExecuteDisbursementInput } from './disbursement.schema';

export async function getReadyForDisbursementQueue(actor?: {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}) {
  const where: any = {
    status: 'READY_FOR_DISBURSEMENT',
    stage: 'FINANCE_VERIFIED',
  };

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.tenantId = actor.tenantId;
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.customer = { ...where.customer, branchId: actor.branchId };
    }
  }

  return prisma.loanApplication.findMany({
    where,
    include: {
      customer: {
        include: {
          bankAccounts: true,
        },
      },
      product: true,
      branch: true,
      underwriting: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getDisbursementHistory(actor?: {
  id?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
}) {
  const where: any = {};

  if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
    if (actor.tenantId) {
      where.loan = { tenantId: actor.tenantId };
    }
    if ((actor.roles?.includes('BRANCH_MANAGER') || actor.roles?.includes('LOAN_OFFICER')) && actor.branchId) {
      where.loan = { ...where.loan, branchId: actor.branchId };
    }
  }

  return prisma.disbursement.findMany({
    where,
    include: {
      loan: {
        include: {
          customer: {
            include: {
              bankAccounts: true,
            },
          },
          product: true,
          application: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function executeDisbursement(
  input: ExecuteDisbursementInput,
  actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string }
) {
  if (
    actor.roles.includes('BRANCH_MANAGER') &&
    !actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r))
  ) {
    throw new ForbiddenError('Branch Manager role is strictly prohibited from releasing funds or executing loan disbursements.');
  }

  const isAuthorized = actor.roles?.some((r) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r)
  );
  if (!isAuthorized) {
    throw new ForbiddenError('Access forbidden: You do not have permission to disburse loans.');
  }

  // Segregation of Duties: Super Admin cannot execute operational disbursements alone
  if (actor.roles?.includes('SUPER_ADMIN') && !actor.roles.some((r) => ['FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) {
    throw new ForbiddenError(
      'Access forbidden: Super Admin is a platform control-plane role and cannot execute operational disbursements.'
    );
  }

  return financeService.executeDisbursementWithControls(
    input.applicationId,
    {
      disbursementMethod: input.disbursementMethod,
      referenceNumber: input.referenceNumber,
    },
    {
      id: actor.id,
      email: actor.email,
      roles: actor.roles,
      tenantId: actor.tenantId,
      branchId: actor.branchId,
    }
  );
}
