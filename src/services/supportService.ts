// ==========================================
// HUREMASO HRMS — Support Service
// Full-Stack REST API Service for Support Tickets, Maintenance, Knowledge Base & Agents
// ==========================================

export type TicketCategory =
  | 'IT Support'
  | 'Hardware'
  | 'Software'
  | 'Access / Permissions'
  | 'HR Support'
  | 'Facilities'
  | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TicketStatus = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed' | 'Reopened';

export interface ITicketComment {
  id: string;
  author: string;
  authorEmail?: string;
  role: string;
  text: string;
  timestamp: string;
  isStaff?: boolean;
}

export interface ITicketInternalNote {
  id: string;
  author: string;
  authorEmail?: string;
  text: string;
  timestamp: string;
}

export interface ITicketHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface ISupportTicket {
  id: string;
  _id?: string;
  ticketNumber: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assignedAgent?: string;
  assignedAgentEmail?: string;
  resolutionDetails?: string;
  resolvedAt?: string;
  closedAt?: string;
  reopenedAt?: string;
  firstResponseAt?: string;
  slaDueAt?: string;
  linkedMaintenanceId?: string;
  comments: ITicketComment[];
  internalNotes?: ITicketInternalNote[];
  history?: ITicketHistoryEntry[];
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
}

export interface ISupportDashboardMetrics {
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  reopenedTickets: number;
  unassignedTickets: number;
  totalTickets: number;
  averageResponseTimeHours: number;
  averageResolutionTimeHours: number;
  slaAdherenceRate: number;
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>;
  priorityBreakdown: Array<{ priority: string; count: number; percentage: number }>;
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    requesterName: string;
    department: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    assignedAgent?: string;
    lastUpdated: string;
  }>;
}

