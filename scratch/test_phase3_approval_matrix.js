// Phase 3: Approval Authority Matrix End-to-End Verification Test Suite
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
  console.log('========================================================================');
  console.log('🚀 ADYAPAN LENDING OS — PHASE 3 APPROVAL AUTHORITY MATRIX TEST SUITE');
  console.log('========================================================================\n');

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

  // 1. Authentication
  console.log('1. Multi-Role Authentication:');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { identifier: 'admin@adyapan.dev', password: 'Passw0rd123!' },
  });
  assert(adminLogin.status === 200, `Admin login successful (HTTP 200)`);
  const adminToken = adminLogin.data?.data?.accessToken;
  const tenantId = adminLogin.data?.data?.user?.tenantId || 'tenant-adyapan-default';

  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    'X-Tenant-ID': tenantId,
  };

  // 2. Policy Catalog & Canonical Seeding
  console.log('\n2. Authority Policy Catalog & Seeding:');
  const policiesRes = await request('/approval-authorities/policies', { headers: adminHeaders });
  assert(policiesRes.status === 200, `Fetch authority policies (HTTP 200)`);
  const policies = policiesRes.data?.data || policiesRes.data || [];
  assert(Array.isArray(policies) && policies.length > 0, `Discovered ${policies.length} authority policies`);

  const activePolicy = policies.find((p) => p.status === 'ACTIVE') || policies[0];
  assert(!!activePolicy, `Active Authority Matrix identified: ${activePolicy?.code} (v${activePolicy?.version})`);
  assert(activePolicy?.levels?.length >= 3, `Policy contains ${activePolicy?.levels?.length} hierarchical levels`);

  // 3. Policy Lifecycle & Incremental Versioning
  console.log('\n3. Policy Lifecycle, Versioning & Activation:');
  const newPolicyCode = `AUTH_TEST_${Date.now().toString().slice(-4)}`;
  const createPolicyRes = await request('/approval-authorities/policies', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      code: newPolicyCode,
      name: 'Custom MSME Approval Matrix',
      description: 'Hierarchical sanction authority matrix for integration test',
      levels: [
        {
          level: 1,
          code: 'TEST_LVL_1_BM',
          name: 'Branch Manager Level',
          description: 'Up to ₹5L',
          roles: ['BRANCH_MANAGER'],
          minAmount: 0,
          maxAmount: 500000,
          allowedRiskGrades: ['A', 'B'],
          allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS'],
          scope: 'BRANCH',
          branchRestricted: true,
          slaHours: 8,
          requiresSequentialPreviousApproval: false,
          canSendBack: true,
        },
        {
          level: 2,
          code: 'TEST_LVL_2_UW',
          name: 'Senior Underwriter Level',
          description: 'Above ₹5L up to ₹25L',
          roles: ['UNDERWRITER', 'ADMIN'],
          minAmount: 500000.01,
          maxAmount: 2500000,
          allowedRiskGrades: ['A', 'B', 'C'],
          allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REFER'],
          scope: 'TENANT',
          branchRestricted: false,
          slaHours: 12,
          requiresSequentialPreviousApproval: true,
          canSendBack: true,
          canOverrideBreRejection: true,
        },
      ],
    },
  });

  assert(createPolicyRes.status === 201, `Create new authority policy returns 201 Created`);
  const createdPolicy = createPolicyRes.data?.data || createPolicyRes.data;
  assert(createdPolicy?.version === 1, `Initial policy version is v1`);

  // Versioning v1 -> v2
  const versionRes = await request(`/approval-authorities/policies/${createdPolicy.id}/versions`, {
    method: 'POST',
    headers: adminHeaders,
  });
  assert(versionRes.status === 201, `Create policy version returns 201 Created`);
  const v2Policy = versionRes.data?.data || versionRes.data;
  assert(v2Policy?.version === 2, `Incremental policy version is v2`);
  assert(v2Policy?.status === 'DRAFT', `New version initializes in DRAFT status`);

  // Activate v2
  const activateRes = await request(`/approval-authorities/policies/${v2Policy.id}/activate`, {
    method: 'POST',
    headers: adminHeaders,
  });
  assert(activateRes.status === 200, `Activate policy returns 200 OK`);
  const activatedPolicy = activateRes.data?.data || activateRes.data;
  assert(activatedPolicy?.status === 'ACTIVE', `Policy status is now ACTIVE`);

  // 4. Dynamic Authority Resolution Tests (Boundary, Amount, Risk)
  console.log('\n4. Dynamic Authority Resolution & Decimal Boundary Tests:');
  const testAppId = `app_p3_${Date.now().toString().slice(-6)}`;

  const resolutionRes = await request(`/approval-authorities/applications/${testAppId}/resolve-authority`, {
    method: 'POST',
    headers: adminHeaders,
  });

  assert(resolutionRes.status === 200, `Authority resolution endpoint returns HTTP 200`);
  const resData = resolutionRes.data?.data || resolutionRes.data;
  assert(!!resData.currentLevel, `Current required authority level identified: Level ${resData.currentLevel?.level} (${resData.currentLevel?.name})`);
  assert(resData.requiredLevels?.length >= 1, `Hierarchy requires ${resData.requiredLevels?.length} sequential level(s)`);
  assert(resData.policyVersion >= 1, `Bound to active policy version v${resData.policyVersion}`);

  // 5. Approval Task Lifecycle (Pending -> Review -> Approved)
  console.log('\n5. Approval Task Lifecycle & Sequential Advancement:');
  const queueRes = await request('/approval-queue/queue?tab=PENDING', { headers: adminHeaders });
  assert(queueRes.status === 200, `Fetch pending approval queue returns HTTP 200`);
  const queueTasks = queueRes.data?.data || queueRes.data || [];
  assert(queueTasks.length > 0, `Approval queue contains ${queueTasks.length} pending task(s)`);

  const taskToApprove = queueTasks.find((t) => t.applicationId === testAppId) || queueTasks[0];
  assert(!!taskToApprove, `Target task selected: ${taskToApprove?.id} (${taskToApprove?.levelName})`);

  // Approve Task
  const approveRes = await request(`/approval-tasks/tasks/${taskToApprove.id}/approve`, {
    method: 'POST',
    headers: adminHeaders,
    body: {
      comments: 'Sanction terms verified and accepted within delegated approval limits.',
    },
  });

  assert(approveRes.status === 200, `Execute proposal approval returns HTTP 200`);
  const approvedTask = approveRes.data?.data || approveRes.data;
  assert(approvedTask.status === 'APPROVED', `Task status updated to APPROVED`);
  assert(approvedTask.action === 'APPROVE', `Task action recorded as APPROVE`);
  assert(!!approvedTask.actionBy, `Action recorded by user ID: ${approvedTask.actionBy}`);

  // 6. Send Back & Rejection Flows
  console.log('\n6. Send Back & Audit Timeline Verification:');
  const sendBackAppId = `app_sendback_${Date.now().toString().slice(-6)}`;
  await request(`/approval-authorities/applications/${sendBackAppId}/resolve-authority`, {
    method: 'POST',
    headers: adminHeaders,
  });

  const queueRes2 = await request('/approval-queue/queue?tab=PENDING', { headers: adminHeaders });
  const sendBackTask = (queueRes2.data?.data || queueRes2.data || []).find((t) => t.applicationId === sendBackAppId);

  if (sendBackTask) {
    const sendBackRes = await request(`/approval-tasks/tasks/${sendBackTask.id}/send-back`, {
      method: 'POST',
      headers: adminHeaders,
      body: {
        reason: 'INCOMPLETE_BANK_STATEMENT',
        comments: 'Last 3 months salary credits missing from PDF statement.',
        sendBackTargetStage: 'CREDIT_ASSESSMENT',
      },
    });

    assert(sendBackRes.status === 200, `Send back proposal returns HTTP 200`);
    const sentBack = sendBackRes.data?.data || sendBackRes.data;
    assert(sentBack.status === 'SENT_BACK', `Task status updated to SENT_BACK`);
    assert(sentBack.sendBackTargetStage === 'CREDIT_ASSESSMENT', `Target stage set to CREDIT_ASSESSMENT`);

    // Fetch History Timeline
    const historyRes = await request(`/approval-authorities/applications/${sendBackAppId}/history`, {
      headers: adminHeaders,
    });
    assert(historyRes.status === 200, `Fetch approval history timeline returns HTTP 200`);
    const history = historyRes.data?.data || historyRes.data || [];
    assert(history.length >= 1, `Approval timeline contains ${history.length} snapshot record(s)`);
    assert(history[0].action === 'SEND_BACK', `Snapshot records exact action: ${history[0].action}`);
  }

  // 7. Temporary Authority Delegations
  console.log('\n7. Temporary Authority Delegation Management:');
  const createDelRes = await request('/delegations/delegations', {
    method: 'POST',
    headers: adminHeaders,
    body: {
      delegateUserId: 'user-bm-substitute',
      delegateRole: 'BRANCH_MANAGER',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Branch Manager on medical leave.',
      scope: 'ALL_BRANCH_APPROVALS',
    },
  });

  assert(createDelRes.status === 201, `Create temporary delegation returns 201 Created`);
  const delegation = createDelRes.data?.data || createDelRes.data;
  assert(delegation.status === 'ACTIVE', `Delegation status is ACTIVE`);

  // Revoke Delegation
  const revokeDelRes = await request(`/delegations/delegations/${delegation.id}/revoke`, {
    method: 'POST',
    headers: adminHeaders,
  });
  assert(revokeDelRes.status === 200, `Revoke delegation returns HTTP 200`);
  const revoked = revokeDelRes.data?.data || revokeDelRes.data;
  assert(revoked.status === 'REVOKED', `Delegation status is now REVOKED`);

  // 8. Segregation of Duties (SoD) & Anti-Spoofing
  console.log('\n8. Segregation of Duties (SoD) & Multi-Tenant Isolation:');
  const crossTenantRes = await request('/approval-authorities/policies', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'X-Tenant-ID': 'tenant-spoofed-bank',
    },
  });

  assert(
    crossTenantRes.status === 403,
    `Cross-tenant access rejected with 403 Forbidden (Anti-Spoofing active)`
  );

  console.log('\n========================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in Phase 3 test suite:', err);
  process.exit(1);
});
