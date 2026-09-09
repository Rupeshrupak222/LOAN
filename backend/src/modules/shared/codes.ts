let seqCounter = 0;

/** Human-friendly sequential-ish reference codes for demo purposes. */
function stamp(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const ms = (now.getTime() % 100000).toString().padStart(5, '0');
  const pid = (process.pid % 1000).toString().padStart(3, '0');
  seqCounter = (seqCounter + 1) % 10000;
  const seq = seqCounter.toString().padStart(4, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${y}${m}${d}${ms}${pid}${seq}${rand}`;
}

export const generateCustomerCode = () => `CUST-${stamp()}`;
export const generateApplicationNo = () => `APP-${stamp()}`;
export const generateLoanNo = () => `LN-${stamp()}`;
export const generatePaymentNo = () => `PMT-${stamp()}`;
export const generateCaseNo = () => `COL-${stamp()}`;
export const generateNocNo = () => `NOC-${stamp()}`;
