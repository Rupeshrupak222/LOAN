const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));

const { analyticsMetricsService } = require('../backend/dist/modules/analytics/analytics-metrics.service');
const { reportBuilderService } = require('../backend/dist/modules/analytics/report-builder.service');
const { reportingSnapshotService } = require('../backend/dist/modules/analytics/reporting-snapshot.service');
const { analyticsExportService } = require('../backend/dist/modules/analytics/analytics-export.service');
const { rolePermissionService } = require('../backend/dist/modules/roles/role-permission.service');

async function runPhase14Tests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PHASE 14 COMPREHENSIVE TEST SUITE: ANALYTICS & MIS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Define test actors
  const superAdmin = {
    id: 'usr-super-01',
    roles: ['SUPER_ADMIN'],
    tenantId: 'tenant-adyapan-default',
  };

  const companyAdmin = {
    id: 'usr-comp-01',
    roles: ['COMPANY_ADMIN'],
    tenantId: 'tenant-adyapan-default',
  };

  const branchManager = {
    id: 'usr-bm-01',
    roles: ['BRANCH_MANAGER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'br-mum-01',
  };

  const financeOfficer = {
    id: 'usr-fin-01',
    roles: ['FINANCE_OFFICER'],
    tenantId: 'tenant-adyapan-default',
  };

  const partnerUser = {
    id: 'usr-partner-01',
    roles: ['PARTNER'],
    tenantId: 'tenant-adyapan-default',
    partnerId: 'partner-fintech-01',
  };

  const customerUser = {
    id: 'usr-cust-01',
    roles: ['CUSTOMER'],
  };

  // ---------------------------------------------------------------------------
  // 1. RBAC & PERMISSION CHECKS
  // ---------------------------------------------------------------------------
  console.log('1. RBAC & Permissions Verification:');
  assert(
    rolePermissionService.hasPermission(superAdmin, 'ANALYTICS_COMMAND_CENTER'),
    'Super Admin has ANALYTICS_COMMAND_CENTER permission'
  );
  assert(
    rolePermissionService.hasPermission(branchManager, 'ANALYTICS_BRANCHES'),
    'Branch Manager has ANALYTICS_BRANCHES permission'
  );
  assert(
    rolePermissionService.hasPermission(financeOfficer, 'ANALYTICS_FINANCE'),
    'Finance Officer has ANALYTICS_FINANCE permission'
  );
  assert(
    !rolePermissionService.hasPermission(customerUser, 'ANALYTICS_VIEW'),
    'Customer is denied ANALYTICS_VIEW permission'
  );

  // ---------------------------------------------------------------------------
  // 2. SECURITY & DATA ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n2. Security & Multi-Tenant / Branch / Partner Isolation:');
  try {
    await analyticsMetricsService.getOriginationFunnel(companyAdmin, { tenantId: 'tenant-other-nbfc' });
    assert(false, 'Cross-tenant analytics access should be blocked for Company Admin');
  } catch (err) {
    assert(err.statusCode === 403 || err.code === 'FORBIDDEN', 'Cross-tenant analytics access blocked with ForbiddenError');
  }

  try {
    await analyticsMetricsService.getOriginationFunnel(branchManager, { branchId: 'br-blr-02' });
    assert(false, 'Cross-branch analytics access should be blocked for Branch Manager');
  } catch (err) {
    assert(err.statusCode === 403 || err.code === 'FORBIDDEN', 'Cross-branch analytics access blocked with ForbiddenError');
  }

  try {
    await analyticsMetricsService.getRiskFraudAnalytics(customerUser);
    assert(false, 'Customer cannot access sensitive risk & fraud analytics');
  } catch (err) {
    assert(err.statusCode === 403 || err.code === 'FORBIDDEN', 'Customer blocked from risk & fraud analytics with ForbiddenError');
  }

  // ---------------------------------------------------------------------------
  // 3. ORIGINATIONS & FUNNEL METRICS
  // ---------------------------------------------------------------------------
  console.log('\n3. Origination & Funnel Analytics Engine:');
  const funnel = await analyticsMetricsService.getOriginationFunnel(superAdmin, { preset: 'LAST_30_DAYS' });
  assert(funnel.totalApplications >= 0, 'Total applications calculated');
  assert(funnel.funnelStages && funnel.funnelStages.length === 6, 'All 6 stage funnel milestones computed');
  assert(funnel.approvalRatePct >= 0 && funnel.approvalRatePct <= 100, 'Approval rate is valid percentage');
  assert(funnel.freshness && funnel.freshness.dataFreshnessText.length > 0, 'Data freshness metadata present');

  // ---------------------------------------------------------------------------
  // 4. CREDIT / BRE ANALYTICS
  // ---------------------------------------------------------------------------
  console.log('\n4. Credit & BRE Analytics:');
  const credit = await analyticsMetricsService.getCreditBREAnalytics(superAdmin);
  assert(credit.decisionBreakdown && credit.decisionBreakdown.length === 4, 'Decision breakdown contains all 4 outcomes');
  assert(credit.topRejectionReasons && credit.topRejectionReasons.length > 0, 'Top rejection reasons computed');
  assert(credit.approvalByRiskGrade && credit.approvalByRiskGrade.length === 5, 'Risk grade approval mapping covers 5 tiers');

  // ---------------------------------------------------------------------------
  // 5. RISK & FRAUD MATRIX
  // ---------------------------------------------------------------------------
  console.log('\n5. Risk & Fraud 2D Matrix:');
  const riskFraud = await analyticsMetricsService.getRiskFraudAnalytics(superAdmin);
  assert(riskFraud.riskVsFraudMatrix && riskFraud.riskVsFraudMatrix.length === 5, '2D Risk x Fraud matrix computed');
  assert(riskFraud.fraudTierDistribution && riskFraud.fraudTierDistribution.length === 5, 'Fraud tier distribution populated');

  // ---------------------------------------------------------------------------
  // 6. PORTFOLIO & DELINQUENCY DPD ANALYTICS
  // ---------------------------------------------------------------------------
  console.log('\n6. Portfolio & DPD Delinquency Engine:');
  const portfolio = await analyticsMetricsService.getPortfolioAnalytics(superAdmin);
  assert(portfolio.totalPrincipalOutstanding >= 0, 'Portfolio AUM calculated');
  assert(portfolio.portfolioByProduct && portfolio.portfolioByProduct.length > 0, 'Product distribution computed');

  const delinq = await analyticsMetricsService.getDelinquencyAnalytics(superAdmin);
  assert(delinq.dpdBuckets && delinq.dpdBuckets.length === 6, 'All standard DPD buckets mapped');
  assert(delinq.bucketRollRates && delinq.bucketRollRates.rollBackCurePct > 0, 'Roll-back cure rate computed');

  // ---------------------------------------------------------------------------
  // 7. COLLECTIONS & FINANCIAL ANALYTICS
  // ---------------------------------------------------------------------------
  console.log('\n7. Collections & Financial MIS Integration:');
  const coll = await analyticsMetricsService.getCollectionAnalytics(superAdmin);
  assert(coll.collectorScorecards && coll.collectorScorecards.length > 0, 'Collector productivity scorecards generated');
  assert(coll.overallCollectionEfficiencyPct > 0, 'Collection efficiency computed');

  const fin = await analyticsMetricsService.getFinancialAnalytics(superAdmin);
  assert(fin.totalOperatingRevenue > 0, 'Operating revenue aggregated from financial statements');
  assert(fin.trialBalanceBalanced !== undefined, 'Trial balance verification completed');

  // ---------------------------------------------------------------------------
  // 8. PARTNER, BRANCH & OPERATIONAL SLA TELEMETRY
  // ---------------------------------------------------------------------------
  console.log('\n8. Partner, Branch & Operational SLA Telemetry:');
  const partnerMetrics = await analyticsMetricsService.getPartnerAnalytics(superAdmin);
  assert(partnerMetrics.partnerLeaderboard !== undefined, 'Partner leaderboard computed');

  const partnerScoped = await analyticsMetricsService.getPartnerAnalytics(partnerUser);
  assert(
    partnerScoped.partnerLeaderboard.every((p) => p.partnerId === partnerUser.partnerId),
    'Partner user only sees their own performance data'
  );

  const sla = await analyticsMetricsService.getOperationalSlaAnalytics(superAdmin);
  assert(sla.currentBottleneckStage.length > 0, 'Active operational bottleneck stage identified');
  assert(sla.recommendedAction.length > 0, 'Actionable next recommendation provided');

  // ---------------------------------------------------------------------------
  // 9. DYNAMIC REPORT BUILDER & SAVED REPORTS
  // ---------------------------------------------------------------------------
  console.log('\n9. Report Builder & Saved Reports Library:');
  const reportQuery = {
    title: 'Automated Test Sourcing Report',
    dimensions: ['PRODUCT', 'CHANNEL'],
    metrics: ['APPLICATION_COUNT', 'APPROVAL_RATE', 'DISBURSED_AMOUNT'],
    filters: { preset: 'THIS_MONTH' },
  };

  const reportResult = await reportBuilderService.executeReportQuery(superAdmin, reportQuery);
  assert(reportResult.rows && reportResult.rows.length > 0, 'Report builder dynamic query executed successfully');
  assert(reportResult.rows[0].APPLICATION_COUNT !== undefined, 'Metric column values aggregated properly');

  // Invalid dimension injection prevention
  try {
    await reportBuilderService.executeReportQuery(superAdmin, {
      dimensions: ['INVALID_INJECTION_DIM'],
      metrics: ['APPLICATION_COUNT'],
    });
    assert(false, 'Invalid dimensions should be blocked by whitelist');
  } catch (err) {
    assert(err.statusCode === 400 || err.code === 'BAD_REQUEST', 'Invalid dimension blocked with BadRequestError');
  }

  // Saved report CRUD
  const savedReport = await reportBuilderService.createSavedReport(companyAdmin, {
    name: 'Auto-Test Saved Sourcing MIS',
    visibility: 'TEAM',
    queryConfig: reportQuery,
  });
  assert(savedReport.id.startsWith('rep-'), 'Saved report created with generated ID');

  const savedList = reportBuilderService.listSavedReports(companyAdmin);
  assert(savedList.some((r) => r.id === savedReport.id), 'Created report listed in saved reports library');

  await reportBuilderService.deleteSavedReport(companyAdmin, savedReport.id);
  const updatedList = reportBuilderService.listSavedReports(companyAdmin);
  assert(!updatedList.some((r) => r.id === savedReport.id), 'Saved report successfully deleted');

  // ---------------------------------------------------------------------------
  // 10. AUDITED CSV EXPORT WITH PII MASKING
  // ---------------------------------------------------------------------------
  console.log('\n10. Audited CSV Export Engine:');
  const exportResult = await analyticsExportService.exportReportToCsv(companyAdmin, reportQuery, { unmaskPii: false });
  assert(exportResult.csvContent.length > 0, 'CSV content generated');
  assert(exportResult.filename.endsWith('.csv'), 'CSV filename created with timestamp');

  const maskedPhone = analyticsExportService.maskPii('+91 9876543210', 'phoneNumber', false);
  assert(maskedPhone === '+91 98****3210', 'Phone number masked properly');

  const maskedPan = analyticsExportService.maskPii('ABCDE1234F', 'panNumber', false);
  assert(maskedPan === 'ABCDE****F', 'PAN card masked properly');

  // ---------------------------------------------------------------------------
  // 11. IMMUTABLE REPORTING SNAPSHOTS
  // ---------------------------------------------------------------------------
  console.log('\n11. Immutable Reporting Snapshot Engine:');
  const snapshot = await reportingSnapshotService.generateSnapshot(superAdmin, {
    snapshotDate: '2026-09-12',
    snapshotType: 'DAILY',
  });
  assert(snapshot.isImmutable === true, 'Snapshot created as immutable point-in-time state');
  assert(snapshot.totalAum > 0, 'Snapshot captures total AUM');

  const snapshotsList = reportingSnapshotService.listSnapshots(superAdmin);
  assert(snapshotsList.some((s) => s.id === snapshot.id), 'Snapshot stored in immutable snapshot ledger');

  // ---------------------------------------------------------------------------
  // 12. EXECUTIVE COMMAND CENTER
  // ---------------------------------------------------------------------------
  console.log('\n12. Executive Command Center Telemetry:');
  const commandCenter = await analyticsMetricsService.getCommandCenterOverview(superAdmin);
  assert(commandCenter.enterpriseSnapshot.totalAum > 0, 'Command center snapshot AUM loaded');
  assert(commandCenter.operationsAlerts && commandCenter.operationsAlerts.length > 0, 'Actionable operational alerts populated');

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase14Tests().catch((err) => {
  console.error('Fatal error during Phase 14 test execution:', err);
  process.exit(1);
});
