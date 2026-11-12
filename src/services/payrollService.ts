import { FinanceRequest } from '../types';
import {
  PayrollRecord,
  PayrollReportsSummary,
  PayrollFinanceRequest,
  PayrollBenefitAdvance,
  SalaryDisbursement,
  PaymentApplication,
  DisbursementSummary,
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

// ─── Payroll Record & One-Tap Payment Services ────────────────────────────────
export const payrollRecordService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    department?: string;
  }): Promise<{ items: PayrollRecord[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);

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

  async pay(id: string, amount: number, paymentMethod = 'Bank Transfer', notes?: string): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, notes }),
    });
    return mapItem(item);
  },

  async create(data: {
    employeeName: string;
    employeeId?: string;
    department: string;
    amount: number;
    category?: 'statement' | 'upcoming' | 'slips' | 'pay-on-request' | 'advance-payments';
    status?: 'Paid' | 'Pending';
  }): Promise<PayrollRecord> {
    const item = await fetchJson<PayrollRecord>(`${BASE}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async getReports(): Promise<PayrollReportsSummary> {
    const data = await fetchJson<PayrollReportsSummary>(`${BASE}/reports`);
    return data;
  },
};

// ─── Legacy payrollService compatibility adapter ─────────────────────────────
export const payrollService = {
  // One-tap records
  getPayrollRecords: payrollRecordService.getAll,
  payPayrollRecord: payrollRecordService.pay,
  getPayrollReports: payrollRecordService.getReports,

  // Finance requests (kept for backward-compatible views)
  async getFinanceRequests(): Promise<FinanceRequest[]> {
    const res = await financeRequestService.getAll();
    return res.items.map((item) => ({
      id: item.id,
      employeeName: item.employeeName,
      department: item.department,
      type: item.requestType,
      amount: item.amount,
      dateRequested: item.dateRequested,
      status: item.status,
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
      status: created.status,
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
      status: updated.status,
      description: updated.description || '',
    };
  },
};

// ─── Finance Requests (API-backed) ───────────────────────────────────────────
export const financeRequestService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
  }): Promise<{ items: PayrollFinanceRequest[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);

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
  }): Promise<PayrollFinanceRequest> {
    const item = await fetchJson<PayrollFinanceRequest>(`${BASE}/finance-requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async updateStatus(id: string, status: 'Approved' | 'Rejected', notes?: string): Promise<PayrollFinanceRequest> {
    const item = await fetchJson<PayrollFinanceRequest>(`${BASE}/finance-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/finance-requests/${id}`, { method: 'DELETE' });
  },
};

// ─── Benefit Advances (API-backed) ────────────────────────────────────────────
export const benefitAdvanceService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  }): Promise<{ items: PayrollBenefitAdvance[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.category && params.category !== 'all') qs.set('category', params.category);

    const res = await fetch(`${BASE}/benefit-advances?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch benefit advances`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async create(data: {
    employeeName: string;
    employeeId?: string;
    benefitType: string;
    category: PayrollBenefitAdvance['category'];
    amount: number;
    description?: string;
  }): Promise<PayrollBenefitAdvance> {
    const item = await fetchJson<PayrollBenefitAdvance>(`${BASE}/benefit-advances`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async updateStatus(id: string, status: 'Approved' | 'Rejected', notes?: string): Promise<PayrollBenefitAdvance> {
    const item = await fetchJson<PayrollBenefitAdvance>(`${BASE}/benefit-advances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/benefit-advances/${id}`, { method: 'DELETE' });
  },
};

// ─── Salary Disbursement (API-backed) ─────────────────────────────────────────
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
    if (params?.period) qs.set('period', params.period);

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

  async disburse(id: string): Promise<SalaryDisbursement> {
    const item = await fetchJson<SalaryDisbursement>(`${BASE}/disbursements/${id}/disburse`, { method: 'POST' });
    return mapItem(item);
  },

  async create(data: {
    employeeName: string;
    employeeId?: string;
    department: string;
    period: string;
    grossAmount: number;
    deductions?: number;
    method?: string;
  }): Promise<SalaryDisbursement> {
    const item = await fetchJson<SalaryDisbursement>(`${BASE}/disbursements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },
};

// ─── Payment Applications (API-backed) ───────────────────────────────────────
export const paymentApplicationService = {
  async getAll(params?: { search?: string; status?: string }): Promise<{ items: PaymentApplication[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);

    const res = await fetch(`${BASE}/payment-apps?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch payment applications`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async create(data: {
    name: string;
    provider: string;
    apiKey?: string;
    webhookUrl?: string;
    autoDisburse?: boolean;
    disbursementDay?: number;
  }): Promise<PaymentApplication> {
    const item = await fetchJson<PaymentApplication>(`${BASE}/payment-apps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      provider: string;
      apiKey: string;
      autoDisburse: boolean;
      disbursementDay: number;
      notes: string;
      status: 'Active' | 'Pending' | 'Inactive' | 'Error';
    }>
  ): Promise<PaymentApplication> {
    const item = await fetchJson<PaymentApplication>(`${BASE}/payment-apps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapItem(item);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE}/payment-apps/${id}`, { method: 'DELETE' });
  },
};

// ─── Payroll AI (API-backed) ──────────────────────────────────────────────────
export const payrollAIService = {
  async chat(message: string, context?: string): Promise<{ reply: string; timestamp: string }> {
    return fetchJson<{ reply: string; timestamp: string }>(`${BASE}/ai/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  },
};

export default payrollService;
