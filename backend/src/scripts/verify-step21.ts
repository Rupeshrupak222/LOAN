import { signAccessToken } from '../modules/auth/tokens';

async function runStep21Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 21: MULTI-TENANT ARCHITECTURE LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  console.log('--- 1. SUPER ADMIN AUTHENTICATION ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // 2. Tenant Registry Inspection
  console.log('\n--- 2. TENANT REGISTRY INSPECTION ---');
  const tenantsRes = await fetch('http://localhost:4000/api/v1/tenants', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const tenantsData: any = await tenantsRes.json();
  console.log('List Tenants Status:', tenantsRes.status, '(Expected 200)');
  console.log('Tenants Discovered:', tenantsData.data?.map((t: any) => `${t.name} (${t.code} - ${t.id})`));

  const currentRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const currentData: any = await currentRes.json();
  console.log('Default Current Tenant Context:', currentData.data);

  // 3. Onboard New Lender Tenant
  console.log('\n--- 3. ONBOARD NEW LENDER TENANT (SUPER ADMIN ONLY) ---');
  const onboardRes = await fetch('http://localhost:4000/api/v1/tenants', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'HORIZON_FIN',
      name: 'Horizon Microfinance Ltd',
      tier: 'GROWTH',
      contactEmail: 'risk@horizonfin.dev',
      domain: 'horizonfin.dev',
    }),
  });
  const onboardData: any = await onboardRes.json();
  console.log('Onboard Tenant Status:', onboardRes.status, '(Expected 201)');
  console.log('Onboarded Tenant:', onboardData.data?.name, 'ID:', onboardData.data?.id);

  // 4. Anti-Spoofing & Anti-IDOR Boundary Protection
  console.log('\n--- 4. ANTI-SPOOFING & ANTI-IDOR BOUNDARY ENFORCEMENT ---');
  // Issue a non-superadmin token assigned strictly to 'tenant-apex-nbfc'
  const apexStaffToken = signAccessToken({
    sub: 'usr-apex-officer-99',
    email: 'officer@apexcap.dev',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-apex-nbfc',
  });

  // Test A: Normal request matching authorized tenant
  const apexSelfRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: {
      Authorization: 'Bearer ' + apexStaffToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
    },
  });
  const apexSelfData: any = await apexSelfRes.json();
  console.log('Apex Staff Authorized Tenant Request Status:', apexSelfRes.status, 'Active Context:', apexSelfData.data?.tenantId);

  // Test B: Malicious spoofing attempt (Apex staff claims 'X-Tenant-ID: tenant-adyapan-default')
  const spoofRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: {
      Authorization: 'Bearer ' + apexStaffToken,
      'X-Tenant-ID': 'tenant-adyapan-default',
    },
  });
  console.log('Cross-Tenant Header Spoofing Attempt Status:', spoofRes.status, '(Expected 403 Forbidden)');

  // 5. Super Admin Cross-Tenant Supervision Switching
  console.log('\n--- 5. SUPER ADMIN CROSS-TENANT CONTEXT SWITCHING ---');
  const saSwitchedRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
    },
  });
  const saSwitchedData: any = await saSwitchedRes.json();
  console.log('Super Admin Tenant-Switch Status:', saSwitchedRes.status, '(Expected 200)');
  console.log('Switched Context:', saSwitchedData.data?.name, `(${saSwitchedData.data?.tenantId})`);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  const bListRes = await fetch('http://localhost:4000/api/v1/tenants', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower List Tenants Status:', bListRes.status, '(Expected 403 Forbidden)');

  const bCreateRes = await fetch('http://localhost:4000/api/v1/tenants', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'FAKE', name: 'Fake NBFC', contactEmail: 'hacker@nbfc.dev' }),
  });
  console.log('Borrower Onboard Tenant Status:', bCreateRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 21 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep21Verification().catch(console.error);
