import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, DollarSign, TrendingUp, CheckCircle2, Clock, Plus, ChevronLeft, ChevronRight, Eye, Printer, Send, CreditCard, User } from 'lucide-react';
import { salaryDisbursementService, getEmployees } from '../../services/payrollService';
import { SalaryDisbursement, DisbursementSummary, EmployeeReference } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import PayrollAIFloat from './PayrollAIFloat';

const STATUSES = ['All', 'Paid', 'Pending', 'Processing', 'Failed'];
const DEPARTMENTS = ['All', 'Marketing', 'Engineering', 'Sales', 'HR', 'Operations', 'Finance', 'Product'];
const METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'Stripe', 'PayPal'];
const PAGE_SIZE = 10;

interface NewDisbursementForm {
  employeeName: string;
  employeeId?: string;
  department: string;
  period: string;
  grossAmount: string;
  deductions: string;
  method: string;
  notes?: string;
}

const initialForm: NewDisbursementForm = {
  employeeName: '',
  employeeId: '',
  department: 'Operations',
  period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
  grossAmount: '',
  deductions: '0',
  method: 'Bank Transfer',
  notes: '',
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

  // Employees list
  const [employees, setEmployees] = useState<EmployeeReference[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Add modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewDisbursementForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<NewDisbursementForm>>({});

  // Disburse action modal
  const [disburseTarget, setDisburseTarget] = useState<SalaryDisbursement | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [isDisbursing, setIsDisbursing] = useState(false);

  // Receipt Modal
  const [receiptItem, setReceiptItem] = useState<SalaryDisbursement | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

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

  useEffect(() => {
    load();
  }, [load]);

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setForm((f) => ({
        ...f,
        employeeName: emp.name,
        employeeId: emp.id,
        department: emp.department || f.department,
      }));
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
        employeeId: form.employeeId || undefined,
        department: form.department,
        period: form.period,
        grossAmount: Number(form.grossAmount),
        deductions: Number(form.deductions) || 0,
        method: form.method as any,
        notes: form.notes || undefined,
      });
      toast.success('Disbursement record created!');
      setShowModal(false);
      setForm(initialForm);
      setSelectedEmpId('');
      setPage(1);
      await load();
    } catch {
      toast.error('Failed to create disbursement record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDisburseModal = (item: SalaryDisbursement) => {
    setDisburseTarget(item);
    setTransactionRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setDisburseNotes('');
  };

  const handleConfirmDisburse = async () => {
    if (!disburseTarget) return;
    setIsDisbursing(true);
    try {
      const updated = await salaryDisbursementService.disburse(
        disburseTarget.id,
        transactionRef || undefined,
        disburseNotes || undefined
      );
      toast.success(`Disbursement processed for ${disburseTarget.employeeName}!`);
      setDisburseTarget(null);
      await load();
      // Open receipt
      setReceiptItem(updated);
    } catch {
      toast.error('Failed to disburse salary.');
    } finally {
      setIsDisbursing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Salary Disbursement</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and execute salary payments via Bank Transfer, Cash, Cheque, Stripe, and PayPal.</p>
        </div>
        <button
          onClick={() => {
            setForm(initialForm);
            setSelectedEmpId('');
            setFormErrors({});
            setShowModal(true);
          }}
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
            { label: 'Total Net Payout', value: `$${summary.totalNet.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Disbursed / Paid', value: `${summary.totalPaid} records`, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Pending Payout', value: `${summary.totalPending} records`, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50' },
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
                  <th className="px-6 py-4">Net Payout</th>
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
                      <div className="text-[10px] text-slate-400">{item.disbursementId || item.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{item.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">${item.grossAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-rose-600 font-medium">-${item.deductions.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-700">${item.netAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">{item.method}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusBadgeVariant(item.status) as any} size="sm">{item.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'Pending' ? (
                          <button
                            onClick={() => openDisburseModal(item)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#003333] cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            Disburse
                          </button>
                        ) : (
                          <button
                            onClick={() => setReceiptItem(item)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:text-[#004848] hover:bg-slate-50 cursor-pointer font-medium"
                            title="View Receipt"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Receipt
                          </button>
                        )}
                      </div>
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
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), page + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 text-xs font-bold border rounded-md cursor-pointer ${
                    page === p ? 'bg-[#004848] text-white border-[#004848]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Disbursement Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Disbursement Record">
        <div className="space-y-4 text-xs">
          {/* Quick Employee Picker */}
          {employees.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Employee (or fill manually)</label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                <option value="">-- Choose Existing Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Name *</label>
              <input
                type="text"
                value={form.employeeName}
                onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
                placeholder="Full name"
                className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#004848] ${
                  formErrors.employeeName ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {formErrors.employeeName && <p className="text-[10px] text-red-500 mt-1">{formErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Period *</label>
              <input
                type="text"
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                placeholder="e.g. July 2025"
                className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#004848] ${
                  formErrors.period ? 'border-red-400' : 'border-slate-200'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gross Amount (USD) *</label>
              <input
                type="number"
                value={form.grossAmount}
                onChange={(e) => setForm((f) => ({ ...f, grossAmount: e.target.value }))}
                placeholder="0.00"
                min="0"
                className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#004848] ${
                  formErrors.grossAmount ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {formErrors.grossAmount && <p className="text-[10px] text-red-500 mt-1">{formErrors.grossAmount}</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deductions (USD)</label>
              <input
                type="number"
                value={form.deductions}
                onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
                placeholder="0.00"
                min="0"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          {form.grossAmount && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs font-semibold text-slate-700 flex justify-between items-center">
              <span>Calculated Net Payout:</span>
              <span className="text-emerald-700 font-extrabold text-sm">
                ${Math.max(0, Number(form.grossAmount) - (Number(form.deductions) || 0)).toLocaleString()}
              </span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Disbursement memo..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Disburse Confirmation Modal */}
      <Modal
        isOpen={!!disburseTarget}
        onClose={() => setDisburseTarget(null)}
        title="Execute Salary Disbursement"
      >
        {disburseTarget && (
          <div className="space-y-4 text-xs">
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 space-y-1">
              <p className="font-bold text-[#004848] text-sm">Disburse Salary to {disburseTarget.employeeName}</p>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>Period: <strong>{disburseTarget.period}</strong></span>
                <span>Method: <strong>{disburseTarget.method}</strong></span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-teal-200/50">
                <span>Total Net Payout:</span>
                <span className="text-emerald-700">${disburseTarget.netAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Reference / Receipt ID</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="TXN-XXXXXX"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disbursement Remarks</label>
              <textarea
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                rows={2}
                placeholder="Payment confirmation notes..."
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDisburseTarget(null)}
                className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisburse}
                disabled={isDisbursing}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                {isDisbursing ? 'Processing...' : 'Confirm & Disburse'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Receipt Modal */}
      <Modal
        isOpen={!!receiptItem}
        onClose={() => setReceiptItem(null)}
        title="Payment Disbursement Receipt"
      >
        {receiptItem && (
          <div className="space-y-5 text-xs">
            <div ref={receiptRef} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">HUREMASO HRMS</h3>
                  <p className="text-[10px] text-slate-400">Official Salary Payment Receipt</p>
                </div>
                <div className="text-right">
                  <Badge variant="success" size="sm">PAID</Badge>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{receiptItem.disbursementId || receiptItem.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium">Employee Name</span>
                  <p className="font-bold text-slate-800">{receiptItem.employeeName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Department</span>
                  <p className="font-bold text-slate-800">{receiptItem.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Pay Period</span>
                  <p className="font-bold text-slate-800">{receiptItem.period}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Disbursed Date</span>
                  <p className="font-bold text-slate-800">{receiptItem.disbursedAt || new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Payment Method</span>
                  <p className="font-bold text-slate-800">{receiptItem.method}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Transaction Reference</span>
                  <p className="font-mono font-bold text-slate-800">{receiptItem.transactionReference || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Salary:</span>
                  <span className="font-semibold">${receiptItem.grossAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Total Deductions:</span>
                  <span className="font-semibold">-${receiptItem.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t border-slate-100 pt-2">
                  <span>Total Net Paid:</span>
                  <span className="text-emerald-700">${receiptItem.netAmount.toLocaleString()}</span>
                </div>
              </div>

              {receiptItem.notes && (
                <div className="p-2.5 bg-slate-50 rounded text-slate-600 text-[11px]">
                  <strong>Note:</strong> {receiptItem.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </button>
              <button
                onClick={() => setReceiptItem(null)}
                className="px-5 py-2 bg-[#004848] text-white font-bold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating AI Assistant */}
      <PayrollAIFloat />
    </div>
  );
};

export default SalaryDisbursementPage;
