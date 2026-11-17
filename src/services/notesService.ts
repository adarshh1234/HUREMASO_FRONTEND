const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/notes`;

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order?: number;
}

export interface NoteItem {
  id: string;
  _id?: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  date: string;
  pinned: boolean;
  tags?: string[];
  aiSummary?: string;
  checklistItems?: ChecklistItem[];

  // Interview Notes metadata
  candidateName?: string;
  candidateId?: string;
  interviewId?: string;
  vacancyName?: string;
  interviewerName?: string;
  interviewRound?: string;
  interviewDate?: string;
  technicalRating?: number;
  communicationRating?: number;
  strengths?: string;
  improvements?: string;

  // HR Policy / Memo metadata
  applicableScope?: string;
  policyStatus?: 'Draft' | 'Active' | 'Archived';
  memoSubject?: string;
  visibility?: 'public' | 'internal' | 'restricted';
  authorName?: string;
  authorId?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryCounts {
  all: number;
  hrPolicy: number;
  interviewNotes: number;
  checklists: number;
  memos: number;
  pinned: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
  const userId = localStorage.getItem('userId') || 'user-admin';
  const userRole = localStorage.getItem('userRole') || 'hr-admin';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': userRole,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export const notesService = {
  async getNotes(params?: {
    category?: string;
    search?: string;
    tag?: string;
    pinned?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<NoteItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.tag && params.tag.trim()) query.set('tag', params.tag.trim());
    if (params?.pinned !== undefined) query.set('pinned', String(params.pinned));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const qs = query.toString();
    const data = await fetchJson<NoteItem[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) {
      return data.map((note) => ({
        ...note,
        id: (note._id || note.id || '').toString(),
      }));
    }
    return [];
  },

  async getNoteById(id: string): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}`);
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async createNote(note: Partial<NoteItem>): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(note),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async updateNote(id: string, note: Partial<NoteItem>): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async togglePin(id: string, pinned?: boolean): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}/pin`, {
      method: 'PATCH',
      body: JSON.stringify(pinned !== undefined ? { pinned } : {}),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async updateChecklist(id: string, checklistItems: ChecklistItem[]): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}/checklist`, {
      method: 'PATCH',
      body: JSON.stringify({ checklistItems }),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async toggleChecklistItem(id: string, itemId: string, completed?: boolean): Promise<NoteItem> {
    const data = await fetchJson<NoteItem>(`${BASE_URL}/${id}/checklist/${itemId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify(completed !== undefined ? { completed } : {}),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async deleteNote(id: string): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  async aiSummarize(id: string): Promise<{ summary: string; note: NoteItem }> {
    return await fetchJson<{ summary: string; note: NoteItem }>(`${BASE_URL}/${id}/ai-summarize`, {
      method: 'POST',
    });
  },

  async getCategoryCounts(): Promise<CategoryCounts> {
    return await fetchJson<CategoryCounts>(`${BASE_URL}/categories/counts`);
  },

  async getAllTags(): Promise<string[]> {
    return await fetchJson<string[]>(`${BASE_URL}/tags/all`);
  },
};
