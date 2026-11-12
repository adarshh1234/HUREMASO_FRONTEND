import React, { useState } from 'react';
import { 
  Shield, 
  Check, 
  X, 
  Save, 
  User, 
  Smartphone, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  MessageSquare, 
  Download, 
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { EmployeeAppUser, IEmployeeAppPermissions, AppUserRole } from '../../../types/employeeApp.types';

interface AppPermissionsTabProps {
  users: EmployeeAppUser[];
  loading: boolean;
  onUpdatePermissions: (
    id: string,
    permissions: Partial<IEmployeeAppPermissions>,
    role?: AppUserRole
  ) => Promise<any>;
}

const ROLE_TEMPLATES: Record<AppUserRole, IEmployeeAppPermissions> = {
  Standard: {
    canViewPayslip: true,
    canApplyLeave: true,
    canSubmitClaims: true,
    canPunchAttendance: true,
    canViewDirectory: true,
    canSubmitRequests: true,
    canViewAnnouncements: true,
    canChatSupport: true,
    canDownloadDocuments: false,
    canUpdateProfilePhoto: false,
  },
  Manager: {
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
  Field_Staff: {
    canViewPayslip: true,
    canApplyLeave: true,
    canSubmitClaims: true,
    canPunchAttendance: true,
    canViewDirectory: false,
    canSubmitRequests: true,
    canViewAnnouncements: true,
    canChatSupport: true,
    canDownloadDocuments: false,
    canUpdateProfilePhoto: false,
  },
  Executive: {
    canViewPayslip: true,
    canApplyLeave: true,
    canSubmitClaims: true,
    canPunchAttendance: false,
    canViewDirectory: true,
    canSubmitRequests: true,
    canViewAnnouncements: true,
    canChatSupport: true,
    canDownloadDocuments: true,
    canUpdateProfilePhoto: true,
  },
  Admin: {
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
};

const PERMISSION_METADATA: Array<{
  key: keyof IEmployeeAppPermissions;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: 'canViewPayslip',
    title: 'View Digital Payslips',
    description: 'Allow employee to view and download salary breakdowns and tax certificates.',
    icon: DollarSign,
  },
  {
    key: 'canApplyLeave',
    title: 'Apply Leave & Time-Off',
    description: 'Submit sick, vacation, and wake-off requests directly from phone.',
    icon: Calendar,
  },
  {
    key: 'canPunchAttendance',
    title: 'GPS Geofenced Punch-in',
    description: 'Clock-in/out with location accuracy check on mobile device.',
    icon: Clock,
  },
  {
    key: 'canSubmitClaims',
    title: 'Expense & Benefit Claims',
    description: 'Upload receipt photos for reimbursements and travel advances.',
    icon: FileText,
  },
  {
    key: 'canViewDirectory',
    title: 'Organization Directory',
    description: 'Search colleagues, view designations, extensions, and teams.',
    icon: Users,
  },
  {
    key: 'canSubmitRequests',
    title: 'Employee Self Requests',
    description: 'Lodge device unlocks, profile changes, and support tickets.',
    icon: Layers,
  },
  {
    key: 'canViewAnnouncements',
    title: 'Announcements & Broadcasts',
    description: 'Receive real-time push alerts and emergency company updates.',
    icon: MessageSquare,
  },
  {
    key: 'canChatSupport',
    title: 'HR In-App Support Chat',
    description: 'Direct messaging channel with HR helpdesk administrators.',
    icon: MessageSquare,
  },
  {
    key: 'canDownloadDocuments',
    title: 'Offline Document Cache',
    description: 'Store company handbook, SOPs, and letters on local device.',
    icon: Download,
  },
  {
    key: 'canUpdateProfilePhoto',
    title: 'Mobile Avatar Upload',
    description: 'Allow capturing selfie or uploading custom employee photo.',
    icon: Camera,
  },
];

export const AppPermissionsTab: React.FC<AppPermissionsTabProps> = ({
  users,
  loading,
  onUpdatePermissions,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [localPermissions, setLocalPermissions] = useState<IEmployeeAppPermissions | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppUserRole>('Standard');
  const [saving, setSaving] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Sync state when selected user changes
  React.useEffect(() => {
    if (selectedUser) {
      setLocalPermissions(selectedUser.permissions || ROLE_TEMPLATES.Standard);
      setSelectedRole(selectedUser.role || 'Standard');
    }
  }, [selectedUser]);

  const handleTogglePermission = (key: keyof IEmployeeAppPermissions) => {
    if (!localPermissions) return;
    setLocalPermissions({
      ...localPermissions,
      [key]: !localPermissions[key],
    });
  };

  const handleApplyRolePreset = (role: AppUserRole) => {
    setSelectedRole(role);
    setLocalPermissions(ROLE_TEMPLATES[role]);
  };

  const handleSave = async () => {
    if (!selectedUser || !localPermissions) return;
    try {
      setSaving(true);
      await onUpdatePermissions(selectedUser.id, localPermissions, selectedRole);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Select Employee</h4>
            <p className="text-xs text-slate-500">Choose an employee to customize mobile capabilities.</p>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {users.map((u) => {
              const isSelected = (selectedUser && selectedUser.id === u.id) || selectedUserId === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setLocalPermissions(u.permissions);
                    setSelectedRole(u.role);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50/80 border-[#004848] shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#004848]' : 'text-slate-900'}`}>
                        {u.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{u.department} &bull; {u.role}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#004848] shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Permissions Matrix */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
          {selectedUser && localPermissions ? (
            <>
              {/* Header with user info & Save button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                    alt={selectedUser.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedUser.fullName}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.designation} &bull; ID: {selectedUser.employeeId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
                  </button>
                </div>
              </div>

              {/* Role Preset Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">Apply Role Template Preset:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(['Standard', 'Manager', 'Field_Staff', 'Executive', 'Admin'] as AppUserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleApplyRolePreset(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedRole === r
                          ? 'bg-[#004848] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {PERMISSION_METADATA.map((item) => {
                  const Icon = item.icon;
                  const isEnabled = localPermissions[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleTogglePermission(item.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isEnabled
                          ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg mt-0.5 ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleTogglePermission(item.key)}
                          className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848] cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>Select a user to inspect and modify mobile permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
