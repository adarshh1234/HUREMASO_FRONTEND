import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Check, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { financeRequestService } from '../../services/payrollService';
import { PayrollFinanceRequest } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';

const REQUEST_TYPES = [
  'Salary Advance',
  'Loan Repayment',
  'Expense Reimbursement',
  'Travel Allowance',
  'Medical Reimbursement',
  'Education Allowance',
];

const DEPARTMENTS = ['All', 'Marketing', 'Engineering', 'Sales', 'HR', 'Operations', 'Finance', 'Product'];
const STATUSES = ['All', 'Pending', 'Approved', 'Rejected'];
const PAGE_SIZE = 10;

interface NewRequestForm {
  employeeName: string;
  employeeId: string;
  requestType: string;
  department: string;
  amount: string;
  description: string;
}

const initialForm: NewRequestForm = {
  employeeName: '',
  employeeId: '',
  requestType: REQUEST_TYPES[0],
  department: 'Operations',
  amount: '',
  description: '',
};

export const EmployeeFinanceRequestsPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<PayrollFinanceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<NewRequestForm>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await financeRequestService.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        department: deptFilter !== 'All' ? deptFilter : undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError('Failed to load finance requests.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, deptFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = (): boolean => {
    const errors: Partial<NewRequestForm> = {};
    if (!form.employeeName.trim()) errors.employeeName = 'Required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) errors.amount = 'Enter a valid amount';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await financeRequestService.create({
        employeeName: form.employeeName,
        employeeId: form.employeeId || undefined,
        requestType: form.requestType,
        department: form.department,
        amount: Number(form.amount),
        description: form.description || undefined,
      });
      toast.success('Finance request submitted successfully!');
      setShowModal(false);
      setForm(initialForm);
      setPage(1);
      await load();
    } catch {
      toast.error('Failed to submit finance request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await financeRequestService.updateStatus(id, 'Approved');
      toast.success('Finance request approved!');
      await load();
    } catch {
      toast.error('Failed to approve request.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await financeRequestService.updateStatus(id, 'Rejected');
      toast.error('Finance request rejected.');
      await load();
    } catch {
      toast.error('Failed to reject request.');
    }
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'error';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Employee Finance Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Review, approve or reject employee finance and salary advance requests.</p>
        </div>
        <button
          onClick={() => { setForm(initialForm); setFormErrors({}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, type, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-[#004848] bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 bg-white outline-none focus:border-[#004848] cursor-pointer"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 bg-white outline-none focus:border-[#004848] cursor-pointer"
        >
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8"><Loader /></div>
        ) : error ? (
          <EmptyState title="Failed to load" description={error} action={<button onClick={load} className="text-xs font-bold text-[#004848] underline cursor-pointer">Retry</button>} />
        ) : items.length === 0 ? (
          <EmptyState title="No finance requests found" description="Adjust filters or create a new finance request." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Request Type</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{req.employeeName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{req.requestId || req.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-700">{req.requestType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{req.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{req.dateRequested}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">${req.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusBadgeVariant(req.status) as any} size="sm">{req.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer"
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 cursor-pointer"
                            title="Reject"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && items.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing {items.length} of {total} results</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), page + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors cursor-pointer ${page === p ? 'bg-[#004848] text-white border-[#004848]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Finance Request">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
              <input
                type="text"
                value={form.employeeName}
                onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
                placeholder="Full name"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${formErrors.employeeName ? 'border-red-400' : 'border-slate-200'}`}
              />
              {formErrors.employeeName && <p className="text-[10px] text-red-500 mt-1">{formErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="EMP-XXXXX (optional)"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Request Type *</label>
              <select
                value={form.requestType}
                onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (USD) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              min="0"
              className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${formErrors.amount ? 'border-red-400' : 'border-slate-200'}`}
            />
            {formErrors.amount && <p className="text-[10px] text-red-500 mt-1">{formErrors.amount}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Reason for request..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeFinanceRequestsPage;
