async function testLogins() {
  const accounts = [
    { email: 'officer@adyapan.dev', pass: 'Passw0rd!123', role: 'LOAN_OFFICER' },
    { email: 'admin@adyapan.dev', pass: 'Passw0rd!123', role: 'ADMIN' },
    { email: 'superadmin@adyapan.dev', pass: 'Passw0rd!123', role: 'SUPER_ADMIN' },
    { email: 'manager@adyapan.dev', pass: 'Passw0rd!123', role: 'BRANCH_MANAGER' },
    { email: 'analyst@adyapan.dev', pass: 'Passw0rd!123', role: 'CREDIT_ANALYST' },
    { email: 'underwriter@adyapan.dev', pass: 'Passw0rd!123', role: 'UNDERWRITER' },
    { email: 'finance@adyapan.dev', pass: 'Passw0rd!123', role: 'FINANCE_OFFICER' },
    { email: 'collections@adyapan.dev', pass: 'Passw0rd!123', role: 'COLLECTION_OFFICER' },
    { email: 'auditor@adyapan.dev', pass: 'Passw0rd!123', role: 'AUDITOR' },
    { email: 'royalharshi@gmail.com', pass: 'Harshi@12345', role: 'CUSTOMER' },
    { email: 'ravi.kumar@adyapan.dev', pass: 'Passw0rd!123', role: 'CUSTOMER' },
  ];

  console.log('Testing login endpoint for all staff and customer accounts:\n');

  for (const acc of accounts) {
    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: acc.email, password: acc.pass }),
      });
      const data: any = await res.json();
      if (res.status === 200 && data.success) {
        console.log(`✅ SUCCESS: ${acc.email} -> Roles: [${data.data?.user?.roles?.join(', ')}] Token acquired`);
      } else {
        console.log(`❌ FAILED: ${acc.email} (HTTP ${res.status}) ->`, data);
      }
    } catch (err: any) {
      console.log(`❌ ERROR: ${acc.email} ->`, err.message);
    }
  }
}

testLogins().catch(console.error);
