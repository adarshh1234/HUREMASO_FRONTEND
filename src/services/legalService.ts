const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/legal`;

export interface LegalContractItem {
  id: string;
  _id?: string;
  employeeId?: string;
  contractType: string;
  title: string;
  status: 'Draft' | 'Active' | 'Under Review' | 'Expired' | 'Terminated';
  effectiveDate: string;
  expiryDate?: string;
  clauses?: Array<{ clauseTitle: string; content: string; riskLevel: string }>;
  riskScore?: number;
  complianceFlags?: string[];
  documentUrl?: string;
  createdAt?: string;
}

export interface LegalOverview {
  complianceScore: number;
  complianceStatus: string;
  flaggedClausesCount: number;
  totalAuditedContracts: number;
  recentAudits: LegalContractItem[];
}

export interface LegalQueryResponse {
  answer: string;
  category: string;
  riskAssessment: string;
  recommendations: string[];
  referencedClauses?: string[];
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

export const legalService = {
  async getOverview(): Promise<LegalOverview> {
    return fetchJson<LegalOverview>(`${BASE_URL}/overview`);
  },

  async queryAi(query: string, context?: any): Promise<LegalQueryResponse> {
    return fetchJson<LegalQueryResponse>(`${BASE_URL}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  },

  async checkCompliance(contractType?: string): Promise<any> {
    const qs = contractType ? `?contractType=${encodeURIComponent(contractType)}` : '';
    return fetchJson(`${BASE_URL}/compliance-check${qs}`);
  },

  async getContracts(status?: string): Promise<LegalContractItem[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const data = await fetchJson<any[]>(`${BASE_URL}/contracts${qs}`);
    return (data || []).map((c) => ({ ...c, id: c.id || c._id || '' }));
  },

  async createContract(contract: Partial<LegalContractItem>): Promise<LegalContractItem> {
    const data = await fetchJson<any>(`${BASE_URL}/contracts`, {
      method: 'POST',
      body: JSON.stringify(contract),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async updateContract(id: string, contract: Partial<LegalContractItem>): Promise<LegalContractItem> {
    const data = await fetchJson<any>(`${BASE_URL}/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contract),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  async deleteContract(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/contracts/${id}`, {
      method: 'DELETE',
    });
  },
};

export default legalService;
