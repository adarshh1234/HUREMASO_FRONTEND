export type OffboardingStatus =
  | 'Initiated'
  | 'Notice Period'
  | 'In Progress'
  | 'Pending Clearance'
  | 'Clearance In Progress'
  | 'Pending Settlement'
  | 'Settlement Pending'
  | 'Settled'
  | 'Completed'
  | 'Cancelled';

export type SeparationType =
  | 'Resignation'
  | 'Termination'
  | 'Mutual Separation'
  | 'Retirement'
  | 'Other';

export interface IOffboardingResignationDoc {
  status: 'Drafted' | 'Submitted' | 'Approved' | 'Not Applicable';
  noticeDuration: string;
  reason: string;
  resignationDate?: string;
  lastWorkingDate?: string;
  submittedDate?: string;
  letterContent?: string;
  docUrl?: string;
}

export interface IOffboardingTerminationDoc {
  status: 'Drafted' | 'Issued' | 'Acknowledged' | 'Not Applicable';
  terminationType: string;
  terminationReason?: string;
  effectiveDate?: string;
  severanceDetails: string;
  issuedDate?: string;
  letterContent?: string;
  docUrl?: string;
}

export interface IOffboardingDocumentSection {
  resignationLetter: IOffboardingResignationDoc;
  terminationLetter: IOffboardingTerminationDoc;
}

export interface IOffboardingMilestone {
  date: string;
  event: string;
  detail: string;
}

export interface IOffboardingCareerHistory {
  period: string;
  position: string;
  department: string;
  type: 'Joining' | 'Promotion' | 'Transfer' | 'Milestone';
  details: string;
}

export interface IOffboardingAppraisal {
  cycle: string;
  rating: number;
  managerFeedback: string;
  achievements: string;
  strengths?: string;
  improvements?: string;
  date: string;
}

export interface IOffboardingReference {
  name: string;
  designation: string;
  company: string;
  contactInfo: string;
  relationship: string;
  status: 'Pending' | 'Verified' | 'Flagged';
  notes?: string;
}

export interface IOffboardingPerformance {
  milestones: IOffboardingMilestone[];
  history?: IOffboardingCareerHistory[];
  appraisals?: IOffboardingAppraisal[];
  references?: IOffboardingReference[];
  overallRating: number;
  exitScore: string;
  rehireEligible: boolean;
  projectHandoverComplete: boolean;
  experienceCertificateIssued: boolean;
}

export interface IOffboardingSettlementAudit {
  action: string;
  changedBy: string;
  date: string;
  notes?: string;
}

export interface IOffboardingSettlement {
  basicSalary?: number;
  unpaidSalary?: number;
  allowances?: number;
  bonuses?: number;
  otherCompensation?: number;
  grossPayout: number;
  encashableLeaveDays: number;
  leaveEncashmentAmount: number;
  gratuityAmount: number;
  tenureServed: string;
  gratuityFormula: string;
  noticePeriodSalary: number;
  noticePeriodDeduction?: number;
  noticeDays: number;
  pendingSalaryAmount: number;
  pendingExpenseAmount: number;
  otherBenefits?: number;
  assetDeductions?: number;
  otherDeductions?: number;
  deductions: number;
  netPayout: number;
  currency?: string;
  status: 'Pending Audit' | 'Approved' | 'Disbursed';
  disbursedDate?: string;
  paymentReference?: string;
  auditHistory?: IOffboardingSettlementAudit[];
}

export interface IOffboardingLegal {
  chequeVoucherNo: string;
  chequeAmount: number;
  chequeStatus: 'Prepared' | 'Issued' | 'Cleared';
  chequeIssueDate?: string;
  chequeClearedDate?: string;
  visaType?: string;
  visaExpiryDate?: string;
  visaCancellationStatus: 'Active' | 'In Progress' | 'Cancelled' | 'Not Applicable';
  visaGracePeriodDays: number;
  visaCancellationRequestDate?: string;
  visaSupportingDoc?: string;
  insuranceProvider?: string;
  insurancePolicyNo?: string;
  insuranceDelisted: boolean;
  insuranceCancellationDate?: string;
  pccStatus: 'Pending' | 'Clear' | 'Issued' | 'Not Applicable';
  pccRequestDate?: string;
  pccCertificateRef?: string;
  pccDocUrl?: string;
  nocIssued: boolean;
}

export interface IOffboardingAssetItem {
  name: string;
  tag: string;
  category?: string;
  status: 'Possessed' | 'Pending Return' | 'Returned' | 'Missing' | 'Damaged';
  assignedDate?: string;
  condition?: string;
  returnDate?: string;
  returnCondition?: string;
  deductionCost?: number;
  verifiedBy?: string;
}

export interface IOffboardingDependencyItem {
  task: string;
  category: 'Access' | 'Handover' | 'Admin';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Signed Off';
  serviceName?: string;
}

export interface IOffboardingMissingAssetItem {
  name: string;
  tag: string;
  reportedDate: string;
  investigator: string;
  explanation: string;
  deductionApproved: boolean;
  deductionAmount: number;
}

export interface IOffboardingAssets {
  items: IOffboardingAssetItem[];
  dependencies: IOffboardingDependencyItem[];
  missingItems?: IOffboardingMissingAssetItem[];
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
  ticketType?: string;
  ticketStatus: 'Not Required' | 'Requested' | 'Issued' | 'Cancelled';
  ticketDocumentUrl?: string;
  excessBaggageAllowance: number;
  allowanceStatus: 'Not Required' | 'Approved' | 'Reimbursed';
}

export interface IOffboardingCustomField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'dropdown' | 'checkbox';
  value: string | number | boolean;
  options?: string[];
}

export interface IOffboardingRecord {
  id: string;
  _id?: string;
  recordId: string;
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  exitDate: string;
  lastWorkingDate?: string;
  resignationDate?: string;
  hrPersonnel?: string;
  separationType: SeparationType;
  status: OffboardingStatus;
  documents: IOffboardingDocumentSection;
  performance: IOffboardingPerformance;
  settlement: IOffboardingSettlement;
  legal: IOffboardingLegal;
  assets: IOffboardingAssets;
  travel: IOffboardingTravel;
  customFields?: IOffboardingCustomField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOffboardingRecordDTO {
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  exitDate?: string;
  lastWorkingDate?: string;
  resignationDate?: string;
  hrPersonnel?: string;
  separationType?: SeparationType;
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
  completedCount: number;
  pendingClearanceCount: number;
  averageClearanceDays: number;
  annualizedAttritionRate: number;
  rehireEligibilityRate: number;
  averageSettlementAmount: number;
  assetRecoveryRate: number;
  clearanceCompletionRate: number;
  separationReasons?: Record<string, number>;
  departmentAttrition?: Record<string, number>;
}
