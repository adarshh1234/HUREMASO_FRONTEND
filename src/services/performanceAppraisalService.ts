import {
  IPerformanceAppraisalRecord,
  CreateAppraisalDTO,
  AppraisalQueryParams,
  AppraisalReportsSummary,
  IEndorsementItem,
} from '../types/performanceAppraisal';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/performance-appraisal`;

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

export const performanceAppraisalService = {
  async getRecords(params?: AppraisalQueryParams): Promise<{ items: (IPerformanceAppraisalRecord & { id: string })[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);
    if (params?.cycle && params.cycle !== 'All') qs.set('cycle', params.cycle);

    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch appraisal records`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getRecordById(id: string): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}`);
    return mapItem(item);
  },

  async createRecord(payload: CreateAppraisalDTO): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateRecord(id: string, payload: Partial<IPerformanceAppraisalRecord>): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateReportsAi(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['reportsAi']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/reports-ai`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateAttendanceTime(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['attendanceTime']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/attendance-time`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateSmartWork(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['smartWork']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/smart-work`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updatePsychometric(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['psychometric']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/psychometric`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateEsops(
    id: string,
    sops: IPerformanceAppraisalRecord['eSops']['sops']
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/e-sops`, {
      method: 'PATCH',
      body: JSON.stringify({ sops }),
    });
    return mapItem(item);
  },

  async updateReview(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['review']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async addEndorsement(
    id: string,
    payload: Omit<IEndorsementItem, 'id' | 'date'> & { date?: string }
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/endorsements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateStrategy(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['strategy']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/strategy`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateAnalyticsAi(
    id: string,
    payload: Partial<IPerformanceAppraisalRecord['analyticsAi']>
  ): Promise<IPerformanceAppraisalRecord & { id: string }> {
    const item = await fetchJson<IPerformanceAppraisalRecord>(`${BASE}/${id}/analytics-ai`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async deleteRecord(id: string): Promise<void> {
    await fetchJson(`${BASE}/${id}`, { method: 'DELETE' });
  },

  async getReportsSummary(): Promise<AppraisalReportsSummary> {
    return fetchJson<AppraisalReportsSummary>(`${BASE}/reports/summary`);
  },
};

export default performanceAppraisalService;
