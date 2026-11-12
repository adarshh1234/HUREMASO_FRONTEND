const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/support/miscellaneous`;

export interface MiscRequestItem {
  id: string;
  _id?: string;
  requestId: string;
  employee: string;
  name: string;
  department: string;
  dept: string;
  requestType: string;
  type: string;
  description: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Approved' | 'Pending' | 'Rejected';
  createdBy?: string;
  email?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MiscRequestSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
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

export const miscellaneousRequestService = {
  async getAll(params?: {
    status?: string;
    priority?: string;
    requestType?: string;
    type?: string;
    department?: string;
    dept?: string;
    employee?: string;
    name?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MiscRequestItem[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && !String(v).startsWith('All')) {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    const list = Array.isArray(data) ? data : (data as any)?.requests || (data as any)?.data || [];
    return list.map((item: any) => ({
      ...item,
      id: item.id || item._id || item.requestId || '',
      requestId: item.requestId || item.id || '',
      name: item.name || item.employee || '',
      employee: item.employee || item.name || '',
      dept: item.dept || item.department || '',
      department: item.department || item.dept || '',
      type: item.type || item.requestType || '',
      requestType: item.requestType || item.type || '',
    }));
  },

  async getById(id: string): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`);
    return {
      ...item,
      id: item.id || item._id || item.requestId || '',
      requestId: item.requestId || item.id || '',
      name: item.name || item.employee || '',
      employee: item.employee || item.name || '',
      dept: item.dept || item.department || '',
      department: item.department || item.dept || '',
      type: item.type || item.requestType || '',
      requestType: item.requestType || item.type || '',
    };
  },

  async getSummary(): Promise<MiscRequestSummary> {
    return await fetchJson<MiscRequestSummary>(`${BASE_URL}/summary`);
  },

  async create(data: {
    employee?: string;
    name?: string;
    department?: string;
    dept?: string;
    requestType?: string;
    type?: string;
    description: string;
    priority?: 'High' | 'Medium' | 'Low';
    status?: 'Pending' | 'Approved' | 'Rejected';
    email?: string;
    date?: string;
  }): Promise<MiscRequestItem> {
    const payload = {
      ...data,
      employee: data.employee || data.name,
      name: data.name || data.employee,
      department: data.department || data.dept,
      dept: data.dept || data.department,
      requestType: data.requestType || data.type,
      type: data.type || data.requestType,
    };
    const item = await fetchJson<any>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      ...item,
      id: item.id || item._id || item.requestId || '',
      requestId: item.requestId || item.id || '',
      name: item.name || item.employee || '',
      employee: item.employee || item.name || '',
      dept: item.dept || item.department || '',
      department: item.department || item.dept || '',
      type: item.type || item.requestType || '',
      requestType: item.requestType || item.type || '',
    };
  },

  async update(id: string, data: Partial<MiscRequestItem>): Promise<MiscRequestItem> {
    const payload = {
      ...data,
      employee: data.employee || data.name,
      name: data.name || data.employee,
      department: data.department || data.dept,
      dept: data.dept || data.department,
      requestType: data.requestType || data.type,
      type: data.type || data.requestType,
    };
    const item = await fetchJson<any>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return {
      ...item,
      id: item.id || item._id || item.requestId || '',
      requestId: item.requestId || item.id || '',
      name: item.name || item.employee || '',
      employee: item.employee || item.name || '',
      dept: item.dept || item.department || '',
      department: item.department || item.dept || '',
      type: item.type || item.requestType || '',
      requestType: item.requestType || item.type || '',
    };
  },

  async updateStatus(
    id: string,
    status: 'Pending' | 'Approved' | 'Rejected',
    comments?: string
  ): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    });
    return {
      ...item,
      id: item.id || item._id || item.requestId || '',
      requestId: item.requestId || item.id || '',
      name: item.name || item.employee || '',
      employee: item.employee || item.name || '',
      dept: item.dept || item.department || '',
      department: item.department || item.dept || '',
      type: item.type || item.requestType || '',
      requestType: item.requestType || item.type || '',
    };
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

export default miscellaneousRequestService;
