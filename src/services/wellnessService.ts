import {
  FinancialIncentive,
  EmployeeDevelopment,
  HealthWellness,
  WorkplaceLifeBalance,
  WellnessStatsSummary,
  BonusStatus,
  ClaimStatus,
  FringeClaimStatus,
  MentorshipStatus,
  CareerGoalStatus,
  CertificationStatus,
} from '../types/wellness.types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/wellness`;

// Default Employee ID for demo / single-employee view
export const DEFAULT_EMPLOYEE_ID = 'EMP-001';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error((errorBody as any).message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

// ========================= STATS SUMMARY =========================

export const wellnessStatsService = {
  async getSummaryStats(): Promise<WellnessStatsSummary> {
    try {
      return await fetchJson<WellnessStatsSummary>(`${BASE_URL}/stats/summary`);
    } catch (err) {
      console.warn('Failed to fetch wellness stats summary, using fallback', err);
      return {
        totalGrantedEsopShares: 2500,
        totalVestedShares: 1250,
        totalPortfolioValue: 106250,
        totalBonusAmount: 18500,
        activeIncentivesCount: 2,
        totalCompletedTrainingHours: 48,
        totalActiveCertifications: 2,
        learningAllowanceBalance: 1200,
        enrolledProgramsCount: 2,
        completionRate: 65,
        activeInsurancePoliciesCount: 1,
        coveredDependentsCount: 3,
        pendingHealthClaimsCount: 1,
        approvedHealthClaimsCount: 2,
        wellnessParticipationScore: 88,
        activeFlexibleSchedulesCount: 1,
        pendingLeaveRequestsCount: 0,
        accommodationOccupancyCount: 1,
        childcareEnrolledCount: 1,
        totalFringeReimbursed: 550,
      };
    }
  },
};

// ========================= FINANCIAL INCENTIVES =========================

export const wellnessFinancialService = {
  async getMyIncentives(employeeId = DEFAULT_EMPLOYEE_ID): Promise<FinancialIncentive> {
    try {
      return await fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}`);
    } catch (err) {
      console.warn('Failed to fetch financial incentives from API, using defaults', err);
      return {
        employeeId,
        employeeName: 'Sarah Johnson',
        department: 'Engineering',
        grantedEsopShares: 2500,
        grantPrice: 12.5,
        currentFMV: 42.5,
        grantDate: '2023-10-15',
        vestingSchedule: [
          { trancheNumber: 1, period: 'Tranche 1 (Year 1)', vestingDate: '2024-10-15', shares: 625, status: 'Vested' },
          { trancheNumber: 2, period: 'Tranche 2 (Year 2)', vestingDate: '2025-10-15', shares: 625, status: 'Vested' },
          { trancheNumber: 3, period: 'Tranche 3 (Year 3)', vestingDate: '2026-10-15', shares: 625, status: 'Granted' },
          { trancheNumber: 4, period: 'Tranche 4 (Year 4)', vestingDate: '2027-10-15', shares: 625, status: 'Granted' },
        ],
        exerciseHistory: [],
        bonusYear: 2026,
        bonusMultiplier: 1.25,
        estimatedBonusAmount: 18500,
        bonusStatus: 'Approved',
        bonusTargetAchievement: 112,
        bonusPlans: [
          {
            planName: 'Annual Executive & Tech Performance Plan',
            bonusYear: 2026,
            targetMetrics: 'ARR growth + platform latency < 120ms',
            targetAchievement: 112,
            bonusMultiplier: 1.25,
            estimatedBonusAmount: 18500,
            status: 'Approved',
            notes: 'Exceeded product KPIs for Q1-Q3',
          },
        ],
        incentives: [
          {
            title: 'Project Milestone Alpha',
            target: '100% On-time delivery',
            reward: '$2,500 Spot Award',
            rewardAmount: 2500,
            status: 'Achieved',
            quarter: 'Q3-2026',
          },
          {
            title: 'Client Satisfaction Index',
            target: '> 95% CSAT Score',
            reward: '$1,500 Incentive',
            rewardAmount: 1500,
            status: 'In_Progress',
            quarter: 'Q3-2026',
          },
        ],
        financialLiteracySessionsAttended: 2,
        financialLiteracyPrograms: [
          {
            title: 'Personal Wealth Architecture & Retirement Indexing',
            date: '2026-11-20',
            speaker: 'Elena Vance, CFP',
            category: 'Wealth Strategy',
            topics: 'Asset diversification, index funds, tax optimization',
            registered: true,
            attended: true,
          },
          {
            title: 'Navigating Equity Grants & Tax Strategies (ESOP Focus)',
            date: '2026-12-05',
            speaker: 'Marcus Sterling, CPA',
            category: 'Equity & Tax',
            topics: '83(b) election, AMT mitigation, long term capital gains',
            registered: true,
            attended: false,
          },
        ],
      };
    }
  },

  async createEsopGrant(employeeId = DEFAULT_EMPLOYEE_ID, data: { shares: number; grantPrice: number; currentFMV?: number; grantDate?: string }): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/esop-grant`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async exerciseEsop(employeeId = DEFAULT_EMPLOYEE_ID, trancheNumber: number): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/exercise-esop`, {
      method: 'POST',
      body: JSON.stringify({ trancheNumber }),
    });
  },

  async updateBonusStatus(employeeId = DEFAULT_EMPLOYEE_ID, bonusStatus: BonusStatus): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/bonus-status`, {
      method: 'PATCH',
      body: JSON.stringify({ bonusStatus }),
    });
  },

  async addBonusPlan(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/bonus-plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBonusPlanStatus(employeeId = DEFAULT_EMPLOYEE_ID, planId: string, status: BonusStatus): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/bonus-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addIncentive(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/incentives`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateIncentiveStatus(employeeId = DEFAULT_EMPLOYEE_ID, incentiveId: string, status: string): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/incentives/${incentiveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addLiteracyProgram(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/literacy-programs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async enrollLiteracyProgram(employeeId = DEFAULT_EMPLOYEE_ID, programId: string, registered = true): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}/literacy-programs/${programId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ registered }),
    });
  },

  async update(employeeId = DEFAULT_EMPLOYEE_ID, data: Partial<FinancialIncentive>): Promise<FinancialIncentive> {
    return fetchJson<FinancialIncentive>(`${BASE_URL}/financial-incentives/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ========================= EMPLOYEE DEVELOPMENT =========================

export const wellnessDevelopmentService = {
  async getMyDevelopment(employeeId = DEFAULT_EMPLOYEE_ID): Promise<EmployeeDevelopment> {
    try {
      return await fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}`);
    } catch (err) {
      console.warn('Failed to fetch employee development from API, using defaults', err);
      return {
        employeeId,
        employeeName: 'Sarah Johnson',
        department: 'Engineering',
        completedTrainingHours: 48,
        annualTargetHours: 60,
        learningAllowanceBalance: 1200,
        learningAllowanceCurrency: 'USD',
        learningPrograms: [
          {
            _id: 'p1',
            id: 'p1',
            title: 'Strategic Product Leadership & Team Management',
            provider: 'Huremaso Learning Hub',
            totalModules: 8,
            completedModules: 6,
            progressPercent: 75,
            status: 'In_Progress',
            trainingHours: 24,
            allowanceCost: 400,
          },
          {
            _id: 'p2',
            id: 'p2',
            title: 'Advanced Cloud Security & Microservices Architecture',
            provider: 'Coursera Enterprise',
            totalModules: 10,
            completedModules: 4,
            progressPercent: 40,
            status: 'In_Progress',
            trainingHours: 30,
            allowanceCost: 600,
          },
        ],
        certifications: [
          {
            _id: 'c1',
            id: 'c1',
            name: 'AWS Solutions Architect Professional',
            issuingOrganization: 'Amazon Web Services',
            issuedDate: '2024-03-15',
            expiryDate: '2027-03-15',
            certificationId: 'AWS-PSA-908123',
            status: 'Active',
            verifiedBy: 'HR Verifier',
          },
          {
            _id: 'c2',
            id: 'c2',
            name: 'Project Management Professional (PMP)',
            issuingOrganization: 'Project Management Institute',
            issuedDate: '2023-11-20',
            expiryDate: '2026-11-20',
            certificationId: 'PMI-2938491',
            status: 'Expiring Soon',
            verifiedBy: 'HR Verifier',
          },
        ],
        mentorship: {
          mentorName: 'David Chen (VP Engineering)',
          mentorId: 'EMP-088',
          status: 'Active',
          objectives: 'Scale high-throughput microservices and sharpen executive leadership competencies.',
          durationMonths: 6,
          startDate: '2026-06-01',
          sessions: [
            {
              sessionDate: '2026-09-15',
              topic: 'System Scalability & Team Capacity Planning',
              notes: 'Discussed architectural bottlenecks in Q3 and transition to event-driven queues.',
              feedback: 'Great progress on technical trade-offs.',
              completed: true,
            },
          ],
        },
        careerGoals: [
          {
            id: 'cg1',
            title: 'Advance to Principal Software Architect',
            targetDate: '2027-06-30',
            status: 'In Progress',
            managerFeedback: 'Demonstrating solid system design mastery. Next focus on cross-department influence.',
            milestones: [
              { title: 'Publish Enterprise Zero-Trust Spec', completed: true },
              { title: 'Lead Distributed Systems Modernization', completed: true },
              { title: 'Mentor 3 Senior Engineers', completed: false },
            ],
          },
        ],
        careerGoal: 'Principal Software Architect',
      };
    }
  },

  async addProgram(employeeId = DEFAULT_EMPLOYEE_ID, programData: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/programs`, {
      method: 'POST',
      body: JSON.stringify(programData),
    });
  },

  async updateProgram(employeeId = DEFAULT_EMPLOYEE_ID, programId: string, data: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/programs/${programId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProgram(employeeId = DEFAULT_EMPLOYEE_ID, programId: string): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/programs/${programId}`, {
      method: 'DELETE',
    });
  },

  async addCertification(employeeId = DEFAULT_EMPLOYEE_ID, certData: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/certifications`, {
      method: 'POST',
      body: JSON.stringify(certData),
    });
  },

  async updateCertification(employeeId = DEFAULT_EMPLOYEE_ID, certId: string, data: { status?: CertificationStatus; verifiedBy?: string; expiryDate?: string }): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/certifications/${certId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCertification(employeeId = DEFAULT_EMPLOYEE_ID, certId: string): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/certifications/${certId}`, {
      method: 'DELETE',
    });
  },

  async requestMentorship(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/mentorship/request`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addMentorshipSession(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/mentorship/sessions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMentorshipStatus(employeeId = DEFAULT_EMPLOYEE_ID, status: MentorshipStatus, feedback?: string): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/mentorship/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, mentorFeedback: feedback }),
    });
  },

  async addCareerGoal(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/career-goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCareerGoal(employeeId = DEFAULT_EMPLOYEE_ID, goalId: string, data: object): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/career-goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCareerGoal(employeeId = DEFAULT_EMPLOYEE_ID, goalId: string): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/career-goals/${goalId}`, {
      method: 'DELETE',
    });
  },

  async update(employeeId = DEFAULT_EMPLOYEE_ID, data: Partial<EmployeeDevelopment>): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ========================= HEALTH & WELLNESS =========================

export const wellnessHealthService = {
  async getMyHealth(employeeId = DEFAULT_EMPLOYEE_ID): Promise<HealthWellness> {
    try {
      return await fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}`);
    } catch (err) {
      console.warn('Failed to fetch health wellness from API, using defaults', err);
      return {
        employeeId,
        employeeName: 'Sarah Johnson',
        department: 'Engineering',
        groupInsurancePolicyNumber: 'GHI-8849-2026',
        groupInsuranceSumInsured: 50000,
        groupInsuranceCurrency: 'USD',
        groupInsuranceEffective: '2026-01-01',
        groupInsuranceExpiry: '2027-01-01',
        groupInsuranceStatus: 'Active',
        annualReimbursementAllowance: 1500,
        insuranceDependents: [
          { _id: 'd1', id: 'd1', name: 'Sarah Johnson (Self)', relationship: 'Primary Insured', status: 'Covered' },
          { _id: 'd2', id: 'd2', name: 'Michael Johnson', relationship: 'Spouse', status: 'Covered' },
          { _id: 'd3', id: 'd3', name: 'Emma Johnson', relationship: 'Child', status: 'Covered' },
        ],
        healthClaims: [
          { _id: 'cl1', claimId: 'CLM-901', date: '2026-08-10', type: 'Dental', description: 'Dental Consultation & Cleaning', amount: 150, currency: 'USD', status: 'Approved' },
          { _id: 'cl2', claimId: 'CLM-882', date: '2026-07-14', type: 'Vision', description: 'Prescription Eyewear Reimbursement', amount: 220, currency: 'USD', status: 'Paid' },
        ],
        eapSessionsAvailable: 12,
        eapSessionsUsed: 2,
        mindfulnessAppAccess: true,
        counsellingAppointments: [
          {
            id: 'capp-1',
            counsellorName: 'Dr. Rachel Adams, LMFT',
            appointmentDate: '2026-11-25',
            appointmentTime: '14:00',
            topic: 'Workplace Stress Management & Mindful Resilience',
            status: 'Scheduled',
          },
        ],
        fitnessChallengeName: 'Corporate 100,000 Step Challenge',
        fitnessChallengeStepsGoal: 100000,
        fitnessChallengeCurrentSteps: 78400,
        fitnessChallengeRank: 14,
        fitnessChallengeStatus: 'Active',
        fitnessRewardPoints: 1200,
        fitnessActivities: [
          {
            id: 'act-1',
            activityName: 'Morning Sprint & Jog',
            date: '2026-11-16',
            durationMinutes: 45,
            stepsCount: 6500,
            caloriesBurned: 380,
          },
        ],
      };
    }
  },

  async submitClaim(employeeId = DEFAULT_EMPLOYEE_ID, claimData: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/claims`, {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  async updateClaimStatus(
    employeeId = DEFAULT_EMPLOYEE_ID,
    claimId: string,
    status: ClaimStatus,
    rejectionReason?: string
  ): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  },

  async addDependent(employeeId = DEFAULT_EMPLOYEE_ID, dependent: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/dependents`, {
      method: 'POST',
      body: JSON.stringify(dependent),
    });
  },

  async updateDependent(employeeId = DEFAULT_EMPLOYEE_ID, dependentId: string, data: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/dependents/${dependentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async removeDependent(employeeId = DEFAULT_EMPLOYEE_ID, dependentId: string): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/dependents/${dependentId}`, {
      method: 'DELETE',
    });
  },

  async bookCounselling(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/counselling/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelCounselling(employeeId = DEFAULT_EMPLOYEE_ID, appointmentId: string): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/counselling/${appointmentId}/cancel`, {
      method: 'PATCH',
    });
  },

  async logFitnessActivity(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/fitness/log`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async enrollFitnessChallenge(employeeId = DEFAULT_EMPLOYEE_ID, challengeName: string, stepsGoal: number): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/fitness/enroll`, {
      method: 'POST',
      body: JSON.stringify({ challengeName, stepsGoal }),
    });
  },

  async update(employeeId = DEFAULT_EMPLOYEE_ID, data: Partial<HealthWellness>): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ========================= WORKPLACE LIFE BALANCE =========================

