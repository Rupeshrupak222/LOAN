export interface LoanApplicationRecord {
  id: string;
  applicationNo: string;
  customerId: string;
  customer?: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    customerCode: string;
    kycStatus: string;
    riskCategory?: string;
  };
  productId: string;
  product?: {
    code: string;
    name: string;
    interestRate: string | number;
    interestMethod: string;
  };
  requestedAmount: string | number;
  tenureMonths: number;
  purpose?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
