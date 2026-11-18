// ─── Payroll Record ──────────────────────────────────────────────────────────
export type PayrollRecordStatus = 'Paid' | 'Pending' | 'Processing' | 'Failed' | 'Payed';

export interface PayrollRecord {
  id: string;
  _id?: string;
  employeeName: string;
  employeeId?: string;
  department: string;
  designation?: string;
  date: string;
  period?: string;
  basicSalary?: number;
  allowances?: number;
  bonuses?: number;
  incentives?: number;
  grossSalary?: number;
  taxDeductions?: number;
  epfDeduction?: number;
  esiDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  netSalary?: number;
  amount: number;
  paidAmount?: number;
  status: PayrollRecordStatus;
  category?: 'statement' | 'upcoming' | 'slips' | 'pay-on-request' | 'advance-payments';
  paymentMethod?: string;
  paidAt?: string;
  transactionRef?: string;
  notes?: string;
  slipsGenerated?: boolean;
  slipUrl?: string;
  slipPublishedDate?: string;
  advanceDetails?: {
    totalAdvanceAmount?: number;
    installmentAmount?: number;
    remainingBalance?: number;
    repaymentSchedule?: string;
    installmentsRemaining?: number;
  };
  payOnRequestDetails?: {
    requestedAmount?: number;
    reason?: string;
    description?: string;
    supportingDoc?: string;
    approvedBy?: string;
    approvalRemarks?: string;
  };
}

// ─── Pay Grade Management ────────────────────────────────────────────────────
export interface PayGradeAllowance {
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface PayGradeAssignedEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  currentSalary: number;
  assignedDate?: string;
}

export interface PayGrade {
  id: string;
  _id?: string;
  gradeCode: string;
  gradeName: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  allowances?: PayGradeAllowance[];
  description?: string;
  assignedEmployees?: PayGradeAssignedEmployee[];
  status: 'Active' | 'Inactive';
}

// ─── Employment Status ────────────────────────────────────────────────────────
export interface EmploymentStatusSummary {
  activeCount: number;
  probationCount: number;
  contractCount: number;
  terminatedCount: number;
  totalEmployees: number;
  employees: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
    employmentStatus: string;
    category?: string;
    isTerminated?: boolean;
    payrollEligible: boolean;
    salaryStatus: string;
    basicSalary: number;
    netSalary: number;
  }[];
}

// ─── Reports & Analytics Summary ──────────────────────────────────────────────
export interface PayrollReportsSummary {
  totalMonthlyOutflow: number;
  totalGrossPayroll: number;
  totalNetPayroll: number;
  totalDeductions: number;
  pendingRequestsCount: number;
  budgetVariancePercent: number;
  paidCount: number;
  pendingCount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  completionRatePercent: number;
  departmentDistribution: { department: string; gross: number; count: number }[];
  monthlyTrends: { month: string; outflow: number; net: number }[];
  gradeDistribution: { grade: string; employeeCount: number }[];
  advancesSummary: { totalAdvances: number; outstandingBalance: number };
}

