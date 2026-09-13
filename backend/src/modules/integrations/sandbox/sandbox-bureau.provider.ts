// Deterministic Credit Bureau Sandbox Provider
import {
  BureauInquiryRequest,
  BureauProvider,
  BureauReportResult,
  BureauTradelineSummary,
} from '../interfaces/bureau.interface';

export type BureauScenario =
  | 'GOOD_CREDIT'
  | 'AVERAGE_CREDIT'
  | 'POOR_CREDIT'
  | 'NO_HISTORY'
  | 'HIGH_DPD'
  | 'HIGH_ENQUIRY';

export class SandboxBureauProvider implements BureauProvider {
  readonly providerId = 'sandbox_bureau';
  readonly name = 'Deterministic In-Memory Bureau Gateway';
  readonly environment = 'SANDBOX' as const;

  private forcedScenario?: BureauScenario;

  public setForcedScenario(scenario?: BureauScenario) {
    this.forcedScenario = scenario;
  }

  public async fetchCreditReport(
    req: BureauInquiryRequest,
    correlationId: string
  ): Promise<BureauReportResult> {
    const pan = (req.pan || '').trim().toUpperCase();

    // Determine active scenario
    let scenario: BureauScenario = this.forcedScenario || 'GOOD_CREDIT';
    if (!this.forcedScenario) {
      if (pan.includes('POOR') || pan.endsWith('0520P')) scenario = 'POOR_CREDIT';
      else if (pan.includes('AVG') || pan.endsWith('0680A')) scenario = 'AVERAGE_CREDIT';
      else if (pan.includes('NTC') || pan.endsWith('0000N')) scenario = 'NO_HISTORY';
      else if (pan.includes('DPD') || pan.endsWith('0090D')) scenario = 'HIGH_DPD';
      else if (pan.includes('ENQ') || pan.endsWith('0012E')) scenario = 'HIGH_ENQUIRY';
      else scenario = 'GOOD_CREDIT';
    }

    const reportRef = `SBX-BUR-${scenario}-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    switch (scenario) {
      case 'POOR_CREDIT': {
        const tradelines: BureauTradelineSummary[] = [
          {
            accountType: 'PERSONAL_LOAN',
            institutionName: 'Apex Finance NBFC',
            sanctionedAmount: 50000,
            currentBalance: 42000,
            overdueAmount: 42000,
            dpdMax: 90,
            status: 'WRITTEN_OFF',
            openedDate: '2023-01-10',
          },
          {
            accountType: 'CREDIT_CARD',
            institutionName: 'Himalayan Bank',
            sanctionedAmount: 30000,
            currentBalance: 29500,
            overdueAmount: 12000,
            dpdMax: 60,
            status: 'DELINQUENT',
            openedDate: '2022-05-15',
          },
        ];
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: 520,
          scoreTier: 'POOR',
          totalAccounts: 2,
          activeAccounts: 2,
          totalOutstanding: 71500,
          totalOverdueAmount: 54000,
          dpd30PlusCount: 2,
          dpd90PlusCount: 1,
          writtenOffCount: 1,
          settledCount: 0,
          recentInquiriesLast30Days: 4,
          tradelines,
          reportReference: reportRef,
          generatedAt,
        };
      }

      case 'AVERAGE_CREDIT': {
        const tradelines: BureauTradelineSummary[] = [
          {
            accountType: 'TWO_WHEELER_LOAN',
            institutionName: 'Metro Rural Finance',
            sanctionedAmount: 60000,
            currentBalance: 12000,
            overdueAmount: 0,
            dpdMax: 20,
            status: 'CURRENT',
            openedDate: '2022-08-01',
          },
        ];
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: 685,
          scoreTier: 'FAIR',
          totalAccounts: 2,
          activeAccounts: 1,
          totalOutstanding: 12000,
          totalOverdueAmount: 0,
          dpd30PlusCount: 0,
          dpd90PlusCount: 0,
          writtenOffCount: 0,
          settledCount: 0,
          recentInquiriesLast30Days: 2,
          tradelines,
          reportReference: reportRef,
          generatedAt,
        };
      }

      case 'NO_HISTORY': {
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: -1,
          scoreTier: 'NO_HISTORY',
          totalAccounts: 0,
          activeAccounts: 0,
          totalOutstanding: 0,
          totalOverdueAmount: 0,
          dpd30PlusCount: 0,
          dpd90PlusCount: 0,
          writtenOffCount: 0,
          settledCount: 0,
          recentInquiriesLast30Days: 1,
          tradelines: [],
          reportReference: reportRef,
          generatedAt,
        };
      }

      case 'HIGH_DPD': {
        const tradelines: BureauTradelineSummary[] = [
          {
            accountType: 'CONSUMER_DURABLE',
            institutionName: 'QuickFin NBFC',
            sanctionedAmount: 35000,
            currentBalance: 35000,
            overdueAmount: 35000,
            dpdMax: 120,
            status: 'DELINQUENT',
            openedDate: '2023-03-20',
          },
        ];
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: 550,
          scoreTier: 'POOR',
          totalAccounts: 1,
          activeAccounts: 1,
          totalOutstanding: 35000,
          totalOverdueAmount: 35000,
          dpd30PlusCount: 1,
          dpd90PlusCount: 1,
          writtenOffCount: 0,
          settledCount: 0,
          recentInquiriesLast30Days: 5,
          tradelines,
          reportReference: reportRef,
          generatedAt,
        };
      }

      case 'HIGH_ENQUIRY': {
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: 640,
          scoreTier: 'FAIR',
          totalAccounts: 1,
          activeAccounts: 1,
          totalOutstanding: 15000,
          totalOverdueAmount: 0,
          dpd30PlusCount: 0,
          dpd90PlusCount: 0,
          writtenOffCount: 0,
          settledCount: 0,
          recentInquiriesLast30Days: 12, // High inquiry velocity
          tradelines: [],
          reportReference: reportRef,
          generatedAt,
        };
      }

      case 'GOOD_CREDIT':
      default: {
        const tradelines: BureauTradelineSummary[] = [
          {
            accountType: 'PERSONAL_LOAN',
            institutionName: 'National Premier Bank',
            sanctionedAmount: 100000,
            currentBalance: 0,
            overdueAmount: 0,
            dpdMax: 0,
            status: 'CLOSED',
            openedDate: '2021-04-10',
          },
          {
            accountType: 'CREDIT_CARD',
            institutionName: 'Prime Card Services',
            sanctionedAmount: 75000,
            currentBalance: 8400,
            overdueAmount: 0,
            dpdMax: 0,
            status: 'CURRENT',
            openedDate: '2022-01-15',
          },
        ];
        return {
          status: 'COMPLETED',
          bureauName: 'SANDBOX_BUREAU',
          score: 785,
          scoreTier: 'EXCELLENT',
          totalAccounts: 3,
          activeAccounts: 1,
          totalOutstanding: 8400,
          totalOverdueAmount: 0,
          dpd30PlusCount: 0,
          dpd90PlusCount: 0,
          writtenOffCount: 0,
          settledCount: 0,
          recentInquiriesLast30Days: 0,
          tradelines,
          reportReference: reportRef,
          generatedAt,
        };
      }
    }
  }
}
