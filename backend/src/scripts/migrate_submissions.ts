import { prisma } from '../config/prisma';

async function main() {
  console.log('Creating PaymentSubmission table if not exists...');

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "submissionNo" TEXT NOT NULL UNIQUE,
      "loanId" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      "amount" DECIMAL(14, 2) NOT NULL,
      "method" TEXT NOT NULL,
      "reference" TEXT NOT NULL,
      "payerMobile" TEXT,
      "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "notes" TEXT,
      "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
      "verifiedByUserId" TEXT,
      "verifiedAt" TIMESTAMP(3),
      "rejectionReason" TEXT,
      "paymentId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentSubmission_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentSubmission_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PaymentSubmission_loanId_idx" ON "PaymentSubmission"("loanId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PaymentSubmission_customerId_idx" ON "PaymentSubmission"("customerId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PaymentSubmission_status_idx" ON "PaymentSubmission"("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PaymentSubmission_reference_idx" ON "PaymentSubmission"("reference");
  `);

  console.log('PaymentSubmission table verified and ready!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