export interface PayrollSummary {
  period: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

// ─── Finance Requests ────────────────────────────────────────────────────────
export type FinanceRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';

export interface PayrollFinanceRequest {
  id: string;
  _id?: string;
  requestId: string;
  employeeName: string;
  employeeId?: string;
  requestType: string;
  department: string;
  amount: number;
  description?: string;
  status: FinanceRequestStatus;
  dateRequested: string;
  supportingDoc?: string;
  approvalRemarks?: string;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  history?: {
    status: FinanceRequestStatus;
    changedBy: string;
    timestamp: string;
    remarks?: string;
    action?: string;
    performedBy?: string;
  }[];
  notes?: string;
}

// ─── Benefit Schemes & Advances ──────────────────────────────────────────────
export type BenefitCategory = 'employee-benefits' | 'performance-benefits' | 'other-benefits' | 'benefit-advance';
export type BenefitAdvanceStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';

export interface BenefitScheme {
  id: string;
  _id?: string;
  schemeId: string;
  category: BenefitCategory;
  tab: string;
  title: string;
  name?: string;
  description: string;
  annualLimit?: number;
  maxAmount?: number;
  maxLimit?: number;
  eligibilityCriteria?: string;
  eligibility?: string;
  applicationDeadline?: string;
  frequency?: string;
  formula?: string;
  statutoryType?: 'EPF' | 'Gratuity' | 'ESI' | 'Insurance' | 'None';
  isEnabled: boolean;
}

export interface PayrollBenefitAdvance {
  id: string;
  _id?: string;
  advanceId: string;
  employeeName: string;
  employeeId?: string;
  department?: string;
  benefitType: string;
  category: BenefitCategory;
  tab?: string;
  amount: number;
  description?: string;
  status: BenefitAdvanceStatus;
  dateRequested: string;
  supportingDoc?: string;
  vestingSchedule?: string;
  grantedUnits?: number;
  currentSalary?: number;
  proposedSalary?: number;
  incrementPercent?: number;
  statutoryContributionEmployee?: number;
  statutoryContributionEmployer?: number;
  leaveBalanceEncashing?: number;
  policyNumber?: string;
  insuranceProvider?: string;
  coverageDetails?: string;
  dependentsCount?: number;
  metadata?: Record<string, any>;
  approvalRemarks?: string;
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  history?: {
    status: BenefitAdvanceStatus;
    changedBy: string;
    timestamp: string;
    remarks?: string;
    action?: string;
    performedBy?: string;
  }[];
  notes?: string;
}

export interface BenefitAdvance {
  id: string;
  employeeName: string;
  type: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
}

// ─── Salary Disbursement ─────────────────────────────────────────────────────
export type DisbursementStatus = 'Draft' | 'Pending' | 'Approved' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled';
export type DisbursementMethod = 'Bank Transfer' | 'Cash' | 'Cheque' | 'Stripe' | 'PayPal';

export interface SalaryDisbursement {
  id: string;
  _id?: string;
  disbursementId: string;
  employeeName: string;
  employeeId?: string;
  department: string;
  period: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  method: DisbursementMethod;
  status: DisbursementStatus;
  disbursedAt?: string;
  transactionRef?: string;
  transactionReference?: string;
  remarks?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface DisbursementSummary {
  totalGross: number;
  totalNet: number;
  totalPaid: number;
  totalPending: number;
  count: number;
  paidCount: number;
  pendingCount: number;
}

// ─── Payment Application ──────────────────────────────────────────────────────
export type PaymentApplicationStatus = 'Active' | 'Pending' | 'Inactive' | 'Error';

export interface PaymentApplication {
  id: string;
  _id?: string;
  applicationId: string;
  name: string;
  provider: string;
  environment: 'Sandbox' | 'Production';
  apiKeyMasked?: string;
  webhookUrl?: string;
  webhookSecretMasked?: string;
  status: PaymentApplicationStatus;
  autoDisburse: boolean;
  disbursementDay?: number;
  lastSync?: string;
  lastSyncStatus?: 'Success' | 'Error' | 'Pending';
  lastError?: string;
  testedAt?: string;
  testStatus?: 'Connected' | 'Failed' | 'Untested';
  lastTestedAt?: string;
  notes?: string;
}

// ─── AI Analytics Types ───────────────────────────────────────────────────────
export interface WorkforceAnalyticsResponse {
  annualizedTurnoverRate: number;
  retentionIndicatorPercent: number;
  forecastNextQuarterOutflow: number;
  departmentTurnover: { department: string; turnoverRate: number; riskLevel: 'Low' | 'Medium' | 'High' }[];
  retentionDrivers: string[];
}

export interface PerformanceSkillsResponse {
  skillGaps: { skill: string; requiredCount: number; qualifiedCount: number; gapPercent: number }[];
  recommendations: { role: string; developmentFocus: string; targetEmployees: number }[];
}

export interface EmployeeExperienceResponse {
  satisfactionScore: number;
  benefitsUtilizationRate: number;
  engagementTrend: 'Rising' | 'Stable' | 'Declining';
  topUtilizedBenefits: { benefit: string; utilizationCount: number }[];
}

export interface ComplianceCheckResponse {
  healthScorePercent: number;
  missingPayrollInfoEmployees: { employeeId: string; employeeName: string; missingField: string }[];
  statutoryChecks: { rule: string; status: 'Compliant' | 'Action Required'; details: string }[];
}

export interface KnowledgeSyncResponse {
  success: boolean;
  syncedEntities: number;
  lastSyncedAt: string;
  details: string;
}

// ─── Employee Reference ───────────────────────────────────────────────────────
export interface EmployeeReference {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  role?: string;
  jobTitle?: string;
  email: string;
  salary?: number;
}
