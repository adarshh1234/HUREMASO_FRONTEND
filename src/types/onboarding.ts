export type OnboardingStatus = 
  | 'Pending'
  | 'In Progress'
  | 'Offer Accepted'
  | 'Verification Pending'
  | 'Contract Signed'
  | 'Provisioning'
  | 'Ready to Join'
  | 'Completed';

export type VerificationCheckStatus = 'Verified' | 'Pending' | 'Flagged' | 'In Progress';

export interface BackgroundVerificationCheck {
  status: VerificationCheckStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface BackgroundVerification {
  legal: BackgroundVerificationCheck;
  pcc: BackgroundVerificationCheck;
  immigration: BackgroundVerificationCheck;
  biometrics: BackgroundVerificationCheck;
  credentials: BackgroundVerificationCheck;
  digital: BackgroundVerificationCheck;
  postHire: BackgroundVerificationCheck;
}

export interface AssessmentTrait {
  trait: string;
  score: string;
  desc: string;
}

export interface OnboardingAssessments {
  psychometric: {
    geniusScore: number;
    cognitiveSpeed: string;
    completionTime: string;
    status: string;
    traits: AssessmentTrait[];
  };
  language: { score: string; status: string; notes?: string };
  performance: { score: string; status: string; notes?: string };
  technical: { score: string; status: string; notes?: string };
  at: { score: string; status: string; notes?: string };
}

export interface OnboardingOffer {
  roleTitle: string;
  baseSalary: string;
  equity: string;
  bonus: string;
  signOnBonus?: string;
  offerDate: string;
  acceptanceDate?: string;
  status: 'Draft' | 'Sent' | 'Offer Accepted' | 'Declined';
}

export interface OnboardingDocuments {
  contract: { status: 'Pending' | 'Drafted' | 'Signed'; signedDate?: string; docUrl?: string };
  nda: { status: 'Pending' | 'Drafted' | 'Signed'; signedDate?: string; docUrl?: string };
  custom: Array<{ name: string; status: string; docUrl?: string }>;
}

export interface OnboardingProvisions {
  laptop: { assigned: boolean; model?: string; serialNo?: string; status?: string };
  workstation: { assigned: boolean; deskNo?: string; location?: string };
  simCard: { assigned: boolean; number?: string };
  creditCard: { assigned: boolean; cardType?: string };
  car: { assigned: boolean; vehicleNo?: string };
  homeOffice: { assigned: boolean; allowance?: number };
}

export interface OnboardingBuddyManager {
  buddyName: string;
  buddyRole: string;
  managerName: string;
  managerRole: string;
  department: string;
  meetingScheduled: boolean;
}

export interface TrainingModule {
  title: string;
  duration: string;
  progress: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface OnboardingVisa {
  visaType: string;
  passportNo: string;
  expiryDate: string;
  country: string;
  status: 'Applied' | 'In Review' | 'Approved' | 'Issued' | 'Not Required';
}

export interface OnboardingInsurance {
  provider: string;
  policyNumber: string;
  coverageAmount: string;
  dependentsCount: number;
  status: 'Active' | 'Pending Enrolment' | 'Underwriting';
}

export interface OnboardingMisc {
  association: string;
  corporateCard: boolean;
  specialRequests?: string;
}

export interface OnboardingCandidate {
  id: string;
  _id?: string;
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  startDate: string;
  status: OnboardingStatus;
  backgroundVerification: BackgroundVerification;
  assessments: OnboardingAssessments;
  offer: OnboardingOffer;
  documents: OnboardingDocuments;
  provisions: OnboardingProvisions;
  buddyManager: OnboardingBuddyManager;
  training: TrainingModule[];
  visa: OnboardingVisa;
  insurance: OnboardingInsurance;
  miscellaneous: OnboardingMisc;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCandidatePayload {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  startDate?: string;
  baseSalary?: string;
  equity?: string;
  buddyName?: string;
  managerName?: string;
}

export interface OnboardingReportSummary {
  totalOnboarding: number;
  completedCount: number;
  inProgressCount: number;
  verificationPendingCount: number;
  averageOnboardingDays: number;
  complianceRate: number;
}
