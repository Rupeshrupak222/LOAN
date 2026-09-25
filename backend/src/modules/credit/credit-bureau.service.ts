import pino from 'pino';
import { BadRequestError, ForbiddenError } from '../../common/errors';
import { providerRegistry } from '../integrations/provider-registry.service';
import { ExecutionMode } from '../integrations/integration.types';
import { logAudit } from '../audit/audit.service';
import { PiiMasker } from '../privacy/pii-masker';
import { prisma } from '../../config/prisma';
import {
  BureauInquiryRequest,
  BureauReportResult,
  BureauReportStatus,
} from '../integrations/interfaces/bureau.interface';

const logger = pino({ name: 'credit-bureau-service' });

export type BureauVerificationMode = 'REAL_PROVIDER' | 'SANDBOX_SIMULATION';

export interface BureauProviderMetadata {
  providerName: string;
  isSandbox: boolean;
  verificationMode: BureauVerificationMode;
  disclaimer: string;
}

export interface BureauInquiryDto {
  pan: string;
  fullName: string;
  mobile: string;
  dateOfBirth?: string;
  address?: string;
  pincode?: string;
  loanAmountRequested?: number;
  customerId?: string;
  applicationId?: string;
}

export interface BureauInquiryContext {
  userId?: string;
  tenantId?: string;
  role?: string;
  ipAddress?: string;
  customerId?: string;
  applicationId?: string;
  forceMode?: ExecutionMode;
}

export interface BureauInquiryResponse {
  success: boolean;
  status: BureauReportStatus;
  bureauName: string;
  score: number;
  scoreTier: string;
  totalAccounts: number;
  activeAccounts: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  dpd30PlusCount: number;
  dpd90PlusCount: number;
  writtenOffCount: number;
  settledCount: number;
  recentInquiriesLast30Days: number;
  reportReference: string;
  generatedAt: string;
  panMasked: string;
  message: string;
  providerMetadata: BureauProviderMetadata;
}

export class CreditBureauService {
  /**
   * Authoritative Credit Bureau Report Pull & Normalization Flow
   */
  public async fetchBureauReport(
    dto: BureauInquiryDto,
    context?: BureauInquiryContext
  ): Promise<BureauInquiryResponse> {
    const cleanPan = dto.pan?.trim().toUpperCase();
    if (!cleanPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      throw new BadRequestError('Invalid PAN format. PAN must be 10 characters (e.g., ABCDE1234F).');
    }

    const cleanMobile = dto.mobile?.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      throw new BadRequestError('Invalid mobile number. Expected 10 numeric digits.');
    }

    const targetCustomerId = dto.customerId || context?.customerId;
    const targetAppId = dto.applicationId || context?.applicationId;

    // IDOR Protection: Validate tenant boundaries if context tenantId is provided
    if (context?.tenantId) {
      if (targetCustomerId) {
        const customerRecord = await prisma.customer.findUnique({
          where: { id: targetCustomerId },
          select: { id: true, tenantId: true },
        });
        if (customerRecord && customerRecord.tenantId !== context.tenantId) {
          throw new ForbiddenError('Access denied: Customer does not belong to your organization.');
        }
      }

      if (targetAppId) {
        const appRecord = await prisma.loanApplication.findUnique({
          where: { id: targetAppId },
          select: { id: true, tenantId: true },
        });
        if (appRecord && appRecord.tenantId !== context.tenantId) {
          throw new ForbiddenError('Access denied: Loan application does not belong to your organization.');
        }
      }
    }

    const correlationId = `BUR-INQ-${Date.now().toString(36).toUpperCase()}`;

    // Resolve provider via centralized Provider Gateway Foundation
    const resolution = providerRegistry.getBureauProvider({
      forceMode: context?.forceMode,
      tenantId: context?.tenantId,
    });

    const { provider, mode, isSandbox } = resolution;

    // Execute provider inquiry (real provider errors will strictly propagate without sandbox fallback)
    const bureauResult: BureauReportResult = await provider.fetchCreditReport(
      {
        pan: cleanPan,
        fullName: dto.fullName?.trim() || '',
        mobile: cleanMobile,
        dateOfBirth: dto.dateOfBirth,
        address: dto.address,
        pincode: dto.pincode,
        loanAmountRequested: dto.loanAmountRequested,
      },
      correlationId
    );

