import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type {
  CollectionEscalationRecord,
  CollectionFollowUpRecord,
  EscalationTier,
  FollowUpStatus,
} from './collection.types';

export interface CreateFollowUpInput {
  caseId: string;
  assignedToUserId?: string;
  dueDate: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionTitle: string;
  notes?: string;
}

export interface EscalateCaseInput {
  caseId: string;
  triggerReason: string;
  toTier: EscalationTier;
  escalatedToUserId?: string;
  notes?: string;
}

export class CollectionEscalationService {
  private followUps: Map<string, CollectionFollowUpRecord> = new Map();
  private escalations: Map<string, CollectionEscalationRecord> = new Map();

  /**
   * Create a collection follow-up task
   */
  public async createFollowUp(
    input: CreateFollowUpInput,
    actor: { id?: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<CollectionFollowUpRecord> {
    const colCase = await prisma.collectionCase.findUnique({
      where: { id: input.caseId },
      include: { loan: true },
    });

    if (!colCase) {
      throw new NotFoundError(`Collection case ${input.caseId} not found.`);
    }

    const dueDate = new Date(input.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestError('Invalid follow-up due date format.');
    }

    const followUp: CollectionFollowUpRecord = {
      id: `flw-${uuid().slice(0, 8)}`,
      caseId: input.caseId,
      loanId: colCase.loanId,
      assignedToUserId: input.assignedToUserId || colCase.assignedOfficerId || actor.id || 'unassigned',
      dueDate: dueDate.toISOString(),
      priority: input.priority || (colCase.priority as any) || 'MEDIUM',
      actionTitle: input.actionTitle,
      notes: input.notes,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.followUps.set(followUp.id, followUp);

    // Also record an activity note
    await prisma.collectionActivity.create({
      data: {
        caseId: input.caseId,
        activityType: 'CALL',
        outcome: 'CONTACTED',
        notes: `Scheduled Follow-up Task: "${input.actionTitle}" due ${dueDate.toLocaleDateString()}.${input.notes ? ' ' + input.notes : ''}`,
        nextFollowUpDate: dueDate,
        performedBy: actor.email || 'system',
      },
    });

    return followUp;
  }

  /**
   * Complete a follow-up task
   */
  public completeFollowUp(
    id: string,
    completedNotes: string,
    actor: { email?: string }
  ): CollectionFollowUpRecord {
    const followUp = this.followUps.get(id);
    if (!followUp) throw new NotFoundError(`Follow-up task ${id} not found.`);

    const updated: CollectionFollowUpRecord = {
      ...followUp,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
      completedNotes: `${completedNotes} (Completed by ${actor.email || 'officer'})`,
    };

    this.followUps.set(id, updated);
    return updated;
  }

  /**
   * Escalate a delinquent case to a higher supervisory or recovery tier
   */
  public async escalateCase(
    input: EscalateCaseInput,
    actor: { id?: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<CollectionEscalationRecord> {
    const colCase = await prisma.collectionCase.findUnique({
      where: { id: input.caseId },
      include: { loan: true },
    });

    if (!colCase) {
      throw new NotFoundError(`Collection case ${input.caseId} not found.`);
    }

    let fromTier: EscalationTier = 'TIER_1_COLLECTOR';
    if (colCase.status === 'ESCALATED') fromTier = 'TIER_2_SUPERVISOR';
    else if (colCase.status === 'LEGAL_REVIEW') fromTier = 'TIER_3_COLLECTION_MANAGER';

    const escalation: CollectionEscalationRecord = {
      id: `esc-${uuid().slice(0, 8)}`,
      caseId: input.caseId,
      loanId: colCase.loanId,
      triggerReason: input.triggerReason,
      fromTier,
      toTier: input.toTier,
      escalatedByUserId: actor.id || 'system',
      escalatedToUserId: input.escalatedToUserId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.escalations.set(escalation.id, escalation);

    let nextStatus = 'ESCALATED';
    if (input.toTier === 'TIER_4_LEGAL_RECOVERY') {
      nextStatus = 'LEGAL_REVIEW';
    }

    // Update case model status and priority
    await prisma.collectionCase.update({
      where: { id: input.caseId },
      data: {
        status: nextStatus,
        priority: 'CRITICAL',
        assignedOfficerId: input.escalatedToUserId || colCase.assignedOfficerId,
      },
    });

    await prisma.collectionActivity.create({
      data: {
        caseId: input.caseId,
        activityType: 'NOTICE',
        outcome: 'ESCALATED',
        notes: `Case escalated to ${input.toTier}: ${input.triggerReason}.${input.notes ? ' Notes: ' + input.notes : ''}`,
        performedBy: actor.email || 'system',
      },
    });

    await logAudit({
      userId: actor.id,
      action: 'COLLECTION_CASE_ESCALATED',
      entity: 'CollectionCase',
      entityId: input.caseId,
      newValue: {
        fromTier,
        toTier: input.toTier,
        reason: input.triggerReason,
        tenantId: colCase.loan.tenantId,
        branchId: colCase.loan.branchId,
      },
    });

    return escalation;
  }

  /**
   * Resolve an escalation
   */
  public resolveEscalation(
    escalationId: string,
    resolutionOutcome: string,
    resolutionNotes: string,
    actor: { email?: string }
  ): CollectionEscalationRecord {
    const esc = this.escalations.get(escalationId);
    if (!esc) throw new NotFoundError(`Escalation ${escalationId} not found.`);

    const resolved: CollectionEscalationRecord = {
      ...esc,
      status: 'RESOLVED',
      resolutionNotes: `${resolutionOutcome}: ${resolutionNotes} (Resolved by ${actor.email || 'supervisor'})`,
      resolvedAt: new Date().toISOString(),
    };
    this.escalations.set(escalationId, resolved);
    return resolved;
  }

  /**
   * List follow-ups for a case
   */
  public listFollowUps(caseId: string): CollectionFollowUpRecord[] {
    return Array.from(this.followUps.values())
      .filter((f) => f.caseId === caseId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * List escalations for a case
   */
  public listEscalations(caseId: string): CollectionEscalationRecord[] {
    return Array.from(this.escalations.values())
      .filter((e) => e.caseId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const collectionEscalationService = new CollectionEscalationService();
