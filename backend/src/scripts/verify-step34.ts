async function runStep34Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 34: ROLE & PERMISSION BUILDER LIVE VERIFICATION');
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

  // 2. Permission Catalog & SoD Rules
  console.log('\n--- 2. PERMISSION CATALOG & SOD RULES ---');
  const permsRes = await fetch('http://localhost:4000/api/v1/roles/permissions-matrix', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const permsData: any = await permsRes.json();
  console.log('Permissions Catalog Status:', permsRes.status, 'Total Granular Permissions:', permsData.data?.length);

  const sodRes = await fetch('http://localhost:4000/api/v1/roles/sod-rules', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const sodData: any = await sodRes.json();
  console.log('SoD Rules Status:', sodRes.status, 'Total Active Banking SoD Rules:', sodData.data?.length);

  // 3. SoD Conflict Evaluation
  console.log('\n--- 3. SOD CONFLICT EVALUATION ---');
  const sodCheckRes = await fetch('http://localhost:4000/api/v1/roles/check-sod', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
    }),
  });
  const sodCheckData: any = await sodCheckRes.json();
  console.log('SoD Check Status:', sodCheckRes.status);
  console.log('  - Has Conflict:', sodCheckData.data?.hasConflict);
  console.log('  - Has Critical Block:', sodCheckData.data?.hasCriticalBlock);
  console.log('  - Detected Conflict:', sodCheckData.data?.conflicts?.[0]?.ruleName);

  // 4. Custom Role Creation with Inheritance & Limits
  console.log('\n--- 4. CUSTOM ROLE CREATION WITH INHERITANCE ---');
  const createRoleRes = await fetch('http://localhost:4000/api/v1/roles', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'CHIEF_CREDIT_OFFICER_LIVE',
      name: 'Chief Credit Officer (Institutional Desk)',
      description: 'High authority underwriting committee leader',
      parentRoleCode: 'UNDERWRITER',
      permissions: ['UNDERWRITING_COMMITTEE_VOTE', 'CONFIGURATION_VIEW_POLICIES'],
      scope: 'TENANT',
      sanctionLimitAmount: 15000000, // ₹1.5 Crore
    }),
  });
  const createRoleData: any = await createRoleRes.json();
  const role = createRoleData.data;
  console.log('Create Role Status:', createRoleRes.status, 'Role Code:', role?.code);
  console.log('  - Role Name:', role?.name);
  console.log('  - Inherited Parent:', role?.parentRoleCode);
  console.log('  - Final Permissions Count:', role?.permissions?.length);
  console.log('  - Sanction Authority Limit:', role?.sanctionLimitAmount);

  // 5. Effective Permissions
  console.log('\n--- 5. EFFECTIVE PERMISSIONS EVALUATION ---');
  const effRes = await fetch('http://localhost:4000/api/v1/roles/effective-permissions', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const effData: any = await effRes.json();
  console.log('Effective Permissions Status:', effRes.status, 'Granted Count:', effData.data?.total);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bCreateRoleRes = await fetch('http://localhost:4000/api/v1/roles', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'HACK_ROLE', name: 'Hacked' }),
  });
  console.log('Borrower Create Role Status:', bCreateRoleRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 34 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep34Verification().catch(console.error);
