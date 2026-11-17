export type AppraisalStatus =
  | 'Draft'
  | 'Self Review Pending'
  | 'Manager Review Pending'
  | 'In Calibration'
  | 'Approved'
  | 'Completed';

export type AppraisalCycleStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Active'
  | 'Under Review'
  | 'Calibration'
  | 'Completed'
  | 'Archived';

export type AppraisalFrequency = 'Quarterly' | 'Bi-Annual' | 'Annual';

export interface IAppraisalCycle {
  _id?: string;
  id?: string;
  cycleId: string;
  name: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  reviewDeadline: string;
  eligibleDepartments: string[];
  eligibleEmployeeIds: string[];
  frequency: AppraisalFrequency;
  status: AppraisalCycleStatus;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ICompetencyItem {
  skill: string;
  score: string;
  status: string;
  benchmarkScore: string;
}

export interface IReportsAiSection {
  overallAiScore: number;
  peerSentimentRating: number;
  competenciesMetCount: number;
  totalCompetenciesCount: number;
  performanceTier: string;
  competencies: ICompetencyItem[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  skillGaps?: string[];
  recommendations?: string[];
  leadershipOpportunities?: string[];
  dataSources?: string[];
  lastGeneratedDate?: string;
}

export interface IAttendanceLogItem {
  month: string;
  shiftAdherence: string;
  punctualityPct: number;
  notes: string;
  presentDays?: number;
  absentDays?: number;
  lateDays?: number;
}

export interface IAttendanceTimeSection {
  punctualityScore: number;
  streakStatus: string;
  overtimeHoursPerMonth: number;
  overtimeContribution: string;
  velocityMultiplier: string;
  velocityNotes: string;
  attendanceImpactScore: number;
  totalWorkingDays?: number;
  presentDays?: number;
  absentDays?: number;
  lateArrivals?: number;
  tasksCompleted?: number;
  onTimeTaskPercentage?: number;
  logs: IAttendanceLogItem[];
}

export interface ISmartWorkInitiative {
  id: string;
  title: string;
  description?: string;
  category: string;
  hoursSaved: number;
  estimatedHoursSaved?: number;
  actualHoursSaved?: number;
  date?: string;
  status: string;
  supportingDocUrl?: string;
}

export interface ISmartWorkSection {
  automatedWorkflowsCount: number;
  hoursSavedPerMonth: number;
  focusHoursRatio: number;
  deepWorkBalanceNote: string;
  initiatives: ISmartWorkInitiative[];
}

export interface IBehavioralTrait {
  trait: string;
  score: number;
  level: string;
  benchmark?: string;
  interpretation?: string;
}

export interface IPsychometricSection {
  assessmentId?: string;
  assessmentDate?: string;
  discProfileArchetype: string;
  archetypeDescription: string;
  dScore?: number;
  iScore?: number;
  sScore?: number;
  cScore?: number;
  resultProfile?: string;
  cognitivePercentile: number;
  cognitiveNotes: string;
  eqScore: number;
  eqMax: number;
  eqNotes: string;
  consentGiven?: boolean;
  behavioralTraits: IBehavioralTrait[];
}

export interface IEsopItem {
  sopId: string;
  title: string;
  version: string;
  status: string;
  updatedDate: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  docUrl?: string;
  complianceNotes?: string;
}

export interface IEsopsSection {
  sops: IEsopItem[];
  compliancePercentage?: number;
}

export interface ISelfAppraisal {
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Completed';
  score: number;
  comments: string;
  strengths: string;
  improvementAreas: string;
  keyDeliverables?: string;
  challengesFaced?: string;
  supportingEvidence?: string;
  submittedAt?: string;
}

export interface IManagerReview {
  status: 'Pending' | 'In Progress' | 'Signed Off';
  score: number;
  reviewerName: string;
  comments: string;
  promotionRecommended?: boolean;
  developmentPlan?: string;
  signedAt?: string;
}

export interface IHrCalibration {
  status: 'Scheduled' | 'In Progress' | 'Completed';
  scheduledDate: string;
  finalRating: number;
  statusNotes: string;
  calibratedBy?: string;
  calibrationNotes?: string;
  calibratedAt?: string;
}

export interface IReviewSection {
  cycle: string;
  selfAppraisal: ISelfAppraisal;
  managerReview: IManagerReview;
  hrCalibration: IHrCalibration;
}

export interface IFeedback360Item {
  id: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerRole: string;
  relationship: string;
  isAnonymous: boolean;
  score: number;
  comments: string;
  date: string;
}

export interface IEndorsementItem {
  id: string;
  from: string;
  role: string;
  text: string;
  date: string;
  recommendationType: string;
  verified: boolean;
  evidenceUrl?: string;
}

export interface IReferencesSection {
  endorsements: IEndorsementItem[];
}

export interface IHipoMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  assignedMentor: string;
  progress: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface ISpecialStrategySection {
  hipoTrack: {
    nominated: boolean;
    nominatorName?: string;
    nominationDate?: string;
    nominationReason?: string;
    trackName: string;
    description: string;
    roadmapStatus: string;
    status: string;
    milestones?: IHipoMilestone[];
  };
  retentionGrant: {
    eligible: boolean;
    grantName: string;
    description: string;
    grantAmount?: number;
    grantUnits?: number;
    approvalStatus?: string;
    grantDate?: string;
    vestingSchedule?: string;
    vestingStatus: string;
    agreementExpiry: string;
  };
}

export interface IAnalyticsAiSection {
  predictedTrajectoryGrowth: string;
  trajectoryGrowthTier: string;
  attritionRiskPct: number;
  attritionRiskLevel: string;
  retentionLikelihood: string;
  leadershipReadinessScore: number;
  promotionReadiness: string;
  aiSummary: string;
  confidenceLevel?: string;
  influencingFactors?: string[];
}

export interface IApprovalHistoryItem {
  step: string;
  actorName: string;
  actorRole: string;
  action: string;
  comment?: string;
  timestamp: string;
}

export interface IPerformanceAppraisalRecord {
  _id: string;
  id: string;
  recordId: string;
  employeeName: string;
  employeeId?: string;
  departmentId?: string;
  role: string;
  department: string;
  cycle: string;
  cycleId?: string;
  status: AppraisalStatus;
  reportsAi: IReportsAiSection;
  attendanceTime: IAttendanceTimeSection;
  smartWork: ISmartWorkSection;
  psychometric: IPsychometricSection;
  eSops: IEsopsSection;
  review: IReviewSection;
  feedback360?: IFeedback360Item[];
  references: IReferencesSection;
  strategy: ISpecialStrategySection;
  analyticsAi: IAnalyticsAiSection;
  approvalHistory?: IApprovalHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppraisalDTO {
  employeeName: string;
  employeeId?: string;
  departmentId?: string;
  role: string;
  department: string;
  cycle?: string;
  cycleId?: string;
  status?: AppraisalStatus;
}

export interface AppraisalQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  department?: string;
  cycle?: string;
  employeeId?: string;
}

export interface AppraisalReportsSummary {
  totalAppraisals: number;
  completedAppraisals: number;
  averageAiScore: number;
  averagePunctuality: number;
  topPerformersCount: number;
  hiPoNominatedCount: number;
  averageRetentionRiskPct: number;
}
