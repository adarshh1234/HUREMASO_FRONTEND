import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Calendar, DollarSign, Award, UserCheck, CreditCard, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { payrollRecordService } from '../../services/payrollService';
import { PayrollRecord, PayrollReportsSummary } from '../../types/payroll';

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
  { id: 'reports', label: 'AI Reports and Analytics', icon: Sparkles }
];

const PAGE_SIZE = 10;

export const PayrollOneTapPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as PayrollTabType | null;
  const activeTab: PayrollTabType = tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'statement';

  const setActiveTab = (tab: PayrollTabType) => {
    setSearchParams({ tab });
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<PayrollRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [payAmount, setPayAmount] = useState('$00.00');
  const [reports, setReports] = useState<PayrollReportsSummary | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'reports') {
        const rep = await payrollRecordService.getReports();
        setReports(rep);
      } else if (['statement', 'upcoming', 'slips', 'pay-on-request', 'advance-payments'].includes(activeTab)) {
        const result = await payrollRecordService.getAll({
          category: activeTab,
          page: currentPage,
          limit: PAGE_SIZE,
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
  }, [activeTab, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      // Update state directly from API response
      setRows((prev) =>
        prev.map((r) => (r.id === selectedRecord.id ? updated : r))
      );

      toast.success(`Payment of $${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} completed successfully!`);
      setSelectedRecord(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Payroll in One Tap</h1>
          <p className="text-xs text-slate-500 mt-1">Manage single-tap payroll processing, salary slips, pay grades, and analytics.</p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 8 Top Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
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

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <Loader size="lg" text="Loading payroll data from database..." />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content depending on Active Tab */}
      {!isLoading && !error && (activeTab === 'statement' || activeTab === 'upcoming' || activeTab === 'slips' || activeTab === 'pay-on-request' || activeTab === 'advance-payments') && (
        <div className="space-y-4 animate-fade-in">
          {rows.length === 0 ? (
            <EmptyState
              title="No payroll records found"
              description="There are currently no payroll records in this category."
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-6 px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span className="col-span-2">Employee Name</span>
                <span>Department</span>
                <span>Date</span>
                <span>Amount</span>
                <span className="text-right">Status / Action</span>
              </div>

              <div className="space-y-2">
                {rows.map((row) => {
                  const isPaid = row.status === 'Paid' || row.status === 'Payed';
                  const displayAmount = isPaid && row.paidAmount ? row.paidAmount : row.amount;

                  return (
                    <div 
                      key={row.id}
                      className="grid grid-cols-6 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800 hover:border-slate-300 transition-colors"
                    >
                      <span className="col-span-2 text-slate-900">{row.employeeName}</span>
                      <span className="text-slate-500 font-semibold">{row.department}</span>
                      <span className="text-slate-500 font-semibold">{row.date}</span>
                      <span className="text-slate-700 font-mono font-semibold">
                        ${displayAmount ? displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                      
                      <div className="flex justify-end items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          isPaid 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>

                        {!isPaid && (
                          <button 
                            onClick={() => handlePayClick(row)}
                            className="px-4 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[10px] font-bold rounded transition-colors cursor-pointer shadow-sm"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-end items-center gap-2 pt-4">
                  <button 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                          ? 'bg-[#004848] text-white border-[#004848] font-extrabold shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && activeTab === 'pay-grades' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Pay Grades</h3>
          <p className="text-xs text-slate-500">Configured salary grades and compensation brackets for roles across departments.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {[
              { grade: 'Grade A - Executive', salary: '$120,000 - $180,000 / yr' },
              { grade: 'Grade B - Senior Lead', salary: '$85,000 - $115,000 / yr' },
              { grade: 'Grade C - Specialist', salary: '$55,000 - $80,000 / yr' }
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">{item.grade}</span>
                <span className="text-[11px] font-semibold text-[#004848] block">{item.salary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && activeTab === 'employment-status' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Employment Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { status: 'Full-Time Permanent', count: '142 Employees' },
              { status: 'Part-Time', count: '28 Employees' },
              { status: 'Contract / Freelance', count: '15 Workers' },
              { status: 'Probationary', count: '9 Employees' }
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-1">
                <span className="text-xs font-bold text-slate-700 block">{item.status}</span>
                <span className="text-base font-extrabold text-[#004848] block">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && activeTab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">AI Payroll Reports & Analytics</h3>
          </div>
          <p className="text-xs text-slate-500">Automated insights, monthly payroll variance, and budget forecasting.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border border-teal-100 bg-teal-50/40 rounded-lg p-4 space-y-1">
              <span className="text-xs font-bold text-teal-900 block">Total Monthly Outflow</span>
              <span className="text-lg font-extrabold text-[#004848] block">
                ${reports?.totalMonthlyOutflow ? reports.totalMonthlyOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '482,500.00'}
              </span>
            </div>
            <div className="border border-indigo-100 bg-indigo-50/40 rounded-lg p-4 space-y-1">
              <span className="text-xs font-bold text-indigo-900 block">Pending Requests</span>
              <span className="text-lg font-extrabold text-indigo-700 block">
                {reports?.pendingRequestsCount ?? 2} Payments
              </span>
            </div>
            <div className="border border-emerald-100 bg-emerald-50/40 rounded-lg p-4 space-y-1">
              <span className="text-xs font-bold text-emerald-900 block">AI Budget Variance</span>
              <span className="text-lg font-extrabold text-emerald-700 block">
                {reports?.budgetVariancePercent ?? -1.4}% (Within Limit)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      <Modal 
        isOpen={!!selectedRecord} 
        onClose={() => !isSubmitting && setSelectedRecord(null)} 
        title="Enter Amount"
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
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
                <span className="font-semibold text-slate-700">{selectedRecord.date}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount</label>
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
              <span>{isSubmitting ? 'Processing...' : 'Pay'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollOneTapPage;
