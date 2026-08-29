/** Human-friendly sequential-ish reference codes for demo purposes. */
function stamp(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${y}${m}${rand}`;
}

export const generateCustomerCode = () => `CUST-${stamp()}`;
export const generateApplicationNo = () => `APP-${stamp()}`;
export const generateLoanNo = () => `LOAN-${stamp()}`;
export const generatePaymentNo = () => `PAY-${stamp()}`;
