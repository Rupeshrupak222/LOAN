// Phase 2: BRE & Decision Engine End-to-End Verification Test Script
const http = require('http');

const BASE_URL = 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers,
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('🚀 ADYAPAN LENDING OS — PHASE 2 BRE & DECISION ENGINE TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Authenticate as Admin
  console.log('1. Authentication & Session Initialization:');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      identifier: 'admin@adyapan.dev',
      password: 'Passw0rd123!',
    },
  });

  assert(loginRes.status === 200, `Admin login successful (HTTP ${loginRes.status})`);
  const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
  const tenantId = loginRes.data?.data?.user?.tenantId || 'tenant-adyapan-default';
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
  };

  // 2. Fetch Active Decision Policies
  console.log('\n2. Decision Policy Catalog & Seeding:');
  const policiesRes = await request('/decision-policies/policies', { headers: authHeaders });
  assert(policiesRes.status === 200, `Fetch decision policies (HTTP ${policiesRes.status})`);
  const policies = policiesRes.data?.data || policiesRes.data || [];
  assert(Array.isArray(policies) && policies.length > 0, `Discovered ${policies.length} decision policies`);

  const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0];
  assert(!!activePolicy, `Active policy identified: ${activePolicy?.code} (v${activePolicy?.version})`);

  // 3. Create New Decision Policy & Versioning
  console.log('\n3. Policy Lifecycle & Incremental Versioning:');
  const newPolicyCode = `TEST_POLICY_${Date.now().toString().slice(-4)}`;
  const createPolicyRes = await request('/decision-policies/policies', {
    method: 'POST',
    headers: authHeaders,
    body: {
      code: newPolicyCode,
      name: 'Custom Test Underwriting Policy',
      description: 'End-to-end integration test policy',
      ruleGroups: [
        {
          id: `grp_elig_${Date.now()}`,
          code: 'TEST_ELIGIBILITY',
          name: 'Test Eligibility Rules',
          description: 'Basic criteria',
          category: 'ELIGIBILITY',
          logicalOperator: 'AND',
          enabled: true,
          rules: [
            {
              id: `rule_age_${Date.now()}`,
              code: 'MIN_AGE_TEST',
              name: 'Minimum Age 21',
              description: 'Applicant must be at least 21',
              category: 'ELIGIBILITY',
              field: 'borrower.age',
              operator: 'GREATER_THAN_OR_EQUAL',
              expectedValue: 21,
              severity: 'HARD_STOP',
              actionOnPass: 'PASS',
              actionOnFail: 'FAIL',
              reasonCode: 'AGE_BELOW_MINIMUM',
              customerReason: 'Applicant age is below minimum requirements.',
              weight: 20,
              enabled: true,
              priority: 1,
            },
          ],
        },
      ],
    },
  });

  assert(createPolicyRes.status === 201, `Create new policy returns 201 Created`);
  const createdPolicy = createPolicyRes.data?.data || createPolicyRes.data;
  assert(createdPolicy?.code === newPolicyCode, `Created policy code matches: ${createdPolicy?.code}`);
  assert(createdPolicy?.version === 1, `Initial policy version is v1`);

  // Create Policy Version v2
  const versionRes = await request(`/decision-policies/policies/${createdPolicy.id}/versions`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(versionRes.status === 201, `Create policy version returns 201 Created`);
  const v2Policy = versionRes.data?.data || versionRes.data;
  assert(v2Policy?.version === 2, `Incremental policy version is v${v2Policy?.version}`);
  assert(v2Policy?.status === 'DRAFT', `New policy version initializes in DRAFT status`);

  // Activate Policy v2
  const activateRes = await request(`/decision-policies/policies/${v2Policy.id}/activate`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert(activateRes.status === 200, `Activate policy returns 200 OK`);
  const activatedPolicy = activateRes.data?.data || activateRes.data;
  assert(activatedPolicy?.status === 'ACTIVE', `Policy status is now ACTIVE`);

  // 4. Decision Engine Simulator (Stateless What-If Tests)
  console.log('\n4. BRE Decision Simulator & Rule Engine Tests:');

  // Scenario A: Prime Borrower -> APPROVE
  const primeSimRes = await request('/decision-engine/simulate', {
    method: 'POST',
    headers: authHeaders,
    body: {
      productId: 'PROD_PL_PERSONAL_LOAN',
      loanAmount: 300000,
      tenureMonths: 36,
      applicantAge: 32,
      employmentType: 'SALARIED',
      monthlyIncome: 80000,
      existingObligations: 10000,
      cibilScore: 760,
      cibilOverdueAccounts: 0,
      cibilDPD30Last12m: 0,
      averageBankBalance: 25000,
      bankBounces90d: 0,
      kycVerified: true,
      fraudRiskScore: 5,
    },
  });

  assert(primeSimRes.status === 200, `Prime simulation executed (HTTP ${primeSimRes.status})`);
  const primeDecision = primeSimRes.data?.data || primeSimRes.data;
  assert(
    ['APPROVE', 'APPROVE_WITH_CONDITIONS'].includes(primeDecision.decision),
    `Prime borrower verdict: ${primeDecision.decision} (Expected APPROVE)`
  );
  assert(primeDecision.riskGrade === 'A' || primeDecision.riskGrade === 'B', `Prime risk grade: ${primeDecision.riskGrade}`);
  assert(primeDecision.foirPct > 0 && primeDecision.foirPct <= 50, `Decimal FOIR calculated: ${primeDecision.foirPct}%`);
  assert(primeDecision.eligibleAmount >= 300000, `Eligible amount: ₹${primeDecision.eligibleAmount.toLocaleString('en-IN')}`);
  assert(primeDecision.passedRules.length > 0, `Passed rules count: ${primeDecision.passedRules.length}`);

  // Scenario B: High FOIR -> REFER / APPROVE_WITH_CONDITIONS
  const highFoirSimRes = await request('/decision-engine/simulate', {
    method: 'POST',
    headers: authHeaders,
    body: {
      productId: 'PROD_PL_PERSONAL_LOAN',
      loanAmount: 500000,
      tenureMonths: 24,
      applicantAge: 29,
      employmentType: 'SALARIED',
      monthlyIncome: 35000,
      existingObligations: 20000, // Very high existing obligations
      cibilScore: 710,
      cibilOverdueAccounts: 0,
      cibilDPD30Last12m: 0,
      averageBankBalance: 4000,
      bankBounces90d: 0,
      kycVerified: true,
      fraudRiskScore: 10,
    },
  });

  const highFoirDecision = highFoirSimRes.data?.data || highFoirSimRes.data;
  assert(
    highFoirDecision.decision === 'REFER' || highFoirDecision.decision === 'REJECT',
    `High FOIR verdict: ${highFoirDecision.decision} (Calculated FOIR: ${highFoirDecision.foirPct}%)`
  );
  assert(
    highFoirDecision.reasons.some((r) => r.toLowerCase().includes('foir') || r.toLowerCase().includes('financial')) ||
      highFoirDecision.failedRules.some((r) => r.field.includes('foir')),
    `Adverse reason or rule reflects FOIR threshold breach`
  );

  // Scenario C: Subprime CIBIL & Write-offs -> REJECT
  const subprimeSimRes = await request('/decision-engine/simulate', {
    method: 'POST',
    headers: authHeaders,
    body: {
      productId: 'PROD_PL_PERSONAL_LOAN',
      loanAmount: 200000,
      tenureMonths: 24,
      applicantAge: 23,
      employmentType: 'SALARIED',
      monthlyIncome: 25000,
      existingObligations: 5000,
      cibilScore: 590, // Subprime score below 650 threshold
      cibilOverdueAccounts: 2,
      cibilDPD30Last12m: 60,
      averageBankBalance: 1500,
      bankBounces90d: 3,
      kycVerified: true,
      fraudRiskScore: 20,
    },
  });

  const subprimeDecision = subprimeSimRes.data?.data || subprimeSimRes.data;
  assert(subprimeDecision.decision === 'REJECT', `Subprime credit verdict: ${subprimeDecision.decision}`);
  assert(
    subprimeDecision.failedRules.some((r) => r.ruleCode.includes('CIBIL') || r.ruleCode.includes('CREDIT')),
    `Subprime knockout captured in failedRules`
  );
  assert(subprimeDecision.riskGrade === 'E' || subprimeDecision.riskGrade === 'D', `Risk grade reflects high risk: ${subprimeDecision.riskGrade}`);

  // Scenario D: Fraud Signal / Duplicate Applicant -> Instant HARD_STOP REJECT
  const fraudSimRes = await request('/decision-engine/simulate', {
    method: 'POST',
    headers: authHeaders,
    body: {
      productId: 'PROD_PL_PERSONAL_LOAN',
      loanAmount: 300000,
      tenureMonths: 36,
      applicantAge: 30,
      employmentType: 'SALARIED',
      monthlyIncome: 80000,
      existingObligations: 5000,
      cibilScore: 780,
      cibilOverdueAccounts: 0,
      cibilDPD30Last12m: 0,
      averageBankBalance: 20000,
      bankBounces90d: 0,
      kycVerified: false,
      fraudRiskScore: 90, // Severe fraud risk
    },
  });

  const fraudDecision = fraudSimRes.data?.data || fraudSimRes.data;
  assert(fraudDecision.decision === 'REJECT', `Fraud signal verdict: ${fraudDecision.decision}`);
  assert(
    fraudDecision.failedRules.some((r) => r.severity === 'HARD_STOP' || r.category === 'FRAUD_RISK'),
    `HARD_STOP fraud rule triggered knockout`
  );

  // 5. Live Application Decision Evaluation & Snapshot Persistence
  console.log('\n5. Live Application Evaluation & Snapshot Persistence:');
  const appId = `app_test_${Date.now().toString().slice(-6)}`;

  // Evaluate Application v1
  const evalV1Res = await request(`/decision-engine/evaluate/${appId}`, {
    method: 'POST',
    headers: authHeaders,
  });

  assert(evalV1Res.status === 200, `Evaluate live application returns HTTP 200`);
  const snapshotV1 = evalV1Res.data?.data || evalV1Res.data;
  assert(snapshotV1.applicationId === appId, `Snapshot linked to applicationId: ${snapshotV1.applicationId}`);
  assert(snapshotV1.decisionVersion === 1, `Decision version is v1`);
  assert(!!snapshotV1.decisionResult, `DecisionResult payload persisted in snapshot`);
  assert(!!snapshotV1.contextSnapshot, `Complete DecisionContext input preserved immutably`);

  // Re-evaluate Application (v2)
  const evalV2Res = await request(`/decision-engine/evaluate/${appId}`, {
    method: 'POST',
    headers: authHeaders,
  });

  assert(evalV2Res.status === 200, `Re-evaluate application returns HTTP 200`);
  const snapshotV2 = evalV2Res.data?.data || evalV2Res.data;
  assert(snapshotV2.decisionVersion === 2, `New decision version created: v${snapshotV2.decisionVersion}`);
  assert(snapshotV2.id !== snapshotV1.id, `Previous snapshot (v1) was NOT overwritten (Immutable ledger)`);

  // Fetch Decision History
  const historyRes = await request(`/decision-engine/applications/${appId}/decisions`, {
    headers: authHeaders,
  });
  assert(historyRes.status === 200, `Fetch application decisions history returns HTTP 200`);
  const history = historyRes.data?.data || historyRes.data || [];
  assert(history.length >= 2, `Decision history audit log contains ${history.length} versions`);

  // 6. Manual Underwriter Override & Audit Trail
  console.log('\n6. Manual Decision Override & Governance:');
  const overrideRes = await request(`/decision-engine/decisions/${snapshotV2.id}/override`, {
    method: 'POST',
    headers: authHeaders,
    body: {
      newDecision: 'APPROVE',
      reason: 'UNDERWRITER_POLICY_EXCEPTION',
      comments: 'Collateral value and strong guarantor compensating factor provided and verified.',
    },
  });

  assert(overrideRes.status === 200, `Execute manual override returns HTTP 200`);
  const overriddenRecord = overrideRes.data?.data || overrideRes.data;
  assert(overriddenRecord.finalDecision === 'APPROVE', `Final decision updated to: ${overriddenRecord.finalDecision}`);
  assert(overriddenRecord.systemDecision === snapshotV2.systemDecision, `Original systemDecision preserved untouched: ${overriddenRecord.systemDecision}`);
  assert(!!overriddenRecord.override, `Override audit block recorded with reason: ${overriddenRecord.override?.reason}`);

  // 7. Multi-Tenant Anti-Spoofing & Boundary Security Test
  console.log('\n7. Multi-Tenant Anti-Spoofing Security:');
  const crossTenantRes = await request('/decision-policies/policies', {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': 'tenant-foreign-evil-bank', // Spoofed header
    },
  });

  assert(
    crossTenantRes.status === 403,
    `Cross-tenant header tampering rejected with 403 Forbidden (Anti-Spoofing active)`
  );

  console.log('\n===============================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
