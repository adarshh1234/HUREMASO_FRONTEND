import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Layers,
  History,
  FileText,
  Paperclip,
  Loader2,
  ArrowRight,
  Shield,
  User,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  associationService,
  AssociationItem,
  CreateAssociationData,
} from '../../services/associationService';

const ASSOCIATION_TYPES = [
  'All Types',
  'Project Collaboration',
  'Resource Sharing',
  'Internal Department',
  'Cross-Team',
  'External Entity',
  'Professional Guild',
  'Other',
];

const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Marketing',
  'Product Design',
  'Finance',
  'HR',
  'Operations',
  'Recruitment',
  'Sales',
  'Customer Success',
  'Legal',
];

export const NewAssociationRequestPage: React.FC = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<AssociationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewRequest, setViewRequest] = useState<AssociationItem | null>(null);
  const [confirmAcceptTarget, setConfirmAcceptTarget] = useState<AssociationItem | null>(null);
  const [confirmRejectTarget, setConfirmRejectTarget] = useState<AssociationItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState('');

  // Form State
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formTargetDept, setFormTargetDept] = useState('Marketing Department');
  const [formEntity, setFormEntity] = useState('Huremaso Global Tech');
  const [formAssocType, setFormAssocType] = useState('Project Collaboration');
  const [formDurationMonths, setFormDurationMonths] = useState(6);
  const [formDetails, setFormDetails] = useState('');
  const [formAttachmentInput, setFormAttachmentInput] = useState('');
  const [formAttachments, setFormAttachments] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const res = await associationService.getNewRequests({
          page,
          limit: 10,
          search: search.trim() || undefined,
          department: selectedDept !== 'All Departments' ? selectedDept : undefined,
          associationType: selectedType !== 'All Types' ? selectedType : undefined,
        });
        setRequests(res.requests);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } catch (err: any) {
        console.error('Failed to load new association requests', err);
        toast.error('Failed to load association requests from server.');
      } finally {
        setIsLoading(false);
      }
    },
    [toast, search, selectedDept, selectedType]
  );

  useEffect(() => {
    loadRequests(currentPage);
  }, [currentPage, loadRequests]);

  const handleAcceptConfirm = async () => {
    if (!confirmAcceptTarget) return;
    setActionInProgress(confirmAcceptTarget.id);
    try {
      await associationService.acceptRequest(
        confirmAcceptTarget.id,
        'System Admin',
        actionNotes.trim() || undefined
      );
      toast.success(`Accepted association request from ${confirmAcceptTarget.name || confirmAcceptTarget.employeeName}`);
      setConfirmAcceptTarget(null);
      setActionNotes('');
      if (viewRequest && viewRequest.id === confirmAcceptTarget.id) {
        setViewRequest(null);
      }
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('Failed to accept association request', err);
      toast.error(err.message || 'Failed to accept association request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!confirmRejectTarget) return;
    if (!actionNotes.trim()) {
      setRejectionReasonError('Please provide a reason for rejecting this request.');
      return;
    }
    setActionInProgress(confirmRejectTarget.id);
    try {
      await associationService.rejectRequest(
        confirmRejectTarget.id,
        actionNotes.trim(),
        'System Admin'
      );
      toast.info(`Cancelled/Rejected association request from ${confirmRejectTarget.name || confirmRejectTarget.employeeName}`);
      setConfirmRejectTarget(null);
      setActionNotes('');
      setRejectionReasonError('');
      if (viewRequest && viewRequest.id === confirmRejectTarget.id) {
        setViewRequest(null);
      }
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('Failed to cancel association request', err);
      toast.error(err.message || 'Failed to cancel association request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddAttachment = () => {
    if (formAttachmentInput.trim()) {
      setFormAttachments([...formAttachments, formAttachmentInput.trim()]);
      setFormAttachmentInput('');
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setFormAttachments(formAttachments.filter((_, i) => i !== idx));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formEmployeeName.trim()) errs.employeeName = 'Employee name is required.';
    if (!formDetails.trim() || formDetails.trim().length < 3) {
      errs.details = 'Request details must be at least 3 characters.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const data: CreateAssociationData = {
        employeeName: formEmployeeName.trim(),
        employeeId: formEmployeeId.trim() || undefined,
        requesterEmail: formEmail.trim() || undefined,
        department: formDept,
        targetDepartment: formTargetDept,
        associatedEntity: formEntity,
        associationType: formAssocType,
        durationMonths: formDurationMonths,
        requestDetails: formDetails.trim(),
        attachments: formAttachments,
      };

      await associationService.createRequest(data);
      toast.success('New association request submitted successfully!');
      setIsCreateModalOpen(false);
      resetCreateForm();
      setCurrentPage(1);
      await loadRequests(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit association request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setFormEmployeeName('');
    setFormEmployeeId('');
    setFormEmail('');
    setFormDept('Engineering');
    setFormTargetDept('Marketing Department');
    setFormEntity('Huremaso Global Tech');
    setFormAssocType('Project Collaboration');
    setFormDurationMonths(6);
    setFormDetails('');
    setFormAttachmentInput('');
    setFormAttachments([]);
    setFormErrors({});
  };

  const hasActiveFilters = search.trim() !== '' || selectedType !== 'All Types' || selectedDept !== 'All Departments';

  const resetFilters = () => {
    setSearch('');
    setSelectedType('All Types');
    setSelectedDept('All Departments');
    setCurrentPage(1);
  };

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 m-0">New Association Request</h1>
            {totalCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {totalCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and process pending inhouse resource sharing and departmental association requests.
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#004848] hover:bg-[#003636] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Request</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
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
              placeholder="Search by requester, department, or details..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-hidden focus:border-[#004848]"
            >
              {ASSOCIATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-hidden focus:border-[#004848]"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 bg-white border border-slate-200 rounded-xl">
          <Loader text="Loading new association requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <EmptyState
            title="No Pending Requests"
            description="There are currently no new association requests pending approval."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              {/* Header info */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-650 shrink-0">
                    <img
                      src={
                        req.requesterAvatar ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                      }
                      alt={req.name || req.employeeName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 leading-none">
                        {req.name || req.employeeName}
                      </h4>
                      {req.associationCode && (
                        <span className="text-[10px] font-mono font-bold text-[#004848] bg-[#004848]/5 px-1.5 py-0.5 rounded">
                          {req.associationCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {req.date || req.dateRequested}
                      </span>
                      {req.department && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          • {req.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {req.associationType || 'Collaboration'}
                  </span>
                  {req.targetDepartment && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      {req.targetDepartment}
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs font-bold text-slate-405 leading-relaxed">
                {req.text || req.requestDetails}
              </p>

              {/* Supporting References / Attachments */}
              {req.attachments && req.attachments.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {req.attachments.map((att, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium"
                    >
                      <Paperclip className="h-2.5 w-2.5 text-slate-400" />
                      {att}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons matching design exactly */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="px-6"
                    disabled={actionInProgress === req.id}
                    onClick={() => {
                      setActionNotes('');
                      setConfirmAcceptTarget(req);
                    }}
                  >
                    Accept
                  </Button>
                  <button
                    disabled={actionInProgress === req.id}
                    onClick={() => {
                      setActionNotes('');
                      setRejectionReasonError('');
                      setConfirmRejectTarget(req);
                    }}
                    className="px-6 py-2 border border-[#0473b8] hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg cursor-pointer transition-all bg-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  onClick={() => setViewRequest(req)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#004848] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && requests.length > 0 && totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pagesArray.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors ${
                currentPage === page
                  ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-sm'
                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================= MODAL: CREATE REQUEST ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">New Association Request</h2>
                  <p className="text-[10px] text-white/70">Submit an inhouse asset / department association request</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEmployeeName}
                    onChange={(e) => setFormEmployeeName(e.target.value)}
                    placeholder="e.g. Sarah Joseph"
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      formErrors.employeeName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    } focus:outline-hidden focus:border-[#004848]`}
                  />
                  {formErrors.employeeName && (
                    <p className="text-[10px] text-rose-500 mt-1">{formErrors.employeeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-1042"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requester Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Department / Asset
                  </label>
                  <input
                    type="text"
                    value={formTargetDept}
                    onChange={(e) => setFormTargetDept(e.target.value)}
                    placeholder="e.g. Marketing Department"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Association Type
                  </label>
                  <select
                    value={formAssocType}
                    onChange={(e) => setFormAssocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    {ASSOCIATION_TYPES.filter((t) => !t.startsWith('All')).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Months)
                  </label>
                  <select
                    value={formDurationMonths}
                    onChange={(e) => setFormDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purpose & Justification Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Describe the association scope, collaboration objectives, and resource requirements..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    formErrors.details ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-hidden focus:border-[#004848]`}
                />
                {formErrors.details && (
                  <p className="text-[10px] text-rose-500 mt-1">{formErrors.details}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attachments / References
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formAttachmentInput}
                    onChange={(e) => setFormAttachmentInput(e.target.value)}
                    placeholder="e.g. project-charter-doc or https://..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="px-3 py-2 text-xs font-bold text-[#004848] bg-[#004848]/10 hover:bg-[#004848]/20 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                {formAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formAttachments.map((att, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-700 border border-slate-200"
                      >
                        <Paperclip className="h-3 w-3 text-slate-400" />
                        <span>{att}</span>
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
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#003636] to-[#004848] hover:opacity-95 shadow-sm transition-all"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW DETAILS ================= */}
      {viewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Association Request Details</h3>
                  <span className="text-[10px] text-white/70 font-mono">
                    {viewRequest.associationCode || viewRequest.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewRequest(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Requester</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewRequest.name || viewRequest.employeeName}</p>
                  <p className="text-[10px] text-slate-500">{viewRequest.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Target Department</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewRequest.targetDepartment || 'General'}</p>
                  <p className="text-[10px] text-slate-500">{viewRequest.associatedEntity || 'Huremaso Global Tech'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Association Type</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewRequest.associationType}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date Requested</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewRequest.date || viewRequest.dateRequested}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Purpose & Justification</span>
                <p className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-semibold">
                  {viewRequest.text || viewRequest.requestDetails}
                </p>
              </div>

              {/* Audit History */}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-2">
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Audit History</span>
                </div>
                {viewRequest.history && viewRequest.history.length > 0 ? (
                  <div className="relative pl-5 border-l-2 border-slate-100 space-y-2.5 my-2">
                    {viewRequest.history.map((h, i) => (
                      <div key={i} className="relative text-[11px]">
                        <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#004848]" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{h.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          by <strong className="text-slate-700">{h.performedBy}</strong>
                          {h.details ? ` — ${h.details}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No audit records available.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  className="px-5"
                  onClick={() => {
                    setActionNotes('');
                    setConfirmAcceptTarget(viewRequest);
                  }}
                >
                  Accept Request
                </Button>
                <button
                  onClick={() => {
                    setActionNotes('');
                    setRejectionReasonError('');
                    setConfirmRejectTarget(viewRequest);
                  }}
                  className="px-5 py-2 border border-[#0473b8] hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg cursor-pointer bg-white"
                >
                  Cancel / Reject
                </button>
              </div>

              <button
                onClick={() => setViewRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIALOG: ACCEPT CONFIRMATION ================= */}
      {confirmAcceptTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3.5">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Accept Association Request</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to approve and activate the association request from{' '}
              <strong className="text-slate-800">{confirmAcceptTarget.name || confirmAcceptTarget.employeeName}</strong>?
              This will transition the record into an active inhouse association under <strong>Existing</strong>.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Approval Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add any activation notes or resource allotment details..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAcceptTarget(null)}
                disabled={actionInProgress !== null}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptConfirm}
                disabled={actionInProgress !== null}
                className="px-4 py-1.5 text-xs font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                {actionInProgress !== null ? 'Accepting...' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIALOG: REJECT CONFIRMATION ================= */}
      {confirmRejectTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3.5">
            <div className="flex items-center gap-2.5 text-rose-700">
              <XCircle className="h-5 w-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Reject Association Request</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to decline the association request from{' '}
              <strong className="text-slate-800">{confirmRejectTarget.name || confirmRejectTarget.employeeName}</strong>?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => {
                  setActionNotes(e.target.value);
                  if (rejectionReasonError) setRejectionReasonError('');
                }}
                placeholder="Specify the reason for declining this request..."
                className={`w-full p-2.5 text-xs rounded-xl border ${
                  rejectionReasonError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                } focus:outline-hidden focus:border-[#004848]`}
              />
              {rejectionReasonError && (
                <p className="text-[10px] text-rose-500 mt-1">{rejectionReasonError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRejectTarget(null)}
                disabled={actionInProgress !== null}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionInProgress !== null}
                className="px-4 py-1.5 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                {actionInProgress !== null ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAssociationRequestPage;
