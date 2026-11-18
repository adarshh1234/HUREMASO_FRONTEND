import { FinanceRequest } from '../types';
import {
  PayrollRecord,
  PayrollReportsSummary,
  PayrollFinanceRequest,
  PayrollBenefitAdvance,
  SalaryDisbursement,
  PaymentApplication,
  DisbursementSummary,
  PayGrade,
  BenefitScheme,
  EmploymentStatusSummary,
  WorkforceAnalyticsResponse,
  PerformanceSkillsResponse,
  EmployeeExperienceResponse,
  ComplianceCheckResponse,
  KnowledgeSyncResponse,
  EmployeeReference,
} from '../types/payroll';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/payroll`;

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

function mapItem<T extends { _id?: string; id?: string }>(item: T): T & { id: string } {
  return {
    ...item,
    id: (item._id || item.id || '') as string,
  };
}

// ─── Real Employee Fetch Helper ──────────────────────────────────────────────
export async function getEmployees(): Promise<EmployeeReference[]> {
  try {
    const res = await fetch(`${VITE_API_URL}/employees?limit=100`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = json.data || json.employees || [];
    return list.map((e: any) => ({
      id: e.id || e.employeeId || e._id,
      employeeId: e.employeeId || e.id || 'EMP-000',
      name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
      department: e.department || 'Operations',
      role: e.jobTitle || e.role || 'Staff',
      jobTitle: e.jobTitle || e.role || 'Staff',
      email: e.email || '',
      salary: e.salary || 3500,
    }));
  } catch {
    return [];
  }
}

// ─── Payroll Record & One-Tap Services ────────────────────────────────────────
export const payrollRecordService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    department?: string;
    period?: string;
  }): Promise<{ items: PayrollRecord[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);
    if (params?.period && params.period !== 'All') qs.set('period', params.period);

    const res = await fetch(`${BASE}/records?${qs.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    const items = (json.data || []).map(mapItem);
    const total = json.pagination?.total ?? json.total ?? items.length;
    return { items, total };
  },

  async getById(id: string): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}`);
    return mapItem(item);
  },

  async pay(id: string, amount: number, paymentMethod = 'Bank Transfer', transactionRef?: string, notes?: string): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, transactionRef, notes }),
    });
    return mapItem(item);
  },

  async generateSlip(id: string): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}/generate-slip`, {
      method: 'POST',
    });
    return mapItem(item);
  },

  async approvePayOnRequest(id: string, status: 'Approved' | 'Rejected', approvalRemarks?: string, approvedBy?: string): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}/approve-pay-request`, {
      method: 'POST',
      body: JSON.stringify({ status, approvalRemarks, approvedBy }),
    });
    return mapItem(item);
  },

  async create(data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async update(id: string, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/records/${id}`, { method: 'DELETE' });
  },

  async getReports(): Promise<PayrollReportsSummary> {
    return fetchJson<PayrollReportsSummary>(`${BASE}/records/reports/summary`);
  },

  async getEmploymentStatus(): Promise<EmploymentStatusSummary> {
    return fetchJson<EmploymentStatusSummary>(`${BASE}/records/employment-status`);
  },
};

