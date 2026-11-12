const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/notes`;

export interface NoteItem {
  id: string | number;
  _id?: string;
  title: string;
  category: string;
  content: string;
  date: string;
  pinned: boolean;
  tags?: string[];
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

export const notesService = {
  async getNotes(params?: { category?: string; search?: string; pinned?: boolean }): Promise<NoteItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.pinned !== undefined) query.set('pinned', String(params.pinned));

      const qs = query.toString();
      const data = await fetchJson<NoteItem[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return data.map((note) => ({
          ...note,
          id: note._id || note.id,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch notes from API, falling back to local defaults', err);
    }
    return [
      {
        id: 1,
        title: 'Q3 Onboarding SLA & Compliance Checklist',
        category: 'Checklists',
        content: 'Ensure all background checks from First Advantage are verified before day 1. Hardware laptops must be shipped 3 days prior.',
        date: 'Sept 01, 2026',
        pinned: true,
      },
      {
        id: 2,
        title: 'Senior Frontend Engineer Interview Evaluation Notes',
        category: 'Interview Notes',
        content: 'Candidate demonstrated deep understanding of React 19 concurrent features, micro-frontend architecture, and Web Vitals optimization.',
        date: 'Aug 29, 2026',
        pinned: true,
      },
      {
        id: 3,
        title: 'Updated UAE Labor Law Gratuity Calculations 2026',
        category: 'HR Policy',
        content: 'Gratuity calculation based on 21 days basic salary for years 1-5, 30 days basic salary for 5+ years. Maximum cap set at 2 years salary.',
        date: 'Aug 25, 2026',
        pinned: false,
      },
      {
        id: 4,
        title: 'Remote Work Security & YubiKey Mandatory Policy',
        category: 'Memos',
        content: 'All remote employees must activate hardware 2FA key tokens for AWS and GitHub access by mid-month.',
        date: 'Aug 20, 2026',
        pinned: false,
      },
    ];
  },

  async createNote(note: Omit<NoteItem, 'id' | '_id'>): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(note),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async updateNote(id: string | number, note: Partial<NoteItem>): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async togglePin(id: string | number): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}/pin`, {
      method: 'PATCH',
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async deleteNote(id: string | number): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  async aiSummarize(id: string | number): Promise<{ summary: string; note: NoteItem }> {
    return await fetchJson<{ summary: string; note: NoteItem }>(`${BASE_URL}/${id}/ai-summarize`, {
      method: 'POST',
    });
  },
};
