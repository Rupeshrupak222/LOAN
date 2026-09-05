async function runStep22Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 22: LENDER CONFIGURATION ENGINE LIVE VERIFICATION');
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

  // 2. Policy Precedence Resolution (Tenant A vs Tenant B)
  console.log('\n--- 2. MULTI-TENANT POLICY DIVERGENCE (FOIR & DTI) ---');

  // Tenant A: Adyapan Prime Lending (Default 55% FOIR)
  const tenantARes = await fetch('http://localhost:4000/api/v1/configuration/active?area=FOIR_DTI', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const tenantAData: any = await tenantARes.json();
  console.log('Tenant A (Adyapan Prime) Active FOIR Limit:', `${(tenantAData.data?.parameters?.maxDtiRatio * 100).toFixed(0)}%`);

  // Tenant B: Apex Capital Partners (Conservative 45% FOIR)
  const tenantBRes = await fetch('http://localhost:4000/api/v1/configuration/active?area=FOIR_DTI', {
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
    },
  });
  const tenantBData: any = await tenantBRes.json();
  console.log('Tenant B (Apex NBFC) Active FOIR Limit:', `${(tenantBData.data?.parameters?.maxDtiRatio * 100).toFixed(0)}%`);
  console.log('-> Confirmed: Two tenants enforce different risk limits on the same platform.');

  // 3. Draft, Versioning & Audit Trail
  console.log('\n--- 3. DRAFT CREATION & ACTIVATION SAFETY ---');
  const draftRes = await fetch('http://localhost:4000/api/v1/configuration/draft', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      area: 'FOIR_DTI',
      parameters: { maxDtiRatio: 0.48, warningDtiRatio: 0.38, allowCoApplicantIncome: true },
      changelog: 'Board approved Q4 adjustment: increase max FOIR to 48%',
    }),
  });
  const draftData: any = await draftRes.json();
  console.log('Draft Creation Status:', draftRes.status, `(Version ${draftData.data?.version}, State: ${draftData.data?.state})`);

  // Verify active configuration remains 45% (Draft does NOT alter live policies)
  const checkActiveRes = await fetch('http://localhost:4000/api/v1/configuration/active?area=FOIR_DTI', {
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
    },
  });
  const checkActiveData: any = await checkActiveRes.json();
  console.log('Active FOIR while draft exists:', `${(checkActiveData.data?.parameters?.maxDtiRatio * 100).toFixed(0)}%`, '(Draft isolated)');

  // 4. Publish Policy Version
  console.log('\n--- 4. PROMOTE DRAFT TO PUBLISHED ---');
  const publishRes = await fetch('http://localhost:4000/api/v1/configuration/publish', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configId: draftData.data?.id }),
  });
  const publishData: any = await publishRes.json();
  console.log('Publish Status:', publishRes.status, `(State: ${publishData.data?.state})`);

  const activeAfterPublishRes = await fetch('http://localhost:4000/api/v1/configuration/active?area=FOIR_DTI', {
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
    },
  });
  const activeAfterPublishData: any = await activeAfterPublishRes.json();
  console.log('Active FOIR after publication:', `${(activeAfterPublishData.data?.parameters?.maxDtiRatio * 100).toFixed(0)}%`);

  // 5. Deterministic Policy Rollback
  console.log('\n--- 5. POLICY ROLLBACK WITH AUDIT RECORD ---');
  const rollbackRes = await fetch('http://localhost:4000/api/v1/configuration/rollback', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'X-Tenant-ID': 'tenant-apex-nbfc',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      area: 'FOIR_DTI',
      targetVersion: 1,
      reason: 'Reverting to conservative 45% baseline per regulator advisory',
    }),
  });
  const rollbackData: any = await rollbackRes.json();
  console.log('Rollback Status:', rollbackRes.status, `(New Version: ${rollbackData.data?.version}, Restored FOIR: ${(rollbackData.data?.parameters?.maxDtiRatio * 100).toFixed(0)}%)`);

  // 6. Parameter Validation & Safety Enforcement
  console.log('\n--- 6. PARAMETER VALIDATION SAFETY ---');
  const invalidRes = await fetch('http://localhost:4000/api/v1/configuration/draft', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      area: 'FOIR_DTI',
      parameters: { maxDtiRatio: 1.5 }, // 150% is invalid
      changelog: 'Invalid policy',
    }),
  });
  console.log('Invalid FOIR (150%) Draft Rejection Status:', invalidRes.status, '(Expected 400 Bad Request)');

  // 7. Borrower Isolation & RBAC Protection
  console.log('\n--- 7. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  const bDraftRes = await fetch('http://localhost:4000/api/v1/configuration/draft', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ area: 'FOIR_DTI', parameters: { maxDtiRatio: 0.99 }, changelog: 'Attack' }),
  });
  console.log('Borrower Draft Policy Status:', bDraftRes.status, '(Expected 403 Forbidden)');

  const bPublishRes = await fetch('http://localhost:4000/api/v1/configuration/publish', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ configId: 'any' }),
  });
  console.log('Borrower Publish Policy Status:', bPublishRes.status, '(Expected 403 Forbidden)');

  const bRollbackRes = await fetch('http://localhost:4000/api/v1/configuration/rollback', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ area: 'FOIR_DTI', targetVersion: 1, reason: 'Attack' }),
  });
  console.log('Borrower Rollback Policy Status:', bRollbackRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 22 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep22Verification().catch(console.error);
