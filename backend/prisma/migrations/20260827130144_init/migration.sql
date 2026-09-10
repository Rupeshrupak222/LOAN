-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'KYC_PENDING', 'KYC_VERIFIED', 'BLOCKED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InterestMethod" AS ENUM ('FLAT', 'REDUCING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'KYC_PENDING', 'KYC_VERIFIED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING', 'APPROVED', 'REJECTED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'OVERDUE', 'RESTRUCTURED', 'SETTLED', 'CLOSED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('UPCOMING', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employeeId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "userId" TEXT,
    "branchId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "employmentType" TEXT,
    "employerName" TEXT,
    "monthlyIncome" DECIMAL(14,2),
    "existingObligations" DECIMAL(14,2),
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfsc" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "riskCategory" "RiskCategory",
    "status" "CustomerStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "minAmount" DECIMAL(14,2) NOT NULL,
    "maxAmount" DECIMAL(14,2) NOT NULL,
    "minTenureMonths" INTEGER NOT NULL,
    "maxTenureMonths" INTEGER NOT NULL,
    "interestRate" DECIMAL(6,3) NOT NULL,
    "interestMethod" "InterestMethod" NOT NULL DEFAULT 'REDUCING',
    "processingFeePct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "lateFeePct" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "eligibilityRules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(14,2) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "purpose" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityAssessment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnderwritingDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "decidedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnderwritingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "loanNo" TEXT NOT NULL,
    "applicationId" TEXT,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "principal" DECIMAL(14,2) NOT NULL,
    "interestRate" DECIMAL(6,3) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "emiAmount" DECIMAL(14,2) NOT NULL,
    "disbursementDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "outstandingPrincipal" DECIMAL(14,2) NOT NULL,
    "outstandingInterest" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outstandingFees" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "nextDueDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentScheduleItem" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "emiNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principal" DECIMAL(14,2) NOT NULL,
    "interest" DECIMAL(14,2) NOT NULL,
    "fees" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(14,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "RepaymentScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "disbursedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNo" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "idempotencyKey" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "loanId" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_mobile_idx" ON "Customer"("mobile");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProduct_code_key" ON "LoanProduct"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_applicationNo_key" ON "LoanApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "LoanApplication_applicationNo_idx" ON "LoanApplication"("applicationNo");

-- CreateIndex
CREATE INDEX "LoanApplication_customerId_idx" ON "LoanApplication"("customerId");

-- CreateIndex
CREATE INDEX "LoanApplication_status_idx" ON "LoanApplication"("status");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibilityAssessment_applicationId_key" ON "EligibilityAssessment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_applicationId_key" ON "RiskAssessment"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "UnderwritingDecision_applicationId_key" ON "UnderwritingDecision"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanNo_key" ON "Loan"("loanNo");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_applicationId_key" ON "Loan"("applicationId");

-- CreateIndex
CREATE INDEX "Loan_loanNo_idx" ON "Loan"("loanNo");

-- CreateIndex
CREATE INDEX "Loan_customerId_idx" ON "Loan"("customerId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_nextDueDate_idx" ON "Loan"("nextDueDate");

-- CreateIndex
CREATE INDEX "RepaymentScheduleItem_loanId_idx" ON "RepaymentScheduleItem"("loanId");

-- CreateIndex
CREATE INDEX "RepaymentScheduleItem_dueDate_idx" ON "RepaymentScheduleItem"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RepaymentScheduleItem_loanId_emiNumber_key" ON "RepaymentScheduleItem"("loanId", "emiNumber");

-- CreateIndex
CREATE INDEX "Disbursement_loanId_idx" ON "Disbursement"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNo_key" ON "Payment"("paymentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_loanId_idx" ON "Payment"("loanId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "Transaction_loanId_idx" ON "Transaction"("loanId");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "Document"("customerId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityAssessment" ADD CONSTRAINT "EligibilityAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnderwritingDecision" ADD CONSTRAINT "UnderwritingDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "LoanProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentScheduleItem" ADD CONSTRAINT "RepaymentScheduleItem_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
