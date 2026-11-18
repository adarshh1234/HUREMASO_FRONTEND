import {
  DashboardOverviewResponse,
  DashboardSummaryMetrics,
  TimeAtWorkMetric,
  DistributionItem,
  EmployeeOnLeaveItem,
  BuzzPost,
  RecentActivityItem,
  MyActionsMetrics,
} from '../types/dashboard';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE = `${VITE_API_URL}/dashboard`;

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

export const dashboardService = {
  // 1. Full Dashboard Overview
  async getOverview(params?: { department?: string; location?: string; subUnit?: string; employeeId?: string }): Promise<DashboardOverviewResponse> {
    const qs = new URLSearchParams();
    if (params?.department) qs.set('department', params.department);
    if (params?.location) qs.set('location', params.location);
    if (params?.subUnit) qs.set('subUnit', params.subUnit);
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    return fetchJson<DashboardOverviewResponse>(`${BASE}/overview?${qs.toString()}`);
  },

  // 2. Summary Metrics (4 cards)
  async getSummary(params?: { department?: string; location?: string; subUnit?: string }): Promise<DashboardSummaryMetrics> {
    const qs = new URLSearchParams();
    if (params?.department) qs.set('department', params.department);
    if (params?.location) qs.set('location', params.location);
    if (params?.subUnit) qs.set('subUnit', params.subUnit);
    return fetchJson<DashboardSummaryMetrics>(`${BASE}/summary?${qs.toString()}`);
  },

  // 3. Time at Work
  async getTimeAtWork(employeeId?: string): Promise<TimeAtWorkMetric> {
    const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    return fetchJson<TimeAtWorkMetric>(`${BASE}/time-at-work${qs}`);
  },

  async clockIn(payload?: { employeeId?: string; note?: string; time?: string; date?: string }): Promise<TimeAtWorkMetric> {
    return fetchJson<TimeAtWorkMetric>(`${BASE}/time-at-work/clock-in`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async clockOut(payload?: { employeeId?: string; note?: string; time?: string; date?: string }): Promise<TimeAtWorkMetric> {
    return fetchJson<TimeAtWorkMetric>(`${BASE}/time-at-work/clock-out`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  // 4. Distributions
  async getSubUnitDistribution(): Promise<DistributionItem[]> {
    return fetchJson<DistributionItem[]>(`${BASE}/employee-distribution/sub-unit`);
  },

  async getLocationDistribution(): Promise<DistributionItem[]> {
    return fetchJson<DistributionItem[]>(`${BASE}/employee-distribution/location`);
  },

  // 5. Employees on Leave Today
  async getEmployeesOnLeave(): Promise<EmployeeOnLeaveItem[]> {
    return fetchJson<EmployeeOnLeaveItem[]>(`${BASE}/employees-on-leave`);
  },

  // 6. Buzz Posts
  async getBuzzPosts(limit = 10): Promise<BuzzPost[]> {
    return fetchJson<BuzzPost[]>(`${BASE}/buzz?limit=${limit}`);
  },

  async createBuzzPost(data: { author: string; authorId?: string; avatar?: string; title?: string; content: string; type?: string }): Promise<BuzzPost> {
    return fetchJson<BuzzPost>(`${BASE}/buzz`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBuzzPost(id: string, data: { title?: string; content?: string; type?: string }): Promise<BuzzPost> {
    return fetchJson<BuzzPost>(`${BASE}/buzz/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteBuzzPost(id: string): Promise<void> {
    await fetchJson(`${BASE}/buzz/${id}`, {
      method: 'DELETE',
    });
  },

  // 7. My Actions
  async getMyActions(): Promise<MyActionsMetrics> {
    return fetchJson<MyActionsMetrics>(`${BASE}/my-actions`);
  },

  // 8. Recent Activities
  async getRecentActivities(limit = 10, type = 'all'): Promise<RecentActivityItem[]> {
    return fetchJson<RecentActivityItem[]>(`${BASE}/recent-activity?limit=${limit}&type=${type}`);
  },
};

export default dashboardService;
