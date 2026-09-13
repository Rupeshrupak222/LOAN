// End-to-End Integration Orchestrator
import { providerRegistry } from './provider-registry.service';
import { breService } from '../bre/bre.service';
import { offerEngineService } from '../offers/offers.service';
import { logAudit } from '../audit/audit.service';
import { prisma } from '../../config/prisma';

export interface ApplicationVerificationFlowInput {
  tenantId: string;
  applicationId: string;
  pan: string;
  fullName: string;
  mobile: string;
  accountNumber: string;
  ifscCode: string;
  actor: { id: string; email: string; roles: string[] };
}

export interface VerificationFlowOutcome {
  applicationId: string;
  kycStatus: 'VERIFIED' | 'FAILED';
  bankStatus: 'VALID_ACCOUNT' | 'INVALID_ACCOUNT' | 'NAME_MATCH' | 'NAME_MISMATCH';
  bureauScore: number;
  breVerdict: string;
  isOfferEligible: boolean;
  offerId?: string;
  orchestrationStatus: 'COMPLETED' | 'REJECTED' | 'MANUAL_REVIEW';
  stepsLog: Array<{ step: string; status: string; timestamp: string }>;
}

export class IntegrationOrchestratorService {
  private static instance: IntegrationOrchestratorService;

  public static getInstance(): IntegrationOrchestratorService {
    if (!IntegrationOrchestratorService.instance) {
      IntegrationOrchestratorService.instance = new IntegrationOrchestratorService();
    }
    return IntegrationOrchestratorService.instance;
  }

  /**
   * Orchestrate full verification sequence using deterministic sandbox adapters:
   * 1. KYC PAN Verification
   * 2. Bank Account Verification
   * 3. Credit Bureau Pull
   * 4. BRE Scoring & Verdict
   * 5. Offer Generation (if eligible)
   */
  public async executeVerificationPipeline(
    input: ApplicationVerificationFlowInput
  ): Promise<VerificationFlowOutcome> {
    const stepsLog: Array<{ step: string; status: string; timestamp: string }> = [];
    const correlationId = `ORCH-${Date.now()}-${input.applicationId.slice(-6)}`;

    // 1. KYC Verification
    const kycRes = await providerRegistry.kyc.verifyPan(
      { panNumber: input.pan, fullName: input.fullName },
      correlationId
    );
    stepsLog.push({
      step: 'KYC_PAN_VERIFICATION',
      status: kycRes.status,
      timestamp: new Date().toISOString(),
    });

    if (kycRes.status === 'FAILED') {
      return {
        applicationId: input.applicationId,
        kycStatus: 'FAILED',
        bankStatus: 'INVALID_ACCOUNT',
        bureauScore: 0,
        breVerdict: 'REJECTED',
        isOfferEligible: false,
        orchestrationStatus: 'REJECTED',
        stepsLog,
      };
    }

    // 2. Bank Verification
    const bankRes = await providerRegistry.bank.verifyBankAccount(
      {
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode,
        beneficiaryName: input.fullName,
      },
      correlationId
    );
    stepsLog.push({
      step: 'BANK_ACCOUNT_VERIFICATION',
      status: bankRes.status,
      timestamp: new Date().toISOString(),
    });

    // 3. Bureau Inquiry
    const bureauRes = await providerRegistry.bureau.fetchCreditReport(
      {
        pan: input.pan,
        fullName: input.fullName,
        mobile: input.mobile,
      },
      correlationId
    );
    stepsLog.push({
      step: 'CREDIT_BUREAU_PULL',
      status: bureauRes.status,
      timestamp: new Date().toISOString(),
    });

    // 4. BRE Evaluation (Authoritative Engine)
    const breEval = await breService.evaluateApplication(input.applicationId);
    stepsLog.push({
      step: 'BRE_DECISIONING',
      status: breEval.verdict,
      timestamp: new Date().toISOString(),
    });

    let offerId: string | undefined;
    const isAutoApproved = breEval.verdict === 'AUTO_APPROVED' || breEval.verdict === 'ELIGIBLE';

    // 5. Offer Generation if approved
    if (isAutoApproved) {
      try {
        const app = await prisma.loanApplication.findUnique({
          where: { id: input.applicationId },
        });

        if (app) {
          const offer = await offerEngineService.generateOffer(
            input.tenantId,
            input.applicationId,
            {
              customOfferedAmount: Number(app.requestedAmount || 25000),
              customTenureMonths: app.tenureMonths || 3,
              overrideRatePct: 18.0,
            },
            input.actor
          );
          offerId = offer.id;
          stepsLog.push({
            step: 'SANCTION_OFFER_GENERATED',
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        stepsLog.push({
          step: 'SANCTION_OFFER_GENERATED',
          status: 'SKIPPED_OR_EXISTS',
          timestamp: new Date().toISOString(),
        });
      }
    }

    await logAudit({
      userId: input.actor.id,
      role: input.actor.roles[0],
      action: 'INTEGRATION_PIPELINE_EXECUTED',
      entity: 'LoanApplication',
      entityId: input.applicationId,
      newValue: {
        kycStatus: kycRes.status,
        bankStatus: bankRes.status,
        bureauScore: bureauRes.score,
        breVerdict: breEval.verdict,
        offerId,
      },
      correlationId,
    }).catch(() => {});

    return {
      applicationId: input.applicationId,
      kycStatus: kycRes.status as 'VERIFIED' | 'FAILED',
      bankStatus: bankRes.status as any,
      bureauScore: bureauRes.score,
      breVerdict: breEval.verdict,
      isOfferEligible: isAutoApproved,
      offerId,
      orchestrationStatus: isAutoApproved ? 'COMPLETED' : 'MANUAL_REVIEW',
      stepsLog,
    };
  }
}

export const integrationOrchestrator = IntegrationOrchestratorService.getInstance();
