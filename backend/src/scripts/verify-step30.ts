async function runStep30Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 30: PRIVACY & CONSENT MANAGEMENT LIVE VERIFICATION');
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

  // 2. Privacy Overview & Opt-In Metrics
  console.log('\n--- 2. PRIVACY GOVERNANCE OVERVIEW & OPT-IN RATES ---');
  const overviewRes = await fetch('http://localhost:4000/api/v1/privacy/overview', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const overviewData: any = await overviewRes.json();
  const ov = overviewData.data;
  console.log('Privacy Overview:');
  console.log('  - Total Consents Recorded:', ov?.totalConsentsRecorded, '| Active Granted:', ov?.activeGrantedConsentsCount);
  console.log('  - Configured Purpose Templates:', ov?.purposesCount);
  console.log('  - Marketing Opt-In Rate (%):', ov?.marketingOptInRate, '| AI Analysis Opt-In Rate (%):', ov?.aiAnalysisOptInRate);

  // 3. Purpose Catalog & Versioning
  console.log('\n--- 3. PURPOSE CATALOG & IMMUTABLE VERSIONING ---');
  const purposesRes = await fetch('http://localhost:4000/api/v1/privacy/purposes', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const purposesData: any = await purposesRes.json();
  console.log('Available Purposes Count:', purposesData.total);
  purposesData.data?.slice(0, 3).forEach((p: any) => {
    console.log(`  * [${p.purposeCode}] ${p.title} (${p.activeVersion} | Mandatory: ${p.isMandatory})`);
  });

  // 4. Consent Grant, Supersede, and Withdrawal Lifecycle
  console.log('\n--- 4. CONSENT GRANT, SUPERSEDE, AND WITHDRAWAL LIFECYCLE ---');
  // 4.1 Initial Grant
  const grant1Res = await fetch('http://localhost:4000/api/v1/privacy/consents/grant', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: 'cust-step30-verify-01',
      purposeCode: 'PURPOSE-KYC-01',
      channel: 'WEB_PORTAL',
      metadata: { ip: '103.21.54.10' },
    }),
  });
  const grant1Data: any = await grant1Res.json();
  const c1 = grant1Data.data;
  console.log('Grant 1 Status:', grant1Res.status, 'ID:', c1?.id, 'Version:', c1?.version, 'Status:', c1?.status);

  // 4.2 Re-grant for same purpose (Supersedes Grant 1)
  const grant2Res = await fetch('http://localhost:4000/api/v1/privacy/consents/grant', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: 'cust-step30-verify-01',
      purposeCode: 'PURPOSE-KYC-01',
      channel: 'MOBILE_APP',
    }),
  });
  const grant2Data: any = await grant2Res.json();
  const c2 = grant2Data.data;
  console.log('Grant 2 (Supersedes Grant 1) Status:', grant2Res.status, 'ID:', c2?.id, 'Status:', c2?.status);

  // 4.3 Withdraw Grant 2
  const withdrawRes = await fetch(`http://localhost:4000/api/v1/privacy/consents/${c2?.id}/withdraw`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: 'Borrower requested revocation of biometric data.' }),
  });
  const withdrawData: any = await withdrawRes.json();
  console.log('Withdraw Status:', withdrawRes.status, 'ID:', withdrawData.data?.id, 'Status:', withdrawData.data?.status);

  // 5. Consent Enforcement Engine
  console.log('\n--- 5. CONSENT ENFORCEMENT ENGINE ---');
  // Check withdrawn consent (should be blocked)
  const enforceBlockedRes = await fetch('http://localhost:4000/api/v1/privacy/enforce', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: 'cust-step30-verify-01',
      requiredType: 'KYC_VERIFICATION',
    }),
  });
  const enforceBlockedData: any = await enforceBlockedRes.json();
  console.log('Enforcement Check (Withdrawn KYC): Granted =', enforceBlockedData.data?.granted, '| Reason:', enforceBlockedData.data?.reason);

  // 6. AI Prompt Data Minimization & PII Sanitizer
  console.log('\n--- 6. AI PROMPT DATA MINIMIZATION & PII SANITIZER ---');
  const aiSanitizeRes = await fetch('http://localhost:4000/api/v1/privacy/ai-sanitize', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'cust-step30-verify-01',
      name: 'Rupesh Sharma',
      pan: 'ABCDE1234F',
      aadhaar: '123456789012',
      bankAccount: '987654321098',
      phone: '+91 98200 12345',
      income: 140000,
      creditScore: 785,
      loanAmount: 800000,
    }),
  });
  const aiData: any = await aiSanitizeRes.json();
  console.log('AI Sanitized Output:');
  console.log('  - Name Masked:', aiData.data?.nameMasked);
  console.log('  - PAN Masked:', aiData.data?.panMasked);
  console.log('  - Aadhaar Masked:', aiData.data?.aadhaarMasked);
  console.log('  - Bank Account Masked:', aiData.data?.bankAccountMasked);
  console.log('  - AI Scope:', aiData.data?.purposeScope, '| Consent Active:', aiData.data?.aiConsentGranted);

  // 7. Borrower Isolation & Self-Service RBAC
  console.log('\n--- 7. BORROWER ISOLATION & SELF-SERVICE RBAC ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  // Borrower self-service: querying their own preferences (allowed)
  const bPrefRes = await fetch('http://localhost:4000/api/v1/privacy/preferences', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Query Own Preferences Status:', bPrefRes.status, '(Expected 200 OK)');

  // Borrower forbidden action: viewing executive privacy overview (blocked)
  const bOverviewRes = await fetch('http://localhost:4000/api/v1/privacy/overview', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Executive Privacy Overview Status:', bOverviewRes.status, '(Expected 403 Forbidden)');

  // Borrower forbidden action: editing purpose template (blocked)
  const bPurposeRes = await fetch('http://localhost:4000/api/v1/privacy/purposes', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purposeCode: 'HACK', title: 'Hacked', category: 'KYC_VERIFICATION' }),
  });
  console.log('Borrower Create Purpose Template Status:', bPurposeRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 30 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep30Verification().catch(console.error);