export interface ISupportMaintenance {
  id: string;
  _id?: string;
  system: string;
  title: string;
  description: string;
  category: 'Infrastructure' | 'Database' | 'Network' | 'Software' | 'Hardware' | 'Facilities';
  priority: TicketPriority;
  status: 'Reported' | 'Scheduled' | 'In Progress' | 'Operational' | 'Resolved' | 'Cancelled';
  requestedBy: string;
  requestedByEmail?: string;
  department?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  targetUptime?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupportHelpArticle {
  id: string;
  _id?: string;
  title: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  viewCount: number;
  helpfulVotes: number;
  unhelpfulVotes?: number;
  isPublished: boolean;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupportAgent {
  id: string;
  _id?: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'Online' | 'Offline' | 'Busy' | 'On Leave';
  specialties: string;
  avatar?: string;
  assignedTicketCount: number;
  resolvedTicketCount: number;
}

export interface ISupportContactRequest {
  id: string;
  _id?: string;
  requesterName: string;
  requesterEmail: string;
  phone?: string;
  department?: string;
  targetAgent?: string;
  subject: string;
  message: string;
  status: 'New' | 'In Progress' | 'Replied' | 'Closed';
  priority: TicketPriority;
  responseMessage?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt?: string;
}

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const API_BASE_URL = `${VITE_API_URL}/support`;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  let user: any = {};
  try {
    user = userStr ? JSON.parse(userStr) : {};
  } catch (_e) {
    user = {};
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user && user.id) {
    headers['x-user-id'] = user.id;
  }
  if (user && (user.name || user.fullName)) {
    headers['x-user-name'] = user.name || user.fullName;
  }

  return headers;
};

/**
 * Safely executes a fetch and parses JSON responses.
 * Prevents "Unexpected end of JSON input" on empty bodies or HTML error pages.
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let json: any = null;
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch (_parseErr) {
        return {
          ok: false,
          status: res.status,
          error: `Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`,
        };
      }
    }

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.message ||
        `HTTP ${res.status}: ${res.statusText || 'Request failed'}`;
      return { ok: false, status: res.status, error: errMsg, data: json?.data };
    }

    if (json && json.success === false) {
      const errMsg = json?.error?.message || json?.message || 'Operation failed';
      return { ok: false, status: res.status, error: errMsg, data: json?.data };
    }

    return { ok: true, status: res.status, data: json?.data !== undefined ? json.data : json };
  } catch (netErr: any) {
    return { ok: false, status: 0, error: netErr?.message || 'Network request failed' };
  }
}

export const supportService = {
  // ================= 1. DASHBOARD METRICS =================

  async getDashboardMetrics(): Promise<ISupportDashboardMetrics> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('Failed to fetch support dashboard metrics:', err);
      return {
        openTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        closedTickets: 0,
        reopenedTickets: 0,
        unassignedTickets: 0,
        totalTickets: 0,
        averageResponseTimeHours: 0,
        averageResolutionTimeHours: 0,
        slaAdherenceRate: 100,
        categoryBreakdown: [],
        priorityBreakdown: [],
        recentTickets: [],
      };
    }
  },

  // ================= 2. TICKETS =================

  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    department?: string;
    assignedAgent?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: ISupportTicket[]; total: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.append('status', params.status);
      if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
      if (params?.category && params.category !== 'All') query.append('category', params.category);
      if (params?.department && params.department !== 'All') query.append('department', params.department);
      if (params?.assignedAgent && params.assignedAgent !== 'All') query.append('assignedAgent', params.assignedAgent);
      if (params?.search) query.append('search', params.search);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const rawTickets = json.data || [];
      const tickets: ISupportTicket[] = rawTickets.map((t: any) => ({
        ...t,
        id: t._id?.toString() || t.id,
      }));
      return {
        tickets,
        total: json.pagination?.total ?? tickets.length,
        totalPages: json.pagination?.totalPages ?? 1,
      };
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      return { tickets: [], total: 0, totalPages: 1 };
    }
  },

  async getTicketById(id: string): Promise<ISupportTicket | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const t = json.data;
      return t ? { ...t, id: t._id?.toString() || t.id } : null;
    } catch (err) {
      console.error(`Failed to fetch ticket ${id}:`, err);
      return null;
    }
  },

  async getTicketHistory(id: string): Promise<ITicketHistoryEntry[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/history`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error(`Failed to fetch ticket history ${id}:`, err);
      return [];
    }
  },

  async createTicket(payload: {
    subject: string;
    description: string;
    requesterName: string;
    requesterEmail: string;
    department?: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    assignedAgent?: string;
    tags?: string[];
  }): Promise<ISupportTicket> {
    const result = await safeFetchJson<any>(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!result.ok || !result.data) {
      throw new Error(result.error || 'Failed to create support ticket');
    }

    const rawData = result.data;
    // Backend controller returns either { ...ticket, ticket: { ... } } or ticket directly
    const t = rawData?.ticket || rawData;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async updateTicket(id: string, payload: Partial<ISupportTicket>): Promise<ISupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update ticket');
    }
    const t = json.data;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async updateTicketStatus(
    id: string,
    status: TicketStatus,
    resolutionDetails?: string,
    notes?: string
  ): Promise<ISupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolutionDetails, notes }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Failed to update status to ${status}`);
    }
    const t = json.data;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async assignTicket(id: string, assignedAgent: string, assignedAgentEmail?: string): Promise<ISupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedAgent, assignedAgentEmail }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Failed to assign ticket to ${assignedAgent}`);
    }
    const t = json.data;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async addComment(id: string, text: string, author: string, authorEmail?: string, isStaff: boolean = false): Promise<ISupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, author, authorEmail, role: isStaff ? 'Support Staff' : 'Requester', isStaff }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to add comment');
    }
    const t = json.data;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async addInternalNote(id: string, text: string, author: string, authorEmail?: string): Promise<ISupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/internal-notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, author, authorEmail }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to add internal note');
    }
    const t = json.data;
    return { ...t, id: t._id?.toString() || t.id };
  },

  async deleteTicket(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete ticket');
    }
  },

  // ================= 3. MAINTENANCE =================

  async getMaintenance(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ maintenance: ISupportMaintenance[]; total: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.append('status', params.status);
      if (params?.category && params.category !== 'All') query.append('category', params.category);
      if (params?.search) query.append('search', params.search);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/maintenance?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const raw = json.data || [];
      const maintenance: ISupportMaintenance[] = raw.map((m: any) => ({
        ...m,
        id: m._id?.toString() || m.id,
      }));
      return {
        maintenance,
        total: json.pagination?.total ?? maintenance.length,
        totalPages: json.pagination?.totalPages ?? 1,
      };
    } catch (err) {
      console.error('Failed to fetch maintenance requests:', err);
      return { maintenance: [], total: 0, totalPages: 1 };
    }
  },

  async createMaintenance(payload: Partial<ISupportMaintenance>): Promise<ISupportMaintenance> {
    const res = await fetch(`${API_BASE_URL}/maintenance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to report maintenance issue');
    }
    const m = json.data;
    return { ...m, id: m._id?.toString() || m.id };
  },

  async updateMaintenance(id: string, payload: Partial<ISupportMaintenance>): Promise<ISupportMaintenance> {
    const res = await fetch(`${API_BASE_URL}/maintenance/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update maintenance request');
    }
    const m = json.data;
    return { ...m, id: m._id?.toString() || m.id };
  },

  async deleteMaintenance(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/maintenance/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete maintenance request');
    }
  },

  // ================= 4. KNOWLEDGE BASE =================

  async getHelpArticles(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ articles: ISupportHelpArticle[]; total: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'All') query.append('category', params.category);
      if (params?.search) query.append('search', params.search);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/help?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const raw = json.data || [];
      const articles: ISupportHelpArticle[] = raw.map((a: any) => ({
        ...a,
        id: a._id?.toString() || a.id,
      }));
      return {
        articles,
        total: json.pagination?.total ?? articles.length,
        totalPages: json.pagination?.totalPages ?? 1,
      };
    } catch (err) {
      console.error('Failed to fetch help articles:', err);
      return { articles: [], total: 0, totalPages: 1 };
    }
  },

  async getHelpArticleById(id: string): Promise<ISupportHelpArticle | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/help/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const a = json.data;
      return a ? { ...a, id: a._id?.toString() || a.id } : null;
    } catch (err) {
      console.error(`Failed to fetch article ${id}:`, err);
      return null;
    }
  },

  async createHelpArticle(payload: {
    title: string;
    category: string;
    question: string;
    answer: string;
    tags?: string[];
  }): Promise<ISupportHelpArticle> {
    const res = await fetch(`${API_BASE_URL}/help`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to create help article');
    }
    const a = json.data;
    return { ...a, id: a._id?.toString() || a.id };
  },

  async voteHelpArticle(id: string, isHelpful: boolean = true): Promise<ISupportHelpArticle> {
    const res = await fetch(`${API_BASE_URL}/help/${encodeURIComponent(id)}/vote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isHelpful }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to submit vote');
    }
    const a = json.data;
    return { ...a, id: a._id?.toString() || a.id };
  },

  // ================= 5. SUPPORT AGENTS =================

  async getSupportAgents(): Promise<ISupportAgent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/agents`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const raw = json.data || [];
      return raw.map((a: any) => ({
        ...a,
        id: a._id?.toString() || a.id,
      }));
    } catch (err) {
      console.error('Failed to fetch support agents:', err);
      return [];
    }
  },

  // ================= 6. CONTACT INQUIRIES =================

  async createContactRequest(payload: {
    requesterName: string;
    requesterEmail: string;
    phone?: string;
    targetAgent?: string;
    subject: string;
    message: string;
    priority?: TicketPriority;
  }): Promise<ISupportContactRequest> {
    const res = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to submit inquiry');
    }
    const c = json.data;
    return { ...c, id: c._id?.toString() || c.id };
  },

  // ================= 7. DEMO SEED =================

  async seedSupportData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/seed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data || { message: 'Seeded' };
  },
};

