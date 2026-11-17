/**
 * Reporting and Analytics Service
 * Connects frontend to HUREMASO Reports (/api/v1/reports) and Analytics (/api/v1/analytics)
 */

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const REPORTS_URL = `${VITE_API_URL}/reports`;
const ANALYTICS_URL = `${VITE_API_URL}/analytics`;

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  status?: string;
  category?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  timeframe?: string;
  period?: string;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface MetricCard {
  label: string;
  value: number | string;
  prevValue?: number | string;
  changePct?: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  badge?: string;
}

export interface GenericReportData {
  summary: Record<string, any>;
  distribution?: DistributionItem[];
  departmentBreakdown?: any[];
  records: Array<Record<string, any>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: any;
}

export interface RecognitionCandidate {
  rank: number;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  totalScore: number;
  scoringBreakdown: {
    appraisalScore: number;
    goalScore: number;
    taskScore: number;
    attendanceScore: number;
    contributionScore: number;
  };
  metrics: {
    appraisalRating: number;
    completedTasks: number;
    attendanceRate: number;
    tenureYears: number;
  };
  status: 'Proposed' | 'Approved';
  isApprovedWinner: boolean;
}

export interface EmployeeOfPeriodRecord {
  periodType: 'week' | 'month' | 'year';
  periodLabel: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  avatar?: string;
  ratingScore: number;
  punctualityScore: number;
  achievementHighlights: string[];
  keyQuote?: string;
  badge: string;
  awardedDate: string;
  status?: 'Proposed' | 'Approved';
  approvedBy?: string;
  scoringBreakdown?: {
    appraisalScore: number;
    goalScore: number;
    taskScore: number;
    attendanceScore: number;
    contributionScore: number;
  };
}

export interface EmployeeOfPeriodResponse {
  employeeOfWeek: EmployeeOfPeriodRecord;
  employeeOfMonth: EmployeeOfPeriodRecord;
  employeeOfYear: EmployeeOfPeriodRecord;
  hallOfFame: EmployeeOfPeriodRecord[];
}

export interface ApproveWinnerPayload {
  periodType: 'week' | 'month' | 'year';
  periodLabel: string;
  employeeId: string;
  remarks?: string;
  approvedBy?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || 'dev-token-hr';
  const userId = localStorage.getItem('userId') || 'USR-HR-LEAD';
  const userName = localStorage.getItem('userName') || 'HR Operations Director';
  const userRole = localStorage.getItem('userRole') || 'HR Manager';

  return {
    Authorization: `Bearer ${token}`,
    'x-user-id': userId,
    'x-user-name': userName,
    'x-user-role': userRole,
  };
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options?.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export const reportingService = {
  // ==========================================
  // 12 CORE REPORT ENDPOINTS
  // ==========================================
  async getReport(reportType: string, params?: ReportFilterParams): Promise<GenericReportData> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'All') {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString();
    const url = `${REPORTS_URL}/${reportType}${qs ? `?${qs}` : ''}`;
    return await fetchJson<GenericReportData>(url);
  },

  // ==========================================
  // UNIFIED EXPORT (PDF, CSV, EXCEL)
  // ==========================================
  async exportReport(
    reportType: string,
    format: 'pdf' | 'csv' | 'excel',
    params?: ReportFilterParams
  ): Promise<Blob> {
    const query = new URLSearchParams();
    query.append('format', format);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '' && val !== 'All') {
          query.append(key, String(val));
        }
      });
    }

    const headers = {
      ...getAuthHeaders(),
    };

    const res = await fetch(`${REPORTS_URL}/${reportType}/export?${query.toString()}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to export ${reportType} report: HTTP ${res.status}`);
    }

    return await res.blob();
  },

  async downloadReport(
    reportType: string,
    format: 'pdf' | 'csv' | 'excel',
    params?: ReportFilterParams
  ): Promise<void> {
    const blob = await this.exportReport(reportType, format, params);
    const dateStr = new Date().toISOString().split('T')[0];
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    const filename = `${reportType}-report-${dateStr}.${ext}`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ==========================================
  // RECOGNITION STUDIO & APPROVALS
  // ==========================================
  async getRecognitionCandidates(
    periodType: 'week' | 'month' | 'year' = 'month',
    department?: string
  ): Promise<RecognitionCandidate[]> {
    const query = new URLSearchParams();
    query.append('periodType', periodType);
    if (department && department !== 'All' && department !== 'All Departments') {
      query.append('department', department);
    }
    return await fetchJson<RecognitionCandidate[]>(`${ANALYTICS_URL}/recognition/candidates?${query.toString()}`);
  },

  async approveWinner(payload: ApproveWinnerPayload): Promise<EmployeeOfPeriodRecord> {
    return await fetchJson<EmployeeOfPeriodRecord>(`${ANALYTICS_URL}/recognition/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getApprovedWinners(periodType?: string): Promise<EmployeeOfPeriodRecord[]> {
    const query = periodType && periodType !== 'all' ? `?periodType=${periodType}` : '';
    return await fetchJson<EmployeeOfPeriodRecord[]>(`${ANALYTICS_URL}/recognition/winners${query}`);
  },

  async getEmployeeOfPeriod(): Promise<EmployeeOfPeriodResponse> {
    return await fetchJson<EmployeeOfPeriodResponse>(`${ANALYTICS_URL}/employee-of-period`);
  },

  async getEmployeeOfWeek(): Promise<EmployeeOfPeriodRecord> {
    return await fetchJson<EmployeeOfPeriodRecord>(`${ANALYTICS_URL}/employee-of-the-week`);
  },

  async getEmployeeOfMonth(): Promise<EmployeeOfPeriodRecord> {
    return await fetchJson<EmployeeOfPeriodRecord>(`${ANALYTICS_URL}/employee-of-the-month`);
  },

  async getEmployeeOfYear(): Promise<EmployeeOfPeriodRecord> {
    return await fetchJson<EmployeeOfPeriodRecord>(`${ANALYTICS_URL}/employee-of-the-year`);
  },

  async getExecutiveDashboard(): Promise<any> {
    return await fetchJson<any>(`${ANALYTICS_URL}/dashboard`);
  },
};

