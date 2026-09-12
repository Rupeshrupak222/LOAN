const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));

async function run() {
  console.log('Applying DDL directly...');

  const ddls = [
    `CREATE TABLE IF NOT EXISTS "CustomerIdentifier" (
      "id" text PRIMARY KEY,
      "customerId" text NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
      "idType" text NOT NULL,
      "maskedValue" text NOT NULL,
      "idHash" text,
      "encryptedValue" text,
      "verificationStatus" text NOT NULL DEFAULT 'PENDING',
      "verifiedAt" timestamp(3) without time zone,
      "verifiedBy" text,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "WorkQueue" (
      "id" text PRIMARY KEY,
      "tenantId" text REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "name" text NOT NULL,
      "key" text NOT NULL,
      "department" text NOT NULL,
      "workspace" text NOT NULL,
      "description" text,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "ApplicationAssignment" (
      "id" text PRIMARY KEY,
      "applicationId" text NOT NULL REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
      "assignedToUserId" text,
      "assignedByUserId" text,
      "queueId" text REFERENCES "WorkQueue"("id") ON DELETE SET NULL,
      "department" text NOT NULL,
      "workspace" text,
      "assignmentType" text NOT NULL DEFAULT 'INDIVIDUAL',
      "status" text NOT NULL DEFAULT 'ACTIVE',
      "assignedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "unassignedAt" timestamp(3) without time zone,
      "notes" text
    );`,
    `CREATE TABLE IF NOT EXISTS "Task" (
      "id" text PRIMARY KEY,
      "tenantId" text REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "title" text NOT NULL,
      "description" text,
      "taskType" text NOT NULL,
      "entityType" text NOT NULL,
      "entityId" text NOT NULL,
      "applicationId" text REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
      "assignedToUserId" text,
      "assignedTeam" text,
      "queueId" text REFERENCES "WorkQueue"("id") ON DELETE SET NULL,
      "priority" text NOT NULL DEFAULT 'MEDIUM',
      "status" text NOT NULL DEFAULT 'OPEN',
      "dueAt" timestamp(3) without time zone,
      "completedAt" timestamp(3) without time zone,
      "completedByUserId" text,
      "createdByUserId" text,
      "metadata" jsonb,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "ActivityLog" (
      "id" text PRIMARY KEY,
      "tenantId" text REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "entityType" text NOT NULL,
      "entityId" text NOT NULL,
      "activityType" text NOT NULL,
      "title" text,
      "message" text NOT NULL,
      "metadata" jsonb,
      "createdByUserId" text,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "CreditReview" (
      "id" text PRIMARY KEY,
      "applicationId" text NOT NULL REFERENCES "LoanApplication"("id") ON DELETE CASCADE,
      "reviewerId" text,
      "decision" text NOT NULL DEFAULT 'PENDING',
      "score" integer,
      "riskLevel" text DEFAULT 'MEDIUM',
      "maxSanctionAmount" numeric(14, 2),
      "recommendedTenure" integer,
      "recommendedRate" numeric(6, 3),
      "remarks" text,
      "conditions" jsonb,
      "factors" jsonb,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Approval" (
      "id" text PRIMARY KEY,
      "tenantId" text REFERENCES "Tenant"("id") ON DELETE SET NULL,
      "entityType" text NOT NULL DEFAULT 'APPLICATION',
      "entityId" text NOT NULL,
      "applicationId" text REFERENCES "LoanApplication"("id") ON DELETE SET NULL,
      "approvalType" text NOT NULL,
      "level" integer NOT NULL DEFAULT 1,
      "approverRole" text,
      "requestedByUserId" text,
      "assignedToUserId" text,
      "status" text NOT NULL DEFAULT 'PENDING',
      "decisionReason" text,
      "comments" text,
      "requestedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "decidedAt" timestamp(3) without time zone,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "ApprovalHistory" (
      "id" text PRIMARY KEY,
      "approvalId" text NOT NULL REFERENCES "Approval"("id") ON DELETE CASCADE,
      "actorId" text,
      "fromStatus" text NOT NULL,
      "toStatus" text NOT NULL,
      "decision" text,
      "comments" text,
      "createdAt" timestamp(3) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "stage" text DEFAULT 'LEAD';`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'MEDIUM';`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "assignedToUserId" text;`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "queueId" text;`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "submittedAt" timestamp(3) without time zone;`,
    `ALTER TABLE "LoanApplication" ADD COLUMN IF NOT EXISTS "closedAt" timestamp(3) without time zone;`,
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "fromStage" text;`,
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "toStage" text;`,
    `ALTER TABLE "ApplicationStatusHistory" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`,
  ];

  for (let i = 0; i < ddls.length; i++) {
    const ddl = ddls[i];
    console.log(`Executing DDL ${i + 1}/${ddls.length}...`);
    await prisma.$executeRawUnsafe(ddl);
  }

  console.log('All DDLs applied!');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
