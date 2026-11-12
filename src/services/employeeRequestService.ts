const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/employee-requests`;

export interface EmployeeRequestItem {
  id: string;
  _id?: string;
  employeeId: string;
  requestType: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  submittedDate?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Populated fields if any
  employee?: {
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    jobInformation?: {
      department?: string;
      jobTitle?: string;
    };
  };
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

export const employeeRequestService = {
  async getAll(params?: {
    employeeId?: string;
    department?: string;
    status?: string;
    requestType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<EmployeeRequestItem[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'All') {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    const list = Array.isArray(data) ? data : (data as any).data || [];
    return list.map((item: any) => ({
      ...item,
      id: item.id || item._id || '',
    }));
  },

  async getById(id: string): Promise<EmployeeRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`);
    return { ...item, id: item.id || item._id || '' };
  },

  async create(data: {
    employeeId: string;
    requestType: string;
    title: string;
    description?: string;
    amount?: number;
    currency?: string;
    attachments?: string[];
  }): Promise<EmployeeRequestItem> {
    const item = await fetchJson<any>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...item, id: item.id || item._id || '' };
  },

  async update(id: string, data: Partial<EmployeeRequestItem>): Promise<EmployeeRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...item, id: item.id || item._id || '' };
  },

  async updateStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled', comments?: string): Promise<EmployeeRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    });
    return { ...item, id: item.id || item._id || '' };
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  async getSummaryStats(): Promise<any> {
    return fetchJson(`${BASE_URL}/stats/summary`);
  },
};

export default employeeRequestService;
