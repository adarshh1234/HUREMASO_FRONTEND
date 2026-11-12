const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/employee-documents`;

export interface EmployeeDocItem {
  id: string;
  _id?: string;
  employeeId?: string;
  title: string;
  category: string;
  folder: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedBy?: string;
  status: 'Active' | 'Archived' | 'Pending' | 'Expired';
  tags?: string[];
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FolderSummary {
  folder: string;
  count: number;
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

export const employeeDocumentService = {
  async getAll(params?: {
    employeeId?: string;
    folder?: string;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<EmployeeDocItem[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') {
          searchParams.append(k, String(v));
        }
      });
    }
    const qs = searchParams.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    const list = Array.isArray(data) ? data : [];
    return list.map((item: any) => ({
      ...item,
      id: item.id || item._id || '',
    }));
  },

  async getFolders(): Promise<FolderSummary[]> {
    const data = await fetchJson<any[]>(`${BASE_URL}/folders`);
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<EmployeeDocItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`);
    return { ...item, id: item.id || item._id || '' };
  },

  async create(data: {
    employeeId?: string;
    title: string;
    category?: string;
    folder?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
    status?: string;
    tags?: string[];
    expiryDate?: string;
  }): Promise<EmployeeDocItem> {
    const item = await fetchJson<any>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        folder: data.folder || 'Personal Information',
        fileUrl: data.fileUrl || '/docs/sample.pdf',
      }),
    });
    return { ...item, id: item.id || item._id || '' };
  },

  async update(id: string, data: Partial<EmployeeDocItem>): Promise<EmployeeDocItem> {
    const item = await fetchJson<any>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

export default employeeDocumentService;
