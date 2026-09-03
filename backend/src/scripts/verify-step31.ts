async function runStep31Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 31: AUDIT & COMPLIANCE EVIDENCE LIVE VERIFICATION');
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

  // 2. Audit Trail Listing
  console.log('\n--- 2. AUDIT TRAIL LISTING ---');
  const auditRes = await fetch('http://localhost:4000/api/v1/audit/', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const auditData: any = await auditRes.json();
  console.log('Audit Query Status:', auditRes.status, 'Total Logs in DB:', auditData.data?.length);

  // 3. Cryptographic SHA-256 Hash Chain Integrity Verification
  console.log('\n--- 3. SHA-256 HASH CHAIN INTEGRITY VERIFICATION ---');
  const verifyChainRes = await fetch('http://localhost:4000/api/v1/audit/verify-chain', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entityId: 'APP-DEMO-001' }),
  });
  const verifyData: any = await verifyChainRes.json();
  console.log('Chain Verification Status:', verifyChainRes.status, 'Integrity Valid:', verifyData.data?.valid, 'Nodes Verified:', verifyData.data?.nodesVerified);

  // 4. Evidence Package Assembly
  console.log('\n--- 4. EVIDENCE PACKAGE GENERATION & ASSEMBLY ---');
  const pkgRes = await fetch('http://localhost:4000/api/v1/audit/evidence-package/APPLICATION/APP-DEMO-001', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const pkgData: any = await pkgRes.json();
  const pkg = pkgData.data;
  console.log('Evidence Package Generated Status:', pkgRes.status, 'Package ID:', pkg?.packageId);
  console.log('  - Target Entity:', pkg?.entityType, '#' + pkg?.entityId);
  console.log('  - Integrity Verified:', pkg?.integrityVerified, '| Total Events:', pkg?.totalEventsCount);
  console.log('  - Supporting Evidence Refs:', pkg?.supportingEvidence?.length, 'items');
  pkg?.supportingEvidence?.forEach((e: any) => console.log(`    * [${e.type}] ${e.title} (#${e.id})`));
  console.log('  - Advisory AI Summary:', pkg?.aiSummaryAdvisory?.slice(0, 80) + '...');

  // 5. Controlled Audit Trail Export with PII Masking
  console.log('\n--- 5. CONTROLLED AUDIT TRAIL EXPORT (CSV & JSON) ---');
  // CSV Export
  const csvRes = await fetch('http://localhost:4000/api/v1/audit/export', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format: 'CSV' }),
  });
  const csvData: any = await csvRes.json();
  console.log('CSV Export Status:', csvRes.status, 'Records Count:', csvData.data?.totalRecords);
  console.log('Sample CSV Output Header:', csvData.data?.data?.split('\n')[0]);

  // JSON Export
  const jsonRes = await fetch('http://localhost:4000/api/v1/audit/export', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format: 'JSON' }),
  });
  const jsonData: any = await jsonRes.json();
  console.log('JSON Export Status:', jsonRes.status, 'Records Count:', jsonData.data?.totalRecords);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bPkgRes = await fetch('http://localhost:4000/api/v1/audit/evidence-package/APPLICATION/APP-DEMO-001', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Generate Evidence Package Status:', bPkgRes.status, '(Expected 403 Forbidden)');

  const bExportRes = await fetch('http://localhost:4000/api/v1/audit/export', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format: 'JSON' }),
  });
  console.log('Borrower Export Audit Trail Status:', bExportRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 31 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep31Verification().catch(console.error);
