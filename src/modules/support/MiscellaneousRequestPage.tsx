import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Phone,
  Mail,
  Plus,
  Eye,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Check,
  RefreshCw,
  Building2,
  CalendarDays,
  TagIcon,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { miscellaneousRequestService } from '../../services/miscellaneousRequestService';

// ========================= TYPES =========================

interface MiscRequest {
  id: string;
  name: string;
  dept: string;
  type: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  priority: 'High' | 'Medium' | 'Low';
  description?: string;
  email?: string;
}

type StatusFilter = 'All' | 'Approved' | 'Pending' | 'Rejected';
type PriorityFilter = 'All' | 'High' | 'Medium' | 'Low';

// ========================= INITIAL DATA =========================

const INITIAL_REQUESTS: MiscRequest[] = [
  { id: 'REQ-001', name: 'Sarah Johnson',   dept: 'Marketing',     type: 'Office Equipment',     date: '2025-07-20', status: 'Approved', priority: 'High',   description: 'Request for a new ergonomic chair and dual monitor setup.', email: 'sarah.j@company.com' },
  { id: 'REQ-002', name: 'Michael Torres',  dept: 'Engineering',   type: 'Software License',     date: '2025-07-22', status: 'Pending',  priority: 'Medium', description: 'Requesting JetBrains All-products pack annual license.', email: 'michael.t@company.com' },
  { id: 'REQ-003', name: 'Priya Nair',      dept: 'Finance',       type: 'Travel Reimbursement', date: '2025-07-23', status: 'Rejected', priority: 'Low',    description: 'Expense claim for client site visit on July 18.', email: 'priya.n@company.com' },
  { id: 'REQ-004', name: 'James Walker',    dept: 'HR',            type: 'Training Request',     date: '2025-07-24', status: 'Approved', priority: 'High',   description: 'External leadership training program enrollment.', email: 'james.w@company.com' },
  { id: 'REQ-005', name: 'Aisha Patel',     dept: 'Operations',    type: 'Facility Repair',      date: '2025-07-25', status: 'Approved', priority: 'High',   description: 'Conference room projector replacement required urgently.', email: 'aisha.p@company.com' },
  { id: 'REQ-006', name: 'Carlos Mendez',   dept: 'Sales',         type: 'Office Equipment',     date: '2025-07-26', status: 'Pending',  priority: 'High',   description: 'Laptop upgrade request for field sales activities.', email: 'carlos.m@company.com' },
  { id: 'REQ-007', name: 'Nadia Kim',       dept: 'Design',        type: 'Software License',     date: '2025-07-27', status: 'Approved', priority: 'Medium', description: 'Adobe Creative Cloud subscription renewal.', email: 'nadia.k@company.com' },
  { id: 'REQ-008', name: 'Ethan Brooks',    dept: 'Engineering',   type: 'Remote Work Setup',    date: '2025-07-28', status: 'Approved', priority: 'High',   description: 'Home office allowance for remote workstation.', email: 'ethan.b@company.com' },
  { id: 'REQ-009', name: 'Fatima Al-Hassan', dept: 'Legal',        type: 'Document Services',    date: '2025-07-30', status: 'Pending',  priority: 'Low',    description: 'Notarization of employment verification letters.', email: 'fatima.a@company.com' },
  { id: 'REQ-010', name: 'Lucas Rivera',    dept: 'Marketing',     type: 'Training Request',     date: '2025-08-01', status: 'Rejected', priority: 'Medium', description: 'LinkedIn Learning subscription request.', email: 'lucas.r@company.com' },
];

const REQUEST_TYPES = ['All Types', 'Office Equipment', 'Software License', 'Travel Reimbursement', 'Training Request', 'Facility Repair', 'Remote Work Setup', 'Document Services'];
const DEPARTMENTS   = ['All Departments', 'Marketing', 'Engineering', 'Finance', 'HR', 'Operations', 'Sales', 'Design', 'Legal'];

// ========================= STATUS BADGE =========================

const StatusBadge: React.FC<{ status: MiscRequest['status'] }> = ({ status }) => {
  const cfg: Record<MiscRequest['status'], { cls: string; icon: React.ReactNode; label: string }> = {
    Approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
    Pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: <Clock className="h-3 w-3" />,         label: 'Pending' },
    Rejected: { cls: 'bg-rose-50 text-rose-700 border-rose-200',          icon: <XCircle className="h-3 w-3" />,        label: 'Rejected' },
  };
  const { cls, icon, label } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cls}`}>
      {icon}{label}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: MiscRequest['priority'] }> = ({ priority }) => {
  const cfg: Record<MiscRequest['priority'], string> = {
    High:   'bg-rose-50 text-rose-600 border-rose-200',
    Medium: 'bg-blue-50 text-blue-600 border-blue-200',
    Low:    'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg[priority]}`}>
      {priority}
    </span>
  );
};

