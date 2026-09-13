// Deterministic Account Aggregator Sandbox Provider
import {
  AaConsentRequest,
  AaConsentResult,
  AaFinancialTelemetry,
  AccountAggregatorProvider,
} from '../interfaces/aa.interface';

export class SandboxAccountAggregatorProvider implements AccountAggregatorProvider {
  readonly providerId = 'sandbox_aa';
  readonly name = 'Deterministic In-Memory Account Aggregator';
  readonly environment = 'SANDBOX' as const;

  private forcedScenario?: 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'UNAVAILABLE';

  public setForcedScenario(scenario?: 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'UNAVAILABLE') {
    this.forcedScenario = scenario;
  }

  public async createConsent(
    req: AaConsentRequest,
    correlationId: string
  ): Promise<AaConsentResult> {
    const handle = `AA-HNDL-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return {
      consentHandle: handle,
      consentId: `AA-CNS-${Date.now()}`,
      status: 'CONSENT_CREATED',
      redirectUrl: `https://sandbox.aa.adyapan.io/consent/${handle}`,
      expiresAt,
      providerReference: `SBX-AA-REQ-${Date.now()}`,
    };
  }

  public async checkConsentStatus(
    consentHandle: string,
    correlationId: string
  ): Promise<AaConsentResult> {
    if (this.forcedScenario === 'REJECTED' || consentHandle.includes('REJECT')) {
      return {
        consentHandle,
        status: 'CONSENT_REJECTED',
        expiresAt: new Date().toISOString(),
        providerReference: `SBX-AA-REJ-${Date.now()}`,
      };
    }

    if (this.forcedScenario === 'EXPIRED') {
      return {
        consentHandle,
        status: 'CONSENT_EXPIRED',
        expiresAt: new Date().toISOString(),
        providerReference: `SBX-AA-EXP-${Date.now()}`,
      };
    }

    return {
      consentHandle,
      consentId: `AA-CNS-${Date.now()}`,
      status: 'CONSENT_APPROVED',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      providerReference: `SBX-AA-APP-${Date.now()}`,
    };
  }

  public async fetchFinancialTelemetry(
    consentId: string,
    correlationId: string
  ): Promise<AaFinancialTelemetry> {
    if (this.forcedScenario === 'UNAVAILABLE') {
      return {
        averageMonthlyInflow: 0,
        averageMonthlyOutflow: 0,
        estimatedMonthlySalary: 0,
        bounceCountLast180Days: 0,
        monthlyClosingBalances: [],
        totalAccountsAggregated: 0,
        detectedLenders: [],
        emiOutflowMonthly: 0,
        statementAvailable: false,
      };
    }

    return {
      averageMonthlyInflow: 75000,
      averageMonthlyOutflow: 45000,
      estimatedMonthlySalary: 72000,
      salaryCreditDay: 1,
      bounceCountLast180Days: 0,
      monthlyClosingBalances: [
        { month: '2026-06', balance: 32000 },
        { month: '2026-07', balance: 38500 },
        { month: '2026-08', balance: 44000 },
      ],
      totalAccountsAggregated: 1,
      detectedLenders: [],
      emiOutflowMonthly: 0,
      statementAvailable: true,
    };
  }
}
