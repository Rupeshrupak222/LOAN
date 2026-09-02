import { prisma } from '../config/prisma';

async function main() {
  const apps = await prisma.loanApplication.findMany({
    include: {
      customer: true,
      product: true,
      underwriting: true,
    }
  });
  const loans = await prisma.loan.findMany({
    include: {
      customer: true,
      disbursements: true,
      transactions: true,
    }
  });
  const transactions = await prisma.transaction.findMany();
  console.log('--- DB SUMMARY ---');
  console.log('Applications count:', apps.length);
  apps.forEach(a => {
    console.log(`App ID: ${a.id}, No: ${a.applicationNo}, Status: ${a.status}, Customer: ${a.customer?.firstName} ${a.customer?.lastName}`);
  });
  console.log('Loans count:', loans.length);
  loans.forEach(l => {
    console.log(`Loan ID: ${l.id}, No: ${l.loanNo}, Status: ${l.status}, Principal: ${l.principal}`);
  });
  console.log('Transactions count:', transactions.length);
  transactions.forEach(t => {
    console.log(`Tx ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount}, Ref: ${t.reference}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
