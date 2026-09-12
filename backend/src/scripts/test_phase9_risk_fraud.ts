import { riskService } from '../modules/risk/risk.service';
import { fraudService } from '../modules/fraud/fraud.service';
import { identityGraphService } from '../modules/fraud/identity-graph.service';
import { fraudRulesEngine } from '../modules/fraud/fraud-rules.engine';
import { riskFraudMatrixService } from '../modules/risk/risk-fraud-matrix.service';
import { rolePermissionService } from '../modules/roles/role-permission.service';
import { buildDecisionContext } from '../modules/bre/decision-engine.service';
import { RiskInputContext } from '../modules/risk/risk.types';
import { FraudInputContext } from '../modules/fraud/fraud.types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 PHASE 9: ADVANCED RISK & FRAUD ENGINE — AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // --------------------------------------------------------------------------
  // TEST 1: 6-Pillar Risk Signals Extraction & Scoring
  // --------------------------------------------------------------------------
  console.log('▶ [TEST 1] 6-Pillar Risk Signal Extraction & Deterministic Scoring');
  totalTests++;
  {
    const primeInput: Partial<RiskInputContext> = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-prime-001',
      customerId: 'cust-prime-001',
      applicantAge: 32,
      monthlyIncome: 120000,
      existingObligations: 20000,
      foirPct: 16.6,
      dtiPct: 16.6,
      workExperienceMonths: 48,
      employerName: 'Tata Consultancy Services',
      bureauScore: 790,
      maxDPDLast12m: 0,
      hasOverdueAccounts: false,
      activeCreditLinesCount: 1,
      averageMonthlyBalance: 65000,
      chequeBouncesLast90d: 0,
      requestedAmount: 300000,
      requestedTenureMonths: 24,
      applicationVelocity24h: 1,
    };

    const primeEval = await riskService.evaluateApplication(
      primeInput.applicationId!,
      primeInput.tenantId!,
      primeInput
    );
    assert(primeEval.riskScore >= 0 && primeEval.riskScore <= 35, `Prime risk score is low (${primeEval.riskScore})`);
    assert(primeEval.riskBand === 'LOW' || primeEval.riskBand === 'MODERATE', `Prime risk band is LOW/MODERATE (${primeEval.riskBand})`);
    assert(primeEval.riskGrade === 'A' || primeEval.riskGrade === 'B', `Prime risk grade is A or B (${primeEval.riskGrade})`);
    assert(primeEval.signals.length >= 4, `Extracted 4 or more risk signals (${primeEval.signals.length})`);
    assert(primeEval.categorySummaries.CUSTOMER.score >= 0, 'Customer pillar summary computed');
    assert(primeEval.categorySummaries.FINANCIAL.score >= 0, 'Financial pillar summary computed');
    assert(primeEval.categorySummaries.CREDIT.score >= 0, 'Credit pillar summary computed');
    assert(primeEval.categorySummaries.BANKING.score >= 0, 'Banking pillar summary computed');

    // Subprime / High Risk scenario
    const subprimeInput: Partial<RiskInputContext> = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-subprime-001',
      customerId: 'cust-subprime-001',
      applicantAge: 20,
      monthlyIncome: 25000,
      existingObligations: 18000, // High FOIR
      foirPct: 72,
      dtiPct: 72,
      workExperienceMonths: 3,
      bureauScore: 580,
      maxDPDLast12m: 60,
      hasOverdueAccounts: true,
      averageMonthlyBalance: 800,
      chequeBouncesLast90d: 4,
      requestedAmount: 500000,
      requestedTenureMonths: 48,
      applicationVelocity24h: 5,
    };

    const subprimeEval = await riskService.evaluateApplication(
      subprimeInput.applicationId!,
      subprimeInput.tenantId!,
      subprimeInput
    );
    assert(subprimeEval.riskScore >= 50, `Subprime risk score is high (${subprimeEval.riskScore})`);
    assert(subprimeEval.riskBand === 'MEDIUM' || subprimeEval.riskBand === 'HIGH' || subprimeEval.riskBand === 'VERY_HIGH', `Subprime risk band is elevated (${subprimeEval.riskBand})`);
    assert(subprimeEval.keyRiskDrivers.length > 0, `Key risk drivers identified (${subprimeEval.keyRiskDrivers.length})`);

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 2: 5-Pillar Fraud Signals Extraction & Anomaly Scoring
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 2] 5-Pillar Fraud Signals & Anomaly Detection');
  totalTests++;
  {
    const cleanFraudInput: Partial<FraudInputContext> = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-fraud-clean-001',
      customerId: 'cust-clean-001',
      panNumber: 'ABCDE1234F',
      declaredName: 'Rahul Sharma',
      bureauName: 'Rahul Sharma',
      bankAccountHolderName: 'Rahul Sharma',
      pennyDropStatus: 'VERIFIED',
      deviceId: 'dev-clean-uuid-001',
      isRootedOrJailbroken: false,
      isEmulator: false,
      ipAddress: '103.45.22.10',
      isVpnOrProxy: false,
      isTorExitNode: false,
      applicationsLast24h: 1,
    };

    const cleanFraudEval = await fraudService.evaluateApplication(
      cleanFraudInput.applicationId!,
      cleanFraudInput.tenantId!,
      cleanFraudInput
    );
    assert(cleanFraudEval.fraudScore <= 35, `Clean fraud score is low (${cleanFraudEval.fraudScore})`);
    assert(cleanFraudEval.outcome === 'CLEAR' || cleanFraudEval.outcome === 'LOW_RISK', `Clean outcome is CLEAR/LOW_RISK (${cleanFraudEval.outcome})`);
    assert(cleanFraudEval.signals.length >= 4, `Extracted 4+ fraud signals (${cleanFraudEval.signals.length})`);

    // Tampered / High Fraud scenario
    const highFraudInput: Partial<FraudInputContext> = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-fraud-syndicate-001',
      customerId: 'cust-syndicate-001',
      panNumber: 'INVALID_PAN',
      declaredName: 'Vikram Singh',
      bureauName: 'Amit Kumar', // Strong name mismatch
      bankAccountHolderName: 'Amit Kumar',
      deviceId: 'dev-emulator-001',
      isRootedOrJailbroken: true,
      isEmulator: true,
      ipAddress: '185.220.101.5', // Tor exit node / VPN
      isVpnOrProxy: true,
      isTorExitNode: true,
      applicationsLast24h: 8, // Velocity burst
      panNameMismatchScore: 75,
      duplicatePanCount: 1,
      bankNameMismatchPct: 60,
      bankAccountLinkedToOtherCustomersCount: 3,
      deviceUsedByCustomersCount: 2,
    };

    const highFraudEval = await fraudService.evaluateApplication(
      highFraudInput.applicationId!,
      highFraudInput.tenantId!,
      highFraudInput
    );
    assert(highFraudEval.fraudScore >= 50, `Syndicate fraud score is high (${highFraudEval.fraudScore})`);
    assert(highFraudEval.outcome === 'HIGH_RISK' || highFraudEval.outcome === 'BLOCK' || highFraudEval.outcome === 'REVIEW', `High fraud outcome is elevated (${highFraudEval.outcome})`);
    assert(highFraudEval.keyFraudFlags.length >= 2, `Multiple anomaly flags raised (${highFraudEval.keyFraudFlags.length})`);

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 3: 2D Risk x Fraud Matrix
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 3] 2D Risk x Fraud Matrix Unified Actions');
  totalTests++;
  {
    // (LOW risk, CLEAR fraud) -> NORMAL
    const matrix1 = riskFraudMatrixService.evaluateMatrix('LOW', 'CLEAR');
    assert(matrix1.operationalAction === 'NORMAL', `LOW x CLEAR -> NORMAL (${matrix1.operationalAction})`);
    assert(matrix1.allowInstantSanction === true, 'Allows instant sanction');

    // (LOW risk, REVIEW fraud) -> FRAUD_REVIEW
    const matrix2 = riskFraudMatrixService.evaluateMatrix('LOW', 'REVIEW');
    assert(matrix2.operationalAction === 'FRAUD_REVIEW', `LOW x REVIEW -> FRAUD_REVIEW (${matrix2.operationalAction})`);

    // (MEDIUM risk, LOW_RISK fraud) -> CREDIT_REVIEW
    const matrix3 = riskFraudMatrixService.evaluateMatrix('MEDIUM', 'LOW_RISK');
    assert(matrix3.operationalAction === 'CREDIT_REVIEW', `MEDIUM x LOW_RISK -> CREDIT_REVIEW (${matrix3.operationalAction})`);

    // (MEDIUM risk, REVIEW fraud) -> ADDITIONAL_REVIEW
    const matrix4 = riskFraudMatrixService.evaluateMatrix('MEDIUM', 'REVIEW');
    assert(matrix4.operationalAction === 'ADDITIONAL_REVIEW', `MEDIUM x REVIEW -> ADDITIONAL_REVIEW (${matrix4.operationalAction})`);

    // (ANY risk, CRITICAL_FRAUD / BLOCK) -> BLOCK
    const matrix5 = riskFraudMatrixService.evaluateMatrix('LOW', 'BLOCK');
    assert(matrix5.operationalAction === 'BLOCK', `LOW x BLOCK -> BLOCK (${matrix5.operationalAction})`);
    assert(matrix5.hardBlock === true, 'Triggers hard block');

    // (VERY_HIGH risk, ANY fraud) -> BLOCK
    const matrix6 = riskFraudMatrixService.evaluateMatrix('VERY_HIGH', 'CLEAR');
    assert(matrix6.operationalAction === 'BLOCK', `VERY_HIGH x CLEAR -> BLOCK (${matrix6.operationalAction})`);

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 4: Identity Graph Entity Linkages & Syndicate Cluster
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 4] Identity Graph Cluster Analysis');
  totalTests++;
  {
    // Register two distinct customers sharing a bank account and IP
    identityGraphService.registerEntity({
      tenantId: 'tenant-test-001',
      customerId: 'cust-graph-001',
      customerName: 'Pooja Hegde',
      pan: 'ABCDE9999P',
      mobile: '+919876543210',
      email: 'pooja@example.com',
      bankAccount: 'SHARED_HDFC_998877',
      deviceId: 'dev-graph-shared',
      ipAddress: '103.11.22.33',
    });

    identityGraphService.registerEntity({
      tenantId: 'tenant-test-001',
      customerId: 'cust-graph-002',
      customerName: 'Anil Kapoor',
      pan: 'FGHIJ8888A',
      mobile: '+919876543219',
      email: 'anil@example.com',
      bankAccount: 'SHARED_HDFC_998877', // Shared bank account!
      deviceId: 'dev-graph-shared',          // Shared device!
      ipAddress: '103.11.22.33',             // Shared IP!
    });

    const cluster1 = identityGraphService.buildCluster('tenant-test-001', 'cust-graph-001');
    assert(cluster1.nodes.length >= 7, `Identity graph built with ${cluster1.nodes.length} nodes`);
    assert(cluster1.linkedCustomersCount >= 1, `Discovered linked customer (${cluster1.linkedCustomersCount})`);
    assert(cluster1.linkedAccountsCount >= 1, `Detected shared disbursement account (${cluster1.linkedAccountsCount})`);
    assert(cluster1.maxSeverity === 'HIGH' || cluster1.maxSeverity === 'CRITICAL', `Cluster flagged with elevated severity (${cluster1.maxSeverity})`);
    assert(cluster1.clusterRiskScore >= 40, `Cluster risk score calculated (${cluster1.clusterRiskScore})`);

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 5: Deterministic Fraud Rules Engine
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 5] Fraud Rules Engine Execution & Dynamic Configuration');
  totalTests++;
  {
    fraudRulesEngine.seedCanonicalRules('tenant-test-001');
    const allRules = fraudRulesEngine.listRules('tenant-test-001');
    assert(allRules.length >= 10, `Default rule catalog loaded (${allRules.length} rules)`);

    // Test Rule Trigger: Device Rooted
    const rootedContext: any = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-rule-test-001',
      customerId: 'cust-rule-001',
      isRootedOrJailbroken: true,
      isEmulator: true,
    };
    const ruleEval1 = fraudRulesEngine.evaluateAllRules('tenant-test-001', rootedContext);
    const hasRootedTrigger = ruleEval1.triggeredRules.some(r => r.rule.code === 'FRAUD_RULE_DEVICE_ROOT_EMULATOR');
    assert(hasRootedTrigger, 'FRAUD_RULE_DEVICE_ROOT_EMULATOR triggered on rooted device context');

    // Test Custom Rule Creation
    const customRule = fraudRulesEngine.createRule('tenant-test-001', {
      code: 'FRAUD_RULE_CUSTOM_VELOCITY',
      name: 'Custom High Velocity Trigger',
      description: 'Flags extreme burst velocity',
      category: 'APPLICATION_VELOCITY',
      field: 'applicationsLast24h',
      operator: 'GREATER_THAN',
      expectedValue: 5,
      severity: 'CRITICAL',
      scoreImpact: 45,
      reasonCode: 'WARN_VELOCITY_OVERFLOW',
    });
    assert(customRule.id !== undefined, 'Custom fraud rule successfully created');

    // Test Rule Toggle
    const toggled = fraudRulesEngine.updateRule('tenant-test-001', customRule.id, { enabled: false });
    assert(toggled?.enabled === false, 'Fraud rule successfully disabled');

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 6: Fraud Investigation Case Desk Lifecycle
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 6] Fraud Investigation Case Desk Lifecycle');
  totalTests++;
  {
    // Create Case
    const fraudCase = fraudService.createCase('tenant-test-001', {
      applicationId: 'app-case-001',
      notes: 'Initial investigation trigger for shared bank account reuse.',
    });
    assert(fraudCase.status === 'OPEN', `New fraud case created in OPEN status (${fraudCase.status})`);

    // Assign Case
    const assignedCase = fraudService.assignCase('tenant-test-001', fraudCase.id, 'user-investigator-01', 'Special Fraud Investigator');
    assert(assignedCase.status === 'IN_REVIEW', `Assigned case transitioned to IN_REVIEW (${assignedCase.status})`);
    assert(assignedCase.assignedToUserId === 'user-investigator-01', 'Assigned to correct user ID');

    // Add Note
    const notedCase = fraudService.addCaseNote('tenant-test-001', fraudCase.id, 'Conducted telephone verification; applicant confirmed account belongs to brother.', {
      id: 'user-investigator-01',
      name: 'Special Fraud Investigator',
      role: 'FRAUD_ANALYST',
    });
    assert(notedCase.notes.length >= 2, `Case timeline note appended (${notedCase.notes.length})`);

    // Add Evidence
    const evidencedCase = fraudService.addCaseEvidence('tenant-test-001', fraudCase.id, {
      type: 'BANK_STATEMENT',
      title: 'Joint Account Confirmation Letter',
      description: 'Signed affidavit from primary account holder.',
      addedBy: 'user-investigator-01',
    });
    assert(evidencedCase.evidence.length === 1, `Evidence document registered (${evidencedCase.evidence.length})`);

    // Resolve Case
    const resolvedCase = fraudService.resolveCase('tenant-test-001', fraudCase.id, {
      resolution: 'CLEARED',
      reason: 'Legitimate joint account confirmed with documentary proof and consent.',
    }, 'user-investigator-01');
    assert(resolvedCase.status === 'CLEARED', `Case resolved with status CLEARED (${resolvedCase.status})`);

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 7: Immutable Versioned Snapshots (v1, v2) & Reproducibility
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 7] Immutable Versioned Snapshots (v1, v2) & Reproducibility');
  totalTests++;
  {
    const appInput1: Partial<RiskInputContext> = {
      tenantId: 'tenant-test-001',
      applicationId: 'app-versioned-001',
      customerId: 'cust-versioned-001',
      applicantAge: 28,
      monthlyIncome: 60000,
      existingObligations: 25000,
      foirPct: 41,
      bureauScore: 710,
    };

    const snapV1 = await riskService.evaluateApplication(
      appInput1.applicationId!,
      appInput1.tenantId!,
      appInput1
    );
    assert(snapV1.evaluationVersion === 1, `First evaluation is snapshot v1 (${snapV1.evaluationVersion})`);

    // Re-evaluate with modified income
    const appInput2: Partial<RiskInputContext> = {
      ...appInput1,
      monthlyIncome: 110000,
      existingObligations: 15000,
      foirPct: 13.6,
      bureauScore: 780,
    };

    const snapV2 = await riskService.evaluateApplication(
      appInput2.applicationId!,
      appInput2.tenantId!,
      appInput2
    );
    assert(snapV2.evaluationVersion === 2, `Re-evaluation is snapshot v2 (${snapV2.evaluationVersion})`);
    assert(snapV2.riskScore < snapV1.riskScore, `v2 score (${snapV2.riskScore}) is lower than v1 (${snapV1.riskScore}) due to higher income`);

    // Fetch snapshot history
    const history = riskService.listEvaluationHistory('tenant-test-001', 'app-versioned-001');
    assert(history.length === 2, `Complete snapshot history preserved with 2 versions (${history.length})`);
    assert(history[0].evaluationVersion === 1, 'Historical v1 preserved unchanged');
    assert(history[1].evaluationVersion === 2, 'Historical v2 preserved unchanged');

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 8: Audited Overrides & Segregation of Duties (SoD)
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 8] Audited Manual Overrides & SoD Enforcement');
  totalTests++;
  {
    // Apply Override on snapV2
    const overridden = await riskService.overrideRiskScore('tenant-test-001', 'app-versioned-001', {
      newScore: 18,
      newGrade: 'A',
      reason: 'Senior Credit Committee special approval for high-net-worth customer vintage.',
      comments: 'Salary confirmed with employer HR direct verification.',
      overriddenBy: 'user-manager-001',
      overrideRole: 'RISK_MANAGER',
    });
    assert(overridden.riskScore === 18, `Risk score successfully overridden to ${overridden.riskScore}`);
    assert(overridden.riskGrade === 'A', `Risk grade overridden to ${overridden.riskGrade}`);
    assert(overridden.override !== null, 'Override metadata attached');
    assert(overridden.override?.overriddenBy === 'user-manager-001', 'Overriding officer logged');

    // Test SoD Rule Registration
    const sodDisburserCheck = rolePermissionService.hasPermission(['FRAUD_ANALYST'], 'DISBURSEMENT_INITIATE' as any);
    assert(!sodDisburserCheck, 'SoD: FRAUD_ANALYST cannot initiate disbursements (SOD_FRAUD_ANALYST_DISBURSER)');

    const sodAuditorCheck = rolePermissionService.hasPermission(['AUDITOR'], 'RISK_MANAGE_POLICIES');
    assert(!sodAuditorCheck, 'SoD: AUDITOR cannot manage risk policies (SOD_AUDITOR_RISK_POLICY_PUBLISHER)');

    const riskManagerCheck = rolePermissionService.hasPermission(['RISK_MANAGER'], 'RISK_OVERRIDE');
    assert(riskManagerCheck, 'RISK_MANAGER is authorized to perform risk overrides');

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 9: Customer & Partner Safe View Sanitization
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 9] Customer & Partner Safe View Redaction');
  totalTests++;
  {
    const rawRiskEval = riskService.getLatestEvaluation('tenant-test-001', 'app-prime-001');
    assert(rawRiskEval !== null, 'Found raw risk evaluation');

    const customerSafeRisk = riskService.getCustomerSafeSummary(rawRiskEval!);
    assert((customerSafeRisk as any).signals === undefined, 'Internal pillar signal weights redacted for customer');
    assert(customerSafeRisk.status === 'ASSESSED', 'Customer receives high-level assessed status');

    const rawFraudEval = fraudService.getLatestEvaluation('tenant-test-001', 'app-fraud-syndicate-001');
    assert(rawFraudEval !== null, 'Found raw fraud evaluation');

    const customerSafeFraud = fraudService.getCustomerSafeSummary(rawFraudEval!);
    assert((customerSafeFraud as any).fraudScore === undefined, 'Numerical fraud anomaly score redacted for customer');
    assert((customerSafeFraud as any).triggeredRules === undefined, 'Internal fraud detection rule codes redacted for customer');
    assert((customerSafeFraud as any).identityGraph === undefined, 'Syndicate entity network topology redacted for customer');

    passedTests++;
  }

  // --------------------------------------------------------------------------
  // TEST 10: Core Decision Engine (BRE) Integration
  // --------------------------------------------------------------------------
  console.log('\n▶ [TEST 10] BRE Decision Context Enrichment');
  totalTests++;
  {
    const mockDbApplication = {
      id: 'app-bre-test-001',
      applicationNo: 'APP-BRE-001',
      tenantId: 'tenant-test-001',
      customerId: 'cust-bre-001',
      productId: 'prod-001',
      requestedAmount: 200000,
      requestedTenure: 24,
      status: 'UNDERWRITING',
      customer: {
        id: 'cust-bre-001',
        employmentType: 'SALARIED',
        monthlyIncome: 75000,
        age: 30,
        cibilScore: 760,
        riskCategory: 'LOW',
        bankAccounts: [{ balance: 35000 }],
        loans: [],
        documents: [],
      },
      product: {
        id: 'prod-001',
        code: 'PROD_PL_UNSECURED',
        name: 'Personal Loan',
        minAmount: 50000,
        maxAmount: 1000000,
        minInterestRate: 12,
        maxInterestRate: 24,
      },
      obligations: [{ monthlyEmi: 15000 }],
      bankStatements: [{ averageMonthlyBalance: 35000, chequeBounceCount: 0 }],
      kycDocuments: [{ status: 'VERIFIED' }],
    };

    const decisionContext = await buildDecisionContext(mockDbApplication as any);
    assert(decisionContext.riskScore !== undefined, `DecisionContext enriched with riskScore (${decisionContext.riskScore})`);
    assert(decisionContext.riskBand !== undefined, `DecisionContext enriched with riskBand (${decisionContext.riskBand})`);
    assert(decisionContext.fraudScore !== undefined, `DecisionContext enriched with fraudScore (${decisionContext.fraudScore})`);
    assert(decisionContext.fraudOutcome !== undefined, `DecisionContext enriched with fraudOutcome (${decisionContext.fraudOutcome})`);
    assert(decisionContext.matrixAction !== undefined, `DecisionContext enriched with 2D matrixAction (${decisionContext.matrixAction})`);

    passedTests++;
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 9 TEST SUITES PASSED WITH 100% SUCCESS!`);
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