export const wellnessWorkplaceService = {
  async getMyWorkplace(employeeId = DEFAULT_EMPLOYEE_ID): Promise<WorkplaceLifeBalance> {
    try {
      return await fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}`);
    } catch (err) {
      console.warn('Failed to fetch workplace life balance from API, using defaults', err);
      return {
        employeeId,
        employeeName: 'Sarah Johnson',
        department: 'Engineering',
        workScheduleType: 'Hybrid',
        officeDaysPerWeek: 3,
        coreHoursStart: '09:00',
        coreHoursEnd: '17:00',
        flexiBandStart: '08:00',
        flexiBandEnd: '10:00',
        remoteWorkLocation: 'Primary Residence (Verified High-Speed Network)',
        scheduleChangeRequests: [],
        sabbaticalLeaveWeeks: 4,
        wellnessDaysTotal: 5,
        wellnessDaysUsed: 1,
        parentalLeaveWeeks: 16,
        paidLeaveRequests: [],
        childCareStipendMonthly: 400,
        childCareStipendCurrency: 'USD',
        childCareStipendActive: true,
        childCareRequests: [],
        dormitoryAccessActive: true,
        accommodationRequests: [],
        familyEventsRegistered: [],
        familyEvents: [
          {
            id: 'fe-1',
            title: 'Huremaso Annual Family Picnic & Funfest',
            date: '2026-12-12',
            location: 'Central Corporate Greens, Bangalore',
            description: 'Games, sports, buffet, music and fun for employee families.',
            registered: false,
          },
        ],
        familySupportRequests: [],
        fringeMonthlyInternetAllowance: 150,
        fringeMonthlyCommuteAllowance: 200,
        fringeTotalYTDReimbursed: 550,
        fringeCurrency: 'USD',
        fringeClaims: [
          { _id: 'f1', claimId: 'FRG-401', date: '2026-08-24', title: 'Home Fiber Internet Bill', category: 'Connectivity', amount: 120, currency: 'USD', status: 'Approved' },
          { _id: 'f2', claimId: 'FRG-392', date: '2026-08-12', title: 'Monthly Transit Pass Reimbursement', category: 'Commute', amount: 180, currency: 'USD', status: 'Paid' },
          { _id: 'f3', claimId: 'FRG-380', date: '2026-07-28', title: 'Ergonomic Home Office Setup Allowance', category: 'Equipment', amount: 250, currency: 'USD', status: 'Paid' },
        ],
      };
    }
  },

  async requestScheduleChange(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/schedule-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewScheduleChange(employeeId = DEFAULT_EMPLOYEE_ID, requestId: string, status: 'Approved' | 'Rejected'): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/schedule-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async requestPaidLeave(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/leave-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewPaidLeave(employeeId = DEFAULT_EMPLOYEE_ID, leaveId: string, status: 'Approved' | 'Rejected', rejectionReason?: string): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/leave-requests/${leaveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  },

  async requestAccommodation(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/accommodation-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewAccommodation(employeeId = DEFAULT_EMPLOYEE_ID, requestId: string, status: 'Approved' | 'Rejected' | 'Allocated', allocatedRoomNumber?: string): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/accommodation-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, allocatedRoomNumber }),
    });
  },

  async requestChildCare(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/childcare-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewChildCare(employeeId = DEFAULT_EMPLOYEE_ID, requestId: string, status: 'Approved' | 'Rejected' | 'Enrolled'): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/childcare-requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async createFamilyEvent(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/family-events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async registerFamilyEvent(employeeId = DEFAULT_EMPLOYEE_ID, eventName: string): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/family-events/register`, {
      method: 'POST',
      body: JSON.stringify({ eventName }),
    });
  },

  async requestFamilySupport(employeeId = DEFAULT_EMPLOYEE_ID, data: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/family-support`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitFringeClaim(employeeId = DEFAULT_EMPLOYEE_ID, claimData: object): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/fringe-claims`, {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  async updateFringeClaimStatus(
    employeeId = DEFAULT_EMPLOYEE_ID,
    claimId: string,
    status: FringeClaimStatus,
    rejectionReason?: string
  ): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/fringe-claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  },

  async applyChildCareStipend(employeeId = DEFAULT_EMPLOYEE_ID): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/childcare-stipend`, {
      method: 'POST',
    });
  },

  async update(employeeId = DEFAULT_EMPLOYEE_ID, data: Partial<WorkplaceLifeBalance>): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
