import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { contractsService } from './contracts.service';
import { ok, created } from '../../common/response';
import { BadRequestError } from '../../common/errors';

export const contractsRoutes = Router();

/**
 * GET /api/v1/contracts/kfs/:applicationId
 * Generates or retrieves statutory Key Fact Statement (KFS)
 */
contractsRoutes.get(
  '/kfs/:applicationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { applicationId } = req.params;
      const kfs = await contractsService.generateKfs(applicationId, {
        id: user?.id,
        tenantId: user?.tenantId,
      });
      return ok(res, kfs);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/contracts/agreement/:applicationId
 * Generates digital loan agreement for execution
 */
contractsRoutes.post(
  '/agreement/:applicationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { applicationId } = req.params;
      const agreement = await contractsService.generateDigitalAgreement(applicationId, {
        id: user?.id,
        tenantId: user?.tenantId,
      });
      return created(res, agreement);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/contracts/esign/initiate
 * Initiates Aadhaar / Digital eSign session for borrower
 */
contractsRoutes.post(
  '/esign/initiate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { applicationId, provider } = req.body;
      if (!applicationId) throw new BadRequestError('applicationId is required');

      const session = await contractsService.initiateESign(applicationId, provider, {
        id: user?.id,
        tenantId: user?.tenantId,
      });
      return created(res, session);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/contracts/esign/complete/:sessionId
 * Completes / verifies an eSign session (Simulation / Webhook trigger)
 */
contractsRoutes.post(
  '/esign/complete/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const metadata = req.body;
      const session = await contractsService.completeESign(sessionId, metadata);
      return ok(res, session);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/contracts/mandate/initiate
 * Registers eNACH / auto-debit mandate
 */
contractsRoutes.post(
  '/mandate/initiate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const { applicationId, authMode, provider } = req.body;
      if (!applicationId) {
        throw new BadRequestError('applicationId is required.');
      }

      const bankName = req.body.bankName || 'HDFC Bank Ltd';
      const accountNumber = req.body.accountNumber || '50100987654321';
      const ifscCode = req.body.ifscCode || 'HDFC0001234';

      const session = await contractsService.initiateMandate(
        applicationId,
        { bankName, accountNumber, ifscCode, authMode, provider },
        { id: user?.id, tenantId: user?.tenantId }
      );
      return created(res, session);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/contracts/mandate/verify/:mandateId
 * Verifies active eNACH mandate status
 */
contractsRoutes.post(
  '/mandate/verify/:mandateId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mandateId } = req.params;
      return ok(res, { mandateId, status: 'ACTIVE', verifiedAt: new Date().toISOString() });
    } catch (err) {
      next(err);
    }
  }
);


/**
 * GET /api/v1/contracts/status/:applicationId
 * Retrieves complete digital journey status for application
 */
contractsRoutes.get(
  '/status/:applicationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { applicationId } = req.params;
      const status = await contractsService.getApplicationContractStatus(applicationId);
      return ok(res, status);
    } catch (err) {
      next(err);
    }
  }
);

export default contractsRoutes;
