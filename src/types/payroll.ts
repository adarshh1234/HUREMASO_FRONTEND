export interface PayrollRecord {
  id: string;
  _id?: string;
  employeeName: string;
  employeeId?: string;
  department: string;
  date: string;
  period?: string;
  amount: number;
  paidAmount?: number;
  status: 'Paid' | 'Pending' | 'Payed';
  category?: 'statement' | 'upcoming' | 'slips' | 'pay-on-request' | 'advance-payments';
  paymentMethod?: string;
  paidAt?: string;
  transactionRef?: string;
  notes?: string;
}

export interface PayrollReportsSummary {
  totalMonthlyOutflow: number;
  pendingRequestsCount: number;
  budgetVariancePercent: number;
  paidCount: number;
  pendingCount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

export interface PayrollSummary {
  period: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

export interface BenefitAdvance {
  id: string;
  employeeName: string;
  type: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
}

export interface PayrollFinanceRequest {
  id: string;
  requestId: string;
  employeeName: string;
  employeeId?: string;
  requestType: string;
  department: string;
  amount: number;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateRequested: string;
  notes?: string;
}

export interface PayrollBenefitAdvance {
  id: string;
  advanceId: string;
  employeeName: string;
  employeeId?: string;
  benefitType: string;
  category: 'employee-benefits' | 'performance-benefits' | 'other-benefits' | 'benefit-advance';
  amount: number;
  description?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dateRequested: string;
  notes?: string;
}

export interface SalaryDisbursement {
  id: string;
  disbursementId: string;
  employeeName: string;
  employeeId?: string;
  department: string;
  period: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  method: 'Bank Transfer' | 'Cash' | 'Cheque';
  status: 'Paid' | 'Pending' | 'Failed' | 'Processing';
  disbursedAt?: string;
}

export interface PaymentApplication {
  id: string;
  applicationId: string;
  name: string;
  provider: string;
  apiKeyMasked?: string;
  webhookUrl?: string;
  status: 'Active' | 'Pending' | 'Inactive' | 'Error';
  autoDisburse: boolean;
  disbursementDay?: number;
  lastSync?: string;
  notes?: string;
}

export interface DisbursementSummary {
  totalGross: number;
  totalNet: number;
  totalPaid: number;
  totalPending: number;
  count: number;
}
