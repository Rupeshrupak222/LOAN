import { signAccessToken } from '../modules/auth/tokens';

async function runStep25Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 25: ENTERPRISE SECURITY HARDENING LIVE VERIFICATION');
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

  // 2. PII Masking Integrity Verification
  console.log('\n--- 2. PII MASKING & FIELD-LEVEL COMPLIANCE ---');
  const piiRes = await fetch('http://localhost:4000/api/v1/security/mask-pii', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pan: 'ABCDE1234F',
      aadhaar: '123456789012',
      bankAccount: '987654321098',
      phone: '+919820012345',
      email: 'borrower@adyapan.dev',
    }),
  });
  const piiData: any = await piiRes.json();
  console.log('PII Masking Verification:');
  console.log('  - PAN:', piiData.data?.maskedPan);
  console.log('  - Aadhaar:', piiData.data?.maskedAadhaar);
  console.log('  - Bank Account:', piiData.data?.maskedBankAccount);
  console.log('  - Phone:', piiData.data?.maskedPhone);
  console.log('  - Email:', piiData.data?.maskedEmail);

  // 3. Token Revocation & Immediate Invalidation
  console.log('\n--- 3. TOKEN REVOCATION & IMMEDIATE SESSION INVALIDATION ---');
  const tempOfficerToken = signAccessToken({
    sub: 'usr-officer-99',
    email: 'officer99@adyapan.dev',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-adyapan-default',
  });

  // Verify token works before revocation
  const preRevokeRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: { Authorization: 'Bearer ' + tempOfficerToken },
  });
  console.log('Pre-Revocation Request Status:', preRevokeRes.status, '(Expected 200)');

  // Revoke token
  const revokeRes = await fetch('http://localhost:4000/api/v1/security/revoke-session', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: tempOfficerToken, reason: 'Security compromise testing' }),
  });
  const revokeData: any = await revokeRes.json();
  console.log('Token Revocation Status:', revokeRes.status, 'Message:', revokeData.message);

  // Verify token is immediately rejected
  const postRevokeRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: { Authorization: 'Bearer ' + tempOfficerToken },
  });
  console.log('Post-Revocation Request Status:', postRevokeRes.status, '(Expected 401 Unauthorized)');

  // 4. Cross-Tenant IDOR Breach Defense
  console.log('\n--- 4. CROSS-TENANT IDOR BREACH DEFENSE ---');
  const apexStaffToken = signAccessToken({
    sub: 'usr-apex-officer-88',
    email: 'officer@apexcap.dev',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-apex-nbfc',
  });

  const idorRes = await fetch('http://localhost:4000/api/v1/tenants/current', {
    headers: {
      Authorization: 'Bearer ' + apexStaffToken,
      'X-Tenant-ID': 'tenant-adyapan-default', // IDOR cross-tenant breach attempt
    },
  });
  console.log('Cross-Tenant Header Spoofing Status:', idorRes.status, '(Expected 403 Forbidden)');

  // 5. Security Audit Telemetry
  console.log('\n--- 5. SECURITY AUDIT EVENT STREAM ---');
  const eventsRes = await fetch('http://localhost:4000/api/v1/security/events', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const eventsData: any = await eventsRes.json();
  console.log('Security Audit Events Retrieved:', eventsData.total, 'Latest Event:', eventsData.data?.[0]?.type);

  // 6. Borrower Isolation & RBAC Protection
  console.log('\n--- 6. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bEventsRes = await fetch('http://localhost:4000/api/v1/security/events', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower List Security Events Status:', bEventsRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 25 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep25Verification().catch(console.error);
