const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));

async function migrate() {
  console.log('Running Phase 17 Database Migration via Prisma Query Engine...');

  const statements = [
    // 1. CustomerIdentifier
    `CREATE TABLE IF NOT EXISTS "CustomerIdentifier" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "idType" TEXT NOT NULL,
      "maskedValue" TEXT NOT NULL,
      "idHash" TEXT,
      "encryptedValue" TEXT,
      "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "verifiedAt" TIMESTAMP(3),
      "verifiedBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "CustomerIdentifier_customerId_idx" ON "CustomerIdentifier"("customerId");`,
    `CREATE INDEX IF NOT EXISTS "CustomerIdentifier_idType_idx" ON "CustomerIdentifier"("idType");`,

    // 2. LoanApplication stage & workflow columns
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "stage" TEXT DEFAULT 'LEAD';`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'MEDIUM';`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "queueId" TEXT;`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);`,
    `CREATE INDEX IF NOT EXISTS "LoanApplication_stage_idx" ON "LoanApplication"("stage");`,
    `CREATE INDEX IF NOT EXISTS "LoanApplication_assignedToUserId_idx" ON "LoanApplication"("assignedToUserId");`,
    `CREATE INDEX IF NOT EXISTS "LoanApplication_queueId_idx" ON "LoanApplication"("queueId");`,
    `CREATE INDEX IF NOT EXISTS "LoanApplication_priority_idx" ON "LoanApplication"("priority");`,

    // 3. ApplicationStatusHistory columns
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "fromStage" TEXT;`,
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "toStage" TEXT;`,
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`,

    // 4. WorkQueue
    `CREATE TABLE IF NOT EXISTS "WorkQueue" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "name" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "workspace" TEXT NOT NULL,
      "description" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "WorkQueue_tenantId_key_key" ON "WorkQueue"("tenantId", "key");`,
    `CREATE INDEX IF NOT EXISTS "WorkQueue_tenantId_idx" ON "WorkQueue"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "WorkQueue_department_idx" ON "WorkQueue"("department");`,

    // 5. ApplicationAssignment
    `CREATE TABLE IF NOT EXISTS "ApplicationAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "applicationId" TEXT NOT NULL REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
      "assignedToUserId" TEXT,
      "assignedByUserId" TEXT,
      "queueId" TEXT REFERENCES "WorkQueue"("id") ON DELETE SET NULL,
      "department" TEXT NOT NULL,
      "workspace" TEXT,
      "assignmentType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "unassignedAt" TIMESTAMP(3),
      "notes" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "ApplicationAssignment_applicationId_idx" ON "ApplicationAssignment"("applicationId");`,
    `CREATE INDEX IF NOT EXISTS "ApplicationAssignment_assignedToUserId_idx" ON "ApplicationAssignment"("assignedToUserId");`,
    `CREATE INDEX IF NOT EXISTS "ApplicationAssignment_queueId_idx" ON "ApplicationAssignment"("queueId");`,
    `CREATE INDEX IF NOT EXISTS "ApplicationAssignment_status_idx" ON "ApplicationAssignment"("status");`,

    // 6. Task
    `CREATE TABLE IF NOT EXISTS "Task" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "taskType" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "applicationId" TEXT REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
      "assignedToUserId" TEXT,
      "assignedTeam" TEXT,
      "queueId" TEXT REFERENCES "WorkQueue"("id") ON DELETE SET NULL,
      "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "dueAt" TIMESTAMP(3),
      "completedAt" TIMESTAMP(3),
      "completedByUserId" TEXT,
      "createdByUserId" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "Task_tenantId_idx" ON "Task"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "Task_entityType_entityId_idx" ON "Task"("entityType", "entityId");`,
    `CREATE INDEX IF NOT EXISTS "Task_applicationId_idx" ON "Task"("applicationId");`,
    `CREATE INDEX IF NOT EXISTS "Task_assignedToUserId_idx" ON "Task"("assignedToUserId");`,
    `CREATE INDEX IF NOT EXISTS "Task_queueId_idx" ON "Task"("queueId");`,
    `CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");`,
    `CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"("priority");`,
    `CREATE INDEX IF NOT EXISTS "Task_dueAt_idx" ON "Task"("dueAt");`,

    // 7. ActivityLog
    `CREATE TABLE IF NOT EXISTS "ActivityLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "activityType" TEXT NOT NULL,
      "title" TEXT,
      "message" TEXT NOT NULL,
      "metadata" JSONB,
      "createdByUserId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_tenantId_idx" ON "ActivityLog"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_activityType_idx" ON "ActivityLog"("activityType");`,
    `CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");`,

    // 8. CreditReview
    `CREATE TABLE IF NOT EXISTS "CreditReview" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "applicationId" TEXT NOT NULL REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
      "reviewerId" TEXT,
      "decision" TEXT NOT NULL DEFAULT 'PENDING',
      "score" INTEGER,
      "riskLevel" TEXT DEFAULT 'MEDIUM',
      "maxSanctionAmount" DECIMAL(14, 2),
      "recommendedTenure" INTEGER,
      "recommendedRate" DECIMAL(6, 3),
      "remarks" TEXT,
      "conditions" JSONB,
      "factors" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "CreditReview_applicationId_idx" ON "CreditReview"("applicationId");`,
    `CREATE INDEX IF NOT EXISTS "CreditReview_reviewerId_idx" ON "CreditReview"("reviewerId");`,
    `CREATE INDEX IF NOT EXISTS "CreditReview_decision_idx" ON "CreditReview"("decision");`,

    // 9. Approval & ApprovalHistory
    `CREATE TABLE IF NOT EXISTS "Approval" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "entityType" TEXT NOT NULL DEFAULT 'APPLICATION',
      "entityId" TEXT NOT NULL,
      "applicationId" TEXT REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
      "approvalType" TEXT NOT NULL,
      "level" INTEGER NOT NULL DEFAULT 1,
      "approverRole" TEXT,
      "requestedByUserId" TEXT,
      "assignedToUserId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "decisionReason" TEXT,
      "comments" TEXT,
      "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "decidedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "Approval_tenantId_idx" ON "Approval"("tenantId");`,
    `CREATE INDEX IF NOT EXISTS "Approval_entityType_entityId_idx" ON "Approval"("entityType", "entityId");`,
    `CREATE INDEX IF NOT EXISTS "Approval_applicationId_idx" ON "Approval"("applicationId");`,
    `CREATE INDEX IF NOT EXISTS "Approval_status_idx" ON "Approval"("status");`,
    `CREATE INDEX IF NOT EXISTS "Approval_assignedToUserId_idx" ON "Approval"("assignedToUserId");`,

    `CREATE TABLE IF NOT EXISTS "ApprovalHistory" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "approvalId" TEXT NOT NULL REFERENCES "Approval"("id") ON DELETE CASCADE,
      "actorId" TEXT,
      "fromStatus" TEXT NOT NULL,
      "toStatus" TEXT NOT NULL,
      "decision" TEXT,
      "comments" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS "ApprovalHistory_approvalId_idx" ON "ApprovalHistory"("approvalId");`
  ];

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`[${i + 1}/${statements.length}] Executed successfully.`);
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err.message);
      throw err;
    }
  }

  console.log('✅ Phase 17 database migration completed successfully!');
  await prisma.$disconnect();
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
