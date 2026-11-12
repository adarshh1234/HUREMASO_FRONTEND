const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/calendar`;

export interface CalendarEvent {
  id?: number | string;
  _id?: string;
  title: string;
  date: string;
  time?: string;
  type?: 'Meeting' | 'Interview' | 'Holiday' | 'Deadline' | 'HR Admin' | string;
  location?: string;
  attendees?: number;
  description?: string;
  reminder?: boolean;
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

export const calendarService = {
  async getEvents(params?: { month?: string; year?: string | number; type?: string; search?: string }): Promise<CalendarEvent[]> {
    try {
      const query = new URLSearchParams();
      if (params?.month) query.set('month', params.month);
      if (params?.year) query.set('year', String(params.year));
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.search) query.set('search', params.search);

      const qs = query.toString();
      const data = await fetchJson<CalendarEvent[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return data.map((evt) => ({
          ...evt,
          id: evt._id || evt.id,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch events from API, falling back to local defaults', err);
    }
    return [
      { id: 1, title: 'Company Wide All-Hands Sync', date: 'Sept 04, 2026', time: '10:00 AM - 11:30 AM', type: 'Meeting', location: 'Main Auditorium & Zoom', attendees: 145 },
      { id: 2, title: 'Candidate Interview - Aisha Kumar', date: 'Sept 08, 2026', time: '02:00 PM - 03:00 PM', type: 'Interview', location: 'Google Meet', attendees: 4 },
      { id: 3, title: 'Q3 Performance Review Deadline', date: 'Sept 15, 2026', time: 'All Day', type: 'Deadline', location: 'HR Portal', attendees: 350 },
      { id: 4, title: 'Labor Day Public Holiday', date: 'Sept 21, 2026', time: 'Full Day Off', type: 'Holiday', location: 'Company Wide', attendees: 500 },
      { id: 5, title: 'Off-Boarding F&F Sign-off Session', date: 'Sept 28, 2026', time: '04:00 PM - 05:00 PM', type: 'HR Admin', location: 'HR Suite 3B', attendees: 3 },
    ];
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | '_id'>): Promise<CalendarEvent> {
    const data = await fetchJson<CalendarEvent>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async updateEvent(id: string | number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const data = await fetchJson<CalendarEvent>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async deleteEvent(id: string | number): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
