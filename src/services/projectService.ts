const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/projects`;

export interface CustomerItem {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  isDeleted?: boolean;
}

export interface ProjectItem {
  id: string;
  _id?: string;
  name: string;
  customerId?: string;
  customerName?: string;
  projectAdmins?: string[];
  description?: string;
  status?: string;
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

export const projectService = {
  // --- Customers ---
  async getCustomers(): Promise<CustomerItem[]> {
    const data = await fetchJson<any[]>(`${BASE_URL}/customers`);
    return (data || []).map((c) => ({
      id: c.id || c._id || '',
      name: c.name,
      description: c.description || '-',
    }));
  },

  async createCustomer(data: { name: string; description?: string }): Promise<CustomerItem> {
    const res = await fetchJson<any>(`${BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { id: res.id || res._id || '', name: res.name, description: res.description };
  },

  async updateCustomer(id: string, data: { name: string; description?: string }): Promise<CustomerItem> {
    const res = await fetchJson<any>(`${BASE_URL}/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { id: res.id || res._id || '', name: res.name, description: res.description };
  },

  async deleteCustomer(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Projects ---
  async getProjects(params?: { customerName?: string; name?: string; search?: string }): Promise<ProjectItem[]> {
    const query = new URLSearchParams();
    if (params?.customerName) query.append('customerName', params.customerName);
    if (params?.name) query.append('name', params.name);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    return (data || []).map((p) => ({
      id: p.id || p._id || '',
      name: p.name,
      customerId: p.customerId,
      customerName: p.customerName || (p.customerId as any)?.name || 'Acme Corp',
      projectAdmins: p.projectAdmins || [],
      description: p.description,
      status: p.status,
    }));
  },

  async createProject(data: {
    name: string;
    customerName?: string;
    customerId?: string;
    projectAdmins?: string[];
    description?: string;
  }): Promise<ProjectItem> {
    const res = await fetchJson<any>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      id: res.id || res._id || '',
      name: res.name,
      customerId: res.customerId,
      customerName: res.customerName,
      projectAdmins: res.projectAdmins || [],
      description: res.description,
      status: res.status,
    };
  },

  async updateProject(id: string, data: Partial<ProjectItem>): Promise<ProjectItem> {
    const res = await fetchJson<any>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return {
      id: res.id || res._id || '',
      name: res.name,
      customerName: res.customerName,
      projectAdmins: res.projectAdmins || [],
      description: res.description,
      status: res.status,
    };
  },

  async deleteProject(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};

export default projectService;
