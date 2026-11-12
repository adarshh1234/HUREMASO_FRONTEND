import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, DollarSign, TrendingUp, CheckCircle2, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { salaryDisbursementService } from '../../services/payrollService';
import { SalaryDisbursement, DisbursementSummary } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';

const STATUSES = ['All', 'Paid', 'Pending', 'Processing', 'Failed'];
const DEPARTMENTS = ['All', 'Marketing', 'Engineering', 'Sales', 'HR', 'Operations', 'Finance'];
const METHODS = ['Bank Transfer', 'Cash', 'Cheque'];
const PAGE_SIZE = 10;

interface NewDisbursementForm {
  employeeName: string;
  department: string;
  period: string;
  grossAmount: string;
  deductions: string;
  method: string;
}

const initialForm: NewDisbursementForm = {
  employeeName: '',
  department: 'Operations',
  period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
  grossAmount: '',
  deductions: '0',
  method: 'Bank Transfer',
};

const statusBadgeVariant = (status: string) => {
  if (status === 'Paid') return 'success';
  if (status === 'Failed') return 'error';
  if (status === 'Processing') return 'info';
  return 'warning';
};

export const SalaryDisbursementPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<SalaryDisbursement[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<DisbursementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewDisbursementForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<NewDisbursementForm>>({});
  const [disbursing, setDisbursing] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [result, sum] = await Promise.all([
        salaryDisbursementService.getAll({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          department: deptFilter !== 'All' ? deptFilter : undefined,
        }),
        salaryDisbursementService.getSummary(),
      ]);
      setItems(result.items);
      setTotal(result.total);
      setSummary(sum);
    } catch {
      setError('Failed to load disbursement records.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, deptFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDisburse = async (id: string) => {
    setDisbursing(id);
    try {
      await salaryDisbursementService.disburse(id);
      toast.success('Salary disbursed successfully!');
      await load();
    } catch {
      toast.error('Failed to disburse salary.');
    } finally {
      setDisbursing(null);
    }
  };

  const validate = (): boolean => {
    const errors: Partial<NewDisbursementForm> = {};
    if (!form.employeeName.trim()) errors.employeeName = 'Required';
    if (!form.period.trim()) errors.period = 'Required';
    if (!form.grossAmount || isNaN(Number(form.grossAmount)) || Number(form.grossAmount) <= 0) errors.grossAmount = 'Enter valid amount';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await salaryDisbursementService.create({
        employeeName: form.employeeName,
        department: form.department,
        period: form.period,
        grossAmount: Number(form.grossAmount),
        deductions: Number(form.deductions) || 0,
        method: form.method as any,
      });
      toast.success('Disbursement record created!');
      setShowModal(false);
      setForm(initialForm);
      setPage(1);
      await load();
    } catch {
      toast.error('Failed to create disbursement record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Salary Disbursement</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track salary payments through bank transfers, cash, and cheques.</p>
        </div>
        <button
          onClick={() => { setForm(initialForm); setFormErrors({}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {[
            { label: 'Total Gross', value: `$${summary.totalGross.toLocaleString()}`, icon: DollarSign, color: 'text-[#004848]', bg: 'bg-teal-50' },
            { label: 'Total Net', value: `$${summary.totalNet.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Paid', value: `${summary.totalPaid} records`, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Pending', value: `${summary.totalPending} records`, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-extrabold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, period, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-[#004848] bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 bg-white outline-none focus:border-[#004848] cursor-pointer">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 bg-white outline-none focus:border-[#004848] cursor-pointer">
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8"><Loader /></div>
        ) : error ? (
          <EmptyState title="Failed to load" description={error} />
        ) : items.length === 0 ? (
          <EmptyState title="No disbursement records" description="No records match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Gross</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{item.disbursementId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{item.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">${item.grossAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-rose-600 font-medium">-${item.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-700">${item.netAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{item.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusBadgeVariant(item.status) as any} size="sm">{item.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleDisburse(item.id)}
                          disabled={disbursing === item.id}
                          className="px-3 py-1 bg-[#004848] text-white text-[10px] font-bold rounded hover:bg-[#003333] cursor-pointer disabled:opacity-60"
                        >
                          {disbursing === item.id ? 'Processing...' : 'Disburse'}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">{item.disbursedAt || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Showing {items.length} of {total} results</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), page + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-xs font-bold border rounded-md cursor-pointer ${page === p ? 'bg-[#004848] text-white border-[#004848]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Disbursement Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Disbursement Record">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
              <input type="text" value={form.employeeName} onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))} placeholder="Full name"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${formErrors.employeeName ? 'border-red-400' : 'border-slate-200'}`} />
              {formErrors.employeeName && <p className="text-[10px] text-red-500 mt-1">{formErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] bg-white cursor-pointer">
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Period *</label>
              <input type="text" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. July 2025"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${formErrors.period ? 'border-red-400' : 'border-slate-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] bg-white cursor-pointer">
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gross Amount (USD) *</label>
              <input type="number" value={form.grossAmount} onChange={(e) => setForm((f) => ({ ...f, grossAmount: e.target.value }))} placeholder="0.00" min="0"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${formErrors.grossAmount ? 'border-red-400' : 'border-slate-200'}`} />
              {formErrors.grossAmount && <p className="text-[10px] text-red-500 mt-1">{formErrors.grossAmount}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deductions (USD)</label>
              <input type="number" value={form.deductions} onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))} placeholder="0.00" min="0"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]" />
            </div>
          </div>
          {form.grossAmount && form.deductions !== undefined && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs font-semibold text-slate-700">
              Net Amount: <span className="text-emerald-700 font-extrabold">${Math.max(0, Number(form.grossAmount) - Number(form.deductions)).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs cursor-pointer">Cancel</button>
            <button onClick={handleCreate} disabled={isSubmitting} className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60">
              {isSubmitting ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryDisbursementPage;
