import {
  ICompanyEvent,
  ISupportEvent,
  IEventsNewsletter,
  IEventsBudgetItem,
  EventQueryParams,
  EventsSummaryStats,
} from '../types/events';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/events`;

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

export const eventService = {
  // Main Events CRUD
  async getEvents(params?: EventQueryParams): Promise<{ items: (ICompanyEvent & { id: string })[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status && params.status !== 'All') qs.set('status', params.status);
    if (params?.eventType && params.eventType !== 'All') qs.set('eventType', params.eventType);
    if (params?.department && params.department !== 'All') qs.set('department', params.department);

    const res = await fetch(`${BASE}?${qs.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch events`);
    const json = await res.json();
    return {
      items: (json.data || []).map(mapItem),
      total: json.pagination?.total ?? json.total ?? (json.data || []).length,
    };
  },

  async getEventById(id: string): Promise<ICompanyEvent & { id: string }> {
    const item = await fetchJson<ICompanyEvent>(`${BASE}/${id}`);
    return mapItem(item);
  },

  async createEvent(eventData: Partial<ICompanyEvent>): Promise<ICompanyEvent & { id: string }> {
    const item = await fetchJson<ICompanyEvent>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    return mapItem(item);
  },

  async updateEvent(id: string, updates: Partial<ICompanyEvent>): Promise<ICompanyEvent & { id: string }> {
    const item = await fetchJson<ICompanyEvent>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return mapItem(item);
  },

  async deleteEvent(id: string): Promise<boolean> {
    await fetchJson(`${BASE}/${id}`, { method: 'DELETE' });
    return true;
  },

  // Support Events
  async getSupportEvents(): Promise<(ISupportEvent & { id: string })[]> {
    const items = await fetchJson<ISupportEvent[]>(`${BASE}/support`);
    return (items || []).map(mapItem);
  },

  async createSupportEvent(payload: Partial<ISupportEvent>): Promise<ISupportEvent & { id: string }> {
    const item = await fetchJson<ISupportEvent>(`${BASE}/support`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateSupportEvent(
    id: string,
    payload: Partial<ISupportEvent> & { reply?: { author: string; text: string } }
  ): Promise<ISupportEvent & { id: string }> {
    const item = await fetchJson<ISupportEvent>(`${BASE}/support/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async deleteSupportEvent(id: string): Promise<void> {
    await fetchJson(`${BASE}/support/${id}`, { method: 'DELETE' });
  },

  // Newsletters
  async getNewsletters(): Promise<(IEventsNewsletter & { id: string })[]> {
    const items = await fetchJson<IEventsNewsletter[]>(`${BASE}/newsletters`);
    return (items || []).map(mapItem);
  },

  async createNewsletter(payload: Partial<IEventsNewsletter>): Promise<IEventsNewsletter & { id: string }> {
    const item = await fetchJson<IEventsNewsletter>(`${BASE}/newsletters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateNewsletter(id: string, payload: Partial<IEventsNewsletter>): Promise<IEventsNewsletter & { id: string }> {
    const item = await fetchJson<IEventsNewsletter>(`${BASE}/newsletters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async deleteNewsletter(id: string): Promise<void> {
    await fetchJson(`${BASE}/newsletters/${id}`, { method: 'DELETE' });
  },

  // Budgets
  async getBudgets(): Promise<(IEventsBudgetItem & { id: string })[]> {
    const items = await fetchJson<IEventsBudgetItem[]>(`${BASE}/budgets`);
    return (items || []).map(mapItem);
  },

  async createBudget(payload: Partial<IEventsBudgetItem>): Promise<IEventsBudgetItem & { id: string }> {
    const item = await fetchJson<IEventsBudgetItem>(`${BASE}/budgets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async updateBudget(id: string, payload: Partial<IEventsBudgetItem>): Promise<IEventsBudgetItem & { id: string }> {
    const item = await fetchJson<IEventsBudgetItem>(`${BASE}/budgets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapItem(item);
  },

  async deleteBudget(id: string): Promise<void> {
    await fetchJson(`${BASE}/budgets/${id}`, { method: 'DELETE' });
  },

  // Stats
  async getSummaryStats(): Promise<EventsSummaryStats> {
    return fetchJson<EventsSummaryStats>(`${BASE}/stats/summary`);
  },
};

export default eventService;
