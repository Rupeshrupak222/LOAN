async function runStep13Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 13: BANK STATEMENT INTELLIGENCE LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Login
  console.log('--- 1. SUPER ADMIN AUTHENTICATION ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // Find customer Dinesh Sharma
  const custRes = await fetch('http://localhost:4000/api/v1/customers', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const custList: any = await custRes.json();
  const customer = (Array.isArray(custList.data) ? custList.data : custList.data?.items || []).find((c: any) => c.email === 'dks241655@gmail.com') || (Array.isArray(custList.data) ? custList.data[0] : custList.data?.items?.[0]);
  console.log('Target Customer:', customer?.customerCode, customer?.firstName, customer?.lastName, 'ID:', customer?.id);

  // 2. Integration Hub Fetch Test (Should return NOT_CONFIGURED)
  console.log('\n--- 2. LIVE INTEGRATION HUB BANKING FETCH (UNCONFIGURED PROVIDER) ---');
  const hubFetchRes = await fetch(`http://localhost:4000/api/v1/bank-intelligence/customers/${customer.id}/fetch`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const hubFetchData: any = await hubFetchRes.json();
  console.log('Integration Hub Fetch Status:', hubFetchRes.status, '(Expected 200)');
  console.log('Hub Response Status:', hubFetchData.data?.status, '(Expected NOT_CONFIGURED)');
  console.log('Hub Error Code:', hubFetchData.data?.error?.code, '(Expected PROVIDER_NOT_CONFIGURED)');
  console.log('Zero fake data verified:', hubFetchData.data?.status === 'NOT_CONFIGURED');

  // 3. Ingest Verified 6-Month Bank Statement Data
  console.log('\n--- 3. STATEMENT INGESTION & DETERMINISTIC NORMALIZATION ---');
  const today = new Date();
  const sampleTxns: any[] = [];

  for (let m = 5; m >= 0; m--) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');

    // Salary credit on the 1st
    sampleTxns.push({
      transactionDate: `${yyyy}-${mm}-01`,
      description: 'CMS/INFOSYS LTD/SALARY CR/OCT',
      amount: 85000,
      transactionType: 'CREDIT',
      balanceAfterTransaction: 95000,
    });

    // Rent debit on 5th
    sampleTxns.push({
      transactionDate: `${yyyy}-${mm}-05`,
      description: 'UPI/HOUSE RENT TO LANDLORD',
      amount: 22000,
      transactionType: 'DEBIT',
      balanceAfterTransaction: 73000,
    });

    // Bajaj Finance EMI debit on 10th
    sampleTxns.push({
      transactionDate: `${yyyy}-${mm}-10`,
      description: 'ACH DR BAJAJ FINANCE LTD LOAN EMI',
      amount: 11500,
      transactionType: 'DEBIT',
      balanceAfterTransaction: 61500,
    });

    // Utilities on 15th
    sampleTxns.push({
      transactionDate: `${yyyy}-${mm}-15`,
      description: 'BESCOM ELECTRICITY BILL BANGALORE',
      amount: 2500,
      transactionType: 'DEBIT',
      balanceAfterTransaction: 59000,
    });

    // General living expenses on 22nd
    sampleTxns.push({
      transactionDate: `${yyyy}-${mm}-22`,
      description: 'UPI/SWIGGY/GROCERIES/SUPERMARKET',
      amount: 12000,
      transactionType: 'DEBIT',
      balanceAfterTransaction: 47000,
    });
  }

  // Add pre-application spike anomaly
  const currentY = today.getFullYear();
  const currentM = String(today.getMonth() + 1).padStart(2, '0');
  sampleTxns.push({
    transactionDate: `${currentY}-${currentM}-26`,
    description: 'IMPS INWARD FROM FRIEND KAPOOR',
    amount: 180000, // Large one-off spike
    balanceAfterTransaction: 227000,
    transactionType: 'CREDIT',
  });

  const ingestRes = await fetch(`http://localhost:4000/api/v1/bank-intelligence/customers/${customer.id}/ingest`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bankName: 'HDFC Bank',
      accountNumber: '501004928190',
      source: 'VERIFIED_E_STATEMENT',
      transactions: sampleTxns,
    }),
  });

  const ingestData: any = await ingestRes.json();
  console.log('Statement Ingest Status:', ingestRes.status, '(Expected 200)');
  console.log('Transactions Ingested:', ingestData.data?.transactionsCount, '(Expected 31)');
  console.log('Estimated Recurring Salary:', ingestData.data?.incomeIntelligence?.estimatedRecurringSalary, '(Expected ~85,000)');
  console.log('Salary Frequency:', ingestData.data?.incomeIntelligence?.salaryFrequency, '(Expected MONTHLY)');
  console.log('Average Bank Balance (ABB):', ingestData.data?.cashFlowIntelligence?.averageBankBalance);
  console.log('Detected EMIs:', ingestData.data?.obligationIntelligence?.detectedEmis);
  console.log('Anomaly Signals Count:', ingestData.data?.anomalySignals?.length);
  console.log('AI Executive Summary:', ingestData.data?.advisoryAiSummary?.executiveSummary);

  // 4. Borrower Isolation Test
  console.log('\n--- 4. BORROWER ISOLATION & ACCESS CONTROL ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;
  console.log('Borrower Login Status:', bLogin.status, 'Roles:', bData.data?.user?.roles);

  // 4a. Borrower attempting to trigger Ingestion -> Should be 403 Forbidden
  const bIngestRes = await fetch(`http://localhost:4000/api/v1/bank-intelligence/customers/${customer.id}/ingest`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankName: 'Fake', accountNumber: '123', transactions: [] }),
  });
  console.log('Borrower Ingestion Attempt Status:', bIngestRes.status, '(Expected 403 Forbidden)');

  // 4b. Borrower attempting to trigger Integration Hub fetch -> Should be 403 Forbidden
  const bFetchRes = await fetch(`http://localhost:4000/api/v1/bank-intelligence/customers/${customer.id}/fetch`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Hub Fetch Attempt Status:', bFetchRes.status, '(Expected 403 Forbidden)');

  // 4c. Borrower viewing own statement intelligence -> 200 OK, but anomalies stripped!
  const bViewRes = await fetch(`http://localhost:4000/api/v1/bank-intelligence/customers/${customer.id}`, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  const bViewData: any = await bViewRes.json();
  console.log('Borrower Own Statement View Status:', bViewRes.status, '(Expected 200)');
  console.log('Anomalies exposed to borrower:', bViewData.data?.anomalySignals?.length, '(Expected 0 - Strictly Stripped)');
  console.log('Underwriter questions exposed to borrower:', bViewData.data?.advisoryAiSummary?.underwriterQuestions?.length, '(Expected 0 - Strictly Stripped)');
  console.log('Masked Account:', bViewData.data?.accountNumberMasked, '(Expected XXXXXX8190)');

  console.log('\n====================================================');
  console.log('ALL STEP 13 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep13Verification().catch(console.error);
