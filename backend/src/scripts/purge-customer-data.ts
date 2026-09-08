import { prisma } from '../config/prisma';
import { decisionIntelligenceService } from '../modules/decision-intelligence/decision-intelligence.service';
import { decisionSimulatorService } from '../modules/decision-simulator/decision-simulator.service';
import { privacyConsentService } from '../modules/privacy/consent.service';
import { communicationService } from '../modules/communication/communication.service';
import { earlyWarningService } from '../modules/early-warning/early-warning.service';

export async function purgeAllCustomerData() {
  console.log('🚀 Starting complete purge of all customer data and in-memory caches...');

  const staffEmails = [
    'superadmin@adyapan.dev',
    'admin@adyapan.dev',
    'manager@adyapan.dev',
    'officer@adyapan.dev',
    'analyst@adyapan.dev',
    'underwriter@adyapan.dev',
    'finance@adyapan.dev',
    'collections@adyapan.dev',
    'auditor@adyapan.dev',
  ];

  await prisma.$transaction(
    async (tx) => {
      // 1. Financial allocations and payment submissions
      const deletedAlloc = await tx.paymentAllocation.deleteMany({});
      console.log(`- Deleted ${deletedAlloc.count} payment allocations`);

      const deletedSubmissions = await tx.paymentSubmission.deleteMany({});
      console.log(`- Deleted ${deletedSubmissions.count} payment submissions`);

      const deletedPayments = await tx.payment.deleteMany({});
      console.log(`- Deleted ${deletedPayments.count} payments`);

      const deletedTx = await tx.transaction.deleteMany({});
      console.log(`- Deleted ${deletedTx.count} ledger transactions`);

      // 2. Loan servicing, schedules, and disbursements
      const deletedSchedule = await tx.repaymentScheduleItem.deleteMany({});
      console.log(`- Deleted ${deletedSchedule.count} repayment schedule items`);

      const deletedDisb = await tx.disbursement.deleteMany({});
      console.log(`- Deleted ${deletedDisb.count} disbursements`);

      // 3. Collections, PTPs, and field activities
      const deletedPtp = await tx.promiseToPay.deleteMany({});
      console.log(`- Deleted ${deletedPtp.count} promise to pay records`);

      const deletedColAct = await tx.collectionActivity.deleteMany({});
      console.log(`- Deleted ${deletedColAct.count} collection activities`);

      const deletedColCase = await tx.collectionCase.deleteMany({});
      console.log(`- Deleted ${deletedColCase.count} collection cases`);

      // 4. Closures, settlements, and restructures
      const deletedClosure = await tx.loanClosure.deleteMany({});
      console.log(`- Deleted ${deletedClosure.count} loan closures`);

      const deletedSettlement = await tx.settlement.deleteMany({});
      console.log(`- Deleted ${deletedSettlement.count} settlements`);

      const deletedRestructure = await tx.loanRestructure.deleteMany({});
      console.log(`- Deleted ${deletedRestructure.count} loan restructures`);

      const deletedLoans = await tx.loan.deleteMany({});
      console.log(`- Deleted ${deletedLoans.count} loans`);

      // 5. Underwriting, credit assessments, and applications
      const deletedUw = await tx.underwritingDecision.deleteMany({});
      console.log(`- Deleted ${deletedUw.count} underwriting decisions`);

      const deletedRisk = await tx.riskAssessment.deleteMany({});
      console.log(`- Deleted ${deletedRisk.count} risk assessments`);

      const deletedElig = await tx.eligibilityAssessment.deleteMany({});
      console.log(`- Deleted ${deletedElig.count} eligibility assessments`);

      const deletedAppHistory = await tx.applicationStatusHistory.deleteMany({});
      console.log(`- Deleted ${deletedAppHistory.count} application status histories`);

      const deletedApprovals = await tx.approvalRequest.deleteMany({});
      console.log(`- Deleted ${deletedApprovals.count} approval requests`);

      const deletedApps = await tx.loanApplication.deleteMany({});
      console.log(`- Deleted ${deletedApps.count} loan applications`);

      // 6. Documents, addresses, bank accounts, and employment
      const deletedDocs = await tx.document.deleteMany({});
      console.log(`- Deleted ${deletedDocs.count} documents`);

      const deletedCustAddr = await tx.customerAddress.deleteMany({});
      console.log(`- Deleted ${deletedCustAddr.count} customer addresses`);

      const deletedCustBank = await tx.customerBankAccount.deleteMany({});
      console.log(`- Deleted ${deletedCustBank.count} customer bank accounts`);

      const deletedCustEmp = await tx.customerEmployment.deleteMany({});
      console.log(`- Deleted ${deletedCustEmp.count} customer employments`);

      const deletedNotifications = await tx.notification.deleteMany({});
      console.log(`- Deleted ${deletedNotifications.count} notifications`);

      // 7. Customers master table
      const deletedCustomers = await tx.customer.deleteMany({});
      console.log(`- Deleted ${deletedCustomers.count} customers`);

      // 8. Non-staff Customer User accounts (preserve the 9 staff employees)
      const nonStaffUsers = await tx.user.findMany({
        where: { email: { notIn: staffEmails } },
        select: { id: true, email: true },
      });
      console.log(`- Found ${nonStaffUsers.length} non-staff customer user login accounts to delete`);

      const nonStaffIds = nonStaffUsers.map((u) => u.id);
      if (nonStaffIds.length > 0) {
        await tx.refreshToken.deleteMany({ where: { userId: { in: nonStaffIds } } });
        await tx.userRole.deleteMany({ where: { userId: { in: nonStaffIds } } });
        await tx.auditLog.deleteMany({ where: { userId: { in: nonStaffIds } } });
        await tx.user.deleteMany({ where: { id: { in: nonStaffIds } } });
        console.log(`- Deleted ${nonStaffIds.length} customer user accounts from User table`);
      }
    },
    { timeout: 30000 }
  );

  // 9. Purge In-Memory Caches across all active services
  try {
    decisionIntelligenceService.clearForTesting();
    console.log('- Cleared Decision Intelligence in-memory cache');
  } catch (e) {
    console.warn('Could not clear decisionIntelligence cache', e);
  }

  try {
    decisionSimulatorService.clearForTesting();
    console.log('- Cleared Decision Simulator in-memory cache');
  } catch (e) {
    console.warn('Could not clear decisionSimulator cache', e);
  }

  try {
    privacyConsentService.clearForTesting();
    console.log('- Cleared Privacy Consent records & preferences');
  } catch (e) {
    console.warn('Could not clear privacyConsent cache', e);
  }

  try {
    communicationService.clearForTesting();
    console.log('- Cleared Omnichannel Communication in-memory cache');
  } catch (e) {
    console.warn('Could not clear communication cache', e);
  }

  try {
    earlyWarningService.clearForTesting();
    console.log('- Cleared Early Warning alerts cache');
  } catch (e) {
    console.warn('Could not clear earlyWarning cache', e);
  }

  console.log('✅ ALL customer data, linked records, and caches have been PURGED completely!');
}

if (require.main === module) {
  purgeAllCustomerData()
    .catch((err) => {
      console.error('❌ Purge failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
}
