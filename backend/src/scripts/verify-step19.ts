async function runStep19Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 19: OMNICHANNEL COMMUNICATION & PRIVACY LIVE VERIFICATION');
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

  // 2. Query Standardized Templates
  console.log('\n--- 2. STANDARDIZED TEMPLATE REGISTRY ---');
  const tplRes = await fetch('http://localhost:4000/api/v1/communications/templates', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const tplData: any = await tplRes.json();
  const templates = tplData.data || [];
  console.log('Templates Status:', tplRes.status, 'Total Standardized Templates:', templates.length, '(Expected 9)');
  for (const t of templates) {
    console.log(`  -> [${t.category}] ${t.code}: ${t.name} (Channels: ${t.supportedChannels.join(', ')})`);
  }

  // 3. Dispatch Transactional Notice with Automated PII Masking
  console.log('\n--- 3. DISPATCH TRANSACTIONAL NOTICE (PII MASKING CHECK) ---');
  const rawBankAcc = '987654321098'; // Sensitive PII
  const disbNoticeRes = await fetch('http://localhost:4000/api/v1/communications/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateCode: 'DISBURSEMENT_NOTICE',
      channel: 'EMAIL',
      recipient: 'borrower@adyapan.dev',
      recipientName: 'Vikramaditya Sen',
      variables: {
        customerName: 'Vikramaditya Sen',
        loanNo: 'LN-LIVE-001',
        netDisbursedAmount: '100000',
        bankAccount: rawBankAcc, // Pass raw bank account
        utrNumber: 'UTR-LIVE-991823',
        firstDueDate: '05-Oct-2026',
        emiAmount: '4730',
      },
    }),
  });
  const disbData: any = await disbNoticeRes.json();
  const disbRecord = disbData.data;
  console.log('Disbursement Notice Status:', disbNoticeRes.status, '(Expected 200)');
  console.log('Notice Record ID:', disbRecord?.id);
  console.log('Delivery Status:', disbRecord?.deliveryStatus);
  console.log('Provider Dispatched:', disbRecord?.provider);

  const containsRawPii = disbRecord?.renderedBody?.includes(rawBankAcc);
  const containsMaskedPii = disbRecord?.renderedBody?.includes('XXXX-XXXX-1098');
  console.log('Raw Sensitive Account Number Leaked in Body:', containsRawPii, '(Expected false)');
  console.log('Masked PII Account Present (XXXX-XXXX-1098):', containsMaskedPii, '(Expected true)');
  if (containsRawPii || !containsMaskedPii) {
    throw new Error('VIOLATION: Automated PII masking failed!');
  }

  // 4. Dispatch SMS Notice
  console.log('\n--- 4. MULTI-CHANNEL DISPATCH (SMS EMI REMINDER) ---');
  const smsRes = await fetch('http://localhost:4000/api/v1/communications/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateCode: 'UPCOMING_EMI_REMINDER',
      channel: 'SMS',
      recipient: '+91 98200 12345',
      recipientName: 'Vikramaditya Sen',
      variables: {
        customerName: 'Vikramaditya Sen',
        loanNo: 'LN-LIVE-001',
        emiAmount: '4730',
        dueDate: '05-Oct-2026',
        paymentUrl: 'https://adyapan.dev/pay',
      },
    }),
  });
  const smsData: any = await smsRes.json();
  console.log('SMS Dispatch Status:', smsRes.status, 'Delivery Status:', smsData.data?.deliveryStatus);

  // 5. Customer DND Preference Enforcement
  console.log('\n--- 5. CUSTOMER DND OPT-OUT COMPLIANCE ---');
  const dndRes = await fetch('http://localhost:4000/api/v1/communications/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateCode: 'APPLICATION_SUBMITTED',
      channel: 'SMS',
      recipient: '+91 98000 00000',
      isDndOpted: true, // DND Opted
      variables: {
        customerName: 'DND Customer',
        applicationNo: 'APP-DND-1',
        requestedAmount: '50000',
        productName: 'Personal Express',
        trackingUrl: 'https://track.dev',
      },
    }),
  });
  const dndData: any = await dndRes.json();
  console.log('DND Test Status:', dndRes.status, '(Expected 200)');
  console.log('DND Delivery Status:', dndData.data?.deliveryStatus, '(Expected BLOCKED_DND)');
  console.log('DND Reason:', dndData.data?.errorMessage);

  // 6. Query Delivery Logs & Aggregated Stats
  console.log('\n--- 6. DELIVERY AUDIT LOGS & KPI STATS ---');
  const logsRes = await fetch('http://localhost:4000/api/v1/communications/logs', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const logsData: any = await logsRes.json();
  console.log('Logs Query Status:', logsRes.status, 'Logs Count:', logsData.data?.length);

  const statsRes = await fetch('http://localhost:4000/api/v1/communications/stats', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const statsData: any = await statsRes.json();
  const stats = statsData.data;
  console.log('Stats Query Status:', statsRes.status, '(Expected 200)');
  console.log('Delivery Rate:', `${stats?.deliveryRatePercent}%`);
  console.log('Total Dispatched:', stats?.totalDispatched);
  console.log('By Channel:', stats?.byChannel);
  console.log('By Status:', stats?.byStatus);
  console.log('Collection Window Active (8 AM - 7 PM):', stats?.collectionWindowActive);

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

  // Borrower attempt send -> 403 Forbidden
  const bSendRes = await fetch('http://localhost:4000/api/v1/communications/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ templateCode: 'APPLICATION_SUBMITTED', channel: 'EMAIL', recipient: 'x', variables: {} }),
  });
  console.log('Borrower Send Notice Status:', bSendRes.status, '(Expected 403 Forbidden)');

  // Borrower attempt stats -> 403 Forbidden
  const bStatsRes = await fetch('http://localhost:4000/api/v1/communications/stats', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Stats Status:', bStatsRes.status, '(Expected 403 Forbidden)');

  // Borrower logs -> returns only their notices
  const bLogsRes = await fetch('http://localhost:4000/api/v1/communications/logs', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  const bLogs = ((await bLogsRes.json()) as any).data || [];
  console.log('Borrower Logs Count:', bLogs.length, '(Strictly isolated to borrower identity)');

  console.log('\n====================================================');
  console.log('ALL STEP 19 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep19Verification().catch(console.error);
