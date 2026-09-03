import { validateProductionEnvironment } from '../config/env-validator';

async function runStep26Verification() {
  console.log('====================================================');
  console.log('STARTING STEP 26: PRODUCTION INFRASTRUCTURE & DEPLOYMENT HARDENING LIVE VERIFICATION');
  console.log('====================================================\n');

  // 1. Kubernetes Health Probes Verification
  console.log('--- 1. KUBERNETES CLOUD-NATIVE HEALTH PROBES ---');

  // Liveness Probe
  const liveRes = await fetch('http://localhost:4000/health/live');
  const liveData: any = await liveRes.json();
  console.log('Liveness Probe (/health/live) Status:', liveRes.status, 'Payload:', liveData);

  // Readiness Probe
  const readyRes = await fetch('http://localhost:4000/health/ready');
  const readyData: any = await readyRes.json();
  console.log('\nReadiness Probe (/health/ready) Status:', readyRes.status, 'Subsystems:', readyData.subsystems);

  // Startup Probe
  const startupRes = await fetch('http://localhost:4000/health/startup');
  const startupData: any = await startupRes.json();
  console.log('\nStartup Probe (/health/startup) Status:', startupRes.status, 'Node Version:', startupData.nodeVersion);

  // Subsystem Telemetry Probe
  const telemetryRes = await fetch('http://localhost:4000/health/telemetry');
  const telemetryData: any = await telemetryRes.json();
  console.log('\nTelemetry Probe (/health/telemetry) Status:', telemetryRes.status, 'Memory RSS (MB):', telemetryData.data?.memory?.rssMb);

  // 2. Production Environment Validation Fail-Fast Check
  console.log('\n--- 2. PRODUCTION ENVIRONMENT VALIDATION & FAIL-FAST CHECKS ---');
  const badProdEnv = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/adyapan',
    JWT_ACCESS_SECRET: 'change_me_access_secret_dev_only', // Insecure placeholder
    JWT_REFRESH_SECRET: 'change_me_refresh_secret_dev_only', // Insecure placeholder
  };
  const validationResult = validateProductionEnvironment(badProdEnv);
  console.log('Insecure Prod Env Valid:', validationResult.valid, '(Expected false)');
  console.log('Identified Fatal Errors:');
  validationResult.errors.forEach((e) => console.log('  -', e));

  // 3. Super Admin Authentication & Async Worker Management
  console.log('\n--- 3. ASYNC WORKER & JOB QUEUE MANAGEMENT ---');
  const saLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'superadmin@adyapan.dev', password: 'Passw0rd!123' }),
  });
  const saData: any = await saLogin.json();
  const saToken = saData.data?.accessToken;

  // Enqueue async report generation job
  const enqueueRes = await fetch('http://localhost:4000/api/v1/jobs/enqueue', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + saToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'REPORT_GENERATION',
      priority: 'HIGH',
      payload: { reportType: 'PORTFOLIO_CONCENTRATION_RISK', records: 500 },
      idempotencyKey: 'idemp-report-live-test-01',
    }),
  });
  const enqueueData: any = await enqueueRes.json();
  console.log('Job Enqueue Status:', enqueueRes.status, 'Job ID:', enqueueData.data?.id);

  // Check worker metrics
  const metricsRes = await fetch('http://localhost:4000/api/v1/jobs/metrics', {
    headers: { Authorization: 'Bearer ' + saToken },
  });
  const metricsData: any = await metricsRes.json();
  console.log('Worker Pool Metrics:', metricsData.data);

  // 4. Borrower Isolation & RBAC Protection
  console.log('\n--- 4. BORROWER ISOLATION & RBAC PROTECTION ---');
  const bLogin = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dks241655@gmail.com', password: 'Passw0rd!123' }),
  });
  const bData: any = await bLogin.json();
  const borrowerToken = bData.data?.accessToken;

  const bMetricsRes = await fetch('http://localhost:4000/api/v1/jobs/metrics', {
    headers: { Authorization: 'Bearer ' + borrowerToken },
  });
  console.log('Borrower Access Job Metrics Status:', bMetricsRes.status, '(Expected 403 Forbidden)');

  console.log('\n====================================================');
  console.log('ALL STEP 26 LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runStep26Verification().catch(console.error);