// ─── Pay Grade Service ───────────────────────────────────────────────────────
export const payGradeService = {
  async getAll(params?: { search?: string; status?: string }): Promise<{ items: PayGrade[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);

    const res = await fetch(`${BASE}/pay-grades?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pay grades`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getById(id: string): Promise<PayGrade> {
    const item = await fetchJson<PayGrade>(`${BASE}/pay-grades/${id}`);
    return mapItem(item);
  },

  async create(data: Partial<PayGrade>): Promise<PayGrade> {
    const item = await fetchJson<PayGrade>(`${BASE}/pay-grades`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async update(id: string, data: Partial<PayGrade>): Promise<PayGrade> {
    const item = await fetchJson<PayGrade>(`${BASE}/pay-grades/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/pay-grades/${id}`, { method: 'DELETE' });
  },
};

// ─── Benefit Schemes Service ─────────────────────────────────────────────────
export const benefitSchemeService = {
  async getAll(category?: string, tab?: string): Promise<BenefitScheme[]> {
    const qs = new URLSearchParams();
    if (category && category !== 'all') qs.set('category', category);
    if (tab && tab !== 'all') qs.set('tab', tab);

    const res = await fetch(`${BASE}/benefit-advances/schemes?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch benefit schemes`);
    const json = await res.json();
    return (json.data || []).map(mapItem);
  },

  async create(data: Partial<BenefitScheme>): Promise<BenefitScheme> {
    const item = await fetchJson<BenefitScheme>(`${BASE}/benefit-advances/schemes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async update(id: string, data: Partial<BenefitScheme>): Promise<BenefitScheme> {
    const item = await fetchJson<BenefitScheme>(`${BASE}/benefit-advances/schemes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },
};

// ─── Finance Requests ────────────────────────────────────────────────────────
export const financeRequestService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
    requestType?: string;
  }): Promise<{ items: PayrollFinanceRequest[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);
    if (params?.requestType && params.requestType !== 'All') qs.set('requestType', params.requestType);

    const res = await fetch(`${BASE}/finance-requests?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch finance requests`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async create(data: {
    employeeName: string;
    employeeId?: string;
    requestType: string;
    department: string;
    amount: number;
    description?: string;
    supportingDoc?: string;
  }): Promise<PayrollFinanceRequest> {
    const item = await fetchJson<PayrollFinanceRequest>(`${BASE}/finance-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async updateStatus(id: string, status: string, remarks?: string, approvedBy?: string): Promise<PayrollFinanceRequest> {
    const item = await fetchJson<PayrollFinanceRequest>(`${BASE}/finance-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks, approvedBy }),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/finance-requests/${id}`, { method: 'DELETE' });
  },
};

// ─── Benefit Advances ────────────────────────────────────────────────────────
export const benefitAdvanceService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    tab?: string;
  }): Promise<{ items: PayrollBenefitAdvance[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.tab && params.tab !== 'all' && params.tab !== 'All') qs.set('tab', params.tab);

    const res = await fetch(`${BASE}/benefit-advances?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch benefit advances`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async create(data: Partial<PayrollBenefitAdvance>): Promise<PayrollBenefitAdvance> {
    const item = await fetchJson<PayrollBenefitAdvance>(`${BASE}/benefit-advances`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async updateStatus(id: string, status: string, remarks?: string, approvedBy?: string): Promise<PayrollBenefitAdvance> {
    const item = await fetchJson<PayrollBenefitAdvance>(`${BASE}/benefit-advances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks, approvedBy }),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/benefit-advances/${id}`, { method: 'DELETE' });
  },
};

// ─── Salary Disbursement ─────────────────────────────────────────────────────
export const salaryDisbursementService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
    period?: string;
  }): Promise<{ items: SalaryDisbursement[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);
    if (params?.period && params.period !== 'All') qs.set('period', params.period);

    const res = await fetch(`${BASE}/disbursements?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch disbursements`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getSummary(): Promise<DisbursementSummary> {
    return fetchJson<DisbursementSummary>(`${BASE}/disbursements/summary`);
  },

  async disburse(id: string, transactionRef?: string, remarks?: string): Promise<SalaryDisbursement> {
    const item = await fetchJson<SalaryDisbursement>(`${BASE}/disbursements/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify({ transactionRef, remarks }),
    });
    return mapItem(item);
  },

  async updateStatus(id: string, status: string, remarks?: string, transactionRef?: string): Promise<SalaryDisbursement> {
    const item = await fetchJson<SalaryDisbursement>(`${BASE}/disbursements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks, transactionRef }),
    });
    return mapItem(item);
  },

  async create(data: Partial<SalaryDisbursement>): Promise<SalaryDisbursement> {
    const item = await fetchJson<SalaryDisbursement>(`${BASE}/disbursements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/disbursements/${id}`, { method: 'DELETE' });
  },
};

// ─── Payment Applications ───────────────────────────────────────────────────
export const paymentApplicationService = {
  async getAll(params?: { search?: string; status?: string; provider?: string }): Promise<{ items: PaymentApplication[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.provider && params.provider !== 'All') qs.set('provider', params.provider);

    const res = await fetch(`${BASE}/payment-apps?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch payment applications`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async create(data: Partial<PaymentApplication & { apiKey?: string; webhookSecret?: string }>): Promise<PaymentApplication> {
    const item = await fetchJson<PaymentApplication>(`${BASE}/payment-apps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async update(id: string, data: Partial<PaymentApplication & { apiKey?: string; webhookSecret?: string }>): Promise<PaymentApplication> {
    const item = await fetchJson<PaymentApplication>(`${BASE}/payment-apps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async testConnection(id: string): Promise<{ success: boolean; latencyMs: number; message: string; verifiedAt: string }> {
    return fetchJson<{ success: boolean; latencyMs: number; message: string; verifiedAt: string }>(
      `${BASE}/payment-apps/${id}/test-connection`,
      { method: 'POST' }
    );
  },

  async sync(id: string): Promise<PaymentApplication> {
    const item = await fetchJson<PaymentApplication>(`${BASE}/payment-apps/${id}/sync`, { method: 'POST' });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/payment-apps/${id}`, { method: 'DELETE' });
  },
};

// ─── Payroll AI Assistant & Analytics ─────────────────────────────────────────
export const payrollAIService = {
  async chat(message: string, context?: string): Promise<{ reply: string; timestamp: string; suggestedAction?: string }> {
    return fetchJson<{ reply: string; timestamp: string; suggestedAction?: string }>(`${BASE}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },

  async getWorkforceAnalytics(): Promise<WorkforceAnalyticsResponse> {
    return fetchJson<WorkforceAnalyticsResponse>(`${BASE}/ai/workforce-analytics`);
  },

  async getPerformanceSkills(): Promise<PerformanceSkillsResponse> {
    return fetchJson<PerformanceSkillsResponse>(`${BASE}/ai/performance-skills`);
  },

  async getEmployeeExperience(): Promise<EmployeeExperienceResponse> {
    return fetchJson<EmployeeExperienceResponse>(`${BASE}/ai/employee-experience`);
  },

  async getComplianceCheck(): Promise<ComplianceCheckResponse> {
    return fetchJson<ComplianceCheckResponse>(`${BASE}/ai/compliance-check`);
  },

  async syncKnowledge(): Promise<KnowledgeSyncResponse> {
    return fetchJson<KnowledgeSyncResponse>(`${BASE}/ai/sync-knowledge`, { method: 'POST' });
  },
};

// ─── Legacy compatibility adapter ────────────────────────────────────────────
export const payrollService = {
  getPayrollRecords: payrollRecordService.getAll,
  payPayrollRecord: payrollRecordService.pay,
  getPayrollReports: payrollRecordService.getReports,

  async getFinanceRequests(): Promise<FinanceRequest[]> {
    const res = await financeRequestService.getAll();
    return res.items.map((item) => ({
      id: item.id,
      employeeName: item.employeeName,
      department: item.department,
      type: item.requestType,
      amount: item.amount,
      dateRequested: item.dateRequested,
      status: item.status as any,
      description: item.description,
    }));
  },

  async createFinanceRequest(data: Omit<FinanceRequest, 'id' | 'dateRequested' | 'status'>): Promise<FinanceRequest> {
    const created = await financeRequestService.create({
      employeeName: data.employeeName,
      department: data.department,
      requestType: data.requestType || (data as any).type || 'Benefit Advance',
      amount: data.amount,
      description: data.description,
    });
    return {
      id: created.id,
      employeeName: created.employeeName,
      department: created.department,
      requestType: created.requestType,
      type: created.requestType,
      amount: created.amount,
      dateRequested: created.dateRequested,
      status: created.status as any,
      description: created.description || '',
    };
  },

  async updateFinanceRequestStatus(id: string, status: 'Approved' | 'Rejected'): Promise<FinanceRequest> {
    const updated = await financeRequestService.updateStatus(id, status);
    return {
      id: updated.id,
      employeeName: updated.employeeName,
      department: updated.department,
      requestType: updated.requestType,
      type: updated.requestType,
      amount: updated.amount,
      dateRequested: updated.dateRequested,
      status: updated.status as any,
      description: updated.description || '',
    };
  },
};

export default payrollService;
