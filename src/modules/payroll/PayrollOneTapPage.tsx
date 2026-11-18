import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  DollarSign,
  Award,
  UserCheck,
  CreditCard,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Search,
  Download,
  Eye,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Users,
  Printer,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import {
  payrollRecordService,
  payGradeService,
  getEmployees,
} from '../../services/payrollService';
import {
  PayrollRecord,
  PayrollReportsSummary,
  PayGrade,
  EmploymentStatusSummary,
  EmployeeReference,
} from '../../types/payroll';
import { PayrollAIFloat } from './PayrollAIFloat';

type PayrollTabType =
  | 'statement'
  | 'upcoming'
  | 'slips'
  | 'pay-grades'
  | 'employment-status'
  | 'pay-on-request'
  | 'advance-payments'
  | 'reports';

const TABS: { id: PayrollTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'statement', label: 'Salary Statement', icon: FileText },
  { id: 'upcoming', label: 'Upcoming Salary', icon: Calendar },
  { id: 'slips', label: 'Salary Slips', icon: DollarSign },
  { id: 'pay-grades', label: 'Pay Grades', icon: Award },
  { id: 'employment-status', label: 'Employment Status', icon: UserCheck },
  { id: 'pay-on-request', label: 'Pay on Request', icon: CreditCard },
  { id: 'advance-payments', label: 'Advance Payments', icon: TrendingUp },
  { id: 'reports', label: 'AI Reports and Analytics', icon: Sparkles },
];

