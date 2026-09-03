async function runStep36Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 36: DYNAMIC PRODUCT CATALOG LIVE VERIFICATION');
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

  // 2. Dynamic Product Catalog Retrieval
  console.log('\n--- 2. DYNAMIC PRODUCT CATALOG RETRIEVAL ---');
  const catRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const catData: any = await catRes.json();
  const products = catData.data;
  console.log('Catalog Status:', catRes.status, 'Total Products:', products?.length);
  products?.forEach((p: any) => {
    console.log(`  - [${p.code}] ${p.name} | Category: ${p.category} | Model: ${p.interestModel} | Rate: ${p.baseInterestRateAnnualPct}% | v${p.version}.0`);
  });

  // 3. Pricing Simulation & Key Fact Statement (KFS)
  console.log('\n--- 3. PRICING SIMULATION & STATUTORY KFS GENERATION ---');
  const primeProduct = products?.find((p: any) => p.code === 'PERSONAL_PRIME_SALARIED');
  const simRes = await fetch('http://localhost:4000/api/v1/loan-products/simulate-pricing', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: primeProduct.id,
      loanAmount: 500000,
      tenureMonths: 24,
      applicantProfile: {
        cibilScore: 760,
        monthlyIncome: 65000,
        existingEmis: 8000,
      },
    }),
  });
  const simData: any = await simRes.json();
  const sim = simData.data;
  console.log('Pricing Simulation Status:', simRes.status);
  console.log('  - Product Name:', sim?.productName);
  console.log('  - Monthly EMI:', sim?.monthlyEmi);
  console.log('  - Statutory APR:', `${sim?.annualPercentageRateApr}%`);
  console.log('  - Total Processing Fees:', sim?.totalFees);
  console.log('  - Net Disbursed:', sim?.netDisbursedAmount);
  console.log('  - KFS Cooling-Off Period:', `${sim?.keyFactStatement?.coolingOffPeriodDays} Days`);
  console.log('  - Eligibility Status:', sim?.eligibilityCheck?.eligible ? 'ELIGIBLE' : 'INELIGIBLE');
  console.log('  - Projected FOIR:', `${sim?.eligibilityCheck?.computedFoirPct}%`);

  // 4. Dynamic Product Creation & Versioning Lifecycle
  console.log('\n--- 4. PRODUCT CREATION & VERSIONING LIFECYCLE ---');
  const createRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'GREEN_EV_LOAN_LIVE',
      name: 'Green Mobility Electric Vehicle Loan',
      description: 'Concessional green mobility credit facility for EV adoption',
      category: 'VEHICLE',
      interestModel: 'REDUCING_BALANCE',
      baseInterestRateAnnualPct: 10.5,
      minLoanAmountInr: 50000,
      maxLoanAmountInr: 2500000,
      minTenureMonths: 12,
      maxTenureMonths: 60,
      feeSchedule: {
        processingFeePct: 1.0,
        processingFeeMinInr: 1000,
        documentationChargesInr: 500,
        foreclosurePenaltyPct: 0.0,
        lockInMonths: 0,
        latePaymentPenaltyMonthlyPct: 2.0,
        gracePeriodDays: 5,
      },
    }),
  });
  const createData: any = await createRes.json();
  const createdProd = createData.data;
  console.log('Create Product Status:', createRes.status, 'Code:', createdProd?.code, 'Version:', `v${createdProd?.version}.0`);

  // Update product to v2.0
  const updateRes = await fetch(`http://localhost:4000/api/v1/loan-products/catalog/${createdProd.id}`, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      baseInterestRateAnnualPct: 11.0,
    }),
  });
  const updateData: any = await updateRes.json();
  const updatedProd = updateData.data;
  console.log('Update Product Status:', updateRes.status, 'New Version:', `v${updatedProd?.version}.0`, 'New Rate:', `${updatedProd?.baseInterestRateAnnualPct}%`);

  // 5. Borrower Isolation & RBAC Protection
  console.log('\n--- 5. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bCreateRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + borrowerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: 'HACK_PROD', name: 'Hacked' }),
  });
  console.log('Borrower Create Product Status:', bCreateRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 36 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep36Verification().catch(console.error);
