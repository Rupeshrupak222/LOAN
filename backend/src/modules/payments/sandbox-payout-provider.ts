import {
  PayoutProvider,
  PayoutRequestParams,
  PayoutResponseResult,
} from './payment-provider.interface';

export class SandboxPayoutProvider implements PayoutProvider {
  name = 'Deterministic Sandbox Payout Gateway';
  code = 'SANDBOX_PAYOUT';

  isConfigured(): boolean {
    return true; // Always available in simulation environment
  }

  async initiatePayout(params: PayoutRequestParams): Promise<PayoutResponseResult> {
    const timestamp = Date.now();
    const providerPayoutId = `pout_sbx_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;

    // Failure simulation
    if (params.payoutNo.includes('FAIL') || params.beneficiaryAccountNo.endsWith('99999')) {
      return {
        providerPayoutId,
        status: 'FAILED',
        errorCode: 'ERR_BENEFICIARY_NAME_OR_IFSC_INVALID',
        failureReason: 'The beneficiary bank account was rejected by recipient bank routing.',
      };
    }

    const utrSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const utrNumber = `UTR-DISB-SBX-${timestamp}-${utrSuffix}`;

    return {
      providerPayoutId,
      status: 'SUCCESS',
      utrNumber,
      estimatedSettlementTime: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
    };
  }

  async fetchPayoutStatus(providerPayoutId: string): Promise<PayoutResponseResult> {
    if (providerPayoutId.includes('FAIL')) {
      return {
        providerPayoutId,
        status: 'FAILED',
        errorCode: 'ERR_BENEFICIARY_REJECTED',
        failureReason: 'Direct NEFT transfer rejected by receiving bank.',
      };
    }

    return {
      providerPayoutId,
      status: 'SUCCESS',
      utrNumber: `UTR-DISB-SBX-${Date.now()}-CONFIRMED`,
    };
  }

  async cancelPayout(providerPayoutId: string): Promise<boolean> {
    return true;
  }
}

export const sandboxPayoutProvider = new SandboxPayoutProvider();
