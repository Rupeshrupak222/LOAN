import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { logActivitySchema, recordPtpSchema } from './collection.schema';
import { prisma } from '../../config/prisma';
import {
  getCollectionDashboard,
  listCollectionCases,
  getCollectionCaseDetail,
  logCollectionActivity,
  recordPromiseToPay,
  getBorrowerSafeCollection,
  getPartnerSafeCollection,
} from './collection.service';
import { collectionAssignmentService } from './collection-assignment.service';
import { collectionEscalationService } from './collection-escalation.service';
import { collectionSettlementService } from './collection-settlement.service';
import { collectionWriteOffService } from './collection-writeoff.service';
import { collectionStrategyService } from './collection-strategy.service';
import { collectionAnalyticsService } from './collection-analytics.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

async function getActor(req: any) {
  let branchId = (req.user as any)?.branchId;
  if (!branchId && req.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { branchId: true, branch: { select: { code: true } } },
    });
    branchId = dbUser?.branch?.code === 'HO' ? undefined : (dbUser?.branchId || undefined);
  } else if (branchId) {
    const dbBranch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    if (dbBranch?.code === 'HO') {
      branchId = undefined;
    }
  }

  return {
    id: req.user?.id,
    email: req.user?.email,
    roles: req.user?.roles,
    tenantId: req.tenantId || req.user?.tenantId,
    branchId,
  };
}

// 1. Dashboard
router.get(
  '/dashboard',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const options = {
      dateFilter: req.query.dateFilter as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const data = await getCollectionDashboard(actor, options);
    res.json(success(data));
  })
);

// 2. Cases Queue
router.get(
  '/cases',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const params = parsePagination(req.query);
    const bucket = req.query.bucket ? String(req.query.bucket) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const queueType = req.query.queueType as 'MY_QUEUE' | 'TEAM_QUEUE' | 'UNASSIGNED' | undefined;
    const result = await listCollectionCases(params, bucket, status, actor, queueType);
    res.json(success(result.data, result.pagination));
  })
);

// 3. Case Detail
router.get(
  '/cases/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const colCase = await getCollectionCaseDetail(req.params.id, actor);
    res.json(success(colCase));
  })
);

// 4. Contact Activity
router.post(
  '/activities',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(logActivitySchema),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const activity = await logCollectionActivity(req.body, actor);
    res.status(201).json(success(activity));
  })
);

// 5. PTP Recording
router.post(
  '/ptp',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(recordPtpSchema),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const ptp = await recordPromiseToPay(req.body, actor);
    res.status(201).json(success(ptp));
  })
);

// 6. Collector Assignment
router.post(
  '/cases/:id/assign',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'COLLECTION_OFFICER'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const asgn = await collectionAssignmentService.assignCase(
      {
        caseId: req.params.id,
        assignedToUserId: req.body.assignedToUserId,
        strategy: req.body.strategy || 'MANUAL',
        notes: req.body.notes,
      },
      actor
    );
    res.status(201).json(success(asgn));
  })
);

// 7. Auto Assignment Batch
router.post(
  '/auto-assign',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const result = await collectionAssignmentService.autoAssignCases(req.body, actor);
    res.status(200).json(success(result));
  })
);

// 8. Follow-Ups
router.post(
  '/follow-ups',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const followUp = await collectionEscalationService.createFollowUp(req.body, actor);
    res.status(201).json(success(followUp));
  })
);

router.post(
  '/follow-ups/:id/complete',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const completed = collectionEscalationService.completeFollowUp(
      req.params.id,
      req.body.completedNotes || 'Completed',
      actor
    );
    res.json(success(completed));
  })
);

// 9. Case Escalations
router.post(
  '/cases/:id/escalate',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const escalation = await collectionEscalationService.escalateCase(
      {
        caseId: req.params.id,
        triggerReason: req.body.triggerReason,
        toTier: req.body.toTier,
        escalatedToUserId: req.body.escalatedToUserId,
        notes: req.body.notes,
      },
      actor
    );
    res.status(201).json(success(escalation));
  })
);

// 10. Settlements
router.post(
  '/settlements',
  authorize('COLLECTION_OFFICER', 'COLLECTION_AGENT', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const settlement = await collectionSettlementService.proposeSettlement(req.body, actor as any);
    res.status(201).json(success(settlement));
  })
);

router.post(
  '/settlements/:id/authorize',
  authorize('BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_CONTROLLER'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const result = await collectionSettlementService.authorizeSettlement(
      req.params.id,
      req.body.action,
      req.body.rejectionReason,
      actor as any
    );
    res.json(success(result));
  })
);

// 11. Write-offs
router.post(
  '/write-offs',
  authorize('COLLECTION_OFFICER', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const writeOff = await collectionWriteOffService.proposeWriteOff(req.body, actor as any);
    res.status(201).json(success(writeOff));
  })
);

router.post(
  '/write-offs/:id/authorize',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const result = await collectionWriteOffService.authorizeWriteOff(
      req.params.id,
      req.body.action,
      req.body.rejectionReason,
      actor as any
    );
    res.json(success(result));
  })
);

// 12. Strategies
router.get(
  '/strategies',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const strategies = collectionStrategyService.listStrategies(actor.tenantId);
    res.json(success(strategies));
  })
);

router.post(
  '/strategies',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const created = collectionStrategyService.createStrategy({
      tenantId: actor.tenantId || 'tenant-adyapan-default',
      name: req.body.name,
      description: req.body.description,
      productScope: req.body.productScope,
      buckets: req.body.buckets,
      rules: req.body.rules,
      priorityWeights: req.body.priorityWeights,
      escalationThresholds: req.body.escalationThresholds,
      createdBy: actor.email || 'admin',
    });
    res.status(201).json(success(created));
  })
);

router.post(
  '/strategies/:id/activate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const activated = collectionStrategyService.activateStrategy(req.params.id);
    res.json(success(activated));
  })
);

// 13. Analytics & Performance
router.get(
  '/analytics',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'COLLECTION_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const data = await collectionAnalyticsService.getPortfolioAnalytics({
      tenantId: actor.tenantId,
      branchId: actor.branchId,
    });
    res.json(success(data));
  })
);

router.get(
  '/performance',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const scorecards = await collectionAnalyticsService.getCollectorPerformance({
      tenantId: actor.tenantId,
      branchId: actor.branchId,
    });
    res.json(success(scorecards));
  })
);

// 14. Safe Views
router.get(
  '/borrower-safe/:loanId',
  asyncHandler(async (req, res) => {
    const safeView = await getBorrowerSafeCollection(req.params.loanId);
    res.json(success(safeView));
  })
);

router.get(
  '/partner-safe/:loanId',
  asyncHandler(async (req, res) => {
    const safeView = await getPartnerSafeCollection(req.params.loanId);
    res.json(success(safeView));
  })
);

export default router;
