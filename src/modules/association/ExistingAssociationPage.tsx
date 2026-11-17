import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Eye,
  Edit,
  RotateCw,
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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  associationService,
  AssociationItem,
  UpdateAssociationData,
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

export const ExistingAssociationPage: React.FC = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<AssociationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  // Modals
  const [viewItem, setViewItem] = useState<AssociationItem | null>(null);
  const [editItem, setEditItem] = useState<AssociationItem | null>(null);
  const [renewItem, setRenewItem] = useState<AssociationItem | null>(null);
  const [deactivateItem, setDeactivateItem] = useState<AssociationItem | null>(null);

  // Edit Form State
  const [editTargetDept, setEditTargetDept] = useState('');
  const [editEntity, setEditEntity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Renew Form State
  const [renewMonths, setRenewMonths] = useState(6);
  const [renewNotes, setRenewNotes] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  // Deactivate Form State
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadAssociations = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const res = await associationService.getExisting({
          page,
          limit: 10,
          search: search.trim() || undefined,
          department: selectedDept !== 'All Departments' ? selectedDept : undefined,
          associationType: selectedType !== 'All Types' ? selectedType : undefined,
        });
        setItems(res.associations);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } catch (err: any) {
        console.error('Failed to load existing associations', err);
        toast.error('Failed to load existing associations from server.');
      } finally {
        setIsLoading(false);
      }
    },
    [toast, search, selectedDept, selectedType]
  );

  useEffect(() => {
    loadAssociations(currentPage);
  }, [currentPage, loadAssociations]);

  const openEditModal = (item: AssociationItem) => {
    setEditItem(item);
    setEditTargetDept(item.targetDepartment || 'Marketing Department');
    setEditEntity(item.associatedEntity || 'Huremaso Global Tech');
    setEditNotes(item.notes || '');
    setEditExpiryDate(item.expiryDate || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      setIsUpdating(true);
      const updateData: UpdateAssociationData = {
        targetDepartment: editTargetDept,
        associatedEntity: editEntity,
        notes: editNotes,
        expiryDate: editExpiryDate || undefined,
        performedBy: 'System Admin',
      };
      await associationService.updateExisting(editItem.id, updateData);
      toast.success(`Updated association for ${editItem.name || editItem.employeeName}`);
      setEditItem(null);
      await loadAssociations(currentPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update association');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewItem) return;

    try {
      setIsRenewing(true);
      await associationService.renewExisting(
        renewItem.id,
        renewMonths,
        undefined,
        renewNotes.trim() || undefined,
        'System Admin'
      );
      toast.success(`Renewed and extended association for ${renewItem.name || renewItem.employeeName}`);
      setRenewItem(null);
      setRenewNotes('');
      await loadAssociations(currentPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to renew association');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateItem) return;

    try {
      setIsDeactivating(true);
      await associationService.cancelExisting(
        deactivateItem.id,
        deactivateReason.trim() || 'Association cancelled by administrator',
        'System Admin'
      );
      toast.info(`Cancelled/Deactivated association for ${deactivateItem.name || deactivateItem.employeeName}`);
      setDeactivateItem(null);
      setDeactivateReason('');
      if (viewItem && viewItem.id === deactivateItem.id) {
        setViewItem(null);
      }
      await loadAssociations(currentPage);
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel existing association');
    } finally {
      setIsDeactivating(false);
    }
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
            <h1 className="text-xl font-bold text-slate-900 m-0">Existing</h1>
            {totalCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalCount} Active Associations
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage active inhouse departmental associations, resource allotments, and renewals.
          </p>
        </div>
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
              placeholder="Search active associations by employee, department, code..."
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
          <Loader text="Loading existing associations..." />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <EmptyState
            title="No Existing Associations"
            description="There are currently no active inhouse associations."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              {/* Header info */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-650 shrink-0">
                    <img
                      src={
                        item.requesterAvatar ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                      }
                      alt={item.name || item.employeeName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 leading-none">
                        {item.name || item.employeeName}
                      </h4>
                      {item.associationCode && (
                        <span className="text-[10px] font-mono font-bold text-[#004848] bg-[#004848]/5 px-1.5 py-0.5 rounded">
                          {item.associationCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {item.date || item.dateRequested}
                      </span>
                      {item.department && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          • {item.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {item.associationType || 'Collaboration'}
                  </span>
                  {item.targetDepartment && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                      {item.targetDepartment}
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs font-bold text-slate-405 leading-relaxed">
                {item.text || item.requestDetails}
              </p>

              {/* Metadata Highlights */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                {item.effectiveDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Effective: <strong>{item.effectiveDate}</strong></span>
                  </span>
                )}
                {item.expiryDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>Expires: <strong>{item.expiryDate}</strong></span>
                  </span>
                )}
                {item.approvalDetails?.approvedBy && (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>Approved by {item.approvalDetails.approvedBy}</span>
                  </span>
                )}
              </div>

              {/* Action buttons (Preserves design with Cancel button on right, adds View, Edit, Renew) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewItem(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#004848] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setRenewItem(item);
                      setRenewMonths(item.durationMonths || 6);
                      setRenewNotes('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Renew</span>
                  </button>
                </div>

                <button
                  disabled={actionInProgress === item.id}
                  onClick={() => {
                    setDeactivateReason('');
                    setDeactivateItem(item);
                  }}
                  className="px-6 py-2 border border-[#0473b8] hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg cursor-pointer transition-all bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && items.length > 0 && totalPages > 1 && (
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

      {/* ================= MODAL: VIEW DETAILS ================= */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Existing Association Details</h3>
                  <span className="text-[10px] text-white/70 font-mono">
                    {viewItem.associationCode || viewItem.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Employee</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewItem.name || viewItem.employeeName}</p>
                  <p className="text-[10px] text-slate-500">{viewItem.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Target Department</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewItem.targetDepartment || 'General'}</p>
                  <p className="text-[10px] text-slate-500">{viewItem.associatedEntity || 'Huremaso Global Tech'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Effective Date</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewItem.effectiveDate || 'Active'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Expiry Date</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewItem.expiryDate || 'Ongoing'}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Association Details & Scope</span>
                <p className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-semibold">
                  {viewItem.text || viewItem.requestDetails}
                </p>
              </div>

              {viewItem.approvalDetails?.approvedBy && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 space-y-0.5">
                  <span className="font-bold text-xs">Approval & Activation Record</span>
                  <p className="text-[11px] text-emerald-800">
                    Approved by <strong>{viewItem.approvalDetails.approvedBy}</strong>
                    {viewItem.approvalDetails.approvedAt ? ` on ${new Date(viewItem.approvalDetails.approvedAt).toLocaleDateString()}` : ''}
                    {viewItem.approvalDetails.notes ? ` — ${viewItem.approvalDetails.notes}` : ''}
                  </p>
                </div>
              )}

              {/* Audit History */}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs mb-2">
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Audit History</span>
                </div>
                {viewItem.history && viewItem.history.length > 0 ? (
                  <div className="relative pl-5 border-l-2 border-slate-100 space-y-2.5 my-2">
                    {viewItem.history.map((h, i) => (
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

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ================= */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#003636] to-[#004848] text-white">
              <div>
                <h3 className="text-base font-bold">Edit Association</h3>
                <span className="text-[10px] text-white/70 font-mono">
                  {editItem.associationCode || editItem.id}
                </span>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Department
                </label>
                <input
                  type="text"
                  value={editTargetDept}
                  onChange={(e) => setEditTargetDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Associated Entity
                </label>
                <input
                  type="text"
                  value={editEntity}
                  onChange={(e) => setEditEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes & Collaboration Scope
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional operational notes or resource alignment details..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-[#003636] to-[#004848] hover:opacity-95 shadow-sm"
                >
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RENEW ================= */}
      {renewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-700">
              <RotateCw className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Renew Association</h3>
            </div>
            <p className="text-xs text-slate-600">
              Extend the duration of the active inhouse association for{' '}
              <strong className="text-slate-800">{renewItem.name || renewItem.employeeName}</strong>.
            </p>

            <form onSubmit={handleRenewSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Extension Duration
                </label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                >
                  <option value={3}>+ 3 Months</option>
                  <option value={6}>+ 6 Months</option>
                  <option value={12}>+ 12 Months (1 Year)</option>
                  <option value={24}>+ 24 Months (2 Years)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Renewal Notes
                </label>
                <textarea
                  rows={2}
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="Reason for extension, project continuation scope..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewItem(null)}
                  disabled={isRenewing}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                >
                  {isRenewing && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Confirm Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DIALOG: DEACTIVATE / CANCEL ================= */}
      {deactivateItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Cancel Existing Association</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to terminate and cancel this existing association for{' '}
              <strong className="text-slate-800">{deactivateItem.name || deactivateItem.employeeName}</strong>?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Reason / Deactivation Notes
              </label>
              <textarea
                rows={2}
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Optional explanation for closing or terminating this association..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateItem(null)}
                disabled={isDeactivating}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                disabled={isDeactivating}
                className="px-4 py-1.5 text-xs font-bold text-white rounded-xl bg-[#0473b8] hover:bg-[#035f99] shadow-xs"
              >
                {isDeactivating ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingAssociationPage;
