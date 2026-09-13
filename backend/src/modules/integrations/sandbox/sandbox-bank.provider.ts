// Deterministic Bank Verification Sandbox Provider
import {
  BankVerificationProvider,
  BankVerificationRequest,
  BankVerificationResult,
} from '../interfaces/banking.interface';

export class SandboxBankVerificationProvider implements BankVerificationProvider {
  readonly providerId = 'sandbox_bank';
  readonly name = 'Deterministic In-Memory Bank Verification';
  readonly environment = 'SANDBOX' as const;

  private forcedScenario?: 'VALID' | 'INVALID' | 'NAME_MISMATCH' | 'PENDING';

  public setForcedScenario(scenario?: 'VALID' | 'INVALID' | 'NAME_MISMATCH' | 'PENDING') {
    this.forcedScenario = scenario;
  }

  public async verifyBankAccount(
    req: BankVerificationRequest,
    correlationId: string
  ): Promise<BankVerificationResult> {
    const acc = (req.accountNumber || '').trim();

    if (this.forcedScenario === 'INVALID' || acc === '9999999999' || acc.length < 9) {
      return {
        status: 'INVALID_ACCOUNT',
        isValid: false,
        registeredName: '',
        beneficiaryNameProvided: req.beneficiaryName,
        nameMatchPercentage: 0,
        bankName: 'Sandbox Simulated Bank',
        branchName: 'Main Branch',
        utrOrReference: `SBX-PENNY-FAIL-${Date.now()}`,
        verificationMode: 'SANDBOX_SIMULATED',
        verifiedAt: new Date().toISOString(),
      };
    }

    if (this.forcedScenario === 'PENDING' || acc.endsWith('0000')) {
      return {
        status: 'PENDING',
        isValid: false,
        registeredName: '',
        beneficiaryNameProvided: req.beneficiaryName,
        nameMatchPercentage: 0,
        bankName: 'Sandbox Simulated Bank',
        branchName: 'Central Processing Hub',
        utrOrReference: `SBX-PENNY-PEND-${Date.now()}`,
        verificationMode: 'SANDBOX_SIMULATED',
        verifiedAt: new Date().toISOString(),
      };
    }

    const isMismatch = this.forcedScenario === 'NAME_MISMATCH' || acc.endsWith('8888');
    const returnedName = isMismatch ? 'UNMATCHED BENEFICIARY TEST' : req.beneficiaryName.toUpperCase();
    const matchPct = isMismatch ? 30 : 98;
    const status = isMismatch ? 'NAME_MISMATCH' : 'NAME_MATCH';

    return {
      status,
      isValid: true,
      registeredName: returnedName,
      beneficiaryNameProvided: req.beneficiaryName,
      nameMatchPercentage: matchPct,
      bankName: 'State Bank of India (Simulated)',
      branchName: 'Koramangala Branch',
      city: 'Bengaluru',
      utrOrReference: `SBX-PENNY-UTR-${Date.now()}`,
      verificationMode: 'PENNY_DROP',
      verifiedAt: new Date().toISOString(),
    };
  }
}
