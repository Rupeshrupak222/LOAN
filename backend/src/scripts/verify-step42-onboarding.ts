async function runStep42OnboardingVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 42: COMMERCIAL CLIENT ONBOARDING VERIFICATION');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;
  console.log('Super Admin Login Status:', saLogin.status, 'Token acquired:', Boolean(saToken));

  // 2. Initiate Commercial Onboarding for New Institution
  console.log('\n--- 1. INITIATE COMMERCIAL INSTITUTION ONBOARDING ---');
  const initRes = await fetch('http://localhost:4000/api/v1/client-onboarding/initiate', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'HERO_FINCORP_LIVE',
      name: 'Hero FinCorp Retail & MSME Credit',
      tier: 'ENTERPRISE',
      primaryContact: {
        name: 'Abhimanyu Munjal',
        email: 'abhimanyu@herofincorp.com',
        phone: '+91 98111 55667',
      },
      organizationDetails: {
        cinNumber: 'U65923DL1991PLC046467',
        rbiRegistrationNo: 'B-14.00892',
        domain: 'herofincorp.adyapan.dev',
      },
    }),
  });
  const initData: any = await initRes.json();
  const onbRecord = initData.data;
  console.log('Initiate Status:', initRes.status);
  console.log('  - Onboarding ID:', onbRecord?.id);
  console.log('  - Stage:', onbRecord?.stage);
  console.log('  - Total Checklist Tasks:', onbRecord?.checklist?.length);
  console.log('  - Initial Completion %:', onbRecord?.completionPercentage);

  // 3. Update Checklist Tasks (Progress through Setup)
  console.log('\n--- 2. PROGRESS THROUGH 16-POINT INSTITUTIONAL CHECKLIST ---');
  const updateRes1 = await fetch(`http://localhost:4000/api/v1/client-onboarding/${onbRecord.id}/checklist`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemCode: 'ORGANIZATION_PROFILE',
      status: 'COMPLETED',
    }),
  });
  const upData1: any = await updateRes1.json();
  console.log('Update Task 1 Status:', updateRes1.status, 'Completion %:', upData1.data?.completionPercentage, 'Stage:', upData1.data?.stage);

  // 4. Run Go-Live Validation (Should indicate pending items)
  console.log('\n--- 3. PRE-ACTIVATION GO-LIVE VALIDATION AUDIT ---');
  const valRes = await fetch(`http://localhost:4000/api/v1/client-onboarding/${onbRecord.id}/validate`, {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const valData: any = await valRes.json();
  const v = valData.data;
  console.log('Validation Status:', valRes.status);
  console.log('  - Ready For Live Activation:', v?.readyForActivation);
  console.log('  - Completed Tasks:', v?.completedItemsCount);
  console.log('  - Pending Mandatory Tasks:', v?.pendingMandatoryCount);

  // 5. Super Admin Final Approval & Idempotent Provisioning
  console.log('\n--- 4. SUPER ADMIN APPROVAL & PROVISIONING ---');
  const approveRes = await fetch(`http://localhost:4000/api/v1/client-onboarding/${onbRecord.id}/approve-provision`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notes: 'Hero FinCorp enterprise commercial clearance granted by Chief Risk Officer.',
    }),
  });
  const approveData: any = await approveRes.json();
  const app = approveData.data;
  console.log('Approval & Provisioning Status:', approveRes.status);
  console.log('  - Final Stage:', app?.stage);
  console.log('  - Completion %:', app?.completionPercentage);
  console.log('  - Approved By:', app?.approvalDetails?.approvedBy);
  console.log('  - Statutory Retention Policy (Years):', app?.retentionPolicy?.financialRecordsRetentionYears);

  // 6. Controlled Offboarding with 8-Year Data Retention Lock
  console.log('\n--- 5. CONTROLLED OFFBOARDING WITH 8-YEAR DATA RETENTION ---');
  const deactRes = await fetch(`http://localhost:4000/api/v1/client-onboarding/${onbRecord.id}/deactivate`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'Synthetic test institution decommissioned after validation.',
    }),
  });
  const deactData: any = await deactRes.json();
  console.log('Deactivation Status:', deactRes.status);
  console.log('  - Offboarded Stage:', deactData.data?.stage);
  console.log('  - Financial Retention Locked:', deactData.data?.retentionPolicy?.financialRecordsRetentionYears === 8);

  console.log('\n====================================================');
  console.log('ALL STEP 42 CLIENT ONBOARDING VERIFICATIONS COMPLETED!');
  console.log('====================================================');
}

runStep42OnboardingVerification().catch(console.error);
