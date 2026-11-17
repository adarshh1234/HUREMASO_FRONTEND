const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/association`;

export interface AssociationItem {
  id: string;
  _id?: string;
  associationCode?: string;
  employeeName: string;
  name?: string;
  employeeId?: string;
  requesterEmail?: string;
  requesterAvatar?: string;
  department?: string;
  targetDepartment?: string;
  associatedEntity?: string;
  associationType?: string;
  requestDetails: string;
  text?: string;
  status: 'Pending' | 'Approved' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Active' | 'Inactive';
  dateRequested: string;
  date?: string;
  effectiveDate?: string;
  expiryDate?: string;
  durationMonths?: number;
  attachments?: string[];
  notes?: string;
  isExisting?: boolean;
  approvalDetails?: {
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    notes?: string;
  };
  history?: Array<{
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details?: string;
  }>;
}

export interface AssociationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateAssociationData {
  employeeName: string;
  employeeId?: string;
  requesterEmail?: string;
  requesterAvatar?: string;
  department?: string;
  targetDepartment?: string;
  associatedEntity?: string;
  associationType?: string;
  requestDetails: string;
  dateRequested?: string;
  effectiveDate?: string;
  expiryDate?: string;
  durationMonths?: number;
  attachments?: string[];
  notes?: string;
}

export interface UpdateAssociationData {
  employeeName?: string;
  employeeId?: string;
  requesterEmail?: string;
  requesterAvatar?: string;
  department?: string;
  targetDepartment?: string;
  associatedEntity?: string;
  associationType?: string;
  requestDetails?: string;
  dateRequested?: string;
  effectiveDate?: string;
  expiryDate?: string;
  durationMonths?: number;
  attachments?: string[];
  notes?: string;
  performedBy?: string;
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
      if (user.name) {
        headers['x-user-name'] = user.name;
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
  return json;
}

function normalizeAssociation(item: any): AssociationItem {
  return {
    ...item,
    id: item._id || item.id || item.associationCode,
    name: item.employeeName || item.name || 'Anonymous Employee',
    employeeName: item.employeeName || item.name || 'Anonymous Employee',
    text: item.requestDetails || item.text || '',
    requestDetails: item.requestDetails || item.text || '',
    date: item.dateRequested || item.date || '',
    dateRequested: item.dateRequested || item.date || '',
    department: item.department || 'General',
    targetDepartment: item.targetDepartment || 'Marketing Department',
    associatedEntity: item.associatedEntity || 'Huremaso Global Tech',
    associationType: item.associationType || 'Project Collaboration',
    status: item.status || 'Pending',
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    history: Array.isArray(item.history) ? item.history : [],
  };
}

export const associationService = {
  // 1. New Association Requests (Listing)
  async getNewRequests(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    associationType?: string;
  }): Promise<{ requests: AssociationItem[]; pagination: AssociationPagination }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && !String(v).startsWith('All')) {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const res = await fetchJson<any>(`${BASE_URL}/requests${qs ? `?${qs}` : ''}`);
    const rawList = res.data || [];
    const requests = rawList.map(normalizeAssociation);
    return {
      requests,
      pagination: res.pagination || { page: 1, limit: 10, total: requests.length, totalPages: 1 },
    };
  },

  // 2. Request Creation
  async createRequest(data: CreateAssociationData): Promise<AssociationItem> {
    const payload = {
      ...data,
      employeeName: data.employeeName,
      name: data.employeeName,
      requestDetails: data.requestDetails,
      text: data.requestDetails,
    };
    const res = await fetchJson<any>(`${BASE_URL}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeAssociation(res.data || res);
  },

  // 3. Request Details
  async getRequestById(id: string): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}`);
    return normalizeAssociation(res.data || res);
  },

  // 4. Update Request
  async updateRequest(id: string, data: UpdateAssociationData): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeAssociation(res.data || res);
  },

  // 5. Accept / Approve Request (Transitions to Active / Existing)
  async acceptRequest(id: string, performedBy = 'System Admin', notes?: string): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ performedBy, notes }),
    });
    return normalizeAssociation(res.data || res);
  },

  // 6. Reject / Cancel Request (Permanently updates status to Rejected)
  async rejectRequest(id: string, rejectionReason?: string, performedBy = 'System Admin'): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({
        performedBy,
        rejectionReason: rejectionReason || 'Request cancelled by administrator',
      }),
    });
    return normalizeAssociation(res.data || res);
  },

  // 7. Existing Associations (Listing)
  async getExisting(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    associationType?: string;
  }): Promise<{ associations: AssociationItem[]; pagination: AssociationPagination }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && !String(v).startsWith('All')) {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const res = await fetchJson<any>(`${BASE_URL}/existing${qs ? `?${qs}` : ''}`);
    const rawList = res.data || [];
    const associations = rawList.map(normalizeAssociation);
    return {
      associations,
      pagination: res.pagination || { page: 1, limit: 10, total: associations.length, totalPages: 1 },
    };
  },

  // 8. Existing Association Details
  async getExistingById(id: string): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/existing/${id}`);
    return normalizeAssociation(res.data || res);
  },

  // 9. Update Existing Association
  async updateExisting(id: string, data: UpdateAssociationData): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/existing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeAssociation(res.data || res);
  },

  // 10. Renew / Extend Existing Association
  async renewExisting(
    id: string,
    durationMonths = 6,
    expiryDate?: string,
    notes?: string,
    performedBy = 'System Admin'
  ): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/existing/${id}/renew`, {
      method: 'PATCH',
      body: JSON.stringify({ durationMonths, expiryDate, notes, performedBy }),
    });
    return normalizeAssociation(res.data || res);
  },

  // 11. Cancel / Deactivate Existing Association (Permanently updates status to Inactive)
  async cancelExisting(id: string, reason?: string, performedBy = 'System Admin'): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/existing/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ performedBy, reason: reason || 'Existing association cancelled' }),
    });
    return normalizeAssociation(res.data || res);
  },

  // 12. Delete Association Record
  async deleteAssociation(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // 13. Overview Statistics
  async getOverview(): Promise<any> {
    const res = await fetchJson<any>(`${BASE_URL}/overview`);
    return res.data || res;
  },
};

export default associationService;
