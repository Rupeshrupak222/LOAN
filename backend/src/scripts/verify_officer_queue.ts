const API_BASE = 'http://localhost:4000/api/v1';

async function main() {
  console.log('Logging in as Loan Officer officer@adyapan.dev...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'officer@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const loginJson: any = await loginRes.json();
  const token = loginJson.data?.accessToken;
  if (!token) {
    console.error('Login failed:', loginJson);
    return;
  }
  console.log('Officer logged in successfully.');

  // Test 1: Fetch default applications list (page 1)
  console.log('\n--- 1. Default Page 1 Queue ---');
  const queueRes = await fetch(`${API_BASE}/applications?page=1&pageSize=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const queueJson: any = await queueRes.json();
  console.log('Total items in queue:', queueJson.pagination?.total);
  console.log('First application on Page 1:');
  const firstApp = queueJson.data?.[0];
  console.log({
    applicationNo: firstApp?.applicationNo,
    borrower: firstApp?.customerName,
    product: firstApp?.product,
    amount: firstApp?.requestedAmount,
    status: firstApp?.status,
    submittedOn: firstApp?.createdAt,
  });

  if (firstApp?.applicationNo === 'APP-26097397') {
    console.log('✅ PASS: Harshitha Royal application #APP-26097397 is #1 on Page 1!');
  } else {
    console.log('❌ App was not #1');
  }

  // Test 2: Search by "harshitha"
  console.log('\n--- 2. Search by "harshitha" ---');
  const searchRes = await fetch(`${API_BASE}/applications?search=harshitha`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchJson: any = await searchRes.json();
  console.log('Search results count:', searchJson.data?.length);
  console.log('Found:', searchJson.data?.map((a: any) => `${a.applicationNo} (${a.customerName})`));

  // Test 3: Filter by status SUBMITTED
  console.log('\n--- 3. Filter by status=SUBMITTED ---');
  const statusRes = await fetch(`${API_BASE}/applications?status=SUBMITTED`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statusJson: any = await statusRes.json();
  console.log('Submitted count:', statusJson.data?.length);
  console.log('Found:', statusJson.data?.map((a: any) => `${a.applicationNo} (${a.customerName})`));
}

main().catch(console.error);
