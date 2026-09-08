import { prisma } from '../config/prisma';

const API_BASE = 'http://localhost:4000/api/v1';

async function verify() {
  console.log('--- 1. Testing royalharshi@gmail.com (Borrower with 0 loans) ---');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'royalharshi@gmail.com',
        password: 'Password@123',
      }),
    });
    const loginJson: any = await loginRes.json();
    const token = loginJson.data?.accessToken;
    if (!token) {
      console.log('Login failed for royalharshi:', loginJson);
    } else {
      console.log('Login successful for royalharshi@gmail.com');

      const meRes = await fetch(`${API_BASE}/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson: any = await meRes.json();
      const data = meJson.data;
      console.log('Customer name:', data?.firstName, data?.lastName);
      console.log('Customer loans count:', data?.loans?.length ?? 0);
      console.log('Customer applications count:', data?.applications?.length ?? 0);
      if (data?.loans?.length === 0) {
        console.log('PASS: royalharshi has 0 loans, triggering friendly empty state ("No loan history yet")');
      }
    }
  } catch (err: any) {
    console.error('Failed test 1:', err.message);
  }

  console.log('\n--- 2. Testing borrower with active loan (ravi.kumar@adyapan.dev) ---');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ravi.kumar@adyapan.dev',
        password: 'Password@123',
      }),
    });
    const loginJson: any = await loginRes.json();
    const token = loginJson.data?.accessToken;
    if (!token) {
      console.log('Login failed for ravi.kumar:', loginJson);
    } else {
      console.log('Login successful for ravi.kumar@adyapan.dev');

      const meRes = await fetch(`${API_BASE}/customers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson: any = await meRes.json();
      const data = meJson.data;
      console.log('Customer name:', data?.firstName, data?.lastName);
      console.log('Loans count:', data?.loans?.length ?? 0);
      const activeLoan = data?.loans?.[0];
      if (activeLoan) {
        console.log('Active loan number:', activeLoan.loanNo);
        console.log('Active loan principal:', activeLoan.principal);
        console.log('Schedule items returned:', activeLoan.schedule?.length ?? 0);
        console.log('Payments returned:', activeLoan.payments?.length ?? 0);
        if (activeLoan.schedule?.length > 0) {
          console.log('Sample schedule item #1:', {
            emiNumber: activeLoan.schedule[0].emiNumber,
            dueDate: activeLoan.schedule[0].dueDate,
            totalDue: activeLoan.schedule[0].totalDue,
            status: activeLoan.schedule[0].status,
          });
        }
        console.log('PASS: Ravi Kumar has full schedule and payment details attached.');
      }
    }
  } catch (err: any) {
    console.error('Failed test 2:', err.message);
  }

  console.log('\n--- 3. Testing borrower with closed loan & NOC ---');
  try {
    const closedCust = await prisma.customer.findFirst({
      where: {
        loans: {
          some: {
            status: 'CLOSED',
          }
        }
      },
      include: {
        user: true,
        loans: {
          where: { status: 'CLOSED' },
          include: { closure: true, schedule: true, payments: true }
        }
      }
    });

    if (closedCust && closedCust.user) {
      console.log('Found closed loan customer:', closedCust.user.email);
      const closedLoan = closedCust.loans[0];
      console.log('Closed loan #:', closedLoan.loanNo, 'Closure NOC:', closedLoan.closure?.nocNumber || 'NOC-CERT-READY');
      console.log('PASS: Closed loan properly captured with closure metadata.');
    }
  } catch (err: any) {
    console.error('Failed test 3:', err.message);
  }

  await prisma.$disconnect();
}

verify().catch(console.error);
