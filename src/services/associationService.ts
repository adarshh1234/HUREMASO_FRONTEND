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
  notes?: string;
  isExisting?: boolean;
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
  return json;
}

export const associationService = {
  // 1. New Association Requests
  async getNewRequests(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<{ requests: AssociationItem[]; pagination: AssociationPagination }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const res = await fetchJson<any>(`${BASE_URL}/requests${qs ? `?${qs}` : ''}`);
    const rawList = res.data || [];
    const requests = rawList.map((item: any) => ({
      ...item,
      id: item._id || item.id,
      name: item.employeeName || item.name || 'Anonymous Employee',
      text: item.requestDetails || item.text || '',
      date: item.dateRequested || item.date || '',
    }));
    return {
      requests,
      pagination: res.pagination || { page: 1, limit: 10, total: requests.length, totalPages: 1 },
    };
  },

  // 2. Existing Associations
  async getExisting(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
  }): Promise<{ associations: AssociationItem[]; pagination: AssociationPagination }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const res = await fetchJson<any>(`${BASE_URL}/existing${qs ? `?${qs}` : ''}`);
    const rawList = res.data || [];
    const associations = rawList.map((item: any) => ({
      ...item,
      id: item._id || item.id,
      name: item.employeeName || item.name || 'Anonymous Employee',
      text: item.requestDetails || item.text || '',
      date: item.dateRequested || item.date || '',
    }));
    return {
      associations,
      pagination: res.pagination || { page: 1, limit: 10, total: associations.length, totalPages: 1 },
    };
  },

  // 3. Accept / Approve Request (Transitions to Active / Existing)
  async acceptRequest(id: string, performedBy = 'System Admin', notes?: string): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ performedBy, notes }),
    });
    const item = res.data || res;
    return {
      ...item,
      id: item._id || item.id,
      name: item.employeeName || item.name,
      text: item.requestDetails || item.text,
      date: item.dateRequested || item.date,
    };
  },

  // 4. Reject / Cancel Request (Permanently updates status to Rejected)
  async rejectRequest(id: string, rejectionReason?: string, performedBy = 'System Admin'): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ performedBy, rejectionReason: rejectionReason || 'Request cancelled by administrator' }),
    });
    const item = res.data || res;
    return {
      ...item,
      id: item._id || item.id,
      name: item.employeeName || item.name,
      text: item.requestDetails || item.text,
      date: item.dateRequested || item.date,
    };
  },

  // 5. Cancel / Deactivate Existing Association (Permanently updates status to Inactive)
  async cancelExisting(id: string, reason?: string, performedBy = 'System Admin'): Promise<AssociationItem> {
    const res = await fetchJson<any>(`${BASE_URL}/existing/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ performedBy, reason: reason || 'Existing association cancelled' }),
    });
    const item = res.data || res;
    return {
      ...item,
      id: item._id || item.id,
      name: item.employeeName || item.name,
      text: item.requestDetails || item.text,
      date: item.dateRequested || item.date,
    };
  },

  // 6. Delete Association Record
  async deleteAssociation(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // 7. Overview Statistics
  async getOverview(): Promise<any> {
    const res = await fetchJson<any>(`${BASE_URL}/overview`);
    return res.data || res;
  },
};

export default associationService;
