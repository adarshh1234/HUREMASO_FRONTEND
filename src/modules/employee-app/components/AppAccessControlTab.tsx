import React, { useState } from 'react';
import { 
  Shield, 
  Smartphone, 
  Fingerprint, 
  Key, 
  Lock, 
  Unlock, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Search,
  Zap,
  Sliders
} from 'lucide-react';
import { EmployeeAppUser, AppUserStatus } from '../../../types/employeeApp.types';

interface AppAccessControlTabProps {
  users: EmployeeAppUser[];
  loading: boolean;
  onToggleStatus: (id: string, status: AppUserStatus, notes?: string) => Promise<any>;
  onResetDevice: (id: string, reason?: string) => Promise<any>;
  onUpdateUser: (id: string, data: Partial<EmployeeAppUser>) => Promise<any>;
}

export const AppAccessControlTab: React.FC<AppAccessControlTabProps> = ({
  users,
  loading,
  onToggleStatus,
  onResetDevice,
  onUpdateUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.employeeId.toLowerCase().includes(s) ||
      u.department.toLowerCase().includes(s)
    );
  });

  const handleToggle = async (user: EmployeeAppUser) => {
    const targetStatus: AppUserStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      setActionLoadingId(user.id);
      await onToggleStatus(user.id, targetStatus, `Admin toggle via Access Control Center`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReset = async (user: EmployeeAppUser) => {
    try {
      setActionLoadingId(user.id);
      await onResetDevice(user.id, 'Admin device unbind from Access Control');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBiometric = async (user: EmployeeAppUser) => {
    try {
      setActionLoadingId(user.id);
      await onUpdateUser(user.id, { biometricEnabled: !user.biometricEnabled });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggle2FA = async (user: EmployeeAppUser) => {
    try {
      setActionLoadingId(user.id);
      await onUpdateUser(user.id, { twoFactorEnabled: !user.twoFactorEnabled });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Policies Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-300" />
            <h3 className="text-base font-bold">App Access & Device Authentication Policies</h3>
          </div>
          <p className="text-xs text-teal-100 leading-relaxed">
            Manage real-time employee mobile activation, device hardware unbinding, biometric FaceID / TouchID enforcement, and remote session suspensions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <p className="text-[10px] uppercase font-bold text-teal-200">Active Mobile Nodes</p>
            <p className="text-lg font-extrabold">{users.filter((u) => u.status === 'Active').length}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <p className="text-[10px] uppercase font-bold text-teal-200">Bound Devices</p>
            <p className="text-lg font-extrabold">{users.filter((u) => !!u.deviceId).length}</p>
          </div>
        </div>
      </div>

      {/* Access Control Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">User Access & Device Bindings</h4>
            <p className="text-xs text-slate-500">Toggle individual app access switches and enforce mobile security features.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">App Access Status</th>
                <th className="py-3 px-3">Bound Device</th>
                <th className="py-3 px-3 text-center">Biometric Sign-In</th>
                <th className="py-3 px-3 text-center">2-Factor Auth</th>
                <th className="py-3 px-3 text-right">Device Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#004848] border-t-transparent rounded-full mb-1"></div>
                    <p>Loading access controls...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No users matching access filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActing = actionLoadingId === user.id;
                  const isActive = user.status === 'Active';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{user.fullName}</p>
                            <p className="text-[11px] text-slate-500">{user.employeeId} &bull; {user.department}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isActing}
                            onClick={() => handleToggle(user)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-[#006666]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium truncate max-w-[140px]">
                            {user.deviceName || (user.deviceId ? 'Bound Device' : 'None linked')}
                          </span>
                          {user.deviceId && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Device Verified" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          disabled={isActing}
                          onClick={() => handleToggleBiometric(user)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            user.biometricEnabled
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Fingerprint className="w-3 h-3" />
                          <span>{user.biometricEnabled ? 'Enabled' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          disabled={isActing}
                          onClick={() => handleToggle2FA(user)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            user.twoFactorEnabled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Key className="w-3 h-3" />
                          <span>{user.twoFactorEnabled ? '2FA On' : '2FA Off'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          disabled={isActing || !user.deviceId}
                          onClick={() => handleReset(user)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-bold transition-all disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Unbind Device</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
