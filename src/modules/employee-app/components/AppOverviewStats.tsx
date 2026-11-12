import React from 'react';
import { 
  Users, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  Bell, 
  Inbox, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { EmployeeAppStats } from '../../../types/employeeApp.types';

interface AppOverviewStatsProps {
  stats: EmployeeAppStats | null;
  loading: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const AppOverviewStats: React.FC<AppOverviewStatsProps> = ({ stats, loading, onNavigateTab }) => {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={`stat-skeleton-${n}`} className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
    );
  }

  const s = stats || {
    totalUsers: 0,
    activeUsers: 0,
    pendingActivations: 0,
    suspendedUsers: 0,
    activeToday: 0,
    pendingRequests: 0,
    totalAnnouncements: 0,
    iosCount: 0,
    androidCount: 0,
    webCount: 0,
    biometricAdoptionRate: 0,
  };

  const statCards = [
    {
      id: 'active-users',
      title: 'Active App Users',
      value: s.activeUsers,
      total: s.totalUsers,
      subtext: `${s.totalUsers} total registered`,
      icon: Users,
      color: 'from-emerald-500/10 to-teal-500/5 text-emerald-700 border-emerald-200/60',
      iconBg: 'bg-emerald-100 text-emerald-700',
      tab: 'users',
    },
    {
      id: 'pending-requests',
      title: 'Pending Requests',
      value: s.pendingRequests,
      subtext: s.pendingRequests > 0 ? 'Requires admin action' : 'All requests resolved',
      icon: Inbox,
      color: s.pendingRequests > 0 
        ? 'from-amber-500/10 to-orange-500/5 text-amber-700 border-amber-200/60'
        : 'from-slate-500/10 to-slate-500/5 text-slate-700 border-slate-200/60',
      iconBg: s.pendingRequests > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700',
      tab: 'requests',
    },
    {
      id: 'biometrics',
      title: 'Biometric Adoption',
      value: `${s.biometricAdoptionRate}%`,
      subtext: 'FaceID / Fingerprint active',
      icon: Fingerprint,
      color: 'from-cyan-500/10 to-blue-500/5 text-cyan-800 border-cyan-200/60',
      iconBg: 'bg-cyan-100 text-cyan-800',
      tab: 'access',
    },
    {
      id: 'active-broadcasts',
      title: 'App Broadcasts',
      value: s.totalAnnouncements,
      subtext: 'Active push notices',
      icon: Bell,
      color: 'from-indigo-500/10 to-purple-500/5 text-indigo-700 border-indigo-200/60',
      iconBg: 'bg-indigo-100 text-indigo-700',
      tab: 'notifications',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Hero Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onNavigateTab(card.tab)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                    {card.subtext}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 flex items-center gap-0.5">
                  Manage <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform & Access Breakdown Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Device Platform Spread</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                iOS: <span className="text-teal-700">{s.iosCount}</span> &bull; Android: <span className="text-teal-700">{s.androidCount}</span> &bull; Web: <span className="text-teal-700">{s.webCount}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('users')}
            className="text-xs font-bold text-[#006666] hover:text-[#004848] transition-colors"
          >
            View
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pending Activations</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {s.pendingActivations} users awaiting first mobile login
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('access')}
            className="text-xs font-bold text-[#006666] hover:text-[#004848] transition-colors"
          >
            Review
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Suspended / Locked</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {s.suspendedUsers} accounts restricted
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('access')}
            className="text-xs font-bold text-[#006666] hover:text-[#004848] transition-colors"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
};
