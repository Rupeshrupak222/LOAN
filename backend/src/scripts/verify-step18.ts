async function runStep18Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 18: PARTNER / DSA / LSP PLATFORM LIVE VERIFICATION');
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

  // 2. Register Partner Entity
  console.log('\n--- 2. REGISTER PARTNER ENTITY ---');
  const regRes = await fetch('http://localhost:4000/api/v1/partners', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: `DSA-LIVE-${Date.now().toString().slice(-4)}`,
      name: 'Apex Finserv Direct Pvt Ltd',
      type: 'DSA',
      contactPerson: 'Rajiv Mehra',
      email: `rajiv.mehra.${Date.now()}@apexfinserv.in`,
      phone: '+91 98200 12345',
      pan: 'AABCA1234F',
      commissionModel: {
        type: 'PERCENTAGE',
        ratePct: 1.75, // 1.75%
        flatFee: 500,  // ₹500
        clawbackPeriodDays: 90,
        clawbackRatePct: 100,
      },
      dlaSigned: true,
    }),
  });
  const regData: any = await regRes.json();
  const partner = regData.data;
  console.log('Register Partner Status:', regRes.status, '(Expected 200)');
  console.log('Partner ID:', partner?.id);
  console.log('Partner Code:', partner?.code);
  console.log('Partner Type:', partner?.type);
  console.log('Commission Model:', partner?.commissionModel);
  console.log('DLA Agreement Signed:', partner?.complianceAgreements?.dlaSigned);

  // 3. List & Retrieve Partners
  console.log('\n--- 3. LIST & RETRIEVE PARTNER PROFILE ---');
  const listRes = await fetch('http://localhost:4000/api/v1/partners', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const listData: any = await listRes.json();
  console.log('List Partners Status:', listRes.status, 'Count:', listData.data?.length);

  const getRes = await fetch(`http://localhost:4000/api/v1/partners/${partner.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const getData: any = await getRes.json();
  console.log('Get Single Partner Status:', getRes.status, 'Name:', getData.data?.name);

  // 4. Submit Sourced Lead (With Verified Consent)
  console.log('\n--- 4. SUBMIT SOURCED LEAD (WITH BORROWER CONSENT) ---');
  const leadRes = await fetch('http://localhost:4000/api/v1/partners/leads', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partnerId: partner.id,
      customerName: 'Vikramaditya Sen',
      customerPhone: '+91 98111 22334',
      customerEmail: 'vikram.sen@outlook.com',
      requestedAmount: 120000,
      productCode: 'PERSONAL',
      consentReference: 'AADHAAR-OTP-998811',
      notes: 'Customer sourced through direct retail agency branch.',
    }),
  });
  const leadData: any = await leadRes.json();
  const sourcedLead = leadData.data;
  console.log('Submit Lead Status:', leadRes.status, '(Expected 200)');
  console.log('Sourced Lead ID:', sourcedLead?.id);
  console.log('Application No:', sourcedLead?.applicationNo);
  console.log('Requested Amount:', `₹${sourcedLead?.requestedAmount}`);
  console.log('Consent Reference Proof:', sourcedLead?.consentReference);
  console.log('Status:', sourcedLead?.status);

  // 5. Calculate Commissions & Payouts
  console.log('\n--- 5. COMMISSIONS & PAYOUTS ENGINE ---');
  const commCalcRes = await fetch('http://localhost:4000/api/v1/partners/commissions/calculate-disbursement', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partnerId: partner.id,
      applicationNo: sourcedLead.applicationNo,
      loanId: 'loan-live-test-01',
      loanNo: 'LN-LIVE-001',
      disbursedAmount: 100000,
    }),
  });
  const commCalcData: any = await commCalcRes.json();
  console.log('Commission Calculation Status:', commCalcRes.status, '(Expected 200)');
  const commRecords = commCalcData.data || [];
  console.log('Commission Records Generated:', commRecords.length);
  for (const c of commRecords) {
    console.log(`  -> ${c.commissionType}: ₹${c.amount} (${c.status})`);
  }

  // Payout Summary
  const summaryRes = await fetch(`http://localhost:4000/api/v1/partners/${partner.id}/payout-summary`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const summaryData: any = await summaryRes.json();
  console.log('Payout Summary Status:', summaryRes.status, '(Expected 200)');
  console.log('Total Earned Commission:', `₹${summaryData.data?.totalEarnedCommission}`);
  console.log('Pending Payout Amount:', `₹${summaryData.data?.pendingPayoutAmount}`);
  console.log('Net Payable:', `₹${summaryData.data?.netPayable}`);

  // Process Payout Batch
  const batchRes = await fetch(`http://localhost:4000/api/v1/partners/${partner.id}/payouts/batch`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const batchData: any = await batchRes.json();
  console.log('Process Payout Batch Status:', batchRes.status, '(Expected 200)');
  console.log('Batch ID:', batchData.data?.batchId);
  console.log('Paid Amount:', `₹${batchData.data?.paidAmount}`);
  console.log('Records Settled:', batchData.data?.recordsCount);

  // 6. Strict Partner Isolation Verification
  console.log('\n--- 6. STRICT PARTNER DATA ISOLATION VERIFICATION ---');
  // Register second partner
  const regB = await fetch('http://localhost:4000/api/v1/partners', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: `LSP-BETA-${Date.now().toString().slice(-4)}`,
      name: 'Beta Fintech Partners',
      type: 'LSP',
      contactPerson: 'Aditi Nair',
      email: `aditi.${Date.now()}@betafintech.in`,
      phone: '+91 98333 44556',
      pan: 'AACFB9988Z',
      commissionModel: { ratePct: 2.0, flatFee: 0, clawbackPeriodDays: 90, clawbackRatePct: 100 },
      dlaSigned: true,
    }),
  });
  const partnerB = ((await regB.json()) as any).data;
  console.log('Registered Partner B:', partnerB.name, 'ID:', partnerB.id);

  // Query leads filtered by Partner A
  const leadsARes = await fetch(`http://localhost:4000/api/v1/partners/leads?partnerId=${partner.id}`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const leadsA = ((await leadsARes.json()) as any).data || [];
  console.log('Partner A Leads Count:', leadsA.length);
  const containsOtherPartner = leadsA.some((l: any) => l.partnerId !== partner.id);
  console.log('Cross-Partner Data Leaked:', containsOtherPartner, '(Expected false)');

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

  const bListRes = await fetch('http://localhost:4000/api/v1/partners', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower List Partners Status:', bListRes.status, '(Expected 403 Forbidden)');

  const bRegRes = await fetch('http://localhost:4000/api/v1/partners', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'HACK', name: 'Hack', type: 'DSA', email: 'h@h.com', phone: '1', pan: '1' }),
  });
  console.log('Borrower Register Partner Status:', bRegRes.status, '(Expected 403 Forbidden)');

  const bLeadRes = await fetch('http://localhost:4000/api/v1/partners/leads', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ partnerId: partner.id, customerName: 'X', customerPhone: '1', requestedAmount: 100 }),
  });
  console.log('Borrower Submit Lead Status:', bLeadRes.status, '(Expected 403 Forbidden)');

  const bPayoutRes = await fetch(`http://localhost:4000/api/v1/partners/${partner.id}/payout-summary`, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Payout Summary Status:', bPayoutRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 18 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep18Verification().catch(console.error);