    const isSuccess = bureauResult.status === 'COMPLETED' && bureauResult.score > 0;
    const panMasked = PiiMasker.maskPan(cleanPan);

    const response: BureauInquiryResponse = {
      success: isSuccess,
      status: bureauResult.status,
      bureauName: bureauResult.bureauName,
      score: bureauResult.score,
      scoreTier: bureauResult.scoreTier,
      totalAccounts: bureauResult.totalAccounts,
      activeAccounts: bureauResult.activeAccounts,
      totalOutstanding: bureauResult.totalOutstanding,
      totalOverdueAmount: bureauResult.totalOverdueAmount,
      dpd30PlusCount: bureauResult.dpd30PlusCount,
      dpd90PlusCount: bureauResult.dpd90PlusCount,
      writtenOffCount: bureauResult.writtenOffCount,
      settledCount: bureauResult.settledCount,
      recentInquiriesLast30Days: bureauResult.recentInquiriesLast30Days,
      reportReference: bureauResult.reportReference,
      generatedAt: bureauResult.generatedAt,
      panMasked,
      message: isSuccess
        ? (isSandbox
            ? `[Sandbox] Credit report generated in simulation mode. Score: ${bureauResult.score} (${bureauResult.scoreTier}).`
            : `Credit report retrieved successfully from ${bureauResult.bureauName}. Score: ${bureauResult.score} (${bureauResult.scoreTier}).`)
        : `Credit bureau inquiry returned status: ${bureauResult.status}.`,
      providerMetadata: {
        providerName: provider.name,
        isSandbox,
        verificationMode: isSandbox ? 'SANDBOX_SIMULATION' : 'REAL_PROVIDER',
        disclaimer: isSandbox
          ? 'Sandbox simulated credit report for development/testing — not an official regulatory bureau report.'
          : 'Authoritative Credit Bureau report retrieved via configured provider gateway.',
      },
    };

    // Audit trail (never stores raw credentials or excessive sensitive payload)
    await logAudit({
      userId: context?.userId,
      tenantId: context?.tenantId,
      role: context?.role,
      ipAddress: context?.ipAddress,
      action: 'CREDIT_BUREAU_INQUIRY',
      entity: targetAppId ? 'LOAN_APPLICATION' : 'CUSTOMER',
      entityId: targetAppId || targetCustomerId,
      correlationId,
      newValue: {
        panMasked,
        bureauName: response.bureauName,
        score: response.score,
        scoreTier: response.scoreTier,
        status: response.status,
        mode,
        isSandbox,
        reportReference: response.reportReference,
      },
    });

    // DB Persistence for Risk / Application if applicationId provided
    if (targetAppId && isSuccess) {
      try {
        const existingRisk = await prisma.riskAssessment.findUnique({
          where: { applicationId: targetAppId },
        });

        const riskCategoryMap: Record<string, any> = {
          EXCELLENT: 'LOW',
          GOOD: 'LOW',
          FAIR: 'MEDIUM',
          POOR: 'HIGH',
          NO_HISTORY: 'MEDIUM',
        };
        const mappedRiskCategory = riskCategoryMap[bureauResult.scoreTier] || 'MEDIUM';

        if (existingRisk) {
          await prisma.riskAssessment.update({
            where: { applicationId: targetAppId },
            data: {
              score: bureauResult.score,
              category: mappedRiskCategory,
              factors: {
                bureauScore: bureauResult.score,
                bureauName: bureauResult.bureauName,
                scoreTier: bureauResult.scoreTier,
                reportReference: bureauResult.reportReference,
                isSandbox,
                mode,
                retrievedAt: bureauResult.generatedAt,
              },
            },
          });
        } else {
          await prisma.riskAssessment.create({
            data: {
              applicationId: targetAppId,
              score: bureauResult.score,
              category: mappedRiskCategory,
              factors: {
                bureauScore: bureauResult.score,
                bureauName: bureauResult.bureauName,
                scoreTier: bureauResult.scoreTier,
                reportReference: bureauResult.reportReference,
                isSandbox,
                mode,
                retrievedAt: bureauResult.generatedAt,
              },
            },
          });
        }
      } catch (err) {
        logger.warn({ msg: 'RiskAssessment persistence skipped or failed', err });
      }
    }

    return response;
  }
}

export const creditBureauService = new CreditBureauService();
