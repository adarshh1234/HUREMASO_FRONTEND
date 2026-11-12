import {
  FinancialIncentive,
  EmployeeDevelopment,
  HealthWellness,
  WorkplaceLifeBalance,
  BonusStatus,
  ClaimStatus,
  FringeClaimStatus,
} from '../types/wellness.types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/wellness`;

// Default Employee ID for demo / single-employee view
const DEFAULT_EMPLOYEE_ID = 'EMP-001';

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
        vestingSchedule: [
          { trancheNumber: 1, period: 'Tranche 1 (Year 1)', vestingDate: '2024-10-15', shares: 625, status: 'Vested' },
          { trancheNumber: 2, period: 'Tranche 2 (Year 2)', vestingDate: '2025-10-15', shares: 625, status: 'Vested' },
          { trancheNumber: 3, period: 'Tranche 3 (Year 3)', vestingDate: '2026-10-15', shares: 625, status: 'Granted' },
          { trancheNumber: 4, period: 'Tranche 4 (Year 4)', vestingDate: '2027-10-15', shares: 625, status: 'Granted' },
        ],
        bonusYear: 2026,
        bonusMultiplier: 1.25,
        estimatedBonusAmount: 18500,
        bonusStatus: 'Approved',
        bonusTargetAchievement: 112,
        incentives: [
          { title: 'Project Milestone Alpha', target: '100% On-time delivery', reward: '$2,500 Spot Award', rewardAmount: 2500, status: 'Achieved', quarter: 'Q3-2026' },
          { title: 'Client Satisfaction Index', target: '> 95% CSAT Score', reward: '$1,500 Incentive', rewardAmount: 1500, status: 'In_Progress', quarter: 'Q3-2026' },
        ],
        financialLiteracySessionsAttended: 2,
      };
    }
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
          { _id: 'p1', title: 'Strategic Product Leadership & Team Management', provider: 'Huremaso Learning Hub', totalModules: 8, completedModules: 6, progressPercent: 75, status: 'In_Progress' },
          { _id: 'p2', title: 'Advanced Cloud Security & Microservices Architecture', provider: 'Coursera Enterprise', totalModules: 10, completedModules: 4, progressPercent: 40, status: 'In_Progress' },
        ],
        certifications: [
          { _id: 'c1', name: 'AWS Solutions Architect', issuingOrganization: 'Amazon Web Services', issuedDate: '2024-03-15', status: 'Active' },
          { _id: 'c2', name: 'Project Management Professional (PMP)', issuingOrganization: 'PMI', issuedDate: '2023-11-20', status: 'Active' },
        ],
        careerGoal: 'Senior Engineering Lead',
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

  async deleteCertification(employeeId = DEFAULT_EMPLOYEE_ID, certId: string): Promise<EmployeeDevelopment> {
    return fetchJson<EmployeeDevelopment>(`${BASE_URL}/employee-development/${employeeId}/certifications/${certId}`, {
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
        groupInsuranceExpiry: '2027-01-01',
        insuranceDependents: [
          { _id: 'd1', name: 'Sarah Johnson (Self)', relationship: 'Primary Insured', status: 'Covered' },
          { _id: 'd2', name: 'Michael Johnson', relationship: 'Spouse', status: 'Covered' },
          { _id: 'd3', name: 'Emma Johnson', relationship: 'Child', status: 'Covered' },
        ],
        healthClaims: [
          { _id: 'cl1', claimId: 'CLM-901', date: '2026-08-10', type: 'Dental', description: 'Dental Consultation', amount: 150, currency: 'USD', status: 'Approved' },
          { _id: 'cl2', claimId: 'CLM-882', date: '2026-07-14', type: 'Vision', description: 'Prescription Eyewear', amount: 220, currency: 'USD', status: 'Reimbursed' },
        ],
        eapSessionsAvailable: 12,
        eapSessionsUsed: 2,
        mindfulnessAppAccess: true,
        fitnessChallengeName: 'Monthly 100,000 Step Challenge',
        fitnessChallengeStepsGoal: 100000,
        fitnessChallengeCurrentSteps: 78400,
        fitnessChallengeRank: 14,
        fitnessChallengeStatus: 'Active',
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
    notes?: string
  ): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async addDependent(employeeId = DEFAULT_EMPLOYEE_ID, dependent: object): Promise<HealthWellness> {
    return fetchJson<HealthWellness>(`${BASE_URL}/health/${employeeId}/dependents`, {
      method: 'POST',
      body: JSON.stringify(dependent),
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
        workScheduleType: 'Hybrid 3/2',
        officeDaysPerWeek: 3,
        coreHoursStart: '09:00',
        coreHoursEnd: '17:00',
        flexiBandStart: '08:00',
        flexiBandEnd: '10:00',
        remoteWorkLocation: 'Primary Residence (Verified High-Speed Network)',
        sabbaticalLeaveWeeks: 4,
        wellnessDaysTotal: 5,
        wellnessDaysUsed: 0,
        parentalLeaveWeeks: 16,
        childCareStipendMonthly: 400,
        childCareStipendCurrency: 'USD',
        childCareStipendActive: true,
        dormitoryAccessActive: true,
        familyEventsRegistered: [],
        fringeMonthlyInternetAllowance: 150,
        fringeMonthlyCommuteAllowance: 200,
        fringeTotalYTDReimbursed: 2800,
        fringeCurrency: 'USD',
        fringeClaims: [
          { _id: 'f1', claimId: 'FRG-401', date: '2026-08-24', title: 'Home Fiber Internet Bill', category: 'Connectivity', amount: 120, currency: 'USD', status: 'Approved' },
          { _id: 'f2', claimId: 'FRG-392', date: '2026-08-12', title: 'Monthly Transit Pass Reimbursement', category: 'Commute', amount: 180, currency: 'USD', status: 'Paid' },
          { _id: 'f3', claimId: 'FRG-380', date: '2026-07-28', title: 'Ergonomic Home Office Setup Allowance', category: 'Equipment', amount: 250, currency: 'USD', status: 'Paid' },
        ],
      };
    }
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
    status: FringeClaimStatus
  ): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/fringe-claims/${claimId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async registerFamilyEvent(employeeId = DEFAULT_EMPLOYEE_ID, eventName: string): Promise<WorkplaceLifeBalance> {
    return fetchJson<WorkplaceLifeBalance>(`${BASE_URL}/workplace-balance/${employeeId}/family-events`, {
      method: 'POST',
      body: JSON.stringify({ eventName }),
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
