// ==========================================
// HUREMASO HRMS — Maintenance Service
// Full-Stack REST API Service for Support Tickets & Infrastructure
// ==========================================

export interface TicketComment {
  id: string;
  author: string;
  authorEmail?: string;
  role: string;
  text: string;
  timestamp: string;
  isStaff?: boolean;
}

export interface TicketHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface SupportTicket {
  id: string;
  _id?: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';
  category: 'System Error' | 'Access Issue' | 'Hardware' | 'Software' | 'Network' | 'Database' | 'Other';
  status: 'Open' | 'In Progress' | 'On Hold' | 'Pending' | 'Resolved' | 'Closed' | 'Reopened';
  requesterName: string;
  requesterEmail?: string;
  department?: string;
  assignedAgent?: string;
  assignedAgentId?: string;
  createdDate: string;
  resolvedDate?: string;
  closedDate?: string;
  resolutionDetails?: string;
  attachments?: string[];
  comments: TicketComment[];
  history: TicketHistoryEntry[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceExecutionEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface ScheduledMaintenanceLog {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  category?: string;
  scheduledDate: string;
  scheduledTime?: string;
  duration: string;
  status: 'Scheduled' | 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'Cancelled';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedServices?: string[];
  performedBy?: string;
  responsibleAdmin?: string;
  resolutionNotes?: string;
  notes?: string;
  executionHistory?: MaintenanceExecutionEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerHealthDetail {
  status: 'Healthy' | 'Degraded' | 'Unavailable';
  uptimeSeconds: number;
  uptimeFormatted: string;
  memoryUsageMb: number;
  totalMemoryMb: number;
  nodeVersion: string;
  activeNodes: number;
  platform: string;
  responseTimeMs: number;
}

export interface DatabaseHealthDetail {
  status: 'Connected' | 'Degraded' | 'Disconnected';
  connectionState: string;
  pingLatencyMs: number;
  databaseName: string;
  collectionsCount: number;
  detectedIssues: string[];
  integrityStatus: 'Optimal' | 'Warning' | 'Error';
}

export interface CacheHealthDetail {
  status: 'Not Configured' | 'Connected' | 'Disconnected';
  latencyMs: number | null;
  redisConfigured: boolean;
  details: string;
}

export interface SystemDiagnosticReport {
  diagnosticId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  overallStatus: 'Healthy' | 'Degraded' | 'Critical';
  serverHealth: ServerHealthDetail;
  databaseHealth: DatabaseHealthDetail;
  cacheHealth: CacheHealthDetail;
  recommendations: string[];
  executedBy: string;
  isReadonly: boolean;
  createdAt?: string;
}

export interface HuremasoOverviewData {
  systemHealth: {
    systemName: string;
    status: 'Operational' | 'Degraded' | 'Under Maintenance';
    uptimePercentage: number;
    uptimeSeconds?: number;
    uptimeFormatted?: string;
    activeNodesCount: number;
    totalNodesCount: number;
    databaseStatus: string;
    databaseLatencyMs?: number;
    fragmentationCount: number;
    cacheLatencyMs: number | null;
    redisStatus: string;
    redisConfigured?: boolean;
    lastDiagnosticRun: string;
    diagnosticsSummary: string;
  };
  serverDetails: ServerHealthDetail;
  databaseDetails: DatabaseHealthDetail;
  cacheDetails: CacheHealthDetail;
  scheduledMaintenanceLogs: ScheduledMaintenanceLog[];
  totalLogsCount: number;
}

const API_BASE_URL = '/api/v1/maintenance';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  let user: any = {};
  try {
    user = userStr ? JSON.parse(userStr) : {};
  } catch (e) {
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
  if (user && user.name) {
    headers['x-user-name'] = user.name;
  }

  return headers;
};

export const maintenanceService = {
  // ================= 1. ACTIVE SUPPORT TICKETS =================

  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params?.category && params.category !== 'All') query.append('category', params.category);
    if (params?.department && params.department !== 'All') query.append('department', params.department);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch tickets');
    }

    const tickets = (json.data || []).map((t: any) => ({
      ...t,
      id: t._id || t.id,
    }));

    return {
      tickets,
      total: json.pagination?.total ?? tickets.length,
      totalPages: json.pagination?.totalPages ?? 1,
    };
  },

