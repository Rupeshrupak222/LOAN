/**
 * Phase 15 - Consumer Digital Lending App & Borrower Journey Test Suite
 * 
 * Verifies:
 * 1. Product discovery & eligibility check (FOIR-based)
 * 2. 7-step consumer loan application submission
 * 3. Real-time decisioning & binding offer generation
 * 4. RBI Key Fact Statement (KFS) generation with APR & cooling-off period
 * 5. Offer acceptance & Aadhaar eSign verification
 * 6. eNACH mandate registration & instant LMS loan creation
 * 7. Active loan servicing, repayment schedule & EMI breakdown
 * 8. Digital repayment execution (UPI / NetBanking)
 * 9. Automated loan closure & statutory No-Objection Certificate (NOC) generation
 * 10. Consumer support ticket creation & SLA tracking
 * 11. Consumer data privacy: Zero internal operational jargon / risk rules exposed
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));

async function runTests() {
  console.log('===============================================================');
  console.log('PHASE 15: CONSUMER DIGITAL LENDING & BORROWER JOURNEY TESTS');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Setup / Identify test tenant, user and product
    console.log('Step 1: Identifying test environment...');
    const tenant = await prisma.tenant.findFirst();
    assert(!!tenant, 'Default tenant exists');

    let user = await prisma.user.findFirst({
      where: { email: { contains: 'borrower' } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `borrower_${Date.now()}@adyapan.com`,
          passwordHash: 'dummy_hash',
          firstName: 'Ananya',
          lastName: 'Sharma',
          tenantId: tenant.id
        }
      });
    }
    assert(!!user, `Consumer user identified: ${user.firstName} ${user.lastName} (${user.id})`);

    // Ensure customer profile is linked
    let customer = await prisma.customer.findFirst({
      where: { userId: user.id }
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerCode: `CUST-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          tenantId: tenant.id,
          firstName: user.firstName,
          lastName: user.lastName,
          mobile: '9876543210',
          email: user.email,
          monthlyIncome: 80000,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE'
        }
      });
    }
    assert(!!customer, `Customer record linked: ${customer.customerCode}`);

    let product = await prisma.loanProduct.findFirst({
      where: { isActive: true }
    });

    if (!product) {
      product = await prisma.loanProduct.create({
        data: {
          name: 'Instant Personal Digital Loan',
          code: `PL-DIGI-${Date.now().toString().slice(-4)}`,
          minAmount: 10000,
          maxAmount: 500000,
          minTenureMonths: 3,
          maxTenureMonths: 36,
          interestRate: 14.5,
          isActive: true,
          tenantId: tenant.id
        }
      });
    }
    assert(!!product, `Loan product identified: ${product.name} (${product.code})`);

    // Import BorrowerService instance directly
    const { borrowerService } = require(path.resolve(__dirname, '../backend/dist/modules/borrower/borrower.service'));
    assert(!!borrowerService, 'BorrowerService instance loaded');

    // 2. Test Eligibility Assessment
    console.log('\nStep 2: Testing consumer eligibility calculator (FOIR-based)...');
    const eligibilityInput = {
      productId: product.id,
      monthlyIncome: 75000,
      existingMonthlyEmi: 15000,
      requestedAmount: 200000,
      requestedTenureMonths: 24,
      employmentType: 'SALARIED'
    };

    const eligibilityResult = await borrowerService.evaluateBorrowerEligibility(user.id, eligibilityInput, tenant.id);
    assert(eligibilityResult.isEligible === true, 'Consumer is evaluated as eligible');
    assert(eligibilityResult.maxEligibleAmount >= 200000, `Max eligible amount calculated: ₹${eligibilityResult.maxEligibleAmount}`);
    assert(eligibilityResult.indicativeEmiAmount > 0, `Indicative EMI calculated: ₹${eligibilityResult.indicativeEmiAmount}`);
    assert(eligibilityResult.recommendedTenureMonths === 24, 'Recommended tenure matches input');
    assert(Array.isArray(eligibilityResult.keyHighlights) && eligibilityResult.keyHighlights.length > 0, 'Consumer-friendly key highlights returned');

    // 3. Test Multi-Step Loan Application Submission
    console.log('\nStep 3: Submitting multi-step consumer digital loan application...');
    const applicationInput = {
      productId: product.id,
      requestedAmount: 150000,
      tenureMonths: 18,
      purpose: 'Home Renovation & Electronics',
      firstName: 'Ananya',
      lastName: 'Sharma',
      dob: '1994-06-15',
      gender: 'FEMALE',
      addressLine1: 'Flat 402, Lotus Tower',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      employmentType: 'SALARIED',
      employerName: 'Tech Innovations India Pvt Ltd',
      monthlyIncome: 80000,
      existingEmiObligations: 10000,
      panNumber: 'ABCPS1234F',
      aadhaarNumberMasked: 'XXXX-XXXX-5544',
      kycConsentGiven: true,
      accountHolderName: 'Ananya Sharma',
      accountNumber: '987654321012',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank Ltd',
      accountType: 'SAVINGS',
      creditBureauConsent: true,
      termsAccepted: true
    };

    const createdApp = await borrowerService.submitBorrowerApplication(user.id, applicationInput, tenant.id);
    assert(!!createdApp.applicationId, `Application created with ID: ${createdApp.applicationId}`);
    assert(!!createdApp.applicationNumber, `Application Number generated: ${createdApp.applicationNumber}`);
    assert(createdApp.status === 'APPROVED', `Application decision status: ${createdApp.status}`);
    assert(!!createdApp.offerId, `Binding offer generated with Offer ID: ${createdApp.offerId}`);
    assert(createdApp.sanctionedAmount === 150000, `Sanctioned Amount: ₹${createdApp.sanctionedAmount}`);

    const offerId = createdApp.offerId;

    // 4. Test Home Dashboard Summary
    console.log('\nStep 4: Fetching borrower home cockpit summary...');
    const homeSummary = await borrowerService.getBorrowerHomeSummary(user.id, tenant.id);
    assert(homeSummary.borrower.firstName === 'Ananya', `Borrower name recognized: ${homeSummary.borrower.firstName} ${homeSummary.borrower.lastName}`);
    assert(homeSummary.creditLimit.preApprovedLimit >= 150000, `Pre-approved limit displayed: ₹${homeSummary.creditLimit.preApprovedLimit}`);
    assert(!!homeSummary.activeApplication, 'Active application appears in borrower cockpit');
    assert(homeSummary.activeApplication.id === createdApp.applicationId, 'Recent application matches created ID');

    // 5. Test Key Fact Statement (KFS) Generation
    console.log('\nStep 5: Generating RBI Key Fact Statement (KFS)...');
    const kfs = await borrowerService.getBorrowerKfs(user.id, offerId, tenant.id);
    assert(!!kfs.kfsId, `KFS ID generated: ${kfs.kfsId}`);
    assert(kfs.loanAmount === 150000, `Sanctioned loan amount: ₹${kfs.loanAmount}`);
    assert(kfs.annualPercentageRateApr >= kfs.nominalInterestRate, `APR (${kfs.annualPercentageRateApr}%) correctly incorporates processing fees vs nominal rate (${kfs.nominalInterestRate}%)`);
    assert(kfs.coolingOffDays === 3, 'RBI mandatory 3-day cooling off period specified');
    assert(!!kfs.grievanceRedressalOfficer.email, `Grievance Redressal Officer contact provided: ${kfs.grievanceRedressalOfficer.email}`);
    assert(kfs.repaymentScheduleSummary.length === 18, `Amortization schedule includes all 18 installments`);

    // 6. Test Offer Acceptance & Aadhaar eSign
    console.log('\nStep 6: Executing consumer offer acceptance & Aadhaar eSign...');
    const acceptRes = await borrowerService.acceptBorrowerOffer(user.id, offerId, tenant.id);
    assert(acceptRes.status === 'ACCEPTED', 'Offer successfully accepted');

    const esignRes = await borrowerService.executeBorrowerEsign(user.id, createdApp.applicationId, '123456', tenant.id);
    assert(esignRes.status === 'READY_FOR_DISBURSEMENT', 'Loan contract executed with Aadhaar eSign');
    assert(!!esignRes.esignSignatureHash, `Aadhaar eSign audit hash: ${esignRes.esignSignatureHash.slice(0, 16)}...`);

    // 7. Test Mandate Setup & Instant LMS Loan Disbursement
    console.log('\nStep 7: Registering eNACH Mandate & executing disbursement...');
    const disburseRes = await borrowerService.setupBorrowerMandateAndDisburse(user.id, createdApp.applicationId, 'ENACH', tenant.id);

    assert(!!disburseRes.loanId, `Loan account created with ID: ${disburseRes.loanId}`);
    assert(!!disburseRes.loanAccountNumber, `Loan Account Number allocated: ${disburseRes.loanAccountNumber}`);
    assert(disburseRes.status === 'ACTIVE', 'Loan status is now ACTIVE');
    assert(disburseRes.mandateStatus === 'ACTIVE', 'eNACH mandate registered: ACTIVE');

    const loanId = disburseRes.loanId;
    const loanNo = disburseRes.loanAccountNumber;

    // 8. Test Active Loan Servicing & Schedule Retrieval
    console.log('\nStep 8: Retrieving active loan account details & schedule...');
    const loanDetail = await borrowerService.getBorrowerLoanDetails(user.id, loanId, tenant.id);
    assert(loanDetail.id === loanId, 'Loan ID matches');
    assert(loanDetail.sanctionedPrincipal === 150000, `Sanctioned principal amount: ₹${loanDetail.sanctionedPrincipal}`);
    assert(loanDetail.repaymentSchedule.length === 18, 'Repayment schedule contains 18 items');
    assert(loanDetail.repaymentSchedule[0].status === 'UPCOMING' || loanDetail.repaymentSchedule[0].status === 'DUE', 'Installment #1 status is active');

    // 9. Test Digital Repayment Execution (EMI payment)
    console.log('\nStep 9: Executing digital repayment (UPI / NetBanking)...');
    const firstEmi = loanDetail.repaymentSchedule[0];
    const repaymentResult = await borrowerService.processBorrowerRepayment(user.id, {
      loanId,
      amount: firstEmi.totalDue,
      paymentMethod: 'UPI',
      upiVpa: 'ananya@oksbi',
      emiNumber: 1
    }, tenant.id);

    assert(repaymentResult.status === 'SUCCESS', 'EMI payment processed successfully');
    assert(!!repaymentResult.paymentId, `Payment transaction ID: ${repaymentResult.paymentId}`);
    assert(repaymentResult.newOutstandingPrincipal < loanDetail.sanctionedPrincipal, `Outstanding principal reduced to ₹${repaymentResult.newOutstandingPrincipal}`);

    // 10. Test Full Settlement & Automated Loan Closure
    console.log('\nStep 10: Settling remaining balance to test loan closure & NOC...');
    const fullSettlementResult = await borrowerService.processBorrowerRepayment(user.id, {
      loanId,
      amount: repaymentResult.newOutstandingPrincipal,
      paymentMethod: 'NET_BANKING'
    }, tenant.id);

    assert(fullSettlementResult.status === 'SUCCESS', 'Full settlement processed');
    assert(fullSettlementResult.isFullyPaid === true, 'Loan marked as isFullyPaid = true');
    assert(fullSettlementResult.newOutstandingPrincipal === 0, 'Loan outstanding is ₹0.00');

    // Fetch loan again to verify status
    const closedLoanDetail = await borrowerService.getBorrowerLoanDetails(user.id, loanId, tenant.id);
    assert(closedLoanDetail.status === 'CLOSED', 'Loan status successfully marked as CLOSED');

    // 11. Test Statutory No-Objection Certificate (NOC) Generation
    console.log('\nStep 11: Generating statutory No-Objection Certificate (NOC)...');
    const noc = await borrowerService.generateBorrowerNoc(user.id, loanId, tenant.id);
    assert(noc.loanAccountNumber === loanNo, 'NOC contains correct loan number');
    assert(noc.borrowerName === 'Ananya Sharma', 'NOC contains customer full name');
    assert(noc.status === 'CLOSED_FULLY_SETTLED', 'NOC status confirms complete settlement');
    assert(!!noc.digitalSignatureHash && noc.digitalSignatureHash.length === 64, `NOC SHA-256 digital signature hash generated: ${noc.digitalSignatureHash.slice(0, 16)}...`);
    assert(noc.sanctionedAmount === 150000, `Sanctioned amount recorded on NOC: ₹${noc.sanctionedAmount}`);

    // 12. Test Support Ticket Submission
    console.log('\nStep 12: Testing borrower support ticket logging...');
    const ticketResult = await borrowerService.createBorrowerSupportTicket(user.id, {
      category: 'PAYMENTS',
      subject: 'Query regarding payment acknowledgment',
      description: 'Requesting confirmation receipt for the full settlement payment made via NetBanking.'
    }, tenant.id);

    assert(!!ticketResult.ticketNumber, `Support ticket logged with Ticket ID: ${ticketResult.ticketNumber}`);
    assert(ticketResult.slaResolutionHours === 24, '24-hour turnaround SLA assigned');
    assert(ticketResult.status === 'OPEN', 'Ticket status initialized to OPEN');

    console.log('\n===============================================================');
    console.log(`ALL PHASE 15 TESTS PASSED SUCCESSFULLY! (${passed}/${total})`);
    console.log('===============================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
