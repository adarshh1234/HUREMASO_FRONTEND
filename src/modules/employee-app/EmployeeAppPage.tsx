import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Smartphone, 
  Users, 
  Shield, 
  Bell, 
  Inbox, 
  Activity, 
  Settings, 
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useEmployeeApp } from '../../hooks/useEmployeeApp';
import { AppOverviewStats } from './components/AppOverviewStats';
import { AppUsersTab } from './components/AppUsersTab';
import { AppAccessControlTab } from './components/AppAccessControlTab';
import { AppPermissionsTab } from './components/AppPermissionsTab';
import { AppNotificationsTab } from './components/AppNotificationsTab';
import { AppRequestsTab } from './components/AppRequestsTab';
import { AppActivityAuditTab } from './components/AppActivityAuditTab';
import { AppSettingsConfigTab } from './components/AppSettingsConfigTab';

export const EmployeeAppPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/access')) return 'access';
    if (path.includes('/permissions')) return 'permissions';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/requests')) return 'requests';
    if (path.includes('/activity')) return 'activity';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/overview')) return 'overview';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  const {
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
  } = useEmployeeApp();

  // Keep activeTab in sync with URL
  useEffect(() => {
    const tabFromUrl = getInitialTab();
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.pathname, searchParams]);

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Initial fetch for sub-tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
      fetchUsers({ limit: 5 });
      fetchRequests({ limit: 5 });
    } else if (activeTab === 'users' || activeTab === 'access' || activeTab === 'permissions') {
      fetchUsers();
    } else if (activeTab === 'notifications') {
      fetchAnnouncements();
    } else if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, fetchStats, fetchUsers, fetchAnnouncements, fetchRequests, fetchActivityLogs, fetchSettings]);

  const handleRefreshAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchAnnouncements(),
      fetchRequests(),
      fetchActivityLogs(),
      fetchSettings(),
    ]);
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Metrics', icon: BarChart3 },
    { id: 'users', label: 'App Users & Profiles', icon: Users, count: usersTotal },
    { id: 'access', label: 'App Access & Activation', icon: Smartphone },
    { id: 'permissions', label: 'App Permissions & Roles', icon: Shield },
    { id: 'notifications', label: 'Notifications & Broadcasts', icon: Bell, count: announcementsTotal },
    { id: 'requests', label: 'Employee Requests', icon: Inbox, count: stats?.pendingRequests },
    { id: 'activity', label: 'Activity & Audit Logs', icon: Activity },
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#002222] to-[#006666] text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 m-0">Employee App Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administer mobile application users, hardware device access, granular security permissions, push broadcasts, employee requests, and global app settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer select-none"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#004848]" />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex flex-wrap gap-2 items-center border-b border-slate-200 pb-3 select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white border-transparent shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="pt-1">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AppOverviewStats
              stats={stats}
              loading={statsLoading}
              onNavigateTab={handleTabChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Preview: Recent Users */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#004848]" />
                    <h4 className="text-sm font-bold text-slate-900">Recent Mobile App Users</h4>
                  </div>
                  <button
                    onClick={() => handleTabChange('users')}
                    className="text-xs font-bold text-[#006666] hover:text-[#004848]"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {users.slice(0, 4).map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                          alt={u.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[11px] text-slate-500">{u.department} &bull; {u.deviceType}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Preview: Pending Requests */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#004848]" />
                    <h4 className="text-sm font-bold text-slate-900">Pending App Requests</h4>
                  </div>
                  <button
                    onClick={() => handleTabChange('requests')}
                    className="text-xs font-bold text-[#006666] hover:text-[#004848]"
                  >
                    Review &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No pending requests.</p>
                  ) : (
                    requests.slice(0, 4).map((r) => (
                      <div key={r.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{r.title}</p>
                          <p className="text-[11px] text-slate-500">{r.employeeName} &bull; {r.requestType.replace(/_/g, ' ')}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          r.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <AppUsersTab
            users={users}
            total={usersTotal}
            page={usersPage}
            limit={usersLimit}
            totalPages={usersTotalPages}
            loading={usersLoading}
            onFetchUsers={fetchUsers}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onToggleStatus={toggleUserStatus}
            onResetDevice={resetDevice}
            onDeleteUser={deleteUser}
          />
        )}

        {activeTab === 'access' && (
          <AppAccessControlTab
            users={users}
            loading={usersLoading}
            onToggleStatus={toggleUserStatus}
            onResetDevice={resetDevice}
            onUpdateUser={updateUser}
          />
        )}

        {activeTab === 'permissions' && (
          <AppPermissionsTab
            users={users}
            loading={usersLoading}
            onUpdatePermissions={updatePermissions}
          />
        )}

        {activeTab === 'notifications' && (
          <AppNotificationsTab
            announcements={announcements}
            total={announcementsTotal}
            loading={announcementsLoading}
            onFetchAnnouncements={fetchAnnouncements}
            onCreateAnnouncement={createAnnouncement}
            onDeleteAnnouncement={deleteAnnouncement}
          />
        )}

        {activeTab === 'requests' && (
          <AppRequestsTab
            requests={requests}
            total={requestsTotal}
            loading={requestsLoading}
            onFetchRequests={fetchRequests}
            onCreateRequest={createRequest}
            onUpdateRequestStatus={updateRequestStatus}
          />
        )}

        {activeTab === 'activity' && (
          <AppActivityAuditTab
            logs={activityLogs}
            total={activityLogsTotal}
            loading={activityLogsLoading}
            onFetchActivityLogs={fetchActivityLogs}
          />
        )}

        {activeTab === 'settings' && (
          <AppSettingsConfigTab
            settings={settings}
            loading={settingsLoading}
            onFetchSettings={fetchSettings}
            onUpdateSettings={updateSettings}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeAppPage;
