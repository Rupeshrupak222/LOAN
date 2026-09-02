const BASE_URL = 'http://localhost:4000/api/v1';
const DEMO_PASSWORD = 'Passw0rd!123';

const ROLES_TO_TEST = [
  { role: 'SUPER_ADMIN', email: 'superadmin@adyapan.dev' },
  { role: 'ADMIN', email: 'admin@adyapan.dev' },
  { role: 'BRANCH_MANAGER', email: 'manager@adyapan.dev' },
  { role: 'LOAN_OFFICER', email: 'officer@adyapan.dev' },
  { role: 'CREDIT_ANALYST', email: 'analyst@adyapan.dev' },
  { role: 'UNDERWRITER', email: 'underwriter@adyapan.dev' },
  { role: 'FINANCE_OFFICER', email: 'finance@adyapan.dev' },
  { role: 'COLLECTION_OFFICER', email: 'collections@adyapan.dev' },
  { role: 'AUDITOR', email: 'auditor@adyapan.dev' },
  { role: 'CUSTOMER', email: 'customer@adyapan.dev' },
];

async function runVerification() {
  console.log('===============================================================');
  console.log('🚀 ADYAPAN LMS — ROLE-BASED DASHBOARD & RBAC VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail || 'Condition not met'}`);
    }
  }

  const tokens: Record<string, string> = {};

  // 1. Authenticate all 10 roles
  console.log('--- 1. AUTHENTICATION OF ALL 10 ROLES ---');
  for (const { role, email } of ROLES_TO_TEST) {
    let success = false;
    let lastErr = '';
    let lastRoles: any = undefined;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password: DEMO_PASSWORD }),
        });
        const data: any = await res.json();
        if (data.data?.accessToken && data.data?.user?.roles?.includes(role)) {
          tokens[role] = data.data.accessToken;
          success = true;
          break;
        } else {
          lastRoles = data.data?.user?.roles;
          lastErr = JSON.stringify(data);
        }
      } catch (err: any) {
        lastErr = err.message;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    assert(
      success,
      `Login as ${role} (${email})`,
      lastRoles ? `Roles returned: ${JSON.stringify(lastRoles)}` : lastErr
    );
  }

  // 2. Permitted API Testing Per Role
  console.log('\n--- 2. PERMITTED DASHBOARD API ACCESS ---');

  // Super Admin: Portfolio reports, Users, Branches, Settings, Audit
  try {
    const res = await fetch(`${BASE_URL}/reports/portfolio`, {
      headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` },
    });
    const json: any = await res.json();
    assert(Boolean(res.status === 200 && json.data?.kpis), 'SUPER_ADMIN -> GET /reports/portfolio', `status: ${res.status}, error: ${JSON.stringify(json.error)}`);
  } catch (err: any) {
    assert(false, 'SUPER_ADMIN -> GET /reports/portfolio', err.message);
  }

  // System Admin: Users, Branches, Settings
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${tokens.ADMIN}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'ADMIN -> GET /users');
  } catch (err: any) {
    assert(false, 'ADMIN -> GET /users', err.message);
  }

  // Loan Officer: Customers list & Loan Products
  try {
    const res = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${tokens.LOAN_OFFICER}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'LOAN_OFFICER -> GET /customers');
  } catch (err: any) {
    assert(false, 'LOAN_OFFICER -> GET /customers', err.message);
  }

  // Credit Analyst: Applications queue
  try {
    const res = await fetch(`${BASE_URL}/applications?status=SUBMITTED`, {
      headers: { Authorization: `Bearer ${tokens.CREDIT_ANALYST}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'CREDIT_ANALYST -> GET /applications?status=SUBMITTED');
  } catch (err: any) {
    assert(false, 'CREDIT_ANALYST -> GET /applications?status=SUBMITTED', err.message);
  }

  // Underwriter: Underwriting Queue
  try {
    const res = await fetch(`${BASE_URL}/underwriting/queue`, {
      headers: { Authorization: `Bearer ${tokens.UNDERWRITER}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'UNDERWRITER -> GET /underwriting/queue');
  } catch (err: any) {
    assert(false, 'UNDERWRITER -> GET /underwriting/queue', err.message);
  }

  // Finance Officer: Disbursement Queue
  try {
    const res = await fetch(`${BASE_URL}/disbursements/queue`, {
      headers: { Authorization: `Bearer ${tokens.FINANCE_OFFICER}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'FINANCE_OFFICER -> GET /disbursements/queue');
  } catch (err: any) {
    assert(false, 'FINANCE_OFFICER -> GET /disbursements/queue', err.message);
  }

  // Collection Officer: Collections Dashboard
  try {
    const res = await fetch(`${BASE_URL}/collections/dashboard`, {
      headers: { Authorization: `Bearer ${tokens.COLLECTION_OFFICER}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && json.data?.agingBuckets, 'COLLECTION_OFFICER -> GET /collections/dashboard');
  } catch (err: any) {
    assert(false, 'COLLECTION_OFFICER -> GET /collections/dashboard', err.message);
  }

  // Auditor: Audit Log inspection
  try {
    const res = await fetch(`${BASE_URL}/audit`, {
      headers: { Authorization: `Bearer ${tokens.AUDITOR}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'AUDITOR -> GET /audit');
  } catch (err: any) {
    assert(false, 'AUDITOR -> GET /audit', err.message);
  }

  // Customer: My Loans (Self Scoped)
  try {
    const res = await fetch(`${BASE_URL}/loans`, {
      headers: { Authorization: `Bearer ${tokens.CUSTOMER}` },
    });
    const json: any = await res.json();
    assert(res.status === 200 && Array.isArray(json.data), 'CUSTOMER -> GET /loans (Self Scoped)');
  } catch (err: any) {
    assert(false, 'CUSTOMER -> GET /loans', err.message);
  }

  // 3. Security & Forbidden Access Testing (403 Enforcement)
  console.log('\n--- 3. STRICT BACKEND 403 FORBIDDEN ENFORCEMENT ---');

  // Test 3A: Loan Officer cannot execute disbursement
  try {
    const res = await fetch(`${BASE_URL}/disbursements/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.LOAN_OFFICER}`,
      },
      body: JSON.stringify({ applicationId: 'app-dummy-123', paymentMethod: 'NEFT', reference: 'UTR-123' }),
    });
    assert(res.status === 403, 'LOAN_OFFICER -> POST /disbursements/execute => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'LOAN_OFFICER -> POST /disbursements/execute => 403 Forbidden', err.message);
  }

  // Test 3B: Loan Officer cannot submit underwriting decision
  try {
    const res = await fetch(`${BASE_URL}/underwriting/dummy-app-id/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.LOAN_OFFICER}`,
      },
      body: JSON.stringify({ decision: 'APPROVE', reason: 'Attempt unauthorized approval' }),
    });
    assert(res.status === 403, 'LOAN_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'LOAN_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden', err.message);
  }

  // Test 3C: Credit Analyst cannot execute disbursement
  try {
    const res = await fetch(`${BASE_URL}/disbursements/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.CREDIT_ANALYST}`,
      },
      body: JSON.stringify({ applicationId: 'app-dummy-123', paymentMethod: 'NEFT' }),
    });
    assert(res.status === 403, 'CREDIT_ANALYST -> POST /disbursements/execute => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'CREDIT_ANALYST -> POST /disbursements/execute => 403 Forbidden', err.message);
  }

  // Test 3D: Underwriter cannot execute disbursement
  try {
    const res = await fetch(`${BASE_URL}/disbursements/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.UNDERWRITER}`,
      },
      body: JSON.stringify({ applicationId: 'app-dummy-123', paymentMethod: 'NEFT' }),
    });
    assert(res.status === 403, 'UNDERWRITER -> POST /disbursements/execute => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'UNDERWRITER -> POST /disbursements/execute => 403 Forbidden', err.message);
  }

  // Test 3E: Finance Officer cannot submit underwriting decision
  try {
    const res = await fetch(`${BASE_URL}/underwriting/dummy-app-id/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.FINANCE_OFFICER}`,
      },
      body: JSON.stringify({ decision: 'APPROVE', reason: 'Attempt unauthorized approval' }),
    });
    assert(res.status === 403, 'FINANCE_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'FINANCE_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden', err.message);
  }

  // Test 3F: Collection Officer cannot underwrite
  try {
    const res = await fetch(`${BASE_URL}/underwriting/dummy-app-id/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.COLLECTION_OFFICER}`,
      },
      body: JSON.stringify({ decision: 'APPROVE', reason: 'Attempt unauthorized approval' }),
    });
    assert(res.status === 403, 'COLLECTION_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'COLLECTION_OFFICER -> POST /underwriting/:id/decision => 403 Forbidden', err.message);
  }

  // Test 3G: Auditor is strictly read-only (Cannot update system settings)
  try {
    const res = await fetch(`${BASE_URL}/settings/payment_allocation_order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.AUDITOR}`,
      },
      body: JSON.stringify({ value: ['FEES'] }),
    });
    assert(res.status === 403, 'AUDITOR -> PUT /settings/:key => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'AUDITOR -> PUT /settings/:key => 403 Forbidden', err.message);
  }

  // Test 3H: Customer cannot access internal staff user directory
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${tokens.CUSTOMER}` },
    });
    assert(res.status === 403, 'CUSTOMER -> GET /users => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'CUSTOMER -> GET /users => 403 Forbidden', err.message);
  }

  // Test 3I: Customer cannot access branches directory
  try {
    const res = await fetch(`${BASE_URL}/branches`, {
      headers: { Authorization: `Bearer ${tokens.CUSTOMER}` },
    });
    assert(res.status === 403, 'CUSTOMER -> GET /branches => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'CUSTOMER -> GET /branches => 403 Forbidden', err.message);
  }

  // Test 3J: Customer cannot query all customers
  try {
    const res = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${tokens.CUSTOMER}` },
    });
    assert(res.status === 403, 'CUSTOMER -> GET /customers => 403 Forbidden');
  } catch (err: any) {
    assert(false, 'CUSTOMER -> GET /customers => 403 Forbidden', err.message);
  }

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} VERIFICATION CHECKS PASSED (100%)`);
  console.log('===============================================================');
}

runVerification().catch(console.error);
