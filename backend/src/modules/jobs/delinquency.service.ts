import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import { Money } from '../finance/money';
import { EmailProvider, SmsProvider } from '../notifications/provider';
import { sendNotification } from '../notifications/notification.service';

const emailProvider = new EmailProvider();
const smsProvider = new SmsProvider();

/**
 * 1. Automated EMI Reminder Service (3 Days Before Due Date)
 */
export async function processEmiReminders(targetDaysAhead = 3) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + targetDaysAhead);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  logger.info({
    msg: '[EMI-REMINDER-JOB] Scanning installments due in 3 days',
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  });

  const dueItems = await prisma.repaymentScheduleItem.findMany({
    where: {
      status: { in: ['DUE', 'UPCOMING'] },
      dueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      loan: {
        include: {
          customer: true,
          product: true,
        },
      },
    },
  });

  let dispatchedCount = 0;
  const results = [];

  for (const item of dueItems) {
    const loan = item.loan;
    const customer = loan?.customer;
    if (!customer) continue;

    const formattedDueDate = new Date(item.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedAmount = `₹${parseFloat(item.totalDue || item.emiAmount || '0').toLocaleString('en-IN')}`;
    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000/customer/payments';

    // Built-in Adyapan FinTech HTML Email Template
    const emailSubject = `Upcoming EMI Reminder: ${formattedAmount} Due on ${formattedDueDate} — Adyapan LMS`;
    const htmlEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B0F19; color: #E2E8F0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #111625; border-radius: 20px; border: 1px solid #1E2445; padding: 32px; shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { text-align: center; border-b: 1px solid #1E2445; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .logo span { color: #2563EB; }
    .badge { display: inline-block; background: rgba(37, 99, 235, 0.15); color: #60A5FA; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(37, 99, 235, 0.3); text-transform: uppercase; margin-bottom: 12px; }
    .card { background: #1E2445; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid rgba(255, 255, 255, 0.05); }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: #94A3B8; font-size: 12px; font-weight: 500; }
    .value { color: #FFFFFF; font-size: 12px; font-weight: 700; }
    .total-amount { font-size: 24px; font-weight: 900; color: #60A5FA; margin-top: 8px; }
    .btn { display: inline-block; width: 100%; background: linear-gradient(to right, #2563EB, #1D4ED8); color: #FFFFFF; text-decoration: none; font-weight: 800; font-size: 13px; text-align: center; padding: 14px 0; border-radius: 12px; margin-top: 20px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4); }
    .footer { text-align: center; font-size: 11px; color: #64748B; margin-top: 28px; border-top: 1px solid #1E2445; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Adyapan <span>LMS</span></div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">Adyapan IT Solution FinTech Platform</div>
    </div>
    
    <div style="text-align: center;">
      <div class="badge">Payment Due Reminder</div>
      <h2 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 800;">Upcoming Loan Installment</h2>
      <p style="font-size: 13px; color: #94A3B8; margin-top: 6px;">Dear <strong>${customerName}</strong>, your monthly installment is due in 3 days.</p>
    </div>

    <div class="card">
      <div class="row">
        <span class="label">Loan Account Code</span>
        <span class="value">${loan.loanCode}</span>
      </div>
      <div class="row">
        <span class="label">Installment Number</span>
        <span class="value">#${item.installmentNumber}</span>
      </div>
      <div class="row">
        <span class="label">Due Date</span>
        <span class="value">${formattedDueDate}</span>
      </div>
      <div class="row">
        <span class="label">Principal Breakup</span>
        <span class="value">₹${parseFloat(item.principalDue || '0').toLocaleString('en-IN')}</span>
      </div>
      <div class="row">
        <span class="label">Interest Breakup</span>
        <span class="value">₹${parseFloat(item.interestDue || '0').toLocaleString('en-IN')}</span>
      </div>
      <div style="text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1);">
        <div class="label">Total Amount Payable</div>
        <div class="total-amount">${formattedAmount}</div>
      </div>
    </div>

    <a href="${portalUrl}" class="btn">Pay EMI Instantly via Borrower Portal &rarr;</a>

    <div class="footer">
      <p style="margin: 0;">This is an automated notification from Adyapan IT Solution Loan Management System.</p>
      <p style="margin: 4px 0 0 0;">Customer Care: 1800-ADYAPAN • Email: support@adyapan.com</p>
    </div>
  </div>
</body>
</html>
    `;

    // Built-in Compliant SMS Text Template
    const smsText = `Dear ${customerName}, your Adyapan Loan ${loan.loanCode} EMI of ${formattedAmount} is due on ${formattedDueDate}. Pay instantly at ${portalUrl} to keep your credit score pristine. Call 1800-ADYAPAN for assistance.`;

    // Dispatch Notifications
    if (customer.email) {
      await emailProvider.send({
        recipient: customer.email,
        title: emailSubject,
        body: htmlEmailBody,
        templateCode: 'UPCOMING_EMI_REMINDER_EMAIL',
      });
    }

    if (customer.mobile) {
      await smsProvider.send({
        recipient: customer.mobile,
        title: 'Adyapan EMI Due Alert',
        body: smsText,
        templateCode: 'UPCOMING_EMI_REMINDER_SMS',
      });
    }

    // Persist In-App Notification
    await sendNotification({
      customerId: customer.id,
      userId: customer.userId || undefined,
      title: `EMI Due Reminder: ${formattedAmount}`,
      message: `Installment #${item.installmentNumber} for Loan ${loan.loanCode} is due on ${formattedDueDate}.`,
      channel: 'EMAIL_AND_SMS',
      type: 'PAYMENT_DUE',
      metadata: { loanId: loan.id, installmentId: item.id, amount: item.totalDue, dueDate: item.dueDate },
    });

    dispatchedCount++;
    results.push({ loanCode: loan.loanCode, customer: customerName, dueDate: formattedDueDate, amount: formattedAmount });
  }

  logger.info(`[EMI-REMINDER-JOB] Completed. Dispatched ${dispatchedCount} reminders.`);
  return { dispatchedCount, items: results };
}

/**
 * 2. Midnight DPD & Delinquency Engine Service (Runs at 00:00 Midnight)
 */
export async function processMidnightDelinquencyEngine() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  logger.info({ msg: '[MIDNIGHT-DPD-ENGINE] Executing midnight delinquency scan', timestamp: now.toISOString() });

  // Find all schedule items where dueDate < today and status is DUE or UPCOMING
  const overdueItems = await prisma.repaymentScheduleItem.findMany({
    where: {
      status: { in: ['DUE', 'UPCOMING'] },
      dueDate: {
        lt: now,
      },
    },
    include: {
      loan: {
        include: {
          customer: true,
        },
      },
    },
  });

  let processedCount = 0;
  let newCasesCreated = 0;

  for (const item of overdueItems) {
    const dueDate = new Date(item.dueDate);
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const dpdDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 1. Mark Schedule Item as OVERDUE
    await prisma.repaymentScheduleItem.update({
      where: { id: item.id },
      data: {
        status: 'OVERDUE',
      },
    });

    // 2. Mark Loan Status as OVERDUE
    await prisma.loan.update({
      where: { id: item.loanId },
      data: {
        status: 'OVERDUE',
      },
    });

    // Determine Aging Bucket
    let bucket = '0-30 Days';
    if (dpdDays > 180) bucket = '180+ Days';
    else if (dpdDays > 90) bucket = '91-180 Days';
    else if (dpdDays > 60) bucket = '61-90 Days';
    else if (dpdDays > 30) bucket = '31-60 Days';

    const overdueAmount = Money.toDb(
      Money.add(item.principalDue, item.interestDue)
    );

    // 3. Populate or Update Collection Case Queue
    const existingCase = await prisma.collectionCase.findFirst({
      where: { loanId: item.loanId },
    });

    if (existingCase) {
      await prisma.collectionCase.update({
        where: { id: existingCase.id },
        data: {
          dpd: dpdDays,
          agingBucket: bucket,
          outstandingAmount: overdueAmount,
          status: 'OPEN',
        },
      });
    } else {
      await prisma.collectionCase.create({
        data: {
          loanId: item.loanId,
          customerId: item.loan.customerId,
          tenantId: item.loan.tenantId,
          dpd: dpdDays,
          agingBucket: bucket,
          outstandingAmount: overdueAmount,
          status: 'OPEN',
        },
      });
      newCasesCreated++;
    }

    // 4. Dispatch Overdue Notification Alert
    const customer = item.loan.customer;
    if (customer) {
      const customerName = `${customer.firstName} ${customer.lastName}`.trim();
      const amountStr = `₹${parseFloat(item.totalDue || item.emiAmount || '0').toLocaleString('en-IN')}`;
      const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000/customer/payments';

      const alertMsg = `URGENT NOTICE: Your Adyapan Loan ${item.loan.loanCode} EMI of ${amountStr} is now ${dpdDays} day(s) overdue. Please clear immediately at ${portalUrl} to avoid late penalty charges and credit score impact.`;

      if (customer.mobile) {
        await smsProvider.send({
          recipient: customer.mobile,
          title: 'Adyapan Overdue Alert',
          body: alertMsg,
          templateCode: 'OVERDUE_ALERT_SMS',
        });
      }

      await sendNotification({
        customerId: customer.id,
        userId: customer.userId || undefined,
        title: `OVERDUE ALERT: Installment #${item.installmentNumber}`,
        message: `Your payment of ${amountStr} is ${dpdDays} days overdue.`,
        channel: 'SMS_AND_IN_APP',
        type: 'OVERDUE_ALERT',
        metadata: { loanId: item.loanId, dpd: dpdDays, overdueAmount },
      });
    }

    processedCount++;
  }

  logger.info(`[MIDNIGHT-DPD-ENGINE] Execution completed. Processed ${processedCount} overdue items, created ${newCasesCreated} new collection cases.`);
  return { processedCount, newCasesCreated };
}
