const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/support/miscellaneous`;

export interface MiscRequestAuditEntry {
  action: 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'UPDATED' | 'COMMENTED';
  previousStatus?: string;
  newStatus: string;
  changedBy: string;
  changedByRole?: string;
  timestamp: string;
  remarks?: string;
}

export interface MiscRequestItem {
  id: string;
  _id?: string;
  requestId: string;
  employeeId?: string;
  employee: string;
  name: string;
  department: string;
  dept: string;
  title?: string;
  requestType: string;
  type: string;
  description: string;
  date: string;
  requiredDate?: string;
  attachments?: string[];
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Processed';
  createdBy?: string;
  email?: string;
  comments?: string;
  reviewerId?: string;
  reviewerName?: string;
  approvalRemarks?: string;
  rejectionReason?: string;
  processedAt?: string;
  processedBy?: string;
  auditHistory?: MiscRequestAuditEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MiscRequestSummary {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  processed: number;
}

export interface MiscRequestQueryParams {
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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.id || user._id) {
        headers['x-user-id'] = user.id || user._id;
      }
      if (user.role) {
        headers['x-user-role'] = user.role;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(), ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

function normalizeItem(item: any): MiscRequestItem {
  return {
    ...item,
    id: item.id || item._id || item.requestId || '',
    requestId: item.requestId || item.id || '',
    name: item.name || item.employee || 'Employee',
    employee: item.employee || item.name || 'Employee',
    dept: item.dept || item.department || 'General',
    department: item.department || item.dept || 'General',
    type: item.type || item.requestType || 'Other',
    requestType: item.requestType || item.type || 'Other',
    status: item.status || 'Pending',
    priority: item.priority || 'Medium',
    date: item.date || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    description: item.description || '',
    email: item.email || '',
    auditHistory: Array.isArray(item.auditHistory) ? item.auditHistory : [],
  };
}

export const miscellaneousRequestService = {
  async getAll(params?: MiscRequestQueryParams): Promise<MiscRequestItem[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && !String(v).startsWith('All')) {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const data = await fetchJson<any>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    const list = Array.isArray(data) ? data : (data as any)?.requests || (data as any)?.data || [];
    return list.map(normalizeItem);
  },

  async getById(id: string): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`);
    return normalizeItem(item);
  },

  async getSummary(): Promise<MiscRequestSummary> {
    try {
      const summary = await fetchJson<any>(`${BASE_URL}/summary`);
      return {
        total: Number(summary?.total || 0),
        pending: Number(summary?.pending || 0),
        inReview: Number(summary?.inReview || 0),
        approved: Number(summary?.approved || 0),
        rejected: Number(summary?.rejected || 0),
        processed: Number(summary?.processed || 0),
      };
    } catch (err) {
      console.warn('Failed to load summary counts from server, returning zeroes:', err);
      return { total: 0, pending: 0, inReview: 0, approved: 0, rejected: 0, processed: 0 };
    }
  },

  async create(data: {
    employee?: string;
    name?: string;
    employeeId?: string;
    department?: string;
    dept?: string;
    title?: string;
    requestType?: string;
    type?: string;
    description: string;
    priority?: 'High' | 'Medium' | 'Low';
    status?: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Processed';
    email?: string;
    date?: string;
    requiredDate?: string;
    attachments?: string[];
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
    return normalizeItem(item);
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
    return normalizeItem(item);
  },

  async updateStatus(
    id: string,
    status: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Processed',
    options?: {
      comments?: string;
      remarks?: string;
      rejectionReason?: string;
      approvalRemarks?: string;
      reviewerName?: string;
      reviewerId?: string;
      processedBy?: string;
    } | string
  ): Promise<MiscRequestItem> {
    const body = typeof options === 'string' ? { status, comments: options } : { status, ...options };
    const item = await fetchJson<any>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return normalizeItem(item);
  },

  async startReview(id: string, reviewerName: string = 'HR Admin', remarks?: string): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewerName, remarks }),
    });
    return normalizeItem(item);
  },

  async approve(id: string, reviewerName: string = 'HR Admin', approvalRemarks?: string): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewerName, approvalRemarks }),
    });
    return normalizeItem(item);
  },

  async reject(id: string, rejectionReason: string, reviewerName: string = 'HR Admin'): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewerName, rejectionReason }),
    });
    return normalizeItem(item);
  },

  async process(id: string, processedBy: string = 'Operations Team', remarks?: string): Promise<MiscRequestItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}/process`, {
      method: 'PATCH',
      body: JSON.stringify({ processedBy, remarks }),
    });
    return normalizeItem(item);
  },

  async getHistory(id: string): Promise<MiscRequestAuditEntry[]> {
    return await fetchJson<MiscRequestAuditEntry[]>(`${BASE_URL}/${id}/history`);
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

export default miscellaneousRequestService;
