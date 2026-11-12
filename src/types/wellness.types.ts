// ========================= FINANCIAL INCENTIVES =========================

export type EsopStatus = 'Granted' | 'Vested' | 'Exercised' | 'Forfeited' | 'Expired';
export type BonusStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';
export type IncentiveStatus = 'Active' | 'Achieved' | 'In_Progress' | 'Missed' | 'Cancelled';

export interface EsopVestingTranche {
  _id?: string;
  trancheNumber: number;
  period: string;
  vestingDate: string;
  shares: number;
  status: EsopStatus;
  exercisedAt?: string;
}

export interface IncentiveRecord {
  _id?: string;
  title: string;
  target: string;
  reward: string;
  rewardAmount: number;
  status: IncentiveStatus;
  achievedAt?: string;
  quarter: string;
}

export interface FinancialIncentive {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  grantedEsopShares: number;
  grantPrice: number;
  currentFMV: number;
  vestingSchedule: EsopVestingTranche[];
  bonusYear: number;
  bonusMultiplier: number;
  estimatedBonusAmount: number;
  bonusStatus: BonusStatus;
  bonusTargetAchievement: number;
  incentives: IncentiveRecord[];
  financialLiteracySessionsAttended: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========================= EMPLOYEE DEVELOPMENT =========================

export type ProgramStatus = 'Not_Started' | 'In_Progress' | 'Completed' | 'On_Hold' | 'Cancelled';
export type CertificationStatus = 'Active' | 'Expired' | 'Pending_Renewal' | 'In_Progress';

export interface LearningProgram {
  _id?: string;
  title: string;
  provider: string;
  totalModules: number;
  completedModules: number;
  progressPercent: number;
  status: ProgramStatus;
  startDate?: string;
  completionDate?: string;
  externalUrl?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuingOrganization: string;
  issuedDate: string;
  expiryDate?: string;
  certificationId?: string;
  status: CertificationStatus;
  badgeUrl?: string;
}

export interface EmployeeDevelopment {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  completedTrainingHours: number;
  annualTargetHours: number;
  learningAllowanceBalance: number;
  learningAllowanceCurrency: string;
  learningPrograms: LearningProgram[];
  certifications: Certification[];
  mentorName?: string;
  mentorId?: string;
  careerGoal?: string;
  nextReviewDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========================= HEALTH & WELLNESS =========================

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed' | 'Under_Review';
export type ClaimType = 'Medical' | 'Dental' | 'Vision' | 'Mental_Health' | 'Pharmacy' | 'Fitness' | 'Other';

export interface InsuranceDependent {
  _id?: string;
  name: string;
  relationship: string;
  status: 'Covered' | 'Not_Covered' | 'Pending';
}

export interface HealthClaim {
  _id?: string;
  claimId: string;
  date: string;
  type: ClaimType;
  description: string;
  amount: number;
  currency: string;
  status: ClaimStatus;
  receiptUrl?: string;
  processedAt?: string;
  notes?: string;
}

export interface HealthWellness {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  groupInsurancePolicyNumber: string;
  groupInsuranceSumInsured: number;
  groupInsuranceCurrency: string;
  groupInsuranceExpiry: string;
  insuranceDependents: InsuranceDependent[];
  healthClaims: HealthClaim[];
  eapSessionsAvailable: number;
  eapSessionsUsed: number;
  mindfulnessAppAccess: boolean;
  fitnessChallengeName?: string;
  fitnessChallengeStepsGoal?: number;
  fitnessChallengeCurrentSteps?: number;
  fitnessChallengeRank?: number;
  fitnessChallengeStatus?: 'Active' | 'Completed' | 'Not_Enrolled';
  createdAt?: string;
  updatedAt?: string;
}

// ========================= WORKPLACE LIFE BALANCE =========================

export type FringeClaimStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';
export type FringeCategory = 'Connectivity' | 'Commute' | 'Equipment' | 'Childcare' | 'Housing' | 'Meal' | 'Other';

export interface FringeClaim {
  _id?: string;
  claimId: string;
  date: string;
  title: string;
  category: FringeCategory;
  amount: number;
  currency: string;
  status: FringeClaimStatus;
  description?: string;
}

export interface WorkplaceLifeBalance {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  workScheduleType: string;
  officeDaysPerWeek: number;
  coreHoursStart: string;
  coreHoursEnd: string;
  flexiBandStart: string;
  flexiBandEnd: string;
  remoteWorkLocation?: string;
  sabbaticalLeaveWeeks: number;
  wellnessDaysTotal: number;
  wellnessDaysUsed: number;
  parentalLeaveWeeks: number;
  childCareStipendMonthly: number;
  childCareStipendCurrency: string;
  childCareStipendActive: boolean;
  dormitoryAccessActive: boolean;
  familyEventsRegistered: string[];
  fringeMonthlyInternetAllowance: number;
  fringeMonthlyCommuteAllowance: number;
  fringeTotalYTDReimbursed: number;
  fringeCurrency: string;
  fringeClaims: FringeClaim[];
  createdAt?: string;
  updatedAt?: string;
}
