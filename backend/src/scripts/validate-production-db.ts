#!/usr/bin/env tsx
/**
 * Adyapan LMS - Production Database Readiness & Data Integrity Validation
 *
 * This script is strictly READ-ONLY.
 * It executes zero database mutations, zero writes, and zero schema changes.
 */

import { dataReadinessService } from '../modules/database/data-readiness.service';
import { prisma } from '../config/prisma';

async function main() {
  console.log('========================================================================');
  console.log('       ADYAPAN LOAN MANAGEMENT SYSTEM (LMS) - DATABASE AUDIT');
  console.log('               STEP 53: PRODUCTION DATA READINESS');
  console.log('========================================================================\n');

  console.log('Executing safe, read-only production database integrity audit...\n');

  const startTime = Date.now();
  const audit = await dataReadinessService.runProductionDatabaseAudit();
  const durationMs = Date.now() - startTime;

  console.log(`Audit Completed in ${durationMs}ms`);
  console.log(`Timestamp:   ${audit.timestamp}`);
  console.log(`Environment: ${audit.environment}`);
  console.log(`Engine:      ${audit.databaseEngine}`);
  console.log(`Mode:        READ-ONLY (Strictly enforced - 0 mutations)`);
  console.log(`Connection:  ${audit.connectionStatus}\n`);

  console.log('--- 1. CRITICAL ENTITY & TABLE STATISTICS ---');
  console.table(
    audit.tableStats.map((t) => ({
      'Table Name': t.tableName,
      'Row Count': t.rowCount >= 0 ? t.rowCount : 'ERROR',
      Status: t.status,
    }))
  );

  console.log('\n--- 2. FINANCIAL INTEGRITY SUMMARY ---');
  console.log(`Total Loans Audited:            ${audit.financialSummary.totalLoansAudited}`);
  console.log(`Total Disbursed Principal:       ₹${Number(audit.financialSummary.totalPrincipalDisbursed).toLocaleString('en-IN')}`);
  console.log(`Total Outstanding Principal:     ₹${Number(audit.financialSummary.totalOutstandingPrincipal).toLocaleString('en-IN')}`);
  console.log(`Total Payments Audited:          ${audit.financialSummary.totalPaymentsAudited}`);
  console.log(`Total Allocations Audited:       ${audit.financialSummary.totalAllocationsAudited}`);
  console.log(`Financial Discrepancies:         ${audit.financialSummary.discrepanciesCount}\n`);

  console.log('--- 3. DATA READINESS CHECKS SUMMARY ---');
  console.table([
    { Check: 'Referential Integrity', Result: audit.checksSummary.referentialIntegrity },
    { Check: 'Orphan Detection', Result: audit.checksSummary.orphanDetection },
    { Check: 'Duplicate Identifiers', Result: audit.checksSummary.duplicateIdentifiers },
    { Check: 'Financial Consistency', Result: audit.checksSummary.financialConsistency },
    { Check: 'State & Lifecycle Consistency', Result: audit.checksSummary.stateConsistency },
    { Check: 'Required Relationships', Result: audit.checksSummary.requiredRelationships },
    { Check: 'Security Protections (Argon2 / Hashes)', Result: audit.checksSummary.securityProtections },
  ]);

  if (audit.anomalies.length > 0) {
    console.log('\n--- 4. ANOMALIES & AUDIT FINDINGS ---');
    console.table(
      audit.anomalies.map((a) => ({
        Category: a.category,
        Entity: a.entity,
        Classification: a.classification,
        Description: a.description,
        Count: a.affectedCount,
        'Sample IDs': a.sampleIds ? a.sampleIds.join(', ') : 'N/A',
      }))
    );
  } else {
    console.log('\n--- 4. ANOMALIES & AUDIT FINDINGS ---');
    console.log('ZERO ANOMALIES FOUND. All integrity invariants and state constraints satisfied.');
  }

  console.log('\n========================================================================');
  console.log(`FINAL VERDICT: [ ${audit.verdict} ]`);
  console.log('========================================================================\n');

  await prisma.$disconnect();

  if (audit.verdict === 'NOT READY') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(async (err) => {
  console.error('Fatal error during production database audit:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
