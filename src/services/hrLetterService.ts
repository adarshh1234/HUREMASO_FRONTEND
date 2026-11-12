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
  employeeId: string;
  templateId?: string;
  letterType: string;
  subject: string;
  content: string;
  issuedDate: string;
  issuedBy?: string;
  status: 'Draft' | 'Issued' | 'Signed' | 'Revoked';
  documentUrl?: string;
  createdAt?: string;
}

export interface CommunicationItem {
  id: string;
  _id?: string;
  title: string;
  type: 'memo' | 'notice' | 'circular' | 'letter';
  content: string;
  targetAudience?: string;
  department?: string;
  author?: string;
  issuedDate?: string;
  status: 'Draft' | 'Published' | 'Archived';
  attachments?: string[];
  createdAt?: string;
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

export const hrLetterService = {
  // --- Templates ---
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

  // --- Issued Letter Records ---
  async getRecords(params?: { employeeId?: string; status?: string }): Promise<IssuedLetterItem[]> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/records${qs ? `?${qs}` : ''}`);
    return (data || []).map((r) => ({ ...r, id: r.id || r._id || '' }));
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

  async createRecord(record: Partial<IssuedLetterItem>): Promise<IssuedLetterItem> {
    const data = await fetchJson<any>(`${BASE_URL}/records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteRecord(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/records/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Communications (Memos, Notices, Circulars) ---
  async getCommunications(params?: { type?: string; status?: string }): Promise<CommunicationItem[]> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/communications${qs ? `?${qs}` : ''}`);
    return (data || []).map((c) => ({ ...c, id: c.id || c._id || '' }));
  },

  async createCommunication(item: {
    title: string;
    type: 'memo' | 'notice' | 'circular' | 'letter';
    content: string;
    targetAudience?: string;
    department?: string;
    author?: string;
    status?: 'Draft' | 'Published' | 'Archived';
  }): Promise<CommunicationItem> {
    const data = await fetchJson<any>(`${BASE_URL}/communications`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteCommunication(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/communications/${id}`, {
      method: 'DELETE',
    });
  },
};

export default hrLetterService;
