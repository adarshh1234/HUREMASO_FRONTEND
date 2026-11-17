const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/hr-letters`;

export interface LetterTemplateItem {
  id: string;
  _id?: string;
  name: string;
  category: 'Offer' | 'Confirmation' | 'Relieving' | 'Experience' | 'Warning' | 'Promotion' | 'General';
  subject: string;
  body: string;
  variables?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssuedLetterItem {
  id: string;
  _id?: string;
  referenceNumber?: string;
  employeeId: string;
  employeeName?: string;
  designation?: string;
  department?: string;
  templateId?: string;
  letterType: string;
  subject: string;
  content: string;
  issuedDate: string;
  effectiveDate?: string;
  issuedBy?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Issued' | 'Signed' | 'Revoked' | 'Published';
  documentUrl?: string;
  createdAt?: string;
}

export interface CommunicationItem {
  id: string;
  _id?: string;
  referenceNumber?: string;
  title: string;
  subject?: string;
  type: 'memo' | 'notice' | 'circular' | 'letter';
  content: string;
  targetAudience?: string;
  recipient?: string;
  recipientName?: string;
  department?: string;
  dept?: string;
  author?: string;
  createdBy?: string;
  issuedDate?: string;
  date?: string;
  effectiveDate?: string;
  expiryDate?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status:
    | 'Draft'
    | 'Pending Approval'
    | 'Approved'
    | 'Published'
    | 'Active'
    | 'Completed'
    | 'Archived'
    | 'Issued'
    | 'Signed'
    | 'Revoked';
  attachments?: string[];
  createdAt?: string;
}

export interface HRLetterStats {
  total: number;
  memos: number;
  notices: number;
  circulars: number;
  letters: number;
  drafts: number;
  published: number;
  archived: number;
}

export interface EmployeePickerItem {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  jobTitle: string;
  email?: string;
}

export interface AIDraftRequest {
  category: 'memo' | 'notice' | 'circular' | 'letter';
  subject: string;
  instructions?: string;
  department?: string;
  targetAudience?: string;
  employeeId?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface AIDraftResponse {
  category: string;
  title: string;
  subject: string;
  content: string;
  department?: string;
  targetAudience?: string;
  priority?: string;
  suggestedReferenceNumber: string;
  model: string;
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

export const hrLetterService = {
  // ==========================================
  // METRICS & STATS
  // ==========================================
  async getStats(): Promise<HRLetterStats> {
    return await fetchJson<HRLetterStats>(`${BASE_URL}/stats`);
  },

  // ==========================================
  // TEMPLATES
  // ==========================================
  async getTemplates(category?: string): Promise<LetterTemplateItem[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const data = await fetchJson<any[]>(`${BASE_URL}/templates${query}`);
    return (data || []).map((t) => ({ ...t, id: t.id || t._id || '' }));
  },

  async getTemplateById(id: string): Promise<LetterTemplateItem> {
    const data = await fetchJson<any>(`${BASE_URL}/templates/${id}`);
    return { ...data, id: data.id || data._id || '' };
  },

  async createTemplate(template: Omit<LetterTemplateItem, 'id'>): Promise<LetterTemplateItem> {
    const data = await fetchJson<any>(`${BASE_URL}/templates`, {
      method: 'POST',
      body: JSON.stringify(template),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async updateTemplate(id: string, template: Partial<LetterTemplateItem>): Promise<LetterTemplateItem> {
    const data = await fetchJson<any>(`${BASE_URL}/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteTemplate(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/templates/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // COMMUNICATIONS (MEMOS, NOTICES, CIRCULARS)
  // ==========================================
  async getCommunications(params?: {
    type?: string;
    status?: string;
    department?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CommunicationItem[]> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.department && params.department !== 'all') query.append('department', params.department);
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params?.search && params.search.trim() !== '') query.append('search', params.search.trim());
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/communications${qs ? `?${qs}` : ''}`);
    return (data || []).map((c) => ({
      ...c,
      id: c.id || c._id || '',
      referenceNumber: c.referenceNumber || (c.id ? `REF-${c.id.slice(-6).toUpperCase()}` : 'REF-2026'),
    }));
  },

  async getCommunicationById(id: string): Promise<CommunicationItem> {
    const data = await fetchJson<any>(`${BASE_URL}/communications/${id}`);
    return { ...data, id: data.id || data._id || '' };
  },

  async createCommunication(item: Partial<CommunicationItem>): Promise<CommunicationItem> {
    const data = await fetchJson<any>(`${BASE_URL}/communications`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async updateCommunication(id: string, item: Partial<CommunicationItem>): Promise<CommunicationItem> {
    const data = await fetchJson<any>(`${BASE_URL}/communications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async updateCommunicationStatus(
    id: string,
    status: string,
    approvedBy?: string
  ): Promise<CommunicationItem> {
    const data = await fetchJson<any>(`${BASE_URL}/communications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy }),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteCommunication(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/communications/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // ISSUED LETTERS / RECORDS
  // ==========================================
  async getRecords(params?: { employeeId?: string; status?: string; search?: string }): Promise<IssuedLetterItem[]> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search && params.search.trim() !== '') query.append('search', params.search.trim());
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/records${qs ? `?${qs}` : ''}`);
    return (data || []).map((r) => ({
      ...r,
      id: r.id || r._id || '',
      referenceNumber: r.referenceNumber || (r.id ? `LTR-${r.id.slice(-6).toUpperCase()}` : 'LTR-2026'),
    }));
  },

  async getRecordById(id: string): Promise<IssuedLetterItem> {
    const data = await fetchJson<any>(`${BASE_URL}/records/${id}`);
    return { ...data, id: data.id || data._id || '' };
  },

  async createRecord(record: Partial<IssuedLetterItem>): Promise<IssuedLetterItem> {
    const data = await fetchJson<any>(`${BASE_URL}/records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async updateRecord(id: string, record: Partial<IssuedLetterItem>): Promise<IssuedLetterItem> {
    const data = await fetchJson<any>(`${BASE_URL}/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteRecord(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/records/${id}`, {
      method: 'DELETE',
    });
  },

  async generateLetter(payload: {
    employeeId: string;
    templateId?: string;
    letterType: string;
    subject: string;
    replacements?: Record<string, string>;
  }): Promise<IssuedLetterItem> {
    const data = await fetchJson<any>(`${BASE_URL}/records/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  // ==========================================
  // AI-ASSISTED DOCUMENT DRAFTING
  // ==========================================
  async generateAIDraft(payload: AIDraftRequest): Promise<AIDraftResponse> {
    return await fetchJson<AIDraftResponse>(`${BASE_URL}/ai/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ==========================================
  // PDF DOWNLOAD ENGINE (GENUINE BINARY PDF)
  // ==========================================
  async downloadCommunicationPDF(id: string, filename?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/communications/${id}/pdf`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const safeFilename = filename || `HUREMASO_DOCUMENT_${id}.pdf`;
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async downloadIssuedLetterPDF(id: string, filename?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/records/${id}/pdf`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to download PDF (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const safeFilename = filename || `HUREMASO_LETTER_${id}.pdf`;
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  async downloadDynamicPDF(payload: any, filename?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate dynamic PDF (${res.status} ${res.statusText})`);
    }

    const blob = await res.blob();
    const safeFilename = filename || 'HUREMASO_PREVIEW.pdf';
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // ==========================================
  // EMPLOYEE DIRECTORY LOOKUP (FOR HR LETTERS)
  // ==========================================
  async getEmployees(): Promise<EmployeePickerItem[]> {
    try {
      const res = await fetch(`${VITE_API_URL}/employees`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      const list = json.data || json || [];
      return list.map((emp: any) => ({
        id: emp.id || emp._id,
        employeeId: emp.employeeId || emp.empId || emp.id || 'EMP',
        name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        department: emp.department || 'General',
        jobTitle: emp.jobTitle || emp.designation || 'Staff',
        email: emp.email,
      }));
    } catch {
      return [
        {
          id: 'EMP2024001',
          employeeId: 'EMP2024001',
          name: 'Sarah Johnson',
          department: 'Software Engineering',
          jobTitle: 'Senior Full Stack Engineer',
        },
      ];
    }
  },
};

export default hrLetterService;