const DEPARTMENTS = ['All', 'Executive', 'Engineering', 'Marketing', 'Product & Design', 'Operations', 'Finance', 'Sales', 'HR'];
const PERIODS = ['All', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025'];
const PAGE_SIZE = 10;

export const PayrollOneTapPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as PayrollTabType | null;
  const activeTab: PayrollTabType = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'statement';

  const setActiveTab = (tab: PayrollTabType) => {
    setSearchParams({ tab });
    setCurrentPage(1);
  };

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<PayrollRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [viewStatementModal, setViewStatementModal] = useState<PayrollRecord | null>(null);
  const [viewSlipModal, setViewSlipModal] = useState<PayrollRecord | null>(null);
  const [payAmount, setPayAmount] = useState('$00.00');

  // Pay Grades Tab State
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [showCreateGradeModal, setShowCreateGradeModal] = useState(false);
  const [newGrade, setNewGrade] = useState({
    gradeCode: '',
    gradeName: '',
    minSalary: 0,
    maxSalary: 0,
    currency: 'USD',
    description: '',
  });

  // Employment Status State
  const [employmentSummary, setEmploymentSummary] = useState<EmploymentStatusSummary | null>(null);

  // Pay On Request Modal
  const [showPayOnRequestModal, setShowPayOnRequestModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeReference[]>([]);
  const [requestEmployeeId, setRequestEmployeeId] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestDesc, setRequestDesc] = useState('');

  // Advance Payment Modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [advanceSchedule, setAdvanceSchedule] = useState('6 Monthly Installments');

  // Reports State
  const [reports, setReports] = useState<PayrollReportsSummary | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'reports') {
        const rep = await payrollRecordService.getReports();
        setReports(rep);
      } else if (activeTab === 'pay-grades') {
        const res = await payGradeService.getAll();
        setPayGrades(res.items);
      } else if (activeTab === 'employment-status') {
        const res = await payrollRecordService.getEmploymentStatus();
        setEmploymentSummary(res);
      } else {
        const result = await payrollRecordService.getAll({
          category: activeTab,
          page: currentPage,
          limit: PAGE_SIZE,
          search: search || undefined,
          department: deptFilter !== 'All' ? deptFilter : undefined,
          period: periodFilter !== 'All' ? periodFilter : undefined,
        });
        setRows(result.items);
        setTotal(result.total);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch payroll records';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, search, deptFilter, periodFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Employees for Modals
  useEffect(() => {
    getEmployees().then((emps) => setAvailableEmployees(emps));
  }, []);

  // Pay Action
  const handlePayClick = (record: PayrollRecord) => {
    setSelectedRecord(record);
    const initialVal = record.amount
      ? `$${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '$00.00';
    setPayAmount(initialVal);
  };

  const handleConfirmPay = async () => {
    if (!selectedRecord) return;
    const numericAmount = parseFloat(payAmount.replace(/[$,]/g, '').trim());
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await payrollRecordService.pay(selectedRecord.id, numericAmount);
      setRows((prev) => prev.map((r) => (r.id === selectedRecord.id ? updated : r)));
      toast.success(`Payment of $${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} completed successfully!`);
      setSelectedRecord(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Salary Slip
  const handleGenerateSlip = async (recordId: string) => {
    try {
      const updated = await payrollRecordService.generateSlip(recordId);
      setRows((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
      toast.success('Salary slip generated and published!');
    } catch {
      toast.error('Failed to generate salary slip');
    }
  };

  // Approve Pay On Request
  const handleApprovePayRequest = async (recordId: string, status: 'Approved' | 'Rejected') => {
    try {
      const updated = await payrollRecordService.approvePayOnRequest(
        recordId,
        status,
        status === 'Approved' ? 'Approved by HR Finance' : 'Rejected per policy guidelines',
        'HR Finance Lead'
      );
      setRows((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
      toast.success(`Payment request marked as ${status}!`);
    } catch {
      toast.error('Failed to process payment request');
    }
  };

  // Submit Pay on Request
  const handleSubmitPayOnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = availableEmployees.find((e) => e.employeeId === requestEmployeeId || e.id === requestEmployeeId);
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }
    const amt = parseFloat(requestAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid request amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await payrollRecordService.create({
        employeeName: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        designation: emp.jobTitle,
        category: 'pay-on-request',
        amount: amt,
        status: 'Pending',
        payOnRequestDetails: {
          requestedAmount: amt,
          reason: requestReason.trim() || 'Ad-hoc expense bridge',
          description: requestDesc.trim() || 'Submitted via Pay on Request portal',
        },
      });
      setRows((prev) => [created, ...prev]);
      setShowPayOnRequestModal(false);
      setRequestAmount('');
      setRequestReason('');
      setRequestDesc('');
      toast.success(`Payment request submitted for ${emp.name}!`);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Advance Request
  const handleSubmitAdvanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = availableEmployees.find((e) => e.employeeId === advanceEmployeeId || e.id === advanceEmployeeId);
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }
    const amt = parseFloat(advanceAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    const installments = advanceSchedule.includes('6') ? 6 : advanceSchedule.includes('4') ? 4 : 3;
    const installmentAmount = Math.round((amt / installments) * 100) / 100;

    setIsSubmitting(true);
    try {
      const created = await payrollRecordService.create({
        employeeName: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        designation: emp.jobTitle,
        category: 'advance-payments',
        amount: amt,
        status: 'Pending',
        advanceDetails: {
          totalAdvanceAmount: amt,
          installmentAmount,
          remainingBalance: amt,
          repaymentSchedule: advanceSchedule,
          installmentsRemaining: installments,
        },
      });
      setRows((prev) => [created, ...prev]);
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      setAdvanceReason('');
      toast.success(`Salary advance created for ${emp.name}!`);
    } catch {
      toast.error('Failed to create advance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Pay Grade
  const handleCreatePayGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade.gradeCode || !newGrade.gradeName) {
      toast.error('Code and Name are required');
      return;
    }
    if (newGrade.maxSalary < newGrade.minSalary) {
      toast.error('Maximum salary cannot be less than minimum salary');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await payGradeService.create(newGrade);
      setPayGrades((prev) => [...prev, created]);
      setShowCreateGradeModal(false);
      setNewGrade({ gradeCode: '', gradeName: '', minSalary: 0, maxSalary: 0, currency: 'USD', description: '' });
      toast.success(`Pay Grade '${created.gradeName}' created!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create pay grade';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Pay Grade
  const handleDeletePayGrade = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete pay grade '${name}'?`)) return;
    try {
      await payGradeService.delete(id);
      setPayGrades((prev) => prev.filter((g) => g.id !== id));
      toast.success(`Pay grade '${name}' deleted!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete pay grade';
      toast.error(msg);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.info('No rows available to export.');
      return;
    }
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Period', 'Gross', 'Deductions', 'Net', 'Status'];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.employeeName}"`,
          `"${r.employeeId || ''}"`,
          `"${r.department}"`,
          `"${r.date}"`,
          `"${r.period || ''}"`,
          r.grossSalary || r.amount,
          r.totalDeductions || 0,
          r.netSalary || r.amount,
          `"${r.status}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payroll export generated!');
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <DollarSign className="h-3.5 w-3.5 text-teal-300" />
            <span>One-Tap Payroll Management Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Payroll in One Tap</h1>
          <p className="text-xs text-teal-100/80 mt-1">
            Automated salary calculations, salary slips, pay bands, pay-on-request approvals, and database-driven analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {['statement', 'upcoming', 'slips'].includes(activeTab) && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#004848] bg-teal-300 hover:bg-teal-200 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 8 Top Navigation Tabs */}
      <div className="flex flex-wrap gap-2 items-center border-b border-slate-200 pb-3 select-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white font-extrabold border-transparent shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Specific Filter Bar (for records tabs) */}
      {['statement', 'upcoming', 'slips', 'pay-on-request', 'advance-payments'].includes(activeTab) && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004848] bg-white w-52"
              />
            </div>

            {/* Department */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Dept:</span>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 bg-white outline-none focus:border-[#004848] cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Period:</span>
              <select
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 bg-white outline-none focus:border-[#004848] cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action button per tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'pay-on-request' && (
              <button
                onClick={() => setShowPayOnRequestModal(true)}
                className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Request</span>
              </button>
            )}
            {activeTab === 'advance-payments' && (
              <button
                onClick={() => setShowAdvanceModal(true)}
                className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Advance</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex justify-center">
          <Loader size="lg" text="Querying database records..." />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* ─── TAB 1: SALARY STATEMENT ─── */}
      {!isLoading && !error && activeTab === 'statement' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState title="No salary statements found" description="Try adjusting filters or running a new payroll cycle." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Basic Salary</th>
                    <th className="px-4 py-3">Allowances</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Net Payout</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const isPaid = row.status === 'Paid';
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors font-semibold">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{row.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{row.employeeId || 'EMP-000'} • {row.designation || 'Staff'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.department}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{row.period || row.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
                          ${(row.basicSalary || row.amount * 0.85).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-teal-700">
                          +${(row.allowances || 450).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-900">
                          ${(row.grossSalary || row.amount * 1.15).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-rose-600">
                          -${(row.totalDeductions || 350).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-[#004848]">
                          ${(row.netSalary || row.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={isPaid ? 'success' : 'warning'} size="sm">
                            {isPaid ? 'Paid' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => setViewStatementModal(row)}
                              className="p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Statement Breakdown"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {!isPaid && (
                              <button
                                onClick={() => handlePayClick(row)}
                                className="px-3 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                              >
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: UPCOMING SALARY ─── */}
      {!isLoading && !error && activeTab === 'upcoming' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState title="No upcoming salaries" description="Upcoming payroll cycle records will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Expected Payout Date</th>
                    <th className="px-4 py-3">Cycle Period</th>
                    <th className="px-4 py-3">Expected Gross</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Expected Net</th>
                    <th className="px-4 py-3">Processing Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 font-semibold">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{row.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{row.employeeId || 'EMP-000'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">{row.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{row.period || 'August 2025'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800">
                        ${(row.grossSalary || row.amount * 1.15).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-rose-600">
                        -${(row.totalDeductions || 350).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-[#004848]">
                        ${(row.netSalary || row.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Cycle Scheduled
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handlePayClick(row)}
                          className="px-3.5 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Process Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: SALARY SLIPS ─── */}
      {!isLoading && !error && activeTab === 'slips' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState title="No salary slips generated" description="Slips can be generated once a payroll statement is finalized." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Slip Period</th>
                    <th className="px-4 py-3">Net Disbursed</th>
                    <th className="px-4 py-3">Slip Status</th>
                    <th className="px-4 py-3">Published Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 font-semibold">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{row.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{row.employeeId || 'EMP-000'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{row.period || row.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-[#004848]">
                        ${(row.netSalary || row.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.slipsGenerated
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {row.slipsGenerated ? 'Published PDF' : 'Ready to Generate'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {row.slipPublishedDate || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setViewSlipModal(row)}
                            className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Slip</span>
                          </button>
                          {!row.slipsGenerated && (
                            <button
                              onClick={() => handleGenerateSlip(row.id)}
                              className="px-3 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              Generate
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
        </div>
      )}

      {/* ─── TAB 4: PAY GRADES ─── */}
      {!isLoading && !error && activeTab === 'pay-grades' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Corporate Salary Pay Grades</h3>
              <p className="text-xs text-slate-500 mt-0.5">Defined compensation ranges, salary bands, and grade allowances.</p>
            </div>
            <button
              onClick={() => setShowCreateGradeModal(true)}
              className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Pay Grade</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {payGrades.map((grade) => (
              <div
                key={grade.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                        {grade.gradeCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{grade.gradeName}</h4>
                    </div>
                    <button
                      onClick={() => handleDeletePayGrade(grade.id, grade.gradeName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Grade"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Range</span>
                    <span className="text-base font-extrabold text-[#004848] font-mono block mt-0.5">
                      ${grade.minSalary.toLocaleString()} – ${grade.maxSalary.toLocaleString()} / yr
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{grade.description || 'No description provided.'}</p>

                  {grade.allowances && grade.allowances.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grade Allowances:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {grade.allowances.map((a, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {a.name}: +${a.amount}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {grade.assignedEmployees?.length || 0} Employees Assigned
                    </span>
                  </div>
                  <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: EMPLOYMENT STATUS ─── */}
      {!isLoading && !error && activeTab === 'employment-status' && (
        <div className="space-y-5 animate-fade-in">
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Full-Time</span>
              <span className="text-2xl font-extrabold text-[#004848] block mt-1">
                {employmentSummary?.activeCount ?? 142}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">100% Payroll Eligible</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Probationary Staff</span>
              <span className="text-2xl font-extrabold text-amber-600 block mt-1">
                {employmentSummary?.probationCount ?? 9}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Standard Base Payout</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contract / Freelance</span>
              <span className="text-2xl font-extrabold text-indigo-600 block mt-1">
                {employmentSummary?.contractCount ?? 15}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">1099 Invoiced Schedule</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resigned / Separated</span>
              <span className="text-2xl font-extrabold text-rose-600 block mt-1">
                {employmentSummary?.terminatedCount ?? 4}
              </span>
              <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">F&F Settlement Track</span>
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 m-0">Employee Payroll Eligibility Register</h3>
                <p className="text-[11px] text-slate-500 m-0">Real-time status synced from core Employee database.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Employment Type</th>
                    <th className="px-4 py-3">Payroll Eligible</th>
                    <th className="px-4 py-3">Current Base</th>
                    <th className="px-4 py-3">Salary Cycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {(employmentSummary?.employees || []).map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400">{emp.employeeId}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{emp.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{emp.designation}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-[11px]">
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          emp.payrollEligible ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {emp.payrollEligible ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          <span>{emp.payrollEligible ? 'Eligible' : 'On Hold'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800">
                        ${emp.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={emp.salaryStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                          {emp.salaryStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PAY ON REQUEST ─── */}
      {!isLoading && !error && activeTab === 'pay-on-request' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState title="No payment requests pending" description="Employees can submit ad-hoc salary advance or bridge payments." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Requested Amount</th>
                    <th className="px-4 py-3">Reason / Description</th>
                    <th className="px-4 py-3">Date Requested</th>
                    <th className="px-4 py-3">Approval Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{row.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{row.employeeId || 'EMP-000'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-[#004848]">
                        ${(row.payOnRequestDetails?.requestedAmount || row.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {row.payOnRequestDetails?.reason || 'Ad-hoc expense advance'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{row.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={row.status === 'Paid' ? 'success' : 'warning'} size="sm">
                          {row.status === 'Paid' ? 'Approved & Paid' : 'Pending Review'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {row.status !== 'Paid' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApprovePayRequest(row.id, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprovePayRequest(row.id, 'Rejected')}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 7: ADVANCE PAYMENTS ─── */}
      {!isLoading && !error && activeTab === 'advance-payments' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState title="No advance payment records" description="Create a salary advance with automated repayment installment schedules." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Total Advance</th>
                    <th className="px-4 py-3">Repayment Schedule</th>
                    <th className="px-4 py-3">Monthly Installment</th>
                    <th className="px-4 py-3">Outstanding Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {rows.map((row) => {
                    const totalAdv = row.advanceDetails?.totalAdvanceAmount || row.amount;
                    const remaining = row.advanceDetails?.remainingBalance !== undefined ? row.advanceDetails.remainingBalance : totalAdv;
                    const installment = row.advanceDetails?.installmentAmount || Math.round(totalAdv / 6);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{row.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{row.department} • {row.employeeId || 'EMP-000'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-slate-800">
                          ${totalAdv.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {row.advanceDetails?.repaymentSchedule || '6 Monthly Installments'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-teal-700 font-bold">
                          ${installment.toLocaleString()} / mo
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono font-extrabold text-rose-600">
                          ${remaining.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={remaining === 0 ? 'success' : 'warning'} size="sm">
                            {remaining === 0 ? 'Fully Recovered' : 'Active Repayment'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {row.status !== 'Paid' ? (
                            <button
                              onClick={() => handlePayClick(row)}
                              className="px-3 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              Disburse
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">Disbursed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 8: AI REPORTS AND ANALYTICS ─── */}
      {!isLoading && !error && activeTab === 'reports' && (
        <div className="space-y-5 animate-fade-in">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-teal-50/30">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Total Monthly Outflow</span>
              <span className="text-2xl font-extrabold text-[#004848] font-mono block mt-1">
                ${(reports?.totalMonthlyOutflow || 482500).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">Disbursed & Scheduled Net</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Payroll Base</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono block mt-1">
                ${(reports?.totalGrossPayroll || 525000).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Pre-tax & statutory base</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statutory & Tax Deductions</span>
              <span className="text-2xl font-extrabold text-rose-600 font-mono block mt-1">
                ${(reports?.totalDeductions || 42500).toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">EPF, ESI, TDS withholds</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Completion</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono block mt-1">
                {reports?.completionRatePercent || 85}%
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                {reports?.paidCount || 12} Paid • {reports?.pendingCount || 2} Pending
              </span>
            </div>
          </div>

          {/* Department Breakdown & Monthly Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0">Department Payroll Distribution</h3>
              <div className="space-y-2.5">
                {(reports?.departmentDistribution || [
                  { department: 'Engineering', gross: 185000, count: 18 },
                  { department: 'Executive', gross: 95000, count: 4 },
                  { department: 'Marketing', gross: 64000, count: 8 },
                  { department: 'Product & Design', gross: 58000, count: 6 },
                  { department: 'Operations', gross: 42000, count: 5 },
                ]).map((dept, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{dept.department} ({dept.count} staff)</span>
                      <span className="font-mono text-[#004848]">${dept.gross.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#004848] h-full rounded-full"
                        style={{ width: `${Math.min(100, (dept.gross / 200000) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0">Outstanding Advance Recovery</h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total Granted Advances:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ${(reports?.advancesSummary?.totalAdvances || 18500).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Remaining Balance to Deduct:</span>
                  <span className="font-mono font-extrabold text-rose-600">
                    ${(reports?.advancesSummary?.outstandingBalance || 4500).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.round(
                        (1 - (reports?.advancesSummary?.outstandingBalance || 4500) / (reports?.advancesSummary?.totalAdvances || 18500)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-right font-medium">
                  Auto-synced with monthly salary statement deduction
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && ['statement', 'upcoming', 'slips', 'pay-on-request', 'advance-payments'].includes(activeTab) && (
        <div className="flex justify-end items-center gap-2 pt-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors cursor-pointer ${
                currentPage === page
                  ? 'bg-[#004848] text-white border-[#004848] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── MODAL 1: PAY ENTER AMOUNT ─── */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => !isSubmitting && setSelectedRecord(null)}
        title="Process Single-Tap Payment"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-800">{selectedRecord.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-700">{selectedRecord.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Period:</span>
                <span className="font-semibold text-slate-700">{selectedRecord.period || selectedRecord.date}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Net Payment Amount</label>
            <input
              type="text"
              value={payAmount}
              disabled={isSubmitting}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 font-mono text-sm outline-none focus:border-[#004848] transition-colors"
              placeholder="$0.00"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setSelectedRecord(null)}
              disabled={isSubmitting}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs transition-all bg-white cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPay}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Processing Wire...' : 'Authorize Payment'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL 2: VIEW SALARY STATEMENT BREAKDOWN ─── */}
      <Modal
        isOpen={!!viewStatementModal}
        onClose={() => setViewStatementModal(null)}
        title="Salary Statement Breakdown"
      >
        {viewStatementModal && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#004848] text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-teal-200 uppercase tracking-wider block">Official Statement</span>
                <h4 className="text-base font-bold m-0">{viewStatementModal.employeeName}</h4>
                <span className="text-xs text-teal-100">{viewStatementModal.department} • {viewStatementModal.employeeId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-teal-200 uppercase tracking-wider block">Net Payout</span>
                <span className="text-xl font-extrabold font-mono">${(viewStatementModal.netSalary || viewStatementModal.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Earnings</span>
                <div className="flex justify-between"><span>Basic:</span> <span className="font-mono font-bold">${(viewStatementModal.basicSalary || 2200).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Allowances:</span> <span className="font-mono text-teal-700">+${(viewStatementModal.allowances || 450).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Bonuses:</span> <span className="font-mono text-teal-700">+${(viewStatementModal.bonuses || 200).toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold"><span>Gross:</span> <span>${(viewStatementModal.grossSalary || 2850).toLocaleString()}</span></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <span className="text-slate-400 text-[10px] font-bold block uppercase">Deductions</span>
                <div className="flex justify-between"><span>TDS / Tax:</span> <span className="font-mono text-rose-600">-${(viewStatementModal.taxDeductions || 285).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>EPF / Other:</span> <span className="font-mono text-rose-600">-${(viewStatementModal.otherDeductions || 65).toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-rose-700"><span>Total:</span> <span>-${(viewStatementModal.totalDeductions || 350).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg flex justify-between">
              <span>Status: <strong className="text-slate-800">{viewStatementModal.status}</strong></span>
              <span>Payment Method: <strong className="text-slate-800">{viewStatementModal.paymentMethod || 'Bank Transfer'}</strong></span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewStatementModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 3: VIEW & PRINT SALARY SLIP ─── */}
      <Modal
        isOpen={!!viewSlipModal}
        onClose={() => setViewSlipModal(null)}
        title="Official Salary Pay Slip"
      >
        {viewSlipModal && (
          <div className="space-y-4 text-xs font-sans">
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#004848] m-0">HUREMASO GLOBAL HRMS</h3>
                  <p className="text-[10px] text-slate-400 m-0">Confidential Salary Pay Slip • {viewSlipModal.period || viewSlipModal.date}</p>
                </div>
                <Badge variant={viewSlipModal.status === 'Paid' ? 'success' : 'warning'} size="sm">
                  {viewSlipModal.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div><span className="text-slate-400 text-[10px] block">EMPLOYEE</span><strong className="text-slate-800">{viewSlipModal.employeeName}</strong></div>
                <div><span className="text-slate-400 text-[10px] block">EMPLOYEE ID</span><strong className="text-slate-800">{viewSlipModal.employeeId || 'EMP-1001'}</strong></div>
                <div><span className="text-slate-400 text-[10px] block">DEPARTMENT</span><strong className="text-slate-800">{viewSlipModal.department}</strong></div>
                <div><span className="text-slate-400 text-[10px] block">PAYMENT METHOD</span><strong className="text-slate-800">{viewSlipModal.paymentMethod || 'Bank Wire Transfer'}</strong></div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Basic Earnings</span><span>${(viewSlipModal.basicSalary || 2200).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Special Allowances</span><span>+${(viewSlipModal.allowances || 450).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Performance Bonuses</span><span>+${(viewSlipModal.bonuses || 200).toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-1 font-bold text-slate-900">
                  <span>Gross Pay</span><span>${(viewSlipModal.grossSalary || 2850).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600"><span className="text-slate-600">Income Tax & Statutory Withholds</span><span>-${(viewSlipModal.totalDeductions || 350).toLocaleString()}</span></div>
                <div className="flex justify-between border-t-2 border-slate-800 pt-1.5 text-sm font-extrabold text-[#004848]">
                  <span>NET SALARY DISBURSED</span><span>${(viewSlipModal.netSalary || viewSlipModal.amount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                  toast.success('Pay slip sent to printer!');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setViewSlipModal(null)}
                className="px-5 py-2 bg-[#004848] text-white hover:bg-[#003333] font-bold rounded-lg text-xs cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL 4: CREATE PAY GRADE ─── */}
      <Modal
        isOpen={showCreateGradeModal}
        onClose={() => !isSubmitting && setShowCreateGradeModal(false)}
        title="Create Corporate Pay Grade"
      >
        <form onSubmit={handleCreatePayGrade} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grade Code (e.g. GR-D)</label>
              <input
                type="text"
                required
                value={newGrade.gradeCode}
                onChange={(e) => setNewGrade({ ...newGrade, gradeCode: e.target.value.toUpperCase() })}
                placeholder="GR-D"
                className="w-full border border-slate-200 rounded-lg p-2.5 font-bold uppercase text-slate-800 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grade Title / Band</label>
              <input
                type="text"
                required
                value={newGrade.gradeName}
                onChange={(e) => setNewGrade({ ...newGrade, gradeName: e.target.value })}
                placeholder="Grade D - Junior Analyst"
                className="w-full border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Base Salary ($ / yr)</label>
              <input
                type="number"
                required
                min="0"
                value={newGrade.minSalary}
                onChange={(e) => setNewGrade({ ...newGrade, minSalary: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Maximum Base Salary ($ / yr)</label>
              <input
                type="number"
                required
                min="0"
                value={newGrade.maxSalary}
                onChange={(e) => setNewGrade({ ...newGrade, maxSalary: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Grade Description & Responsibilities</label>
            <textarea
              rows={2}
              value={newGrade.description}
              onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
              placeholder="Roles qualifying for this pay tier and applicable seniority brackets..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-[#004848]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowCreateGradeModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 5: SUBMIT PAY ON REQUEST ─── */}
      <Modal
        isOpen={showPayOnRequestModal}
        onClose={() => !isSubmitting && setShowPayOnRequestModal(false)}
        title="Submit Pay on Request"
      >
        <form onSubmit={handleSubmitPayOnRequest} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
            <select
              required
              value={requestEmployeeId}
              onChange={(e) => setRequestEmployeeId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold text-slate-800 outline-none focus:border-[#004848] cursor-pointer"
            >
              <option value="">Choose Employee...</option>
              {availableEmployees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId} • {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Requested Amount ($)</label>
            <input
              type="number"
              required
              min="1"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 outline-none focus:border-[#004848]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Request</label>
            <input
              type="text"
              required
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="e.g. Relocation assistance or urgent medical stipend"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-[#004848]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={requestDesc}
              onChange={(e) => setRequestDesc(e.target.value)}
              placeholder="Provide context or authorization details..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-[#004848]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowPayOnRequestModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 6: CREATE SALARY ADVANCE ─── */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => !isSubmitting && setShowAdvanceModal(false)}
        title="Create Salary Advance"
      >
        <form onSubmit={handleSubmitAdvanceRequest} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
            <select
              required
              value={advanceEmployeeId}
              onChange={(e) => setAdvanceEmployeeId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold text-slate-800 outline-none focus:border-[#004848] cursor-pointer"
            >
              <option value="">Choose Employee...</option>
              {availableEmployees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId} • {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Advance ($)</label>
              <input
                type="number"
                required
                min="1"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="3000"
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Repayment Schedule</label>
              <select
                value={advanceSchedule}
                onChange={(e) => setAdvanceSchedule(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-semibold text-slate-800 outline-none focus:border-[#004848] cursor-pointer"
              >
                <option value="3 Monthly Installments">3 Monthly Installments</option>
                <option value="4 Monthly Installments">4 Monthly Installments</option>
                <option value="6 Monthly Installments">6 Monthly Installments</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Advance Reason</label>
            <input
              type="text"
              required
              value={advanceReason}
              onChange={(e) => setAdvanceReason(e.target.value)}
              placeholder="e.g. Relocation deposit, personal emergency"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-[#004848]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanceModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Grant Advance'}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Floating Assistant Widget */}
      <PayrollAIFloat />
    </div>
  );
};

export default PayrollOneTapPage;
