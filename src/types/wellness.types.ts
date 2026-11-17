// ========================= FINANCIAL INCENTIVES =========================

export type EsopStatus = 'Granted' | 'Vested' | 'Exercised' | 'Forfeited' | 'Expired';
export type BonusStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Paid';
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

export interface EsopExerciseRecord {
  id?: string;
  _id?: string;
  trancheNumber: number;
  shares: number;
  grantPrice: number;
  exercisePrice: number;
  exercisedAt: string;
  totalCost: number;
  estimatedValue: number;
}

export interface BonusPlan {
  id?: string;
  _id?: string;
  planName: string;
  bonusYear: number;
  targetMetrics: string;
  targetAchievement: number; // percentage, e.g. 110
  bonusMultiplier: number; // e.g. 1.25
  estimatedBonusAmount: number;
  status: BonusStatus;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface IncentiveRecord {
  id?: string;
  _id?: string;
  title: string;
  target: string;
  reward: string;
  rewardAmount: number;
  status: IncentiveStatus;
  quarter: string;
  achievedAt?: string;
  approvedAt?: string;
}

export interface FinancialLiteracyProgram {
  id?: string;
  _id?: string;
  title: string;
  date: string;
  speaker: string;
  category: string;
  topics?: string;
  materialsUrl?: string;
  registered: boolean;
  attended: boolean;
  score?: number;
  completionDate?: string;
}

export interface FinancialIncentive {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  // ESOP
  grantedEsopShares: number;
  grantPrice: number;
  currentFMV: number;
  grantDate?: string;
  vestingSchedule: EsopVestingTranche[];
  exerciseHistory?: EsopExerciseRecord[];
  // Performance Bonus
  bonusYear: number;
  bonusMultiplier: number;
  estimatedBonusAmount: number;
  bonusStatus: BonusStatus;
  bonusTargetAchievement: number;
  bonusPlans?: BonusPlan[];
  // Incentives
  incentives: IncentiveRecord[];
  // Financial Literacy
  financialLiteracySessionsAttended: number;
  financialLiteracyPrograms?: FinancialLiteracyProgram[];
  createdAt?: string;
  updatedAt?: string;
}

// ========================= EMPLOYEE DEVELOPMENT =========================

export type ProgramStatus = 'Not_Started' | 'In_Progress' | 'Completed' | 'On_Hold' | 'Cancelled';
export type CertificationStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Pending Verification';
export type CareerGoalStatus = 'Not Started' | 'In Progress' | 'Under Review' | 'Completed' | 'On Hold';
export type MentorshipStatus = 'Requested' | 'Active' | 'Completed' | 'Terminated' | 'Rejected';

export interface LearningProgram {
  _id?: string;
  id?: string;
  title: string;
  provider: string;
  totalModules: number;
  completedModules: number;
  progressPercent: number;
  status: ProgramStatus;
  trainingHours?: number;
  allowanceCost?: number;
  startDate?: string;
  completionDate?: string;
  externalUrl?: string;
}

export interface Certification {
  _id?: string;
  id?: string;
  name: string;
  issuingOrganization: string;
  issuedDate: string;
  expiryDate?: string;
  certificationId?: string;
  status: CertificationStatus;
  certificateUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  renewedAt?: string;
  badgeUrl?: string;
}

export interface MentorshipSession {
  id?: string;
  _id?: string;
  sessionDate: string;
  time?: string;
  topic: string;
  notes?: string;
  feedback?: string;
  completed: boolean;
}

export interface MentorshipProgram {
  mentorId?: string;
  mentorName: string;
  menteeId?: string;
  menteeName?: string;
  status: MentorshipStatus;
  objectives: string;
  durationMonths: number;
  startDate?: string;
  sessions: MentorshipSession[];
  mentorFeedback?: string;
  menteeFeedback?: string;
}

export interface CareerMilestone {
  id?: string;
  _id?: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface CareerGoal {
  id?: string;
  _id?: string;
  title: string;
  targetDate?: string;
  status: CareerGoalStatus;
  milestones: CareerMilestone[];
  managerFeedback?: string;
  reviewDate?: string;
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
  mentorship?: MentorshipProgram;
  careerGoal?: string;
  careerGoals?: CareerGoal[];
  nextReviewDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========================= HEALTH & WELLNESS =========================

export type ClaimStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Paid';
export type ClaimType = 'Medical' | 'Dental' | 'Vision' | 'Mental_Health' | 'Pharmacy' | 'Fitness' | 'Other';

export interface InsuranceDependent {
  _id?: string;
  id?: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  status: 'Covered' | 'Not_Covered' | 'Pending';
  coveredDate?: string;
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
  rejectionReason?: string;
  processedAt?: string;
  notes?: string;
}

export interface CounsellingAppointment {
  id?: string;
  _id?: string;
  counsellorName: string;
  appointmentDate: string;
  appointmentTime: string;
  topic: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notesConfidential?: string;
}

export interface FitnessActivity {
  id?: string;
  _id?: string;
  activityName: string;
  date: string;
  durationMinutes: number;
  stepsCount: number;
  caloriesBurned?: number;
}

export interface HealthWellness {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  // Insurance
  groupInsurancePolicyNumber: string;
  groupInsuranceSumInsured: number;
  groupInsuranceCurrency: string;
  groupInsuranceEffective?: string;
  groupInsuranceExpiry: string;
  groupInsuranceStatus?: 'Active' | 'Expiring Soon' | 'Expired';
  insuranceDependents: InsuranceDependent[];
  // Claims
  annualReimbursementAllowance?: number;
  healthClaims: HealthClaim[];
  // Mental Health
  eapSessionsAvailable: number;
  eapSessionsUsed: number;
  mindfulnessAppAccess: boolean;
  counsellingAppointments?: CounsellingAppointment[];
  // Fitness
  fitnessChallengeName?: string;
  fitnessChallengeStepsGoal?: number;
  fitnessChallengeCurrentSteps?: number;
  fitnessChallengeRank?: number;
  fitnessChallengeStatus?: 'Active' | 'Completed' | 'Not_Enrolled';
  fitnessActivities?: FitnessActivity[];
  fitnessRewardPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========================= WORKPLACE LIFE BALANCE =========================

export type FringeClaimStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';
export type FringeCategory = 'Connectivity' | 'Commute' | 'Equipment' | 'Childcare' | 'Housing' | 'Meal' | 'Other';
export type ScheduleType = 'Office' | 'Remote' | 'Hybrid' | 'Flexible Hours';

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
  receiptUrl?: string;
  rejectionReason?: string;
}

export interface ScheduleChangeRequest {
  id?: string;
  _id?: string;
  requestedSchedule: ScheduleType;
  officeDays: number;
  remoteDays: number;
  coreHours: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
  reviewedAt?: string;
}

export interface PaidLeaveRequest {
  id?: string;
  _id?: string;
  leaveType: 'Sabbatical' | 'Wellness Day' | 'Parental Leave' | 'Vacation';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  rejectionReason?: string;
}

export interface AccommodationRequest {
  id?: string;
  _id?: string;
  facilityName: string;
  roomType: 'Single Studio' | 'Shared Dormitory' | 'Executive Suite';
  checkInDate: string;
  checkOutDate?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Allocated';
  allocatedRoomNumber?: string;
}

export interface ChildCareRequest {
  id?: string;
  _id?: string;
  childName: string;
  childAge: number;
  facilityName: string;
  requestedMonthlyStipend: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Enrolled';
}

export interface FamilyEvent {
  id?: string;
  _id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  registered: boolean;
  attendeesCount?: number;
}

export interface FamilySupportRequest {
  id?: string;
  _id?: string;
  requestType: 'Elderly Care' | 'Emergency Assistance' | 'Education Support' | 'Counseling';
  details: string;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Closed';
  createdAt?: string;
}

export interface WorkplaceLifeBalance {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  // Flexible Work
  workScheduleType: string;
  officeDaysPerWeek: number;
  coreHoursStart: string;
  coreHoursEnd: string;
  flexiBandStart: string;
  flexiBandEnd: string;
  remoteWorkLocation?: string;
  scheduleChangeRequests?: ScheduleChangeRequest[];
  // Paid Leave
  sabbaticalLeaveWeeks: number;
  wellnessDaysTotal: number;
  wellnessDaysUsed: number;
  parentalLeaveWeeks: number;
  paidLeaveRequests?: PaidLeaveRequest[];
  // Care & Accommodation
  childCareStipendMonthly: number;
  childCareStipendCurrency: string;
  childCareStipendActive: boolean;
  childCareRequests?: ChildCareRequest[];
  dormitoryAccessActive: boolean;
  accommodationRequests?: AccommodationRequest[];
  // Family
  familyEventsRegistered: string[];
  familyEvents?: FamilyEvent[];
  familySupportRequests?: FamilySupportRequest[];
  // Fringe Reimbursements
  fringeMonthlyInternetAllowance: number;
  fringeMonthlyCommuteAllowance: number;
  fringeTotalYTDReimbursed: number;
  fringeCurrency: string;
  fringeClaims: FringeClaim[];
  createdAt?: string;
  updatedAt?: string;
}

// ========================= AGGREGATED STATS =========================

export interface WellnessStatsSummary {
  // Financial
  totalGrantedEsopShares: number;
  totalVestedShares: number;
  totalPortfolioValue: number;
  totalBonusAmount: number;
  activeIncentivesCount: number;
  // Development
  totalCompletedTrainingHours: number;
  totalActiveCertifications: number;
  learningAllowanceBalance: number;
  enrolledProgramsCount: number;
  completionRate: number;
  // Health
  activeInsurancePoliciesCount: number;
  coveredDependentsCount: number;
  pendingHealthClaimsCount: number;
  approvedHealthClaimsCount: number;
  wellnessParticipationScore: number;
  // Workplace
  activeFlexibleSchedulesCount: number;
  pendingLeaveRequestsCount: number;
  accommodationOccupancyCount: number;
  childcareEnrolledCount: number;
  totalFringeReimbursed: number;
}
