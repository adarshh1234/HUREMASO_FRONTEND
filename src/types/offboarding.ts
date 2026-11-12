export type OffboardingStatus =
  | 'Initiated'
  | 'Notice Period'
  | 'Clearance In Progress'
  | 'Settlement Pending'
  | 'Settled'
  | 'Completed';

export interface IOffboardingDocumentSection {
  resignationLetter: {
    status: 'Drafted' | 'Submitted' | 'Approved' | 'Not Applicable';
    noticeDuration: string;
    reason: string;
    submittedDate?: string;
    docUrl?: string;
  };
  terminationLetter: {
    status: 'Drafted' | 'Issued' | 'Acknowledged' | 'Not Applicable';
    terminationType: string;
    severanceDetails: string;
    issuedDate?: string;
    docUrl?: string;
  };
}

export interface IOffboardingPerformance {
  milestones: Array<{ date: string; event: string; detail: string }>;
  overallRating: number;
  exitScore: string;
  rehireEligible: boolean;
  projectHandoverComplete: boolean;
  experienceCertificateIssued: boolean;
}

export interface IOffboardingSettlement {
  grossPayout: number;
  encashableLeaveDays: number;
  leaveEncashmentAmount: number;
  gratuityAmount: number;
  tenureServed: string;
  gratuityFormula: string;
  noticePeriodSalary: number;
  noticeDays: number;
  pendingSalaryAmount: number;
  pendingExpenseAmount: number;
  deductions: number;
  netPayout: number;
  status: 'Pending Audit' | 'Approved' | 'Disbursed';
  disbursedDate?: string;
}

export interface IOffboardingLegal {
  chequeVoucherNo: string;
  chequeAmount: number;
  chequeStatus: 'Prepared' | 'Issued' | 'Cleared';
  visaCancellationStatus: 'Active' | 'In Progress' | 'Cancelled' | 'Not Applicable';
  visaGracePeriodDays: number;
  insuranceDelisted: boolean;
  pccStatus: 'Pending' | 'Clear' | 'Issued' | 'Not Applicable';
  nocIssued: boolean;
}

export interface IOffboardingAssetItem {
  name: string;
  tag: string;
  category: string;
  status: 'Possessed' | 'Pending Return' | 'Returned' | 'Missing' | 'Damaged';
  returnDate?: string;
  deductionCost?: number;
}

export interface IOffboardingDependencyItem {
  task: string;
  category: 'Access' | 'Handover' | 'Admin';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Signed Off';
}

export interface IOffboardingAssets {
  items: IOffboardingAssetItem[];
  dependencies: IOffboardingDependencyItem[];
  inspectionPassed: boolean;
  totalDeductions: number;
  clearedBy?: string;
  clearedAt?: string;
  isFullyCleared: boolean;
}

export interface IOffboardingTravel {
  repatriationTicketRequired: boolean;
  airline?: string;
  destination?: string;
  flightDate?: string;
  ticketStatus: 'Not Required' | 'Requested' | 'Issued' | 'Cancelled';
  excessBaggageAllowance: number;
  allowanceStatus: 'Not Required' | 'Approved' | 'Reimbursed';
}

export interface IOffboardingRecord {
  _id: string;
  recordId: string;
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  exitDate: string;
  separationType: 'Resignation' | 'Termination' | 'Mutual Separation' | 'Retirement';
  status: OffboardingStatus;
  documents: IOffboardingDocumentSection;
  performance: IOffboardingPerformance;
  settlement: IOffboardingSettlement;
  legal: IOffboardingLegal;
  assets: IOffboardingAssets;
  travel: IOffboardingTravel;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOffboardingRecordDTO {
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  exitDate?: string;
  separationType?: 'Resignation' | 'Termination' | 'Mutual Separation' | 'Retirement';
  status?: OffboardingStatus;
  noticeDuration?: string;
  reason?: string;
}

export interface OffboardingQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  department?: string;
  separationType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OffboardingReportsSummary {
  totalOffboarding: number;
  settledCount: number;
  inProgressCount: number;
  averageClearanceDays: number;
  annualizedAttritionRate: number;
  rehireEligibilityRate: number;
}
