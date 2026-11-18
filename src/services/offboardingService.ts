import {
  IOffboardingRecord,
  CreateOffboardingRecordDTO,
  OffboardingReportsSummary,
  OffboardingQueryParams,
  IOffboardingPerformance,
  IOffboardingCustomField,
} from '../types/offboarding';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/offboarding`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    headers: { ...headers, ...options?.headers },
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

export interface SimpleEmployeePickerItem {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  email?: string;
}

export const offboardingService = {
  async getEmployees(): Promise<SimpleEmployeePickerItem[]> {
    try {
      const res = await fetch(`${VITE_API_URL}/employees`);
      if (!res.ok) return [];
      const json = await res.json();
      const list = json.data?.data || json.data || json || [];
      return (Array.isArray(list) ? list : []).map((emp: any) => ({
        id: (emp.id || emp._id || '') as string,
        employeeId: (emp.employeeId || emp.empId || emp.id || '') as string,
        name: (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee') as string,
        role: (emp.jobTitle || emp.role || emp.designation || 'Staff Member') as string,
        department: (emp.department || 'Engineering') as string,
        email: emp.email,
      }));
    } catch {
      return [];
    }
  },

  async getRecords(params?: OffboardingQueryParams): Promise<{ items: (IOffboardingRecord & { id: string })[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);
    if (params?.separationType && params.separationType !== 'All') qs.set('separationType', params.separationType);

    const res = await fetch(`${BASE}/records?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch offboarding records`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getRecordById(id: string): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}`);
    return mapItem(item);
  },

  async createRecord(payload: CreateOffboardingRecordDTO): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateRecord(id: string, payload: Partial<IOffboardingRecord>): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateDocument(
    id: string,
    payload: {
      type: 'resignation' | 'termination';
      status?: string;
      noticeDuration?: string;
      reason?: string;
      resignationDate?: string;
      lastWorkingDate?: string;
      effectiveDate?: string;
      terminationType?: string;
      terminationReason?: string;
      severanceDetails?: string;
      letterContent?: string;
      docUrl?: string;
    }
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/document`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updatePerformance(
    id: string,
    payload: Partial<IOffboardingPerformance>
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/performance`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateSettlement(
    id: string,
    payload: Partial<IOffboardingRecord['settlement']> & { auditAction?: string }
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/settlement`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateLegal(
    id: string,
    payload: Partial<IOffboardingRecord['legal']>
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/legal`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateAssets(
    id: string,
    payload: {
      items?: IOffboardingRecord['assets']['items'];
      dependencies?: IOffboardingRecord['assets']['dependencies'];
      missingItems?: IOffboardingRecord['assets']['missingItems'];
      inspectionPassed?: boolean;
      totalDeductions?: number;
      clearedBy?: string;
      isFullyCleared?: boolean;
    }
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/assets`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateTravel(
    id: string,
    payload: Partial<IOffboardingRecord['travel']>
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/travel`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateCustomFields(
    id: string,
    customFields: IOffboardingCustomField[]
  ): Promise<IOffboardingRecord & { id: string }> {
    const item = await fetchJson<IOffboardingRecord>(`${BASE}/records/${id}/custom-fields`, {
      method: 'PATCH',
      body: JSON.stringify({ customFields }),
    });
    return mapItem(item);
  },

  async deleteRecord(id: string): Promise<void> {
    await fetchJson(`${BASE}/records/${id}`, { method: 'DELETE' });
  },

  async getReportsSummary(): Promise<OffboardingReportsSummary> {
    return fetchJson<OffboardingReportsSummary>(`${BASE}/reports`);
  },
};

export default offboardingService;
