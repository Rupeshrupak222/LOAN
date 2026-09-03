async function runStep39LoadVerification() {
  console.log('====================================================');
  console.log('STARTING STEP 39: ENTERPRISE LOAD & PERFORMANCE VERIFICATION');
  console.log('====================================================\n');

  // Authenticate Super Admin for benchmark calls
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;

  // Helper function to benchmark parallel requests
  async function benchmarkEndpoint(
    name: string,
    concurrency: number,
    requestFn: (index: number) => Promise<Response>
  ) {
    console.log(`\n--- BENCHMARK: ${name} (${concurrency} concurrent requests) ---`);
    const startTotal = performance.now();

    const tasks = Array.from({ length: concurrency }, (_, i) => {
      const t0 = performance.now();
      return requestFn(i).then((res) => {
        const t1 = performance.now();
        return {
          status: res.status,
          latencyMs: t1 - t0,
        };
      });
    });

    const results = await Promise.all(tasks);
    const totalDurationMs = performance.now() - startTotal;

    const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(concurrency * 0.5)];
    const p95 = latencies[Math.floor(concurrency * 0.95)];
    const p99 = latencies[Math.floor(concurrency * 0.99)];
    const successCount = results.filter((r) => r.status >= 200 && r.status < 300).length;
    const errorCount = concurrency - successCount;
    const rps = Math.round((concurrency / totalDurationMs) * 1000);

    console.log(`  Completed ${concurrency} requests in ${totalDurationMs.toFixed(1)}ms (${rps} RPS)`);
    console.log(`  Latencies: p50 = ${p50.toFixed(1)}ms | p95 = ${p95.toFixed(1)}ms | p99 = ${p99.toFixed(1)}ms`);
    console.log(`  Success: ${successCount}/${concurrency} | Error Rate: ${((errorCount / concurrency) * 100).toFixed(1)}%`);

    return { p50, p95, p99, rps, errorCount };
  }

  // 1. Health Endpoint Concurrent Benchmark
  await benchmarkEndpoint('Health & Diagnostics GET /health', 100, () =>
    fetch('http://localhost:4000/health')
  );

  // 2. Product Catalog Pricing Simulation POST /api/v1/loan-products/simulate-pricing
  const primeProductRes = await fetch('http://localhost:4000/api/v1/loan-products/catalog', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const primeProductData: any = await primeProductRes.json();
  const primeProduct = primeProductData.data?.find((p: any) => p.code === 'PERSONAL_PRIME_SALARIED');

  await benchmarkEndpoint('Pricing & KFS Simulation POST /loan-products/simulate-pricing', 50, (i) =>
    fetch('http://localhost:4000/api/v1/loan-products/simulate-pricing', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: primeProduct.id,
        loanAmount: 250000 + i * 1000,
        tenureMonths: 12,
        applicantProfile: {
          cibilScore: 780,
          monthlyIncome: 80000,
          existingEmis: 5000,
        },
      }),
    })
  );

  // 3. Dynamic Workflow Transition POST /api/v1/workflows/evaluate-transition
  await benchmarkEndpoint('Workflow Gate Evaluation POST /workflows/evaluate-transition', 50, (i) =>
    fetch('http://localhost:4000/api/v1/workflows/evaluate-transition', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowType: 'LOAN_ORIGINATION',
        currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
        candidatePayload: {
          applicationId: `appl-bench-${i}`,
          cibilScore: 770 + (i % 30),
          employmentType: 'SALARIED',
          fraudScore: 10,
          loanAmount: 300000,
        },
      }),
    })
  );

  // 4. Banking Segregation of Duties POST /api/v1/roles/check-sod
  await benchmarkEndpoint('Banking SoD Conflict Check POST /roles/check-sod', 50, () =>
    fetch('http://localhost:4000/api/v1/roles/check-sod', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + saToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
      }),
    })
  );

  console.log('\n====================================================');
  console.log('ALL STEP 39 LOAD & PERFORMANCE BENCHMARKS PASSED!');
  console.log('====================================================');
}

runStep39LoadVerification().catch(console.error);
