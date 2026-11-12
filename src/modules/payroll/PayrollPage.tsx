import React, { useState, useEffect, useCallback } from 'react';
import { FinanceRequest } from '../../types';
import { payrollService, payrollRecordService, financeRequestService } from '../../services/payrollService';
import { PayrollRecord } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { 
  HeartPulse, 
  Award, 
  Car, 
  Check, 
  X,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const PayrollPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'payroll-tap' | 'benefit-advance' | 'finance-requests'>('payroll-tap');
  const [financeRequests, setFinanceRequests] = useState<FinanceRequest[]>([]);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [finData, recordsData] = await Promise.all([
        payrollService.getFinanceRequests(),
        payrollRecordService.getAll({ category: 'statement', limit: 20 }),
      ]);
      setFinanceRequests(finData);
      setPayrollEmployees(recordsData.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load payroll data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePaySubmit = async (id: string, amount?: number) => {
    try {
      const target = payrollEmployees.find((e) => e.id === id);
      const payAmount = amount || (target?.amount ?? 2500);
      const updated = await payrollRecordService.pay(id, payAmount);
      setPayrollEmployees((prev) => prev.map((emp) => (emp.id === id ? updated : emp)));
      toast.success(`Payment of $${payAmount.toLocaleString()} completed successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed.';
      toast.error(msg);
    }
  };

  const handlePayAll = async () => {
    const pending = payrollEmployees.filter((e) => e.status !== 'Paid' && e.status !== 'Payed');
    if (pending.length === 0) {
      toast.info('All employees are already paid!');
      return;
    }

    try {
      for (const emp of pending) {
        await payrollRecordService.pay(emp.id, emp.amount || 2500);
      }
      toast.success('All pending salaries processed successfully!');
      await loadData();
    } catch {
      toast.error('Failed to process batch payments.');
    }
  };

  const handleFinanceApprove = async (id: string) => {
    try {
      await financeRequestService.updateStatus(id, 'Approved');
      await loadData();
      toast.success('Finance request approved!');
    } catch {
      toast.error('Failed to approve request.');
    }
  };

  const handleFinanceReject = async (id: string) => {
    try {
      await financeRequestService.updateStatus(id, 'Rejected');
      await loadData();
      toast.error('Finance request rejected!');
    } catch {
      toast.error('Failed to reject request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 m-0">Payroll Hub</h1>
            <p className="text-sm text-slate-500 mt-1">Disburse salaries in one tap, manage benefit advances, and approve financial requests.</p>
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

        <div className="flex flex-wrap border-b border-slate-200">
          {(['payroll-tap', 'benefit-advance', 'finance-requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 uppercase tracking-wider transition-all -mb-[2px] cursor-pointer ${
                activeTab === tab 
                  ? 'border-[var(--primary-color)] text-[var(--primary-color)] font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab === 'payroll-tap' ? 'Payroll in One Tap' : tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <Loader size="lg" text="Loading payroll data..." />
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && activeTab === 'payroll-tap' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Salary Disbursal</h3>
            <button 
              onClick={handlePayAll}
              className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              Pay All Employees
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {payrollEmployees.length === 0 ? (
                <EmptyState title="No payroll records found" description="No payroll records are available for disbursal." />
              ) : (
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Employee Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Disbursal Date</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payrollEmployees.map((emp) => {
                      const isPaid = emp.status === 'Paid' || emp.status === 'Payed';
                      const displayAmount = isPaid && emp.paidAmount ? emp.paidAmount : emp.amount;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">{emp.employeeName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{emp.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{emp.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800 font-mono">
                            ${displayAmount ? displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isPaid 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                            {!isPaid ? (
                              <button 
                                onClick={() => handlePaySubmit(emp.id, emp.amount)}
                                className="px-3 py-1 bg-[#004848] text-white font-semibold rounded hover:bg-[#003333] cursor-pointer shadow-sm transition-colors"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium text-[11px]">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && activeTab === 'benefit-advance' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-base font-bold text-slate-900">Easy Employee Benefit Advance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Annual Health Check-ups</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Free or discounted full-body check-ups provided yearly for preventive health.</p>
              </div>
              <button 
                onClick={() => toast.success('Applied for Annual Health Check-ups Benefit!')}
                className="w-full py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Workshops & Conferences</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Sponsorship for attending or speaking at industry events to gain exposure and knowledge.</p>
              </div>
              <button 
                onClick={() => toast.success('Applied for Workshops & Conferences sponsorship!')}
                className="w-full py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Car className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Cab / Transport Facilities</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Free or subsidized transportation for commuting to and from the workplace.</p>
              </div>
              <button 
                onClick={() => toast.success('Applied for Cab / Transport facilities!')}
                className="w-full py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && activeTab === 'finance-requests' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">Finance Requests</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {financeRequests.length === 0 ? (
                <EmptyState title="No finance requests" description="No finance requests are currently logged." />
              ) : (
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Request Type</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Date Requested</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {financeRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{req.employeeName}</div>
                          {req.employeeId && <div className="text-xs text-slate-400">ID: {req.employeeId}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">{req.requestType || req.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{req.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{req.dateRequested}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                          ${req.amount ? req.amount.toLocaleString() : '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'error' : 'warning'} size="sm">
                            {req.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                          {req.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleFinanceApprove(req.id)}
                                className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 cursor-pointer"
                                title="Approve Request"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleFinanceReject(req.id)}
                                className="p-1 bg-rose-50 text-rose-700 border border-rose-200 rounded hover:bg-rose-100 cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