// ========================= DROPDOWN FILTER =========================

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, value, options, onChange, icon }) => {
  const [open, setOpen] = useState(false);
  const displayLabel = value.startsWith('All') ? label : value;
  const isSelected = !value.startsWith('All');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
          isSelected
            ? 'bg-[#004848]/10 border-[#004848] text-[#004848] font-bold'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        {icon}
        <span>{displayLabel}</span>
        <ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1.5 z-40 min-w-[160px] bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-xs">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  opt === value ? 'text-[#004848] font-bold bg-[#004848]/5' : 'text-slate-700'
                }`}
              >
                <span>{opt}</span>
                {opt === value && <Check className="h-3.5 w-3.5 text-[#004848]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ========================= REQUEST MODAL =========================

interface RequestModalProps {
  mode: 'create' | 'view' | 'edit';
  request?: MiscRequest;
  onClose: () => void;
  onCreate?: (req: Omit<MiscRequest, 'id'>) => void;
  onUpdate?: (req: MiscRequest) => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ mode, request, onClose, onCreate, onUpdate }) => {
  const [name, setName] = useState(request?.name || '');
  const [email, setEmail] = useState(request?.email || '');
  const [dept, setDept] = useState(request?.dept || 'Engineering');
  const [type, setType] = useState(request?.type || 'Office Equipment');
  const [priority, setPriority] = useState<MiscRequest['priority']>(request?.priority || 'Medium');
  const [status, setStatus] = useState<MiscRequest['status']>(request?.status || 'Pending');
  const [description, setDescription] = useState(request?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Employee name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required';
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') { onClose(); return; }
    if (!validate()) return;

    if (mode === 'create' && onCreate) {
      onCreate({
        name,
        email,
        dept,
        type,
        priority,
        status: 'Pending',
        description,
        date: new Date().toISOString().split('T')[0],
      });
    } else if (mode === 'edit' && onUpdate && request) {
      onUpdate({
        ...request,
        name,
        email,
        dept,
        type,
        priority,
        status,
        description,
      });
    }
  };

  const title = mode === 'create' ? 'Create Miscellaneous Request' : mode === 'edit' ? 'Edit Request' : 'Request Details';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">{title}</h2>
              {request?.id && <span className="text-[10px] text-white/70 font-mono">{request.id}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {mode === 'view' ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Employee</span>
                  <p className="font-bold text-slate-800 mt-0.5">{request?.name}</p>
                  <p className="text-[11px] text-slate-500">{request?.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Department</span>
                  <p className="font-bold text-slate-800 mt-0.5">{request?.dept}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Request Type</span>
                  <p className="font-bold text-slate-800 mt-0.5">{request?.type}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date Submitted</span>
                  <p className="font-bold text-slate-800 mt-0.5">{request?.date}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Priority</span>
                  <div className="mt-1">
                    {request && <PriorityBadge priority={request.priority} />}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Status</span>
                  <div className="mt-1">
                    {request && <StatusBadge status={request.status} />}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Description / Details</span>
                <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {request?.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-hidden focus:border-[#004848] transition-all`}
                />
                {errors.name && <p className="text-[10px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.j@company.com"
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-hidden focus:border-[#004848] transition-all`}
                />
                {errors.email && <p className="text-[10px] text-rose-500 mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    {DEPARTMENTS.filter((d) => !d.startsWith('All')).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Request Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    {REQUEST_TYPES.filter((t) => !t.startsWith('All')).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MiscRequest['priority'])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {mode === 'edit' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as MiscRequest['status'])}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information regarding your request..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-hidden focus:border-[#004848] transition-all`}
                />
                {errors.description && <p className="text-[10px] text-rose-500 mt-1">{errors.description}</p>}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#003636] to-[#004848] hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                {mode === 'create' ? 'Create Request' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================= DELETE MODAL =========================

interface DeleteModalProps {
  request: MiscRequest;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ request, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
        <Trash2 className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Delete Request?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Are you sure you want to delete <span className="font-bold text-slate-700">{request.id}</span> submitted by{' '}
          <span className="font-bold text-slate-700">{request.name}</span>?
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(request.id)}
          className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ========================= MAIN COMPONENT =========================

export const MiscellaneousRequestPage: React.FC = () => {
  const toast = useToast();

  const [requests, setRequests] = useState<MiscRequest[]>(INITIAL_REQUESTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  const [selectedRequest, setSelectedRequest] = useState<MiscRequest | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MiscRequest | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await miscellaneousRequestService.getAll();
      if (data && data.length > 0) {
        setRequests(data as any);
      }
    } catch (err) {
      console.error('Failed to load miscellaneous requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Counts
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;

  // Filtering
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && r.priority !== priorityFilter) return false;
      if (typeFilter !== 'All Types' && r.type !== typeFilter) return false;
      if (deptFilter !== 'All Departments' && r.dept !== deptFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.dept.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.email && r.email.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [requests, statusFilter, priorityFilter, typeFilter, deptFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleCreate = async (newReq: Omit<MiscRequest, 'id'>) => {
    try {
      const created = await miscellaneousRequestService.create(newReq as any);
      setRequests([created as any, ...requests]);
      setModalMode(null);
      toast.success(`Request ${created.requestId || created.id} submitted successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  const handleUpdate = async (updated: MiscRequest) => {
    try {
      const saved = await miscellaneousRequestService.update(updated.id, updated as any);
      setRequests(requests.map((r) => (r.id === updated.id ? (saved as any) : r)));
      setModalMode(null);
      setSelectedRequest(undefined);
      toast.success(`Request ${updated.id} updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update request');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await miscellaneousRequestService.delete(id);
      setRequests(requests.filter((r) => r.id !== id));
      setDeleteTarget(null);
      toast.success(`Request ${id} deleted.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete request');
    }
  };

  const hasActiveFilters =
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    typeFilter !== 'All Types' ||
    deptFilter !== 'All Departments' ||
    search.trim() !== '';

  const resetFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setTypeFilter('All Types');
    setDeptFilter('All Departments');
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER BANNER ================= */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#002f2f] via-[#004848] to-[#005e5e] p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-white/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold text-teal-100 uppercase tracking-wide">
              <HelpCircle className="h-3 w-3" />
              Support Center
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Support & Miscellaneous Requests</h1>
            <p className="text-xs text-white/80 max-w-xl">
              Manage employee support requests, track statuses, and process approvals.
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedRequest(undefined);
              setModalMode('create');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#004848] text-xs font-extrabold hover:bg-slate-50 shadow-md hover:shadow-lg transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="h-4 w-4 text-[#004848]" />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {/* ================= STATS SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Requests */}
        <div
          onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'All' ? 'border-[#004848] shadow-md ring-2 ring-[#004848]/10' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#004848]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Active
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{totalCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Total Requests</p>
            <span className="text-[10px] text-slate-400">All time submissions</span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => { setStatusFilter('Pending'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Pending' ? 'border-amber-500 shadow-md ring-2 ring-amber-500/10' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              In Review
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{pendingCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Pending Review</p>
            <span className="text-[10px] text-slate-400">Awaiting action</span>
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => { setStatusFilter('Approved'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Approved' ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Processed
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{approvedCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Approved</p>
            <span className="text-[10px] text-slate-400">Successfully processed</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => { setStatusFilter('Rejected'); setCurrentPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Rejected' ? 'border-rose-500 shadow-md ring-2 ring-rose-500/10' : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              Declined
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{rejectedCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Rejected</p>
            <span className="text-[10px] text-slate-400">Declined requests</span>
          </div>
        </div>
      </div>

      {/* ================= FILTER TOOLBAR ================= */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, type, department, or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#004848] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={['All', 'Approved', 'Pending', 'Rejected']}
              onChange={(val) => { setStatusFilter(val as StatusFilter); setCurrentPage(1); }}
            />

            <FilterDropdown
              label="Request Type"
              value={typeFilter}
              options={REQUEST_TYPES}
              onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
              icon={<TagIcon className="h-3 w-3 opacity-60" />}
            />

            <FilterDropdown
              label="Department"
              value={deptFilter}
              options={DEPARTMENTS}
              onChange={(val) => { setDeptFilter(val); setCurrentPage(1); }}
              icon={<Building2 className="h-3 w-3 opacity-60" />}
            />

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
          <span>
            Showing <strong className="text-slate-800">{filtered.length}</strong> results
          </span>
          <span className="text-[10px] text-slate-400">Click any row to view full details</span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Request Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#004848]" />
                      <span className="text-xs font-semibold text-slate-600">Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <HelpCircle className="h-8 w-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">No requests found</p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search query or active filter settings.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setModalMode('view');
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#004848]">{req.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#003636] to-teal-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {req.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight group-hover:text-[#004848] transition-colors">
                            {req.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{req.dept}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{req.type}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-500 font-semibold">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        <span>{new Date(req.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setSelectedRequest(req); setModalMode('view'); }}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-[#004848] hover:border-teal-200 transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setSelectedRequest(req); setModalMode('edit'); }}
                          title="Edit Request"
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(req)}
                          title="Delete Request"
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
            <span className="text-[11px] text-slate-500 font-semibold">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} requests
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={`page-${p}`}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    p === currentPage ? 'bg-[#004848] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modalMode === 'create' || modalMode === 'view' || modalMode === 'edit') && (
        <RequestModal
          mode={modalMode}
          request={selectedRequest}
          onClose={() => { setModalMode(null); setSelectedRequest(undefined); }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          request={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default MiscellaneousRequestPage;
