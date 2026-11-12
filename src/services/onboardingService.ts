import {
  OnboardingCandidate,
  CreateCandidatePayload,
  OnboardingReportSummary,
  VerificationCheckStatus,
} from '../types/onboarding';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/onboarding`;

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

function mapItem<T extends { _id?: string; id?: string }>(item: T): T & { id: string } {
  return {
    ...item,
    id: (item._id || item.id || '') as string,
  };
}

export const onboardingService = {
  async getCandidates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
  }): Promise<{ items: OnboardingCandidate[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);

    const res = await fetch(`${BASE}/candidates?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch onboarding candidates`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getCandidateById(id: string): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}`);
    return mapItem(item);
  },

  async createCandidate(payload: CreateCandidatePayload): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateCandidate(id: string, payload: Partial<OnboardingCandidate>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateVerification(
    id: string,
    checkType: 'legal' | 'pcc' | 'immigration' | 'biometrics' | 'credentials' | 'digital' | 'postHire',
    status: VerificationCheckStatus,
    notes?: string,
    verifiedBy?: string
  ): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/background-verification`, {
      method: 'PATCH',
      body: JSON.stringify({ checkType, status, notes, verifiedBy }),
    });
    return mapItem(item);
  },

  async updateOffer(id: string, offerData: Partial<OnboardingCandidate['offer']>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/offer`, {
      method: 'PATCH',
      body: JSON.stringify(offerData),
    });
    return mapItem(item);
  },

  async updateDocument(
    id: string,
    docType: 'contract' | 'nda',
    status: 'Pending' | 'Drafted' | 'Signed',
    signedDate?: string,
    docUrl?: string
  ): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/document`, {
      method: 'PATCH',
      body: JSON.stringify({ docType, status, signedDate, docUrl }),
    });
    return mapItem(item);
  },

  async updateProvisions(id: string, provisions: Partial<OnboardingCandidate['provisions']>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/provisions`, {
      method: 'PATCH',
      body: JSON.stringify(provisions),
    });
    return mapItem(item);
  },

  async updateBuddyManager(id: string, buddyManager: Partial<OnboardingCandidate['buddyManager']>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/buddy-manager`, {
      method: 'PATCH',
      body: JSON.stringify(buddyManager),
    });
    return mapItem(item);
  },

  async updateTraining(id: string, modules: OnboardingCandidate['training']): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/training`, {
      method: 'PATCH',
      body: JSON.stringify({ modules }),
    });
    return mapItem(item);
  },

  async updateVisa(id: string, visa: Partial<OnboardingCandidate['visa']>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/visa`, {
      method: 'PATCH',
      body: JSON.stringify(visa),
    });
    return mapItem(item);
  },

  async updateInsurance(id: string, insurance: Partial<OnboardingCandidate['insurance']>): Promise<OnboardingCandidate> {
    const item = await fetchJson<OnboardingCandidate>(`${BASE}/candidates/${id}/insurance`, {
      method: 'PATCH',
      body: JSON.stringify(insurance),
    });
    return mapItem(item);
  },

  async deleteCandidate(id: string): Promise<void> {
    await fetchJson(`${BASE}/candidates/${id}`, { method: 'DELETE' });
  },

  async getReportsSummary(): Promise<OnboardingReportSummary> {
    return fetchJson<OnboardingReportSummary>(`${BASE}/reports`);
  },
};

export default onboardingService;
