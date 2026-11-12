export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  vacancy: string;
  hiringManager: string;
  dateApplied: string;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Onboarding' | 'Rejected' | string;
  experienceYears: number;
  skills: string[];
  education?: string;
  resumeUrl?: string;
  poolCategory?: string;
  talentPool?: string;
  notes?: string;
}

export interface Vacancy {
  id: string;
  jobTitle: string;
  hiringManager: string;
  datePosted: string;
  status: 'Available' | 'Closed' | 'Active' | 'Draft' | string;
  noOfOpenings: number;
  department: string;
  description: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
  experienceLevel?: string;
  requiredQualifications?: string;
}
