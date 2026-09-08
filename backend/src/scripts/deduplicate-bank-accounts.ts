import { prisma } from '../config/prisma';

async function main() {
  console.log('Finding duplicate customer bank accounts in database...');
  const allAccounts = await prisma.customerBankAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Map<string, string>(); // customerId_accountNumber -> kept account id
  let duplicatesDeleted = 0;

  for (const acc of allAccounts) {
    const key = `${acc.customerId}_${acc.accountNumber?.trim()}`;
    if (!seen.has(key)) {
      seen.set(key, acc.id);
    } else {
      console.log(`Deleting duplicate bank account: ${acc.id} (${acc.bankName} - ${acc.accountNumber}) for customer ${acc.customerId}`);
      await prisma.customerBankAccount.delete({ where: { id: acc.id } });
      duplicatesDeleted++;
    }
  }

  console.log(`Deduplication complete. Deleted ${duplicatesDeleted} duplicate bank account records.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
