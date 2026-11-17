import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Plus,
  Eye,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Check,
  Building2,
  CalendarDays,
  TagIcon,
  Loader2,
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
  Send,
  ArrowRight,
  PackageCheck,
  History,
  Paperclip,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  miscellaneousRequestService,
  MiscRequestItem,
  MiscRequestSummary,
  MiscRequestAuditEntry,
} from '../../services/miscellaneousRequestService';

// ========================= CONSTANTS =========================

const REQUEST_TYPES = [
  'All Types',
  'Office Equipment',
  'Software License',
  'Travel Reimbursement',
  'Training Request',
  'Facility Repair',
  'Remote Work Setup',
  'Document Services',
  'Other',
];

const DEPARTMENTS = [
  'All Departments',
  'Marketing',
  'Engineering',
  'Finance',
  'HR',
  'Operations',
  'Sales',
  'Design',
  'Legal',
];

const STATUS_OPTIONS = [
  'All',
  'Pending',
  'In Review',
  'Approved',
  'Rejected',
  'Processed',
];

const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

// ========================= STATUS BADGE =========================

export const StatusBadge: React.FC<{ status: MiscRequestItem['status'] }> = ({ status }) => {
  const cfg: Record<
    MiscRequestItem['status'],
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    Approved: {
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Approved',
    },
    'In Review': {
      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Clock className="h-3 w-3" />,
      label: 'In Review',
    },
    Pending: {
      cls: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="h-3 w-3" />,
      label: 'Pending',
    },
    Rejected: {
      cls: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Rejected',
    },
    Processed: {
      cls: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: <PackageCheck className="h-3 w-3" />,
      label: 'Processed',
    },
  };

  const current = cfg[status] || cfg['Pending'];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${current.cls}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: MiscRequestItem['priority'] }> = ({ priority }) => {
  const cfg: Record<MiscRequestItem['priority'], string> = {
    High: 'bg-rose-50 text-rose-600 border-rose-200',
    Medium: 'bg-blue-50 text-blue-600 border-blue-200',
    Low: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
        cfg[priority] || cfg['Medium']
      }`}
    >
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

// ========================= CREATE / EDIT MODAL =========================

interface RequestModalProps {
  mode: 'create' | 'edit';
  request?: MiscRequestItem;
  onClose: () => void;
  onSubmitSuccess: (item: MiscRequestItem) => void;
}

const RequestFormModal: React.FC<RequestModalProps> = ({ mode, request, onClose, onSubmitSuccess }) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(request?.name || '');
  const [email, setEmail] = useState(request?.email || '');
  const [dept, setDept] = useState(request?.dept || 'Engineering');
  const [type, setType] = useState(request?.type || 'Office Equipment');
  const [title, setTitle] = useState(request?.title || '');
  const [priority, setPriority] = useState<MiscRequestItem['priority']>(request?.priority || 'Medium');
  const [requiredDate, setRequiredDate] = useState(request?.requiredDate || '');
  const [description, setDescription] = useState(request?.description || '');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [attachments, setAttachments] = useState<string[]>(request?.attachments || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Employee name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required';
    if (!description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddAttachment = () => {
    if (attachmentInput.trim()) {
      setAttachments([...attachments, attachmentInput.trim()]);
      setAttachmentInput('');
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (mode === 'create') {
        const created = await miscellaneousRequestService.create({
          name,
          employee: name,
          email,
          dept,
          department: dept,
          type,
          requestType: type,
          title: title.trim() || undefined,
          priority,
          status: 'Pending',
          requiredDate: requiredDate || undefined,
          description,
          attachments,
          date: new Date().toISOString().split('T')[0],
        });
        toast.success(`Request ${created.requestId || created.id} submitted successfully!`);
        onSubmitSuccess(created);
      } else if (mode === 'edit' && request) {
        const updated = await miscellaneousRequestService.update(request.id, {
          name,
          employee: name,
          email,
          dept,
          department: dept,
          type,
          requestType: type,
          title: title.trim() || undefined,
          priority,
          requiredDate: requiredDate || undefined,
          description,
          attachments,
        });
        toast.success(`Request ${request.requestId || request.id} updated successfully!`);
        onSubmitSuccess(updated);
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              {mode === 'create' ? <Plus className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {mode === 'create' ? 'Create Miscellaneous Request' : 'Edit Request'}
              </h2>
              {request?.requestId && (
                <span className="text-[10px] text-white/70 font-mono">{request.requestId}</span>
              )}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee Name <span className="text-rose-500">*</span>
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
                onChange={(e) => setPriority(e.target.value as MiscRequestItem['priority'])}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Required By Date</label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Business Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete justification and details regarding this request..."
              className={`w-full px-3 py-2 text-xs rounded-xl border ${
                errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              } focus:outline-hidden focus:border-[#004848] transition-all`}
            />
            {errors.description && (
              <p className="text-[10px] text-rose-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supporting Reference / URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                placeholder="e.g. https://store.example.com/item or doc-ref-102"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-2 text-xs font-bold text-[#004848] bg-[#004848]/10 hover:bg-[#004848]/20 rounded-xl transition-all"
              >
                Add
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-700 border border-slate-200"
                  >
                    <Paperclip className="h-3 w-3 text-slate-400" />
                    <span className="max-w-[200px] truncate">{att}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#003636] to-[#004848] hover:opacity-95 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{mode === 'create' ? 'Submit Request' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========================= VIEW DETAILS & WORKFLOW MODAL =========================

interface ViewDetailsModalProps {
  request: MiscRequestItem;
  onClose: () => void;
  onStatusChange: (updated: MiscRequestItem) => void;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ request, onClose, onStatusChange }) => {
  const toast = useToast();
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<'approve' | 'reject' | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  const handleStartReview = async () => {
    try {
      setLoadingAction(true);
      const updated = await miscellaneousRequestService.startReview(
        request.id,
        'HR Reviewer',
        'Review started'
      );
      toast.success(`Request ${request.requestId} moved to In Review`);
      onStatusChange(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start review');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApproveConfirm = async () => {
    try {
      setLoadingAction(true);
      const updated = await miscellaneousRequestService.approve(
        request.id,
        'HR Director',
        remarksInput.trim() || undefined
      );
      toast.success(`Request ${request.requestId} approved!`);
      setActiveActionModal(null);
      setRemarksInput('');
      onStatusChange(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!remarksInput.trim()) {
      setRejectReasonError('Rejection reason is required');
      return;
    }
    try {
      setLoadingAction(true);
      const updated = await miscellaneousRequestService.reject(
        request.id,
        remarksInput.trim(),
        'HR Director'
      );
      toast.success(`Request ${request.requestId} rejected.`);
      setActiveActionModal(null);
      setRemarksInput('');
      onStatusChange(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleProcessConfirm = async () => {
    try {
      setLoadingAction(true);
      const updated = await miscellaneousRequestService.process(
        request.id,
        'Fulfillment Desk',
        'Order placed and fulfilled.'
      );
      toast.success(`Request ${request.requestId} fulfilled!`);
      onStatusChange(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process request');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Request Details</h2>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                  {request.requestId}
                </span>
              </div>
              <p className="text-[11px] text-white/70">
                Submitted on {request.date || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {/* Key Metric Highlights Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Status:</span>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Priority:</span>
              <PriorityBadge priority={request.priority} />
            </div>
            {request.requiredDate && (
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <span>Required By: {request.requiredDate}</span>
              </div>
            )}
          </div>

          {/* Employee & Dept Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-white rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Employee
              </span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{request.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{request.email || 'No email'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Department
              </span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{request.dept}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Request Type
              </span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">{request.type}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Created By
              </span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">
                {request.createdBy || request.name}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Description & Justification
            </span>
            <div className="mt-1 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-normal">
              {request.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Attachments & References ({request.attachments.length})
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {request.attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                  >
                    <Paperclip className="h-3 w-3 text-slate-400" />
                    <span>{att}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Approval Remarks or Rejection Reason Banner */}
          {request.status === 'Approved' && (request.approvalRemarks || request.reviewerName) && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Approval Remarks</span>
                {request.reviewerName && (
                  <span className="text-[10px] text-emerald-700 font-normal">
                    — by {request.reviewerName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-800">
                {request.approvalRemarks || 'Approved for procurement.'}
              </p>
            </div>
          )}

          {request.status === 'Rejected' && (
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>Rejection Reason</span>
                {request.reviewerName && (
                  <span className="text-[10px] text-rose-700 font-normal">
                    — reviewed by {request.reviewerName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-800">
                {request.rejectionReason || request.comments || 'Request declined by reviewer.'}
              </p>
            </div>
          )}

          {request.status === 'Processed' && (
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <PackageCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>Fulfilled & Processed</span>
                {request.processedBy && (
                  <span className="text-[10px] text-teal-700 font-normal">
                    — by {request.processedBy}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-800">
                {request.processedAt ? `Processed on ${request.processedAt}` : 'Request completed.'}
              </p>
            </div>
          )}

          {/* Audit History Timeline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-700 text-xs">
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Audit History & Lifecycle</span>
            </div>
            {request.auditHistory && request.auditHistory.length > 0 ? (
              <div className="relative pl-5 border-l-2 border-slate-100 space-y-3.5 my-2">
                {request.auditHistory.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#004848] flex items-center justify-center" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{entry.action}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {entry.newStatus}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        by <strong className="text-slate-700">{entry.changedBy}</strong>
                        {entry.remarks ? ` — ${entry.remarks}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center text-[11px]">
                No explicit audit logs recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Action buttons depending on state */}
            {request.status === 'Pending' && (
              <button
                type="button"
                onClick={handleStartReview}
                disabled={loadingAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-all cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Start Review</span>
              </button>
            )}

            {(request.status === 'Pending' || request.status === 'In Review') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRemarksInput('');
                    setRejectReasonError('');
                    setActiveActionModal('approve');
                  }}
                  disabled={loadingAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRemarksInput('');
                    setRejectReasonError('');
                    setActiveActionModal('reject');
                  }}
                  disabled={loadingAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {request.status === 'Approved' && (
              <button
                type="button"
                onClick={handleProcessConfirm}
                disabled={loadingAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Mark as Processed / Fulfilled</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Sub-Modal: Approve with Remarks or Reject with Reason */}
        {activeActionModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800">
                  {activeActionModal === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
                <button
                  onClick={() => setActiveActionModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeActionModal === 'approve'
                    ? 'Approval Remarks (Optional)'
                    : 'Reason for Rejection *'}
                </label>
                <textarea
                  rows={3}
                  value={remarksInput}
                  onChange={(e) => {
                    setRemarksInput(e.target.value);
                    if (rejectReasonError) setRejectReasonError('');
                  }}
                  placeholder={
                    activeActionModal === 'approve'
                      ? 'Add any comments or procurement notes...'
                      : 'Please specify the exact reason for rejecting this request...'
                  }
                  className={`w-full p-2.5 text-xs rounded-xl border ${
                    rejectReasonError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  } focus:outline-hidden focus:border-[#004848]`}
                />
                {rejectReasonError && (
                  <p className="text-[10px] text-rose-500 mt-1">{rejectReasonError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={
                    activeActionModal === 'approve'
                      ? handleApproveConfirm
                      : handleRejectConfirm
                  }
                  disabled={loadingAction}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                    activeActionModal === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {loadingAction ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================= DELETE CONFIRMATION MODAL =========================

interface DeleteModalProps {
  request: MiscRequestItem;
  onConfirm: (id: string) => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ request, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600">
        <Trash2 className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Delete Request?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Are you sure you want to permanently delete{' '}
          <span className="font-bold text-slate-700">{request.requestId || request.id}</span> submitted
          by <span className="font-bold text-slate-700">{request.name}</span>?
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(request.id)}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>Delete</span>
        </button>
      </div>
    </div>
  </div>
);

// ========================= MAIN COMPONENT =========================

export const MiscellaneousRequestPage: React.FC = () => {
  const toast = useToast();

  const [requests, setRequests] = useState<MiscRequestItem[]>([]);
  const [summary, setSummary] = useState<MiscRequestSummary>({
    total: 0,
    pending: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
    processed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [deptFilter, setDeptFilter] = useState('All Departments');

  const [selectedRequest, setSelectedRequest] = useState<MiscRequestItem | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MiscRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allRequests, summaryData] = await Promise.all([
        miscellaneousRequestService.getAll(),
        miscellaneousRequestService.getSummary(),
      ]);
      setRequests(allRequests);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to load miscellaneous requests:', err);
      toast.error('Could not load requests from server');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending' && r.status !== 'Pending') return false;
        if (statusFilter === 'In Review' && r.status !== 'In Review') return false;
        if (statusFilter === 'Approved' && r.status !== 'Approved') return false;
        if (statusFilter === 'Rejected' && r.status !== 'Rejected') return false;
        if (statusFilter === 'Processed' && r.status !== 'Processed') return false;
      }
      if (priorityFilter !== 'All' && r.priority !== priorityFilter) return false;
      if (typeFilter !== 'All Types' && r.type !== typeFilter) return false;
      if (deptFilter !== 'All Departments' && r.dept !== deptFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.requestId.toLowerCase().includes(q) ||
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

  const handleCreateSuccess = (newReq: MiscRequestItem) => {
    setRequests((prev) => [newReq, ...prev]);
    setSummary((prev) => ({
      ...prev,
      total: prev.total + 1,
      pending: prev.pending + 1,
    }));
    setModalMode(null);
  };

  const handleUpdateSuccess = (updated: MiscRequestItem) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRequest && selectedRequest.id === updated.id) {
      setSelectedRequest(updated);
    }
    setModalMode(null);
    miscellaneousRequestService.getSummary().then(setSummary).catch(() => {});
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      setIsDeleting(true);
      await miscellaneousRequestService.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setDeleteTarget(null);
      toast.success('Request deleted.');
      miscellaneousRequestService.getSummary().then(setSummary).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete request');
    } finally {
      setIsDeleting(false);
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
              Support & Employee Requests
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">
              Miscellaneous Requests
            </h1>
            <p className="text-xs text-white/80 max-w-xl">
              Track, review, approve, and fulfill employee hardware, software licenses, travel, and
              administrative miscellaneous requests.
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
          onClick={() => {
            setStatusFilter('All');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'All'
              ? 'border-[#004848] shadow-md ring-2 ring-[#004848]/10'
              : 'border-slate-100 hover:border-slate-200'
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
            <h3 className="text-2xl font-extrabold text-slate-800">{summary.total}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Total Requests</p>
            <span className="text-[10px] text-slate-400">All submissions</span>
          </div>
        </div>

        {/* Pending & In Review */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'Pending' ? 'In Review' : 'Pending');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Pending' || statusFilter === 'In Review'
              ? 'border-amber-500 shadow-md ring-2 ring-amber-500/10'
              : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {summary.inReview > 0 ? `${summary.inReview} Reviewing` : 'Awaiting Action'}
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">
              {summary.pending + (summary.inReview || 0)}
            </h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Pending & In Review</p>
            <span className="text-[10px] text-slate-400">
              {summary.pending} pending, {summary.inReview || 0} in review
            </span>
          </div>
        </div>

        {/* Approved & Processed */}
        <div
          onClick={() => {
            setStatusFilter('Approved');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Approved' || statusFilter === 'Processed'
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
              : 'border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Approved
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">
              {summary.approved + (summary.processed || 0)}
            </h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Approved & Processed</p>
            <span className="text-[10px] text-slate-400">
              {summary.approved} approved, {summary.processed || 0} fulfilled
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => {
            setStatusFilter('Rejected');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
            statusFilter === 'Rejected'
              ? 'border-rose-500 shadow-md ring-2 ring-rose-500/10'
              : 'border-slate-100 hover:border-slate-200'
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
            <h3 className="text-2xl font-extrabold text-slate-800">{summary.rejected}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Rejected</p>
            <span className="text-[10px] text-slate-400">Declined submissions</span>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by employee, request ID, department, or keyword..."
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
              options={STATUS_OPTIONS}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />

            <FilterDropdown
              label="Request Type"
              value={typeFilter}
              options={REQUEST_TYPES}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              icon={<TagIcon className="h-3 w-3 opacity-60" />}
            />

            <FilterDropdown
              label="Department"
              value={deptFilter}
              options={DEPARTMENTS}
              onChange={(val) => {
                setDeptFilter(val);
                setCurrentPage(1);
              }}
              icon={<Building2 className="h-3 w-3 opacity-60" />}
            />

            <FilterDropdown
              label="Priority"
              value={priorityFilter}
              options={PRIORITY_OPTIONS}
              onChange={(val) => {
                setPriorityFilter(val);
                setCurrentPage(1);
              }}
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
            Showing <strong className="text-slate-800">{filtered.length}</strong> matching requests
          </span>
          <span className="text-[10px] text-slate-400">
            Click any row to view full details and history
          </span>
        </div>
      </div>

      {/* ================= DATA TABLE ================= */}
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
                      <span className="text-xs font-semibold text-slate-600">
                        Loading requests from server...
                      </span>
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
                        Try adjusting your search query or reset filter settings.
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
                    <td className="py-3 px-4 font-mono font-bold text-[#004848]">
                      {req.requestId || req.id}
                    </td>
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
                        <span>{req.date}</span>
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
                          onClick={() => {
                            setSelectedRequest(req);
                            setModalMode('view');
                          }}
                          title="View Details & Workflow"
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-[#004848] hover:border-teal-200 transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setModalMode('edit');
                          }}
                          title="Edit Request"
                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5" />
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
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} requests
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
                    p === currentPage
                      ? 'bg-[#004848] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
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
      {(modalMode === 'create' || modalMode === 'edit') && (
        <RequestFormModal
          mode={modalMode}
          request={selectedRequest}
          onClose={() => {
            setModalMode(null);
            setSelectedRequest(undefined);
          }}
          onSubmitSuccess={(item) => {
            if (modalMode === 'create') handleCreateSuccess(item);
            else handleUpdateSuccess(item);
          }}
        />
      )}

      {modalMode === 'view' && selectedRequest && (
        <ViewDetailsModal
          request={selectedRequest}
          onClose={() => {
            setModalMode(null);
            setSelectedRequest(undefined);
          }}
          onStatusChange={handleUpdateSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          request={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default MiscellaneousRequestPage;
