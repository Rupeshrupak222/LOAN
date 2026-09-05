import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { decisionSimulatorService } from './decision-simulator.service';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/decision-simulator/simulate
 * Executes a non-destructive What-If simulation against an application.
 */
router.post(
  '/simulate',
  asyncHandler(async (req, res) => {
    const {
      applicationId,
      hypotheticalInputs,
      hypotheticalAmount,
      hypotheticalTenureMonths,
      hypotheticalInterestRate,
      hypotheticalMonthlyIncome,
      hypotheticalMonthlyObligations,
    } = req.body || {};

    const inputs = hypotheticalInputs || {
      requestedAmount: hypotheticalAmount,
      tenureMonths: hypotheticalTenureMonths,
      interestRatePct: hypotheticalInterestRate,
      monthlyIncome: hypotheticalMonthlyIncome,
      existingObligations: hypotheticalMonthlyObligations,
    };

    const result = await decisionSimulatorService.runSimulation(
      {
        applicationId,
        hypotheticalInputs: inputs,
      },
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );

    res.json(success(result));
  })
);

/**
 * POST /api/v1/decision-simulator/save
 * Persists a simulation snapshot for future underwriting committee review.
 */
router.post(
  '/save',
  asyncHandler(async (req, res) => {
    const { simulationId, name } = req.body || {};

    const snapshot = await decisionSimulatorService.saveSimulation(
      simulationId,
      name,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );

    res.json(success(snapshot));
  })
);

/**
 * GET /api/v1/decision-simulator/saved/:applicationId
 * Lists all saved simulation snapshots for a given application.
 */
router.get(
  '/saved/:applicationId',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const snapshots = decisionSimulatorService.listSavedSimulations(applicationId, {
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(snapshots));
  })
);

/**
 * GET /api/v1/decision-simulator/applications/:applicationId
 * Lists all saved simulation snapshots for a given application (alias).
 */
router.get(
  '/applications/:applicationId',
  asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const snapshots = decisionSimulatorService.listSavedSimulations(applicationId, {
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(snapshots));
  })
);

/**
 * GET /api/v1/decision-simulator/snapshots/:id
 * Retrieves a single saved simulation snapshot by ID.
 */
router.get(
  '/snapshots/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const snapshot = decisionSimulatorService.getSavedSimulation(id, {
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(snapshot));
  })
);

export const decisionSimulatorRoutes = router;