  async getTicketById(id: string): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Ticket not found');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async createTicket(payload: {
    title: string;
    description: string;
    priority?: string;
    category?: string;
    requesterName?: string;
    requesterEmail?: string;
    department?: string;
    tags?: string[];
  }): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to create support ticket');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async updateTicket(id: string, payload: Partial<SupportTicket>): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to update support ticket');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async assignTicket(id: string, assignedAgent: string, assignedAgentId?: string): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ assignedAgent, assignedAgentId }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to assign ticket');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async updateTicketStatus(id: string, status: string, resolutionNotes?: string): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolutionNotes }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to update ticket status');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async addComment(id: string, text: string, role = 'Requester'): Promise<SupportTicket> {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    let author = 'Support User';
    let authorEmail: string | undefined;
    try {
      if (userStr) {
        const u = JSON.parse(userStr);
        author = u.name || author;
        authorEmail = u.email;
      }
    } catch (e) {
      // ignore
    }

    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        author,
        authorEmail,
        role,
        text,
        isStaff: role !== 'Requester',
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to add comment');
    }
    const t = json.data;
    return { ...t, id: t._id || t.id };
  },

  async getTicketHistory(id: string): Promise<TicketHistoryEntry[]> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}/history`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch ticket history');
    }
    return json.data || [];
  },

  async deleteTicket(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to delete support ticket');
    }
  },

  // ================= 2. HUREMASO INFRASTRUCTURE TELEMETRY & DIAGNOSTICS =================

  async getHuremasoOverview(): Promise<HuremasoOverviewData> {
    const res = await fetch(`${API_BASE_URL}/huremaso`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch infrastructure telemetry');
    }
    return json.data;
  },

  async runSystemDiagnostics(): Promise<SystemDiagnosticReport> {
    const res = await fetch(`${API_BASE_URL}/huremaso/diagnostics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to run diagnostics');
    }
    return json.data;
  },

  async getDiagnosticHistory(limit = 5): Promise<SystemDiagnosticReport[]> {
    const res = await fetch(`${API_BASE_URL}/huremaso/diagnostics/history?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch diagnostic history');
    }
    return json.data || [];
  },

  // ================= 3. SCHEDULED MAINTENANCE LOGS =================

  async getSchedules(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: ScheduledMaintenanceLog[]; total: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/huremaso/logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to fetch maintenance logs');
    }
    const logs = (json.data || []).map((l: any) => ({
      ...l,
      id: l._id || l.id,
    }));
    return {
      logs,
      total: json.pagination?.total ?? logs.length,
      totalPages: json.pagination?.totalPages ?? 1,
    };
  },

  async createSchedule(payload: {
    title: string;
    description?: string;
    category?: string;
    scheduledDate: string;
    scheduledTime?: string;
    duration?: string;
    priority?: string;
    responsibleAdmin?: string;
    affectedServices?: string[];
    notes?: string;
  }): Promise<ScheduledMaintenanceLog> {
    const res = await fetch(`${API_BASE_URL}/huremaso/logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to schedule maintenance window');
    }
    const l = json.data;
    return { ...l, id: l._id || l.id };
  },

  async updateSchedule(id: string, payload: Partial<ScheduledMaintenanceLog>): Promise<ScheduledMaintenanceLog> {
    const res = await fetch(`${API_BASE_URL}/huremaso/logs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to update maintenance log');
    }
    const l = json.data;
    return { ...l, id: l._id || l.id };
  },

  async updateScheduleStatus(id: string, status: string, notes?: string): Promise<ScheduledMaintenanceLog> {
    const res = await fetch(`${API_BASE_URL}/huremaso/logs/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to update maintenance status');
    }
    const l = json.data;
    return { ...l, id: l._id || l.id };
  },

  async cancelSchedule(id: string, reason: string): Promise<ScheduledMaintenanceLog> {
    const res = await fetch(`${API_BASE_URL}/huremaso/logs/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to cancel maintenance schedule');
    }
    const l = json.data;
    return { ...l, id: l._id || l.id };
  },

  async deleteSchedule(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/huremaso/logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || 'Failed to delete maintenance log');
    }
  },
};

export default maintenanceService;
