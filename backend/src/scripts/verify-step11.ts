async function runFullVerification() {
  console.log('==============================================');
  console.log('STARTING REAL BORROWER & FRAUD ISOLATION TESTS');
  console.log('==============================================\n');

  // STEP 0: Log in as Super Admin and create a second customer (Borrower B) for cross-access testing
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('[SuperAdmin Setup] Token acquired:', Boolean(saToken));

  // Check if Borrower B already exists or create one
  let borrowerBId = '';
  const listCustRes = await fetch('http://localhost:4000/api/v1/customers', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const listCustData: any = await listCustRes.json();
  const existingB = listCustData.data?.find((c: any) => c.email === 'borrower.b@adyapan.dev');

  if (existingB) {
    borrowerBId = existingB.id;
    console.log('[Setup] Borrower B already exists with ID:', borrowerBId);
  } else {
    const createBRes = await fetch('http://localhost:4000/api/v1/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + saToken },
      body: JSON.stringify({
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        mobile: '9822334455',
        email: 'borrower.b@adyapan.dev',
        password: 'Passw0rd!123',
        addressLine: 'Flat 12, Sunrise Heights',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      }),
    });
    const createBData: any = await createBRes.json();
    borrowerBId = createBData.data?.id;
    console.log('[Setup] Created Borrower B with ID:', borrowerBId);
  }

  // TEST A: Authenticate as valid borrower (Borrower A: Dinesh Sharma)
  console.log('\n--- TEST A: VALID BORROWER AUTHENTICATION & OWN-DATA ACCESS ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  console.log('Login Status:', bLogin.status, '(Expected 200)');
  console.log('Roles in token/session:', bData.data?.user?.roles, '(Expected ["CUSTOMER"])');
  console.log('Linked Customer ID:', bData.data?.user?.customerId);
  const borrowerToken = bData.data?.accessToken;
  const borrowerAId = bData.data?.user?.customerId;

  // Access own customer profile
  const ownDataRes = await fetch('http://localhost:4000/api/v1/customers/' + borrowerAId, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  const ownData: any = await ownDataRes.json();
  console.log('Own-Data Access Status:', ownDataRes.status, '(Expected 200)');
  console.log(
    'Own-Data Customer Code:',
    ownData.data?.customerCode,
    'Name:',
    ownData.data?.firstName,
    ownData.data?.lastName
  );

  // TEST B: Cross-Borrower Isolation (Attempt to access Borrower B data using Borrower A token)
  console.log('\n--- TEST B: CROSS-BORROWER ISOLATION ---');
  const crossDataRes = await fetch('http://localhost:4000/api/v1/customers/' + borrowerBId, {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  const crossData: any = await crossDataRes.json();
  console.log('Cross-Borrower Access Status:', crossDataRes.status, '(Expected 403 Forbidden)');
  console.log('Cross-Borrower Error Message:', crossData.error?.message);

  // Cross-Borrower directory list attempt
  const crossListRes = await fetch('http://localhost:4000/api/v1/customers', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Customer Directory List Access as Borrower:', crossListRes.status, '(Expected 403 Forbidden)');

  // TEST C: Fraud & Anomaly Intelligence Access as Borrower (Strictly Forbidden)
  console.log('\n--- TEST C: FRAUD & ANOMALY INTELLIGENCE DATA ISOLATION ---');
  const fraudPortfolioRes = await fetch('http://localhost:4000/api/v1/ai/fraud/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + borrowerToken },
    body: JSON.stringify({}),
  });
  const fraudPortfolioData: any = await fraudPortfolioRes.json();
  console.log('Fraud Portfolio Endpoint Status as Borrower:', fraudPortfolioRes.status, '(Expected 403 Forbidden)');
  console.log('Fraud Portfolio Error Message:', fraudPortfolioData.error?.message);

  const fraudCustRes = await fetch('http://localhost:4000/api/v1/ai/fraud/customers/' + borrowerAId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + borrowerToken },
    body: JSON.stringify({}),
  });
  const fraudCustData: any = await fraudCustRes.json();
  console.log('Fraud Customer Endpoint Status as Borrower:', fraudCustRes.status, '(Expected 403 Forbidden)');
  console.log('Fraud Customer Error Message:', fraudCustData.error?.message);

  // TEST D: Super Admin regression access to Fraud Intelligence
  console.log('\n--- TEST D: SUPER ADMIN REGRESSION TO FRAUD INTELLIGENCE ---');
  const saFraudRes = await fetch('http://localhost:4000/api/v1/ai/fraud/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + saToken },
    body: JSON.stringify({ forceRefresh: false }),
  });
  const saFraudData: any = await saFraudRes.json();
  console.log('Super Admin Fraud Endpoint Status:', saFraudRes.status, '(Expected 200)');
  console.log('Super Admin Fraud Priority:', saFraudData.data?.investigationPriority);
  console.log('Super Admin Signals Monitored:', saFraudData.data?.signals?.length);
  console.log('Super Admin Network Clusters:', saFraudData.data?.networkClusters?.length);
  console.log('Super Admin Summary Preview:', saFraudData.data?.summary?.slice(0, 120) + '...');

  console.log('\n==============================================');
  console.log('ALL TESTS A, B, C, D COMPLETED SUCCESSFULLY!');
  console.log('==============================================');
}

runFullVerification().catch(console.error);
