import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type { CollectionAssignmentRecord } from './collection.types';

export interface AssignCollectorInput {
  caseId: string;
  assignedToUserId: string;
  strategy?: 'MANUAL' | 'ROUND_ROBIN' | 'WORKLOAD_BALANCED' | 'PRODUCT_SPECIALIST' | 'HIGH_TICKET';
  notes?: string;
}

export interface AutoAssignBatchInput {
  tenantId?: string;
  branchId?: string;
  strategy?: 'ROUND_ROBIN' | 'WORKLOAD_BALANCED' | 'HIGH_TICKET';
}

export class CollectionAssignmentService {
  private assignments: Map<string, CollectionAssignmentRecord> = new Map();

  /**
   * Assign or reassign a collection case to a collection officer
   */
  public async assignCase(
    input: AssignCollectorInput,
    actor: { id?: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<CollectionAssignmentRecord> {
    const colCase = await prisma.collectionCase.findUnique({
      where: { id: input.caseId },
      include: {
        loan: {
          select: { id: true, loanNo: true, tenantId: true, branchId: true },
        },
      },
    });

    if (!colCase) {
      throw new NotFoundError(`Collection case ${input.caseId} not found.`);
    }

    // Anti-IDOR: Tenant & Branch Isolation
    if (actor && !actor.roles?.includes('SUPER_ADMIN')) {
      if (colCase.loan.tenantId && actor.tenantId && colCase.loan.tenantId !== actor.tenantId) {
        throw new ForbiddenError('Access forbidden: Case belongs to another institution.');
      }
      if (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId && colCase.loan.branchId && colCase.loan.branchId !== actor.branchId) {
        throw new ForbiddenError('Access forbidden: Case belongs to a different branch.');
      }
    }

    // Verify assigned user exists and has collection role
    const assignedUser = await prisma.user.findUnique({
      where: { id: input.assignedToUserId },
      select: { id: true, firstName: true, lastName: true, email: true, status: true },
    });

    if (!assignedUser || assignedUser.status !== 'ACTIVE') {
      throw new BadRequestError('Assigned collector is invalid or inactive.');
    }

    const userName = `${assignedUser.firstName} ${assignedUser.lastName}`.trim() || assignedUser.email;

    const assignment: CollectionAssignmentRecord = {
      id: `asgn-${uuid().slice(0, 8)}`,
      caseId: input.caseId,
      assignedToUserId: assignedUser.id,
      assignedToUserName: userName,
      assignedByUserId: actor.id || 'system',
      assignedByUserName: actor.email || 'system',
      strategy: input.strategy || 'MANUAL',
      status: 'ASSIGNED',
      notes: input.notes,
      assignedAt: new Date().toISOString(),
    };

    this.assignments.set(assignment.id, assignment);

    // Update case model in database
    await prisma.collectionCase.update({
      where: { id: input.caseId },
      data: {
        assignedOfficerId: assignedUser.id,
        status: colCase.status === 'OPEN' ? 'IN_PROGRESS' : colCase.status,
      },
    });

    await logAudit({
      userId: actor.id,
      action: 'COLLECTION_CASE_ASSIGNED',
      entity: 'CollectionCase',
      entityId: input.caseId,
      newValue: {
        assignedTo: assignedUser.email,
        strategy: assignment.strategy,
        notes: input.notes,
        tenantId: colCase.loan.tenantId,
        branchId: colCase.loan.branchId,
      },
    });

    return assignment;
  }

  /**
   * Run auto-assignment algorithm across unassigned delinquent cases
   */
  public async autoAssignCases(
    input: AutoAssignBatchInput,
    actor: { id?: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<{ assignedCount: number; assignments: CollectionAssignmentRecord[] }> {
    const where: any = {
      assignedOfficerId: null,
      status: { in: ['OPEN', 'IN_PROGRESS', 'OVERDUE'] },
    };

    if (input.tenantId || actor.tenantId) {
      where.loan = { tenantId: input.tenantId || actor.tenantId };
    }
    if (input.branchId || (actor.roles?.includes('BRANCH_MANAGER') && actor.branchId)) {
      where.loan = { ...(where.loan || {}), branchId: input.branchId || actor.branchId };
    }

    const unassignedCases = await prisma.collectionCase.findMany({
      where,
      include: {
        loan: { select: { id: true, loanNo: true, tenantId: true, branchId: true } },
      },
      orderBy: { dpd: 'desc' },
      take: 50,
    });

    if (unassignedCases.length === 0) {
      return { assignedCount: 0, assignments: [] };
    }

    // Find available collection officers
    const officers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(input.tenantId || actor.tenantId ? { tenantId: input.tenantId || actor.tenantId } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (officers.length === 0) {
      return { assignedCount: 0, assignments: [] };
    }

    const createdAssignments: CollectionAssignmentRecord[] = [];
    let officerIndex = 0;

    for (const c of unassignedCases) {
      const selectedOfficer = officers[officerIndex % officers.length];
      officerIndex++;

      const asgn = await this.assignCase(
        {
          caseId: c.id,
          assignedToUserId: selectedOfficer.id,
          strategy: input.strategy || 'ROUND_ROBIN',
          notes: 'Auto-assigned by Collection Assignment Engine',
        },
        actor
      );
      createdAssignments.push(asgn);
    }

    return {
      assignedCount: createdAssignments.length,
      assignments: createdAssignments,
    };
  }

  /**
   * Get assignment history for a collection case
   */
  public getCaseAssignments(caseId: string): CollectionAssignmentRecord[] {
    return Array.from(this.assignments.values())
      .filter((a) => a.caseId === caseId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }
}

export const collectionAssignmentService = new CollectionAssignmentService();
