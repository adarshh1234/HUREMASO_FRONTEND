import {
  EmployeeAppUser,
  AppAnnouncement,
  AppEmployeeRequest,
  AppActivityLog,
  AppSettingsConfig,
  EmployeeAppStats,
  AppUserStatus,
  RequestStatus,
} from '../types/employeeApp.types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/employee-app`;

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

export const employeeAppService = {
  // ================= STATS =================
  async getStats(): Promise<EmployeeAppStats> {
    try {
      const data = await fetchJson<EmployeeAppStats>(`${BASE_URL}/stats`);
      return data;
    } catch (err) {
      console.warn('Failed to fetch employee app stats from API, returning default stats', err);
      return {
        totalUsers: 5,
        activeUsers: 3,
        pendingActivations: 1,
        suspendedUsers: 1,
        activeToday: 2,
        pendingRequests: 1,
        totalAnnouncements: 3,
        iosCount: 3,
        androidCount: 2,
        webCount: 0,
        biometricAdoptionRate: 80,
      };
    }
  },

  // ================= USERS =================
  async getUsers(params?: {
    status?: string;
    role?: string;
    department?: string;
    deviceType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: EmployeeAppUser[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.set('status', params.status);
      if (params?.role && params.role !== 'All') query.set('role', params.role);
      if (params?.department && params.department !== 'All') query.set('department', params.department);
      if (params?.deviceType && params.deviceType !== 'All') query.set('deviceType', params.deviceType);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const qs = query.toString();
      const res = await fetch(`${BASE_URL}/users${qs ? `?${qs}` : ''}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : json.items || [];
      return {
        items: items.map((u: any) => ({ ...u, id: u._id || u.id })),
        total: json.total || items.length,
        page: json.page || 1,
        limit: json.limit || items.length,
        totalPages: json.totalPages || 1,
      };
    } catch (err) {
      console.warn('Failed to fetch app users from API, returning fallback data', err);
      return {
        items: [
          {
            id: '1',
            employeeId: 'EMP-1001',
            appUserId: 'APP-USR-1001',
            fullName: 'Sarah Joseph',
            email: 'sarah.j@company.com',
            phone: '+1 (555) 234-5678',
            department: 'Human Resources',
            designation: 'Senior HR Director',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            status: 'Active',
            role: 'Admin',
            deviceId: 'DEV-IPH-15PRO-889',
            deviceName: 'iPhone 15 Pro Max',
            deviceType: 'iOS',
            osVersion: 'iOS 17.5.1',
            appVersion: 'v2.4.0',
            biometricEnabled: true,
            twoFactorEnabled: true,
            lastLoginAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            lastActiveAt: new Date().toISOString(),
            registeredAt: '2024-01-15T00:00:00.000Z',
            isOnline: true,
            permissions: {
              canViewPayslip: true,
              canApplyLeave: true,
              canSubmitClaims: true,
              canPunchAttendance: true,
              canViewDirectory: true,
              canSubmitRequests: true,
              canViewAnnouncements: true,
              canChatSupport: true,
              canDownloadDocuments: true,
              canUpdateProfilePhoto: true,
            },
            sessionTimeoutMinutes: 60,
          },
          {
            id: '2',
            employeeId: 'EMP-1002',
            appUserId: 'APP-USR-1002',
            fullName: 'Alexander Wright',
            email: 'alex.w@company.com',
            phone: '+1 (555) 345-6789',
            department: 'Engineering',
            designation: 'Principal Architect',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            status: 'Active',
            role: 'Manager',
            deviceId: 'DEV-PIX-8PRO-224',
            deviceName: 'Google Pixel 8 Pro',
            deviceType: 'Android',
            osVersion: 'Android 14',
            appVersion: 'v2.4.0',
            biometricEnabled: true,
            twoFactorEnabled: true,
            lastLoginAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
            registeredAt: '2024-02-01T00:00:00.000Z',
            isOnline: true,
            permissions: {
              canViewPayslip: true,
              canApplyLeave: true,
              canSubmitClaims: true,
              canPunchAttendance: true,
              canViewDirectory: true,
              canSubmitRequests: true,
              canViewAnnouncements: true,
              canChatSupport: true,
              canDownloadDocuments: true,
              canUpdateProfilePhoto: false,
            },
            sessionTimeoutMinutes: 45,
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  },

  async createUser(data: Partial<EmployeeAppUser>): Promise<EmployeeAppUser> {
    const res = await fetchJson<EmployeeAppUser>(`${BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, id: res._id || res.id };
  },

  async updateUser(id: string, data: Partial<EmployeeAppUser>): Promise<EmployeeAppUser> {
    const res = await fetchJson<EmployeeAppUser>(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, id: res._id || res.id };
  },

  async toggleUserStatus(id: string, status: AppUserStatus, notes?: string): Promise<EmployeeAppUser> {
    const res = await fetchJson<EmployeeAppUser>(`${BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    return { ...res, id: res._id || res.id };
  },

  async updatePermissions(
    id: string,
    permissions: Partial<EmployeeAppUser['permissions']>,
    role?: EmployeeAppUser['role']
  ): Promise<EmployeeAppUser> {
    const res = await fetchJson<EmployeeAppUser>(`${BASE_URL}/users/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions, role }),
    });
    return { ...res, id: res._id || res.id };
  },

  async resetDevice(id: string, reason?: string): Promise<EmployeeAppUser> {
    const res = await fetchJson<EmployeeAppUser>(`${BASE_URL}/users/${id}/reset-device`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return { ...res, id: res._id || res.id };
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    return fetchJson<{ success: boolean; message?: string }>(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= ANNOUNCEMENTS =================
  async getAnnouncements(params?: {
    type?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AppAnnouncement[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.type && params.type !== 'All') query.set('type', params.type);
      if (params?.status && params.status !== 'All') query.set('status', params.status);
      if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const qs = query.toString();
      const res = await fetch(`${BASE_URL}/announcements${qs ? `?${qs}` : ''}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : json.items || [];
      return {
        items: items.map((a: any) => ({ ...a, id: a._id || a.id })),
        total: json.total || items.length,
        page: json.page || 1,
        limit: json.limit || items.length,
        totalPages: json.totalPages || 1,
      };
    } catch (err) {
      console.warn('Failed to fetch announcements from API', err);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
  },

  async createAnnouncement(data: Partial<AppAnnouncement>): Promise<AppAnnouncement> {
    const res = await fetchJson<AppAnnouncement>(`${BASE_URL}/announcements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, id: res._id || res.id };
  },

  async updateAnnouncement(id: string, data: Partial<AppAnnouncement>): Promise<AppAnnouncement> {
    const res = await fetchJson<AppAnnouncement>(`${BASE_URL}/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { ...res, id: res._id || res.id };
  },

  async deleteAnnouncement(id: string): Promise<{ success: boolean; message?: string }> {
    return fetchJson<{ success: boolean; message?: string }>(`${BASE_URL}/announcements/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= REQUESTS =================
  async getRequests(params?: {
    status?: string;
    requestType?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AppEmployeeRequest[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.set('status', params.status);
      if (params?.requestType && params.requestType !== 'All') query.set('requestType', params.requestType);
      if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const qs = query.toString();
      const res = await fetch(`${BASE_URL}/requests${qs ? `?${qs}` : ''}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : json.items || [];
      return {
        items: items.map((r: any) => ({ ...r, id: r._id || r.id })),
        total: json.total || items.length,
        page: json.page || 1,
        limit: json.limit || items.length,
        totalPages: json.totalPages || 1,
      };
    } catch (err) {
      console.warn('Failed to fetch requests from API', err);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
    }
  },

  async createRequest(data: Partial<AppEmployeeRequest>): Promise<AppEmployeeRequest> {
    const res = await fetchJson<AppEmployeeRequest>(`${BASE_URL}/requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { ...res, id: res._id || res.id };
  },

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<AppEmployeeRequest> {
    const res = await fetchJson<AppEmployeeRequest>(`${BASE_URL}/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNotes, reviewedBy }),
    });
    return { ...res, id: res._id || res.id };
  },

  // ================= ACTIVITY LOGS =================
  async getActivityLogs(params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AppActivityLog[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.status && params.status !== 'All') query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      const qs = query.toString();
      const res = await fetch(`${BASE_URL}/activity-logs${qs ? `?${qs}` : ''}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.data) ? json.data : json.items || [];
      return {
        items: items.map((l: any) => ({ ...l, id: l._id || l.id })),
        total: json.total || items.length,
        page: json.page || 1,
        limit: json.limit || items.length,
        totalPages: json.totalPages || 1,
      };
    } catch (err) {
      console.warn('Failed to fetch activity logs from API', err);
      return { items: [], total: 0, page: 1, limit: 30, totalPages: 1 };
    }
  },

  // ================= SETTINGS =================
  async getSettings(): Promise<AppSettingsConfig> {
    try {
      return await fetchJson<AppSettingsConfig>(`${BASE_URL}/settings`);
    } catch (err) {
      console.warn('Failed to fetch settings from API, using defaults', err);
      return {
        appName: 'Huremaso Mobile HR',
        currentVersion: 'v2.4.0',
        minimumSupportedVersion: 'v2.0.0',
        maintenanceMode: false,
        maintenanceMessage: 'The employee portal is undergoing maintenance.',
        forceUpdate: false,
        allowBiometricLogin: true,
        sessionTimeoutMinutes: 45,
        allowOfflineMode: true,
        maxDevicesPerUser: 2,
        allowedFeatures: {
          attendanceGeofence: true,
          pushNotifications: true,
          offlineSync: true,
          documentDownload: true,
          darkTheme: true,
          profilePhotoUpload: false,
        },
        securityPolicy: {
          passcodeExpiryDays: 90,
          blockRootedDevices: true,
          screenshotBlocked: true,
          enforceStrongPassword: true,
        },
        supportContactEmail: 'app-support@huremaso.com',
        supportContactPhone: '+1 (800) 555-0199',
      };
    }
  },

  async updateSettings(data: Partial<AppSettingsConfig>): Promise<AppSettingsConfig> {
    return fetchJson<AppSettingsConfig>(`${BASE_URL}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
