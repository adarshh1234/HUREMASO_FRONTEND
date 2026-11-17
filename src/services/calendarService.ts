const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/calendar`;

export interface CalendarAttendee {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  status?: 'Accepted' | 'Declined' | 'Pending';
}

export interface CalendarEvent {
  id: string | number;
  _id?: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  type: 'Meeting' | 'Interview' | 'Holiday' | 'Deadline' | 'General' | 'HR Admin' | string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  agenda?: string;
  attendees?: number;
  attendeeList?: CalendarAttendee[];
  organizer?: string;
  organizerId?: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  department?: string;
  assigneeName?: string;
  assigneeId?: string;
  candidateName?: string;
  candidateId?: string;
  interviewerName?: string;
  jobPosition?: string;
  roundName?: string;
  interviewMode?: 'Online' | 'In-Person' | 'Telephonic';
  holidayType?: 'Public' | 'Company' | 'Regional' | 'Optional';
  applicableScope?: string;
  repeatsAnnually?: boolean;
  dueTime?: string;
  notes?: string;
  reminder?: boolean;
  source?: 'calendar' | 'recruitment' | 'leave' | 'tasks';
  externalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.id || u._id) headers['x-user-id'] = u.id || u._id;
      if (u.name || u.empName) headers['x-user-name'] = u.name || u.empName;
      if (u.role) headers['x-user-role'] = u.role;
    } catch {
      // Ignore
    }
  } else {
    headers['x-user-id'] = 'user-1';
    headers['x-user-name'] = 'Sarah Joseph';
    headers['x-user-role'] = 'Admin';
  }
  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...options?.headers },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export const calendarService = {
  async getEvents(params?: {
    month?: string;
    year?: string | number;
    type?: string;
    search?: string;
    status?: string;
    department?: string;
    priority?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<CalendarEvent[]> {
    try {
      const query = new URLSearchParams();
      if (params?.month) query.set('month', params.month);
      if (params?.year) query.set('year', String(params.year));
      if (params?.type && params.type.toLowerCase() !== 'all') query.set('type', params.type);
      if (params?.search) query.set('search', params.search);
      if (params?.status && params.status.toLowerCase() !== 'all') query.set('status', params.status);
      if (params?.department && params.department.toLowerCase() !== 'all') query.set('department', params.department);
      if (params?.priority && params.priority.toLowerCase() !== 'all') query.set('priority', params.priority);
      if (params?.fromDate) query.set('fromDate', params.fromDate);
      if (params?.toDate) query.set('toDate', params.toDate);

      const qs = query.toString();
      const data = await fetchJson<CalendarEvent[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return data.map((evt) => ({
          ...evt,
          id: (evt._id || evt.id) as string,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch events from API', err);
    }
    return [];
  },

  async getUpcomingEvents(limit = 10, type?: string): Promise<CalendarEvent[]> {
    try {
      const qs = new URLSearchParams();
      qs.set('limit', String(limit));
      if (type && type.toLowerCase() !== 'all') qs.set('type', type);
      const data = await fetchJson<CalendarEvent[]>(`${BASE_URL}/upcoming?${qs.toString()}`);
      if (Array.isArray(data)) {
        return data.map((evt) => ({
          ...evt,
          id: (evt._id || evt.id) as string,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch upcoming events', err);
    }
    return [];
  },

  async getMeetings(params?: { month?: string; search?: string }): Promise<CalendarEvent[]> {
    return this.getEvents({ ...params, type: 'Meeting' });
  },

  async getInterviews(params?: { month?: string; search?: string }): Promise<CalendarEvent[]> {
    return this.getEvents({ ...params, type: 'Interview' });
  },

  async getHolidays(params?: { year?: string | number; search?: string }): Promise<CalendarEvent[]> {
    return this.getEvents({ ...params, type: 'Holiday' });
  },

  async getDeadlines(params?: { status?: string; search?: string }): Promise<CalendarEvent[]> {
    return this.getEvents({ ...params, type: 'Deadline' });
  },

  async getEventById(id: string | number): Promise<CalendarEvent> {
    const data = await fetchJson<CalendarEvent>(`${BASE_URL}/${id}`);
    return {
      ...data,
      id: (data._id || data.id) as string,
    };
  },

  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const data = await fetchJson<CalendarEvent>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return {
      ...data,
      id: (data._id || data.id) as string,
    };
  },

  async updateEvent(id: string | number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const data = await fetchJson<CalendarEvent>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    return {
      ...data,
      id: (data._id || data.id) as string,
    };
  },

  async rescheduleEvent(
    id: string | number,
    data: { date: string; startTime?: string; endTime?: string; time?: string; notes?: string }
  ): Promise<CalendarEvent> {
    const res = await fetchJson<CalendarEvent>(`${BASE_URL}/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return {
      ...res,
      id: (res._id || res.id) as string,
    };
  },

  async updateEventStatus(id: string | number, status: string, notes?: string): Promise<CalendarEvent> {
    const res = await fetchJson<CalendarEvent>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return {
      ...res,
      id: (res._id || res.id) as string,
    };
  },

  async deleteEvent(id: string | number): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
