import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Smartphone, 
  Key, 
  Clock, 
  Download,
  Terminal,
  Activity
} from 'lucide-react';
import { AppActivityLog, ActivityCategory, ActivityStatus } from '../../../types/employeeApp.types';

interface AppActivityAuditTabProps {
  logs: AppActivityLog[];
  total: number;
  loading: boolean;
  onFetchActivityLogs: (params?: any) => Promise<void>;
}

export const AppActivityAuditTab: React.FC<AppActivityAuditTabProps> = ({
  logs,
  total,
  loading,
  onFetchActivityLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchActivityLogs({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, statusFilter, onFetchActivityLogs]);

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'Success':
        return <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Success</span>;
      case 'Warning':
        return <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Warning</span>;
      case 'Failure':
        return <span className="inline-flex items-center gap-1 text-rose-700 font-bold"><XCircle className="w-3.5 h-3.5" /> Failure</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getCategoryBadge = (category: ActivityCategory) => {
    const formatted = category.replace(/_/g, ' ');
    switch (category) {
      case 'Auth':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Auth</span>;
      case 'Access_Change':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Access Change</span>;
      case 'Security_Event':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Security</span>;
      case 'Broadcast':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Broadcast</span>;
      case 'Config_Change':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Config</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail, IP address, user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFetchActivityLogs({ search: searchTerm, category: categoryFilter, status: statusFilter })}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#004848]" />
              <span>Refresh Log Feed</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Categories</option>
            <option value="Auth">Authentication</option>
            <option value="Access_Change">Access Change</option>
            <option value="Permission_Update">Permission Update</option>
            <option value="Broadcast">Broadcasts</option>
            <option value="Request_Action">Request Actions</option>
            <option value="Config_Change">Config Changes</option>
            <option value="Security_Event">Security Events</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Event Action & User</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Audit Details</th>
                <th className="py-3.5 px-4">Device & IP Origin</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#004848] border-t-transparent rounded-full mb-2"></div>
                    <p className="font-medium">Loading activity audit trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    <Terminal className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No activity logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div>
                        <p className="font-bold text-slate-900">{log.action}</p>
                        {log.employeeName && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {log.employeeName} {log.employeeId ? `(${log.employeeId})` : ''}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      {getCategoryBadge(log.category)}
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <p className="text-slate-600 max-w-sm line-clamp-2 leading-relaxed text-xs">
                        {log.details || 'System event recorded.'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-600">
                        <p className="font-semibold text-slate-800">{log.deviceType || 'Mobile Session'}</p>
                        <p className="text-slate-400 text-[10px]">{log.ipAddress || '192.168.1.1'}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      {getStatusIcon(log.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 text-[11px] font-sans">
                      <p className="font-medium text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
