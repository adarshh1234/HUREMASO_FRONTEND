const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/employee-reports`;

export interface HeadcountReport {
  totalEmployees: number;
  activeEmployees: number;
  terminatedEmployees: number;
  byDepartment: Record<string, number>;
  byJobTitle: Record<string, number>;
  byEmploymentStatus: Record<string, number>;
  byGender: Record<string, number>;
}

export interface TurnoverReport {
  totalEmployees: number;
  newHiresCount: number;
  terminationsCount: number;
  turnoverRatePercent: number;
  retentionRatePercent: number;
}

export interface OverviewReport {
  headcount: HeadcountReport;
  turnover: TurnoverReport;
  generatedAt: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export const employeeReportService = {
  async getHeadcount(department?: string): Promise<HeadcountReport> {
    const qs = department ? `?department=${encodeURIComponent(department)}` : '';
    return fetchJson<HeadcountReport>(`${BASE_URL}/headcount${qs}`);
  },

  async getTurnover(year?: number): Promise<TurnoverReport> {
    const qs = year ? `?year=${year}` : '';
    return fetchJson<TurnoverReport>(`${BASE_URL}/turnover${qs}`);
  },

  async getOverview(): Promise<OverviewReport> {
    return fetchJson<OverviewReport>(`${BASE_URL}/overview`);
  },

  async getCustomReport(criteria: {
    fields?: string[];
    department?: string;
    jobTitle?: string;
    employmentStatus?: string;
  }): Promise<any> {
    return fetchJson(`${BASE_URL}/custom`, {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },
};

export default employeeReportService;
