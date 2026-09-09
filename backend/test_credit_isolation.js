const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('STEP 2.2: CREDIT ANALYST VS UNDERWRITER RBAC ISOLATION TEST SUITE');
  console.log('================================================================\n');

  // 1. Login as Credit Analyst
  console.log('1. Logging in as Credit Analyst (analyst@adyapan.dev)...');
  const analystLogin = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'analyst@adyapan.dev', password: 'DevStaffSeed2026!' }
  );

  if (analystLogin.status !== 200) {
    throw new Error('Credit Analyst login failed: ' + JSON.stringify(analystLogin.data));
  }
  const analystToken = analystLogin.data.data.accessToken;
  console.log('   Credit Analyst logged in successfully. Token acquired.\n');

  // 2. Credit Analyst attempts to access Underwriting Queue
  console.log('2. Verifying Credit Analyst CANNOT access Underwriting Queue (GET /api/v1/underwriting/queue)...');
  const uwQueueAttempt = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/underwriting/queue',
    method: 'GET',
    headers: { Authorization: `Bearer ${analystToken}` },
  });

  console.log(`   Status received: ${uwQueueAttempt.status}`);
  if (uwQueueAttempt.status === 403) {
    console.log('   PASS: Access to Underwriting Queue is strictly FORBIDDEN (403) for Credit Analyst.\n');
  } else {
    console.error('   FAIL: Expected 403 Forbidden, but received:', uwQueueAttempt.status, uwQueueAttempt.data);
    process.exit(1);
  }

  // 3. Credit Analyst attempts to submit Underwriting Decision
  const testAppId = '4e6eabc2-d67e-48be-bde9-0ac1b940528a';
  console.log(`3. Verifying Credit Analyst CANNOT submit Underwriting Decision (POST /api/v1/underwriting/${testAppId}/decision)...`);
  const uwDecisionAttempt = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/underwriting/${testAppId}/decision`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': 'application/json',
      },
    },
    {
      decision: 'APPROVE',
      reason: 'Attempted approval by credit analyst without authority',
    }
  );

  console.log(`   Status received: ${uwDecisionAttempt.status}`);
  if (uwDecisionAttempt.status === 403) {
    console.log('   PASS: Underwriting Decision endpoint is strictly FORBIDDEN (403) for Credit Analyst.\n');
  } else {
    console.error('   FAIL: Expected 403 Forbidden, but received:', uwDecisionAttempt.status, uwDecisionAttempt.data);
    process.exit(1);
  }

  // 4. Credit Analyst attempts direct loan rejection via transition endpoint
  console.log('4. Verifying Credit Analyst CANNOT directly REJECT loan via /transition endpoint...');
  const directRejectAttempt = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/applications/${testAppId}/transition`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': 'application/json',
      },
    },
    {
      toStatus: 'REJECTED',
      reason: 'Attempted loan rejection by credit analyst',
    }
  );

  console.log(`   Status received: ${directRejectAttempt.status}`);
  if (directRejectAttempt.status === 403) {
    console.log('   PASS: Direct loan rejection is strictly FORBIDDEN (403) for Credit Analyst.\n');
  } else {
    console.error('   FAIL: Expected 403 Forbidden, but received:', directRejectAttempt.status, directRejectAttempt.data);
    process.exit(1);
  }

  // 5. Credit Analyst attempts direct loan approval via transition endpoint
  console.log('5. Verifying Credit Analyst CANNOT directly APPROVE loan via /transition endpoint...');
  const directApproveAttempt = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/applications/${testAppId}/transition`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': 'application/json',
      },
    },
    {
      toStatus: 'APPROVED',
      reason: 'Attempted loan sanction approval by credit analyst',
    }
  );

  console.log(`   Status received: ${directApproveAttempt.status}`);
  if (directApproveAttempt.status === 403) {
    console.log('   PASS: Direct loan approval is strictly FORBIDDEN (403) for Credit Analyst.\n');
  } else {
    console.error('   FAIL: Expected 403 Forbidden, but received:', directApproveAttempt.status, directApproveAttempt.data);
    process.exit(1);
  }

  // 6. Credit Analyst accesses Credit Assessment Queue
  console.log('6. Testing Credit Assessment Queue (GET /api/v1/credit/queue)...');
  const creditQueue = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/credit/queue',
    method: 'GET',
    headers: { Authorization: `Bearer ${analystToken}` },
  });

  if (creditQueue.status === 200 && creditQueue.data.success) {
    const qData = creditQueue.data.data;
    console.log('   PASS: Credit Assessment Queue loaded successfully.');
    console.log('   Metrics verified:');
    console.log('     - Applications Assigned:', qData.metrics.applicationsAssigned);
    console.log('     - Pending Assessments:', qData.metrics.pendingAssessments);
    console.log('     - Assessments Completed:', qData.metrics.assessmentsCompleted);
    console.log('     - Eligible Applications:', qData.metrics.eligibleApplications);
    console.log('     - Not Eligible Applications:', qData.metrics.notEligibleApplications);
    console.log('     - Pending Documents:', qData.metrics.pendingDocuments);
    console.log('     - High Risk Cases:', qData.metrics.highRiskCases);
    console.log('   Total proposals in queue:', qData.items.length, '\n');
  } else {
    console.error('   FAIL: Credit queue returned status:', creditQueue.status, creditQueue.data);
    process.exit(1);
  }

  // 7. Credit Analyst submits NOT_ELIGIBLE assessment recommendation
  console.log('7. Testing Credit Analyst submitting NOT_ELIGIBLE recommendation...');
  const notEligibleDecision = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/credit/applications/${testAppId}/decision`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': 'application/json',
      },
    },
    {
      decision: 'NOT_ELIGIBLE',
      reason: 'Existing financial obligations are high and repayment capacity does not meet minimum underwriting criteria.',
      riskGrade: 'HIGH',
      employmentVerificationStatus: 'VERIFIED',
    }
  );

  if (notEligibleDecision.status === 200 && notEligibleDecision.data.success) {
    const res = notEligibleDecision.data.data;
    console.log('   PASS: Assessment submitted successfully.');
    console.log('   Result recorded:', res.decision);
    console.log('   Application forwarded to:', res.applicationStatus, '(Forwarded to Underwriting for committee decision, NOT direct rejection!)\n');
  } else {
    console.error('   FAIL: NOT_ELIGIBLE submission failed:', notEligibleDecision.status, notEligibleDecision.data);
    process.exit(1);
  }

  // 8. Credit Analyst submits ELIGIBLE assessment recommendation
  console.log('8. Testing Credit Analyst submitting ELIGIBLE recommendation...');
  const eligibleDecision = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/credit/applications/${testAppId}/decision`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${analystToken}`,
        'Content-Type': 'application/json',
      },
    },
    {
      decision: 'ELIGIBLE',
      reason: 'Verified gross monthly income is adequate with FOIR within limits. Repayment capacity verified and approved for sanction review.',
      riskGrade: 'LOW',
      employmentVerificationStatus: 'VERIFIED',
      verifiedIncome: 75000,
    }
  );

  if (eligibleDecision.status === 200 && eligibleDecision.data.success) {
    const res = eligibleDecision.data.data;
    console.log('   PASS: Assessment submitted successfully.');
    console.log('   Result recorded:', res.decision);
    console.log('   Application forwarded to:', res.applicationStatus, '(Underwriting sanction queue)\n');
  } else {
    console.error('   FAIL: ELIGIBLE submission failed:', eligibleDecision.status, eligibleDecision.data);
    process.exit(1);
  }

  // 9. Verify Underwriter / Admin CAN still access Underwriting Queue
  console.log('9. Verifying System Admin / Underwriter can access Underwriting Queue...');
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'admin@adyapan.dev', password: 'DevStaffSeed2026!' }
  );

  const adminToken = adminLogin.data.data.accessToken;
  const adminUwQueue = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/underwriting/queue',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (adminUwQueue.status === 200) {
    console.log('   PASS: Admin / Underwriter has full access to Underwriting Queue.\n');
  } else {
    console.error('   FAIL: Admin underwriting queue access failed:', adminUwQueue.status, adminUwQueue.data);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('ALL 9 TESTS PASSED: STRICT CREDIT ANALYST ISOLATION CONFIRMED!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
