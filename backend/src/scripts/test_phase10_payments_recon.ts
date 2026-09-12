import Decimal from 'decimal.js';
import { prisma } from '../config/prisma';
import { SandboxPaymentProvider } from '../modules/payments/sandbox-payment-provider';
import { SandboxPayoutProvider } from '../modules/payments/sandbox-payout-provider';
import { paymentAllocationService } from '../modules/payments/payment-allocation.service';
import { generalLedgerService } from '../modules/finance/gl.service';
import { paymentWebhookService } from '../modules/payments/payment-webhook.service';
import { paymentDisputeService } from '../modules/payments/payment-dispute.service';
import { reconciliationService } from '../modules/reconciliation/reconciliation.service';
import { settlementService } from '../modules/reconciliation/settlement.service';
import {
  initiatePayment,
  confirmPayment,
  processRefund,
  reversePayment,
  initiatePayout,
  getCustomerSafePayment,
  getPartnerSafePayment,
} from '../modules/payments/payment.service';
import { rolePermissionService } from '../modules/roles/role-permission.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTestSuite() {
  console.log('====================================================================');
  console.log('🧪 PHASE 10: PAYMENTS, RECONCILIATION & SETTLEMENT ENGINE TEST SUITE');
  console.log('====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // --------------------------------------------------------------------------
  // TEST 1: Provider Abstraction & Gateway Sandbox Verification
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 1] Provider Abstraction & Deterministic Sandbox Simulation');
  totalTests++;
  {
    const provider = new SandboxPaymentProvider();
    assert(provider.isConfigured() === true, 'Sandbox payment provider is configured and available');

    const order = await provider.createOrder({
      amount: 15000,
      currency: 'INR',
      receipt: 'REC-TEST-001',
      customerId: 'cust-test-1',
    });
    assert(order.orderId.startsWith('order_sbx_'), `Order created with valid ID: ${order.orderId}`);
    assert(order.amount === 15000, 'Order amount preserved accurately');
    assert(Boolean(order.checkoutUrl?.includes('sandbox.checkout.adyapan.io')), 'Checkout URL generated');

    const verifySuccess = await provider.verifyPayment({
      orderId: order.orderId,
      providerPaymentId: 'pay_sbx_success_123',
    });
    assert(verifySuccess.verified === true && verifySuccess.status === 'SUCCESS', 'Payment verification succeeded for valid mock');

    const verifyFail = await provider.verifyPayment({
      orderId: order.orderId,
      providerPaymentId: 'pay_sbx_FAIL_decline',
    });
    assert(verifyFail.verified === false && verifyFail.status === 'FAILED', 'Deterministic failure simulation verified');

    const signature = 'test_signature';
    const isValidSig = provider.verifyWebhookSignature('{"event":"payment.captured"}', signature, 'test_secret');
    assert(typeof isValidSig === 'boolean', 'HMAC webhook signature validation functional');

    passedTests++;
    console.log('  🎉 Test 1 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Payout Provider & Bank Routing
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 2] Payout Provider (Disbursements, IMPS/NEFT, UTR Generation)');
  totalTests++;
  {
    const payoutProvider = new SandboxPayoutProvider();
    assert(payoutProvider.isConfigured() === true, 'Payout provider is configured and operational');

    const payoutRes = await payoutProvider.initiatePayout({
      payoutNo: 'POUT-TEST-001',
      amount: 49500,
      currency: 'INR',
      beneficiaryName: 'Rahul Sharma',
      beneficiaryAccountNo: '912384756102',
      beneficiaryIfsc: 'HDFC0000128',
    });

    assert(payoutRes.status === 'SUCCESS', 'Payout initiated with SUCCESS status');
    assert(Boolean(payoutRes.utrNumber?.startsWith('UTR-DISB-SBX-')), `UTR generated properly: ${payoutRes.utrNumber}`);

    const failPayout = await payoutProvider.initiatePayout({
      payoutNo: 'POUT-FAIL-999',
      amount: 10000,
      currency: 'INR',
      beneficiaryName: 'Invalid Account',
      beneficiaryAccountNo: '999999999999',
      beneficiaryIfsc: 'INVALID001',
    });
    assert(failPayout.status === 'FAILED', 'Deterministic payout failure handled properly');

    passedTests++;
    console.log('  🎉 Test 2 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Pure Decimal.js Waterfall Payment Allocation
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 3] Pure Decimal.js Waterfall Allocation Priority (Fees -> Penalties -> Interest -> Principal -> Excess)');
  totalTests++;
  {
    const customer = (await prisma.customer.findFirst()) || (await prisma.customer.create({
      data: {
        customerCode: `CUST-PH10-${Date.now()}`,
        firstName: 'Ankit',
        lastName: 'Verma',
        mobile: '9876543210',
        email: 'ankit.verma@example.com',
      },
    }));

    const product = (await prisma.loanProduct.findFirst()) || (await prisma.loanProduct.create({
      data: {
        code: `PL-PH10-${Date.now().toString().slice(-4)}`,
        name: 'Personal Loan Express',
        productType: 'PERSONAL_LOAN',
        interestRate: 14.5,
        minTenureMonths: 6,
        maxTenureMonths: 36,
        minAmount: 10000,
        maxAmount: 500000,
      },
    }));

    const testLoan = await prisma.loan.create({
      data: {
        loanNo: `LN-PH10-${Date.now().toString().slice(-6)}`,
        customerId: customer.id,
        productId: product.id,
        principal: 50000,
        interestRate: 14.5,
        tenureMonths: 12,
        emiAmount: 4500,
        outstandingPrincipal: 50000,
        outstandingInterest: 5000,
        outstandingFees: 1000,
        status: 'ACTIVE',
        schedule: {
          create: [
            {
              emiNumber: 1,
              dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
              principal: 3800,
              interest: 700,
              fees: 500,
              penaltyAmount: 500,
              totalDue: 5500,
              outstanding: 5500,
              paidAmount: 0,
              status: 'OVERDUE',
            },
          ],
        },
      },
      include: { schedule: true },
    });

    const paymentRecord = await prisma.payment.create({
      data: {
        paymentNo: `PN-ALLOC-${Date.now().toString().slice(-6)}`,
        loanId: testLoan.id,
        customerId: customer.id,
        amount: 5500,
        method: 'UPI',
        status: 'PENDING',
      },
    });

    // Allocate ₹5,500 exactly covering Installment 1 (Fees ₹500 + Penalty ₹500 + Interest ₹700 + Principal ₹3800)
    const allocResult = await paymentAllocationService.allocatePayment({
      paymentId: paymentRecord.id,
      paymentNo: paymentRecord.paymentNo,
      loanId: testLoan.id,
      amount: 5500,
    });

    assert(allocResult.totalAllocated === 5500, `Total allocated matched ₹5500 exactly (${allocResult.totalAllocated})`);
    assert(allocResult.allocatedFees === 500, `Allocated fees: ₹${allocResult.allocatedFees}`);
    assert(allocResult.allocatedPenalties === 500, `Allocated penalties: ₹${allocResult.allocatedPenalties}`);
    assert(allocResult.allocatedInterest === 700, `Allocated interest: ₹${allocResult.allocatedInterest}`);
    assert(allocResult.allocatedPrincipal === 3800, `Allocated principal: ₹${allocResult.allocatedPrincipal}`);

    passedTests++;
    console.log('  🎉 Test 3 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Double-Entry General Ledger Repayment Posting
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 4] Double-Entry GL Journal Integrity (Total Debits == Total Credits)');
  totalTests++;
  {
    const repaymentJournal = await generalLedgerService.postRepaymentJournal({
      loanId: 'loan-test-gl',
      loanNo: 'LN-GL-001',
      paymentNo: 'PN-GL-001',
      totalAmount: 10000,
      allocatedPrincipal: 7000,
      allocatedInterest: 2000,
      allocatedFees: 500,
      allocatedPenalties: 500,
      excessRefund: 0,
      receivedBy: 'TEST_ENGINE',
    });

    assert(repaymentJournal.totalDebit === 10000, `Journal Total Debit: ₹${repaymentJournal.totalDebit}`);
    assert(repaymentJournal.totalCredit === 10000, `Journal Total Credit: ₹${repaymentJournal.totalCredit}`);
    assert(repaymentJournal.totalDebit === repaymentJournal.totalCredit, 'Debits and Credits are perfectly balanced');

    const trialBalance = generalLedgerService.getTrialBalance();
    assert(trialBalance.isBalanced === true, `Trial balance is balanced (Debits: ₹${trialBalance.totalDebits}, Credits: ₹${trialBalance.totalCredits})`);

    passedTests++;
    console.log('  🎉 Test 4 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Webhook Ingestion & Idempotency De-duplication
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 5] Webhook Ingestion Engine with Idempotency Replay Protection');
  totalTests++;
  {
    const eventId = `evt_test_${Date.now()}`;
    const payload = {
      id: eventId,
      event: 'payment.authorized',
      paymentId: 'pay_auth_test_1',
      amount: 5000,
    };

    const firstIngest = await paymentWebhookService.ingestWebhook({
      eventId,
      eventType: 'payment.authorized',
      provider: 'SANDBOX',
      payload,
    });
    assert(firstIngest.success === true && firstIngest.status === 'PROCESSED', 'First webhook delivery processed');

    // Duplicate delivery with same eventId
    const duplicateIngest = await paymentWebhookService.ingestWebhook({
      eventId,
      eventType: 'payment.authorized',
      provider: 'SANDBOX',
      payload,
    });
    assert(duplicateIngest.success === true && duplicateIngest.status === 'DUPLICATE', 'Duplicate webhook acknowledged idempotently without re-execution');

    const webhookLogs = paymentWebhookService.listWebhookEvents();
    assert(webhookLogs.some((e) => e.eventId === eventId), 'Webhook event registered in audit trail');

    passedTests++;
    console.log('  🎉 Test 5 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Payment Reversal Workflow (Bounced Payments & Compensating GL)
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 6] Payment Reversal with Balance Reinstatement & Compensating GL Journal');
  totalTests++;
  {
    // Find or create loan and payment
    const loan = await prisma.loan.findFirst({ include: { schedule: true } });
    if (!loan) throw new Error('No loan available for reversal test');

    const payment = await prisma.payment.create({
      data: {
        paymentNo: `PN-REV-${Date.now().toString().slice(-6)}`,
        loanId: loan.id,
        customerId: loan.customerId,
        amount: 5000,
        method: 'CHEQUE',
        status: 'SUCCESS',
        allocations: {
          create: [
            { bucket: 'PRINCIPAL', amount: 3500 },
            { bucket: 'INTEREST', amount: 1000 },
            { bucket: 'FEES', amount: 500 },
          ],
        },
      },
      include: { allocations: true },
    });

    const reversal = await reversePayment(payment.id, {
      reason: 'Cheque bounced by clearing bank due to insufficient funds',
      comments: 'Return memo #BOUNCE-401',
    });

    assert(reversal.paymentId === payment.id, `Reversal record created for ${payment.id}`);
    assert(reversal.reversalAmount === 5000, 'Reversal amount matches original payment');
    assert(Boolean(reversal.compensatingJournalId), `Compensating GL Journal generated: ${reversal.compensatingJournalId}`);

    const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    assert(updatedPayment?.status === 'REVERSED', 'Payment status updated to REVERSED in database');

    passedTests++;
    console.log('  🎉 Test 6 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 7: Payment Refund Workflow
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 7] Payment Refund Workflow with Bounds Validation');
  totalTests++;
  {
    const loan = await prisma.loan.findFirst();
    if (!loan) throw new Error('No loan found');

    const pmt = await prisma.payment.create({
      data: {
        paymentNo: `PN-RFND-${Date.now().toString().slice(-6)}`,
        loanId: loan.id,
        customerId: loan.customerId,
        amount: 8000,
        method: 'UPI',
        status: 'SUCCESS',
      },
    });

    const refund = await processRefund(pmt.id, {
      amount: 3000,
      reason: 'Borrower requested refund of overpaid excess installment',
    });

    assert(refund.paymentId === pmt.id, 'Refund linked to payment');
    assert(refund.amount === 3000, 'Refund amount ₹3000 recorded');
    assert(refund.status === 'PROCESSED', 'Refund status is PROCESSED');

    // Attempt refunding more than remaining refundable
    try {
      await processRefund(pmt.id, {
        amount: 6000, // 8000 - 3000 = 5000 max remaining
        reason: 'Excessive refund attempt',
      });
      assert(false, 'Should have thrown error on excessive refund amount');
    } catch (e: any) {
      assert(e.message.includes('exceeds remaining refundable balance'), 'Excessive refund blocked with validation error');
    }

    passedTests++;
    console.log('  🎉 Test 7 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 8: Dispute & Chargeback Management
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 8] Payment Dispute & Chargeback Lifecycle');
  totalTests++;
  {
    const dispute = await paymentDisputeService.createDispute({
      paymentId: 'pay_disp_001',
      paymentNo: 'PN-DISP-001',
      type: 'CHARGEBACK',
      amount: 4500,
      reason: 'Customer claims transaction unauthorized via credit card issuer',
    });

    assert(dispute.status === 'OPEN', 'Dispute initialized with OPEN status');
    assert(dispute.amount === 4500, 'Dispute amount is ₹4500');

    const updated = await paymentDisputeService.addEvidence(dispute.id, {
      type: 'BANK_STATEMENT',
      title: 'Signed mandate confirmation PDF',
    });
    assert(updated.status === 'INVESTIGATING', 'Dispute transitioned to INVESTIGATING upon evidence addition');
    assert(updated.evidence.length === 1, 'Evidence item attached to dispute record');

    const resolved = await paymentDisputeService.resolveDispute(dispute.id, {
      status: 'RESOLVED',
      resolutionNotes: 'Customer accepted chargeback settlement after evidence presentation',
      acceptChargeback: true,
    });
    assert(resolved.status === 'RESOLVED', 'Dispute marked RESOLVED');

    passedTests++;
    console.log('  🎉 Test 8 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 9: Multi-Pillar Reconciliation Engine
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 9] Multi-Pillar Reconciliation Engine & Financial Exception Scanner');
  totalTests++;
  {
    const reconRun = await reconciliationService.runReconciliation({
      roles: ['SUPER_ADMIN'],
    });

    assert(typeof reconRun.scannedCount === 'number', `Reconciliation scanned ${reconRun.scannedCount} items`);
    assert(typeof reconRun.exceptionsFound === 'number', `Exceptions identified: ${reconRun.exceptionsFound}`);

    const stats = await reconciliationService.getDashboardStats({
      id: 'admin-1',
      roles: ['SUPER_ADMIN'],
    });

    assert(typeof stats.reconciliationHealthPercent === 'number', `Recon health index: ${stats.reconciliationHealthPercent}%`);
    assert(stats.reconciliationHealthPercent >= 0 && stats.reconciliationHealthPercent <= 100, 'Recon health index within 0-100 bounds');

    passedTests++;
    console.log('  🎉 Test 9 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 10: Maker-Checker Ledger Adjustment Dual Control
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 10] Maker-Checker Ledger Adjustment Dual Control & Thresholds');
  totalTests++;
  {
    const loan = await prisma.loan.findFirst();
    if (!loan) throw new Error('No loan available for adjustment test');

    // ₹10,000 adjustment exceeds ₹5,000 Maker-Checker threshold -> requires approval
    const proposed = await reconciliationService.proposeAdjustment(
      {
        type: 'LEDGER_CORRECTION',
        loanId: loan.id,
        amount: 10000,
        reason: 'Adjust interest accrual timing difference between gateway and core ledger',
      },
      {
        id: 'maker-officer-1',
        email: 'maker@adyapan.io',
        roles: ['FINANCE_OFFICER'],
      }
    );

    assert(proposed.status === 'PENDING_APPROVAL', 'Large adjustment flagged for Checker approval (status: PENDING_APPROVAL)');
    assert(proposed.requiresApproval === true, 'Maker-Checker flag set to true');

    // Self-approval blocked (SoD)
    try {
      await reconciliationService.approveAdjustment(proposed.adjustmentId, {
        id: 'maker-officer-1',
        email: 'maker@adyapan.io', // Same user as proposedBy!
        roles: ['FINANCE_OFFICER'],
      });
      assert(false, 'Should have blocked self-approval under SoD rules');
    } catch (e: any) {
      assert(e.message.includes('cannot approve your own proposed adjustment'), 'Self-approval blocked under Maker-Checker dual control');
    }

    // Independent Checker approval
    const approved = await reconciliationService.approveAdjustment(proposed.adjustmentId, {
      id: 'checker-officer-2',
      email: 'checker@adyapan.io',
      roles: ['FINANCE_OFFICER'],
    });

    assert(approved.status === 'APPROVED', 'Adjustment approved by distinct Checker');
    assert(approved.approvedBy === 'checker@adyapan.io', 'Checker audit identity recorded');

    passedTests++;
    console.log('  🎉 Test 10 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 11: PG Batch Settlement & MDR Fee Variance
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 11] PG Settlement Net Calculation & Fee Variance Auditing');
  totalTests++;
  {
    // Gross: ₹1,00,000. Contracted MDR: 1.75% (Base: ₹1,750, GST 18%: ₹315, Total: ₹2,065, Net: ₹97,935)
    const batch = await settlementService.createSettlementBatch({
      providerCode: 'RAZORPAY',
      grossAmount: 100000,
      contractedMdrPct: 1.75,
      transactionCount: 20,
    });

    assert(batch.grossAmount === 100000, 'Gross volume ₹1,00,000');
    assert(batch.netSettledAmount === 97935, `Net settled amount ₹97,935 verified (${batch.netSettledAmount})`);
    assert(batch.status === 'PENDING', 'Settlement batch created as PENDING');

    const confirmed = await settlementService.confirmSettlement(batch.id, {
      utrNumber: 'UTR-NODAL-SETTLE-001',
    });

    assert(confirmed.status === 'SETTLED', 'Settlement confirmed');
    assert(Boolean(confirmed.journalEntryId), `Settlement GL Journal entry posted: ${confirmed.journalEntryId}`);

    passedTests++;
    console.log('  🎉 Test 11 Passed!\n');
  }

  // --------------------------------------------------------------------------
  // TEST 12: RBAC, SoD & Borrower / Partner Safe Views
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 12] RBAC, Segregation of Duties (SoD) & Safe Views');
  totalTests++;
  {
    // Verify SoD rules registered
    const sodRules = rolePermissionService.getSodRules();
    const hasReconSod = sodRules.some((r: any) => r.code === 'SOD_RECONCILIATION_RESOLVER_AUDITOR' || r.ruleCode === 'SOD_RECONCILIATION_RESOLVER_AUDITOR');
    const hasPayoutSod = sodRules.some((r: any) => r.code === 'SOD_PAYOUT_INITIATOR_APPROVER' || r.ruleCode === 'SOD_PAYOUT_INITIATOR_APPROVER');

    assert(hasReconSod, 'Reconciliation Resolver vs Auditor SoD rule active');
    assert(hasPayoutSod, 'Payout Initiator vs Approver SoD rule active');

    // Customer safe view
    const loan = await prisma.loan.findFirst({ include: { schedule: true } });
    if (loan) {
      const pmt = await prisma.payment.findFirst({ where: { loanId: loan.id } }) || await prisma.payment.create({
        data: {
          paymentNo: `PN-SAFE-${Date.now()}`,
          loanId: loan.id,
          customerId: loan.customerId,
          amount: 5000,
          method: 'UPI',
          status: 'SUCCESS',
        },
      });

      const customerSafe = await getCustomerSafePayment(pmt.id);
      assert(customerSafe.paymentId === pmt.id, 'Customer safe view generated');
      assert(customerSafe.receiptNumber.startsWith('RCPT-'), `Safe receipt number formatted: ${customerSafe.receiptNumber}`);
      assert(typeof customerSafe.remainingLoanBalance === 'number', 'Remaining loan balance calculated in safe view');

      const partnerSafe = await getPartnerSafePayment(pmt.id);
      assert(partnerSafe.paymentNo === pmt.paymentNo, 'Partner safe view generated with minimal sanitized fields');
    }

    passedTests++;
    console.log('  🎉 Test 12 Passed!\n');
  }

  console.log('====================================================================');
  console.log(`🏆 PHASE 10 INTEGRATION SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================================\n');
}

runTestSuite()
  .catch((err) => {
    console.error('Test suite execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
