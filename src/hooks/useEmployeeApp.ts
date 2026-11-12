import { useState, useCallback, useEffect } from 'react';
import { employeeAppService } from '../services/employeeAppService';
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
import { useToast } from './useToast';

export function useEmployeeApp() {
  const { showToast } = useToast();

  // State
  const [stats, setStats] = useState<EmployeeAppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const [users, setUsers] = useState<EmployeeAppUser[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersLimit] = useState<number>(20);
  const [usersTotalPages, setUsersTotalPages] = useState<number>(1);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);

  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [announcementsTotal, setAnnouncementsTotal] = useState<number>(0);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);

  const [requests, setRequests] = useState<AppEmployeeRequest[]>([]);
  const [requestsTotal, setRequestsTotal] = useState<number>(0);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false);

  const [activityLogs, setActivityLogs] = useState<AppActivityLog[]>([]);
  const [activityLogsTotal, setActivityLogsTotal] = useState<number>(0);
  const [activityLogsLoading, setActivityLogsLoading] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettingsConfig | null>(null);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(false);

  // ================= STATS =================
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await employeeAppService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ================= USERS =================
  const fetchUsers = useCallback(async (params?: {
    status?: string;
    role?: string;
    department?: string;
    deviceType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setUsersLoading(true);
      const res = await employeeAppService.getUsers(params);
      setUsers(res.items);
      setUsersTotal(res.total);
      setUsersPage(res.page);
      setUsersTotalPages(res.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [showToast]);

  const createUser = useCallback(async (data: Partial<EmployeeAppUser>) => {
    try {
      const created = await employeeAppService.createUser(data);
      showToast(`User ${created.fullName} registered for Mobile App`, 'success');
      await fetchUsers();
      await fetchStats();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to register app user', 'error');
      throw err;
    }
  }, [fetchUsers, fetchStats, showToast]);

  const updateUser = useCallback(async (id: string, data: Partial<EmployeeAppUser>) => {
    try {
      const updated = await employeeAppService.updateUser(id, data);
      showToast('App user profile updated', 'success');
      await fetchUsers();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
      throw err;
    }
  }, [fetchUsers, showToast]);

  const toggleUserStatus = useCallback(async (id: string, status: AppUserStatus, notes?: string) => {
    try {
      const updated = await employeeAppService.toggleUserStatus(id, status, notes);
      showToast(`User status set to ${status}`, 'success');
      await fetchUsers();
      await fetchStats();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
      throw err;
    }
  }, [fetchUsers, fetchStats, showToast]);

  const updatePermissions = useCallback(async (
    id: string,
    permissions: Partial<EmployeeAppUser['permissions']>,
    role?: EmployeeAppUser['role']
  ) => {
    try {
      const updated = await employeeAppService.updatePermissions(id, permissions, role);
      showToast('Permissions & capabilities saved', 'success');
      await fetchUsers();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update permissions', 'error');
      throw err;
    }
  }, [fetchUsers, showToast]);

  const resetDevice = useCallback(async (id: string, reason?: string) => {
    try {
      const updated = await employeeAppService.resetDevice(id, reason);
      showToast('Device binding unbound successfully', 'success');
      await fetchUsers();
      await fetchStats();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to reset device binding', 'error');
      throw err;
    }
  }, [fetchUsers, fetchStats, showToast]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await employeeAppService.deleteUser(id);
      showToast('App user account removed', 'success');
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
      throw err;
    }
  }, [fetchUsers, fetchStats, showToast]);

  // ================= ANNOUNCEMENTS =================
  const fetchAnnouncements = useCallback(async (params?: {
    type?: string;
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setAnnouncementsLoading(true);
      const res = await employeeAppService.getAnnouncements(params);
      setAnnouncements(res.items);
      setAnnouncementsTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [showToast]);

  const createAnnouncement = useCallback(async (data: Partial<AppAnnouncement>) => {
    try {
      const created = await employeeAppService.createAnnouncement(data);
      showToast('Mobile broadcast dispatched successfully', 'success');
      await fetchAnnouncements();
      await fetchStats();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to create announcement', 'error');
      throw err;
    }
  }, [fetchAnnouncements, fetchStats, showToast]);

  const updateAnnouncement = useCallback(async (id: string, data: Partial<AppAnnouncement>) => {
    try {
      const updated = await employeeAppService.updateAnnouncement(id, data);
      showToast('Announcement updated', 'success');
      await fetchAnnouncements();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update announcement', 'error');
      throw err;
    }
  }, [fetchAnnouncements, showToast]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await employeeAppService.deleteAnnouncement(id);
      showToast('Announcement deleted', 'success');
      await fetchAnnouncements();
      await fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete announcement', 'error');
      throw err;
    }
  }, [fetchAnnouncements, fetchStats, showToast]);

  // ================= REQUESTS =================
  const fetchRequests = useCallback(async (params?: {
    status?: string;
    requestType?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setRequestsLoading(true);
      const res = await employeeAppService.getRequests(params);
      setRequests(res.items);
      setRequestsTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch requests', 'error');
    } finally {
      setRequestsLoading(false);
    }
  }, [showToast]);

  const createRequest = useCallback(async (data: Partial<AppEmployeeRequest>) => {
    try {
      const created = await employeeAppService.createRequest(data);
      showToast('Employee request logged successfully', 'success');
      await fetchRequests();
      await fetchStats();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Failed to log request', 'error');
      throw err;
    }
  }, [fetchRequests, fetchStats, showToast]);

  const updateRequestStatus = useCallback(async (
    id: string,
    status: RequestStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ) => {
    try {
      const updated = await employeeAppService.updateRequestStatus(id, status, reviewNotes, reviewedBy);
      showToast(`Request marked as ${status}`, 'success');
      await fetchRequests();
      await fetchStats();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update request', 'error');
      throw err;
    }
  }, [fetchRequests, fetchStats, showToast]);

  // ================= ACTIVITY LOGS =================
  const fetchActivityLogs = useCallback(async (params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => {
    try {
      setActivityLogsLoading(true);
      const res = await employeeAppService.getActivityLogs(params);
      setActivityLogs(res.items);
      setActivityLogsTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch activity logs', 'error');
    } finally {
      setActivityLogsLoading(false);
    }
  }, [showToast]);

  // ================= SETTINGS =================
  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const data = await employeeAppService.getSettings();
      setSettings(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load app settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  }, [showToast]);

  const updateSettings = useCallback(async (data: Partial<AppSettingsConfig>) => {
    try {
      const updated = await employeeAppService.updateSettings(data);
      setSettings(updated);
      showToast('App configuration updated successfully', 'success');
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
      throw err;
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    // Stats
    stats,
    statsLoading,
    fetchStats,

    // Users
    users,
    usersTotal,
    usersPage,
    usersLimit,
    usersTotalPages,
    usersLoading,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    updatePermissions,
    resetDevice,
    deleteUser,

    // Announcements
    announcements,
    announcementsTotal,
    announcementsLoading,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,

    // Requests
    requests,
    requestsTotal,
    requestsLoading,
    fetchRequests,
    createRequest,
    updateRequestStatus,

    // Activity Logs
    activityLogs,
    activityLogsTotal,
    activityLogsLoading,
    fetchActivityLogs,

    // Settings
    settings,
    settingsLoading,
    fetchSettings,
    updateSettings,
  };
}
