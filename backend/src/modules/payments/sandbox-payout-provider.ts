import {
  PayoutProvider,
  PayoutRequestParams,
  PayoutResponseResult,
} from './payment-provider.interface';

export class SandboxPayoutProvider implements PayoutProvider {
  readonly name = 'Deterministic Sandbox Payout Gateway';
  readonly code = 'SANDBOX_PAYOUT';
  readonly providerId = 'sandbox_payout';
  readonly environment = 'SANDBOX' as const;

  isConfigured(): boolean {
    return true; // Always available in simulation environment
  }

  async initiatePayout(
    params: PayoutRequestParams | any,
    correlationId?: string
  ): Promise<PayoutResponseResult & any> {
    const timestamp = Date.now();
    const payoutNo = params.payoutNo || params.payoutId || `pout_${timestamp}`;
    const providerPayoutId = `pout_sbx_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;
    const beneficiaryAccountNo =
      params.beneficiaryAccountNo || params.accountNumber || '';

    // Failure simulation
    if (
      payoutNo?.includes('FAIL') ||
      beneficiaryAccountNo?.endsWith('99999') ||
      params.purpose?.includes('FAIL')
    ) {
      return {
        payoutId: payoutNo,
        providerPayoutId,
        providerReference: providerPayoutId,
        status: 'FAILED',
        errorCode: 'ERR_BENEFICIARY_NAME_OR_IFSC_INVALID',
        failureReason: 'The beneficiary bank account was rejected by recipient bank routing.',
        isSandbox: true,
        verificationMode: 'SANDBOX_SIMULATION',
      };
    }

    const utrSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const utrNumber = `UTR-DISB-SBX-${timestamp}-${utrSuffix}`;

    return {
      payoutId: payoutNo,
      providerPayoutId,
      providerReference: providerPayoutId,
      status: 'SUCCESS',
      utr: utrNumber,
      utrNumber,
      amount: params.amount,
      fees: 0,
      tax: 0,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      estimatedSettlementTime: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
      isSandbox: true,
      verificationMode: 'SANDBOX_SIMULATION',
    };
  }

  async fetchPayoutStatus(providerPayoutId: string): Promise<PayoutResponseResult & any> {
    if (providerPayoutId.includes('FAIL')) {
      return {
        providerPayoutId,
        status: 'FAILED',
        errorCode: 'ERR_BENEFICIARY_REJECTED',
        failureReason: 'Direct NEFT transfer rejected by receiving bank.',
        isSandbox: true,
        verificationMode: 'SANDBOX_SIMULATION',
      };
    }

    return {
      providerPayoutId,
      status: 'SUCCESS',
      utrNumber: `UTR-DISB-SBX-${Date.now()}-CONFIRMED`,
      isSandbox: true,
      verificationMode: 'SANDBOX_SIMULATION',
    };
  }

  async checkPayoutStatus(payoutId: string, correlationId?: string): Promise<any> {
    return this.fetchPayoutStatus(payoutId);
  }

  async cancelPayout(providerPayoutId: string): Promise<boolean> {
    return true;
  }
}

export const sandboxPayoutProvider = new SandboxPayoutProvider();

