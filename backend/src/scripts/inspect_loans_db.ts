import { prisma } from '../config/prisma';

async function test() {
  const loans = await prisma.loan.findMany({
    include: {
      customer: { include: { user: true } },
      product: true,
      schedule: true,
      payments: true,
      closure: true,
    },
  });
  console.log('Total loans in DB:', loans.length);
  loans.forEach((l) =>
    console.log(
      'Loan:',
      l.loanNo,
      'Customer:',
      l.customer.firstName,
      l.customer.lastName,
      'Email:',
      l.customer.email,
      'Status:',
      l.status,
      'Principal:',
      l.principal,
      'Outstanding:',
      l.outstandingPrincipal,
      'Schedule items:',
      l.schedule.length,
      'Payments:',
      l.payments.length
    )
  );
  await prisma.$disconnect();
}

test().catch(console.error);
