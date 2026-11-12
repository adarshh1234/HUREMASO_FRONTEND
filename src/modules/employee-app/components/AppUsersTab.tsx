import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Smartphone, 
  Fingerprint, 
  Key, 
  MoreVertical, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  EmployeeAppUser, 
  AppUserStatus, 
  AppUserRole, 
  DeviceType 
} from '../../../types/employeeApp.types';

interface AppUsersTabProps {
  users: EmployeeAppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  onFetchUsers: (params?: any) => Promise<void>;
  onCreateUser: (data: Partial<EmployeeAppUser>) => Promise<any>;
  onUpdateUser: (id: string, data: Partial<EmployeeAppUser>) => Promise<any>;
  onToggleStatus: (id: string, status: AppUserStatus, notes?: string) => Promise<any>;
  onResetDevice: (id: string, reason?: string) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
}

export const AppUsersTab: React.FC<AppUsersTabProps> = ({
  users,
  total,
  page,
  limit,
  totalPages,
  loading,
  onFetchUsers,
  onCreateUser,
  onUpdateUser,
  onToggleStatus,
  onResetDevice,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deviceFilter, setDeviceFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EmployeeAppUser | null>(null);
  const [viewingUser, setViewingUser] = useState<EmployeeAppUser | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<EmployeeAppUser | null>(null);

  // Form state for add / edit
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    role: 'Standard' as AppUserRole,
    status: 'Active' as AppUserStatus,
    deviceType: 'iOS' as DeviceType,
    biometricEnabled: true,
    twoFactorEnabled: true,
    sessionTimeoutMinutes: 30,
    notes: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchUsers({
        search: searchTerm,
        status: statusFilter,
        role: roleFilter,
        deviceType: deviceFilter,
        page: 1,
        limit,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, roleFilter, deviceFilter, limit, onFetchUsers]);

  const handleOpenAdd = () => {
    setFormData({
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      email: '',
      phone: '',
      department: 'Engineering',
      designation: '',
      role: 'Standard',
      status: 'Active',
      deviceType: 'iOS',
      biometricEnabled: true,
      twoFactorEnabled: true,
      sessionTimeoutMinutes: 30,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: EmployeeAppUser) => {
    setEditingUser(user);
    setFormData({
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      department: user.department,
      designation: user.designation,
      role: user.role,
      status: user.status,
      deviceType: user.deviceType,
      biometricEnabled: user.biometricEnabled,
      twoFactorEnabled: user.twoFactorEnabled,
      sessionTimeoutMinutes: user.sessionTimeoutMinutes || 30,
      notes: user.notes || '',
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    try {
      setFormSubmitting(true);
      if (editingUser) {
        await onUpdateUser(editingUser.id, formData);
        setEditingUser(null);
      } else {
        await onCreateUser({
          ...formData,
          permissions: {
            canViewPayslip: true,
            canApplyLeave: true,
            canSubmitClaims: true,
            canPunchAttendance: true,
            canViewDirectory: true,
            canSubmitRequests: true,
            canViewAnnouncements: true,
            canChatSupport: true,
            canDownloadDocuments: formData.role !== 'Standard',
            canUpdateProfilePhoto: false,
          },
        });
        setIsAddModalOpen(false);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusBadge = (status: AppUserStatus) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'Inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Inactive</span>;
      case 'Suspended':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Suspended</span>;
      case 'Pending_Activation':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Invite</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getRoleBadge = (role: AppUserRole) => {
    switch (role) {
      case 'Admin':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Admin</span>;
      case 'Manager':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Manager</span>;
      case 'Field_Staff':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Field Staff</span>;
      case 'Executive':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Executive</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Standard</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Action Bar & Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, Employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004848] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Plus className="w-4 h-4" />
              <span>Register App User</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending_Activation">Pending Activation</option>
            <option value="Suspended">Suspended</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Roles</option>
            <option value="Standard">Standard</option>
            <option value="Manager">Manager</option>
            <option value="Field_Staff">Field Staff</option>
            <option value="Executive">Executive</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Device OS</option>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
            <option value="Web">Web</option>
          </select>

          {(searchTerm || statusFilter !== 'All' || roleFilter !== 'All' || deviceFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setRoleFilter('All');
                setDeviceFilter('All');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee & App ID</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Device & Biometrics</th>
                <th className="py-3.5 px-4">App Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#004848] border-t-transparent rounded-full mb-2"></div>
                    <p className="font-medium">Loading employee app users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Smartphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No employee app users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or register a new user.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="font-bold text-slate-900 hover:text-[#004848] transition-colors truncate block text-left"
                          >
                            {user.fullName}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span>{user.employeeId}</span>
                            <span>&bull;</span>
                            <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">{user.appUserId}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-800">{user.department}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {getRoleBadge(user.role)}
                          <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{user.designation}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[130px]">{user.deviceName || (user.deviceId ? 'Bound Device' : 'No device linked')}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">{user.deviceType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          {user.biometricEnabled ? (
                            <span className="flex items-center gap-0.5 text-cyan-700">
                              <Fingerprint className="w-3 h-3" /> FaceID/TouchID
                            </span>
                          ) : (
                            <span className="text-slate-400">PIN Only</span>
                          )}
                          {user.twoFactorEnabled && (
                            <span className="flex items-center gap-0.5 text-emerald-700">
                              <Shield className="w-3 h-3" /> 2FA
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(user.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {user.lastLoginAt ? (
                        <div>
                          <p className="font-medium text-slate-700">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Never logged in</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingUser(user)}
                          title="View App Profile"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          title="Edit User"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#004848] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onResetDevice(user.id, 'Admin device unbind')}
                          title="Unbind Device / Reset 2FA"
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteUser(user)}
                          title="Delete App Account"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{users.length}</span> of <span className="font-bold text-slate-800">{total}</span> app users
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => onFetchUsers({ search: searchTerm, status: statusFilter, role: roleFilter, deviceType: deviceFilter, page: page - 1, limit })}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onFetchUsers({ search: searchTerm, status: statusFilter, role: roleFilter, deviceType: deviceFilter, page: page + 1, limit })}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-[#004848]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Edit App User Profile' : 'Register New App User'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure mobile identity, access status and device credentials.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Human Resources">Human Resources</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Developer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">App Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AppUserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Manager">Manager</option>
                    <option value="Field_Staff">Field Staff</option>
                    <option value="Executive">Executive</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AppUserStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending_Activation">Pending Activation</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Device</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as DeviceType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="iOS">iOS</option>
                    <option value="Android">Android</option>
                    <option value="Web">Web</option>
                  </select>
                </div>
              </div>

              {/* Security Switches */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-bold text-slate-800">Security & Authentication</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Allow Biometric Sign-in (FaceID / Fingerprint)</span>
                  <input
                    type="checkbox"
                    checked={formData.biometricEnabled}
                    onChange={(e) => setFormData({ ...formData, biometricEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Require Two-Factor Auth (SMS/Authenticator OTP)</span>
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnabled}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal remarks or hardware asset notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Profile Drawer/Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Employee App Profile</h3>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2">
              <div className="relative inline-block">
                <img
                  src={viewingUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                  alt={viewingUser.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 mx-auto"
                />
                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${viewingUser.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-2">{viewingUser.fullName}</h4>
              <p className="text-xs text-slate-500">{viewingUser.designation} &bull; {viewingUser.department}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {getStatusBadge(viewingUser.status)}
                {getRoleBadge(viewingUser.role)}
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Employee ID:</span>
                <span className="font-bold text-slate-800">{viewingUser.employeeId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mobile User ID:</span>
                <span className="font-mono text-teal-800 font-semibold">{viewingUser.appUserId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-semibold text-slate-800">{viewingUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Device Token / ID:</span>
                <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">{viewingUser.deviceId || 'Unbound'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Device Model:</span>
                <span className="font-semibold text-slate-800">{viewingUser.deviceName || viewingUser.deviceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">App Version:</span>
                <span className="font-semibold text-slate-800">{viewingUser.appVersion || 'v2.4.0'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Biometrics Enabled:</span>
                <span className="font-semibold text-slate-800">{viewingUser.biometricEnabled ? 'Yes (FaceID/TouchID)' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">2FA Protection:</span>
                <span className="font-semibold text-slate-800">{viewingUser.twoFactorEnabled ? 'Active' : 'Disabled'}</span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  const newStatus = viewingUser.status === 'Active' ? 'Suspended' : 'Active';
                  onToggleStatus(viewingUser.id, newStatus);
                  setViewingUser(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                  viewingUser.status === 'Active'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {viewingUser.status === 'Active' ? 'Suspend Access' : 'Activate User'}
              </button>
              <button
                onClick={() => {
                  onResetDevice(viewingUser.id, 'Admin unbind from profile');
                  setViewingUser(null);
                }}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                Reset Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove App Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete mobile access for <span className="font-bold text-slate-800">{confirmDeleteUser.fullName}</span>? This will wipe the mobile session token.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteUser(confirmDeleteUser.id);
                  setConfirmDeleteUser(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
