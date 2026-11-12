export type AppraisalStatus =
  | 'Draft'
  | 'Self Review Pending'
  | 'Manager Review Pending'
  | 'In Calibration'
  | 'Approved'
  | 'Completed';

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
  lastGeneratedDate?: string;
}

export interface IAttendanceLogItem {
  month: string;
  shiftAdherence: string;
  punctualityPct: number;
  notes: string;
}

export interface IAttendanceTimeSection {
  punctualityScore: number;
  streakStatus: string;
  overtimeHoursPerMonth: number;
  overtimeContribution: string;
  velocityMultiplier: string;
  velocityNotes: string;
  attendanceImpactScore: number;
  logs: IAttendanceLogItem[];
}

export interface ISmartWorkInitiative {
  id: string;
  title: string;
  category: string;
  hoursSaved: number;
  status: string;
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
}

export interface IPsychometricSection {
  discProfileArchetype: string;
  archetypeDescription: string;
  cognitivePercentile: number;
  cognitiveNotes: string;
  eqScore: number;
  eqMax: number;
  eqNotes: string;
  behavioralTraits: IBehavioralTrait[];
}

export interface IEsopItem {
  sopId: string;
  title: string;
  version: string;
  status: string;
  updatedDate: string;
  acknowledged: boolean;
  docUrl?: string;
}

export interface IEsopsSection {
  sops: IEsopItem[];
}

export interface IReviewSection {
  cycle: string;
  selfAppraisal: {
    status: 'Not Started' | 'In Progress' | 'Submitted' | 'Completed';
    score: number;
    comments: string;
    strengths: string;
    improvementAreas: string;
    submittedAt?: string;
  };
  managerReview: {
    status: 'Pending' | 'In Progress' | 'Signed Off';
    score: number;
    reviewerName: string;
    comments: string;
    signedAt?: string;
  };
  hrCalibration: {
    status: 'Scheduled' | 'In Progress' | 'Completed';
    scheduledDate: string;
    finalRating: number;
    statusNotes: string;
  };
}

export interface IEndorsementItem {
  id: string;
  from: string;
  role: string;
  text: string;
  date: string;
  recommendationType: string;
  verified: boolean;
}

export interface IReferencesSection {
  endorsements: IEndorsementItem[];
}

export interface ISpecialStrategySection {
  hipoTrack: {
    nominated: boolean;
    trackName: string;
    description: string;
    roadmapStatus: string;
    status: string;
  };
  retentionGrant: {
    eligible: boolean;
    grantName: string;
    description: string;
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
}

export interface IPerformanceAppraisalRecord {
  _id: string;
  id: string;
  recordId: string;
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  cycle: string;
  status: AppraisalStatus;
  reportsAi: IReportsAiSection;
  attendanceTime: IAttendanceTimeSection;
  smartWork: ISmartWorkSection;
  psychometric: IPsychometricSection;
  eSops: IEsopsSection;
  review: IReviewSection;
  references: IReferencesSection;
  strategy: ISpecialStrategySection;
  analyticsAi: IAnalyticsAiSection;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppraisalDTO {
  employeeName: string;
  employeeId?: string;
  role: string;
  department: string;
  cycle?: string;
  status?: AppraisalStatus;
}

export interface AppraisalQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  department?: string;
  cycle?: string;
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
