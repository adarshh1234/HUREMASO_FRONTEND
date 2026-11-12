import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MoreVertical, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { benefitAdvanceService } from '../../services/payrollService';
import { PayrollBenefitAdvance } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';

const PAGE_SIZE = 9;

type BenefitCategory = 'employee-benefits' | 'performance-benefits' | 'other-benefits' | 'benefit-advance';

interface SectionConfig {
  title: string;
  subtitle: string;
  category: BenefitCategory;
  tabs: string[];
  tabLabels?: Record<string, string>;
}

function getSectionConfig(pathname: string): SectionConfig {
  if (pathname === '/payroll/employee-benefits') {
    return {
      title: 'Employee Benefits',
      subtitle: 'Comprehensive employee benefit schemes, bonuses, and stock options.',
      category: 'employee-benefits',
      tabs: ['Bonus', 'Stock Options', 'Performance Benefits', "Directors' Benefits"],
    };
  }
  if (pathname === '/payroll/performance-benefits') {
    return {
      title: 'Performance Benefits',
      subtitle: 'Performance incentives, annual increments, promotions, gifts, and bonuses.',
      category: 'performance-benefits',
      tabs: ['Incentives', 'Increments', 'Bonus'],
    };
  }
  if (pathname === '/payroll/other-benefits') {
    return {
      title: 'Other Benefits',
      subtitle: 'Statutory benefits including EPF, Gratuity, ELI, ESI, Insurance, and Travel allowances.',
      category: 'other-benefits',
      tabs: ['EPF', 'Gratuity', 'ELI', 'ESI', 'Insurance', 'Paid Leave', 'Travel'],
    };
  }
  // Default: /payroll/benefit-advance
  return {
    title: 'Employee Benefits Advance',
    subtitle: 'Apply for benefit advances including health check-ups, workshops, transport, and more.',
    category: 'benefit-advance',
    tabs: [],
  };
}

const STATIC_BENEFIT_CARDS: Record<string, { title: string; description: string }[]> = {
  'Bonus': [
    { title: 'Annual Performance Bonus', description: 'Year-end bonus based on individual performance ratings and company targets.' },
    { title: 'Festive Bonus', description: 'Special seasonal bonus disbursed during annual holiday festivals.' },
  ],
  'Stock Options': [
    { title: 'ESOP Plan 2025', description: 'Employee Stock Ownership Plan options vested over a 4-year period.' },
    { title: 'RSU Grants', description: 'Restricted Stock Units granted for exceptional quarterly performance.' },
  ],
  "Performance Benefits": [
    { title: 'Quarterly Incentive Scheme', description: 'Direct cash incentives tied to KPI achievements and project completion.' },
    { title: 'Top Performer Award', description: 'Recognition reward including gift vouchers and extra paid days off.' },
  ],
  "Directors' Benefits": [
    { title: 'Executive Health Cover', description: 'Comprehensive global medical coverage for leadership team members.' },
    { title: 'Car Allowance', description: 'Dedicated executive transport allowance and maintenance budget.' },
  ],
  'Incentives': [
    { title: 'Sales Commission Incentive', description: 'Tiered commission payouts for achieving monthly revenue targets.' },
    { title: 'Quarterly Target Bonus', description: 'Direct incentives tied to KPI achievements and project completion.' },
  ],
  'Increments': [
    { title: 'Annual Merit Salary Increment', description: 'Standard annual salary revision based on performance reviews.' },
  ],
  'EPF': [{ title: 'Employees Provident Fund', description: 'Statutory 12% employer and employee contribution with tax benefits.' }],
  'Gratuity': [{ title: 'Gratuity Fund', description: 'Retirement benefit for employees completing 5+ years of continuous service.' }],
  'ELI': [{ title: 'Employee Life Insurance', description: 'Group term life insurance coverage up to 5x annual salary.' }],
  'ESI': [{ title: 'Employee State Insurance', description: 'Full medical care and sickness benefits for eligible wage brackets.' }],
  'Insurance': [{ title: 'Group Mediclaim Insurance', description: 'Family floater health insurance covering hospitalization and OPD.' }],
  'Paid Leave': [{ title: 'Encashable Paid Leave', description: 'Unused earned leave encashment at the end of the financial year.' }],
  'Travel': [{ title: 'Travel Allowance (LTA)', description: 'Leave Travel Allowance for annual domestic vacations with tax exemption.' }],
  'benefit-advance-default': [
    { title: 'Annual Health Check-ups', description: 'Free or discounted full-body check-ups provided yearly for preventive health.' },
    { title: 'Workshops & Conferences', description: 'Sponsorship for attending or speaking at industry events.' },
    { title: 'Cab / Transport Facilities', description: 'Free or subsidized transportation for commuting to and from the workplace.' },
    { title: 'Meal & Food Allowance', description: 'Subsidized cafeteria meals or meal card for all employees.' },
    { title: 'Child Care Allowance', description: 'Reimbursement for daycare expenses for children under 5 years.' },
    { title: 'Gym & Wellness Benefit', description: 'Annual gym membership reimbursement for employee health.' },
  ],
};

interface ApplyForm {
  employeeName: string;
  employeeId: string;
  amount: string;
  description: string;
}

const statusBadge = (status: string) => {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'error';
  return 'warning';
};

export const PayrollBenefitAdvancePage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const config = getSectionConfig(location.pathname);

  const [activeTab, setActiveTab] = useState<string>(config.tabs[0] || '');
  const [items, setItems] = useState<PayrollBenefitAdvance[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<string>('');
  const [applyForm, setApplyForm] = useState<ApplyForm>({ employeeName: '', employeeId: '', amount: '', description: '' });
  const [applyErrors, setApplyErrors] = useState<Partial<ApplyForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await benefitAdvanceService.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: config.category,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      // silent - will show empty state
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, config.category]);

  useEffect(() => { load(); }, [load]);

  // Reset tab when route changes
  useEffect(() => {
    setActiveTab(config.tabs[0] || '');
    setPage(1);
  }, [location.pathname]);

  const openApply = (benefitTitle: string) => {
    setSelectedBenefit(benefitTitle);
    setApplyForm({ employeeName: '', employeeId: '', amount: '', description: '' });
    setApplyErrors({});
    setShowApplyModal(true);
  };

  const validateApply = (): boolean => {
    const errors: Partial<ApplyForm> = {};
    if (!applyForm.employeeName.trim()) errors.employeeName = 'Required';
    setApplyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApply = async () => {
    if (!validateApply()) return;
    setIsSubmitting(true);
    try {
      await benefitAdvanceService.create({
        employeeName: applyForm.employeeName,
        benefitType: selectedBenefit,
        category: config.category,
        amount: Number(applyForm.amount) || 0,
        description: applyForm.description || undefined,
      });
      toast.success(`Applied for ${selectedBenefit}!`);
      setShowApplyModal(false);
      await load();
    } catch {
      toast.error('Failed to submit benefit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await benefitAdvanceService.updateStatus(id, 'Approved');
      toast.success('Benefit approved!');
      await load();
    } catch {
      toast.error('Failed to approve benefit.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await benefitAdvanceService.updateStatus(id, 'Rejected');
      toast.error('Benefit rejected.');
      await load();
    } catch {
      toast.error('Failed to reject benefit.');
    }
  };

  // Get static cards for active tab
  const staticCards = config.tabs.length > 0
    ? (STATIC_BENEFIT_CARDS[activeTab] || [])
    : (STATIC_BENEFIT_CARDS['benefit-advance-default'] || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">{config.title}</h1>
        <p className="text-xs text-slate-500 mt-1">{config.subtitle}</p>
      </div>

      {/* Tabs */}
      {config.tabs.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
          {config.tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${activeTab === tab ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Static Benefit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        {staticCards.map((card, idx) => (
          <div
            key={`static-${idx}-${card.title}`}
            className="bg-[#e9eff4]/65 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition-all"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold text-slate-800 leading-snug">{card.title}</h3>
                <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{card.description}</p>
            </div>
            <button
              onClick={() => openApply(card.title)}
              className="w-full py-2 bg-white border border-slate-200 hover:border-slate-300 text-[#004848] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Apply / Configure
            </button>
          </div>
        ))}
      </div>

      {/* Applied Requests Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">Applied Requests</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004848] bg-white w-44"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1.5 bg-white outline-none focus:border-[#004848] cursor-pointer">
              {['All', 'Pending', 'Approved', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={load} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6"><Loader /></div>
          ) : items.length === 0 ? (
            <EmptyState title="No applied requests" description="Apply for a benefit above to see records here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Benefit Type</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 text-xs">{item.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{item.advanceId}</div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 font-medium">{item.benefitType}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">{item.dateRequested}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-slate-800">
                          {item.amount > 0 ? `$${item.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge variant={statusBadge(item.status) as any} size="sm">{item.status}</Badge>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          {item.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleApprove(item.id)} className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded cursor-pointer hover:bg-emerald-100" title="Approve">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleReject(item.id)} className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded cursor-pointer hover:bg-rose-100" title="Reject">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Logged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {total > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">{items.length} of {total}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), page + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-[10px] font-bold border rounded cursor-pointer ${page === p ? 'bg-[#004848] text-white border-[#004848]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title={`Apply: ${selectedBenefit}`}>
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-teal-800">Applying for: <span className="text-[#004848]">{selectedBenefit}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
              <input type="text" value={applyForm.employeeName} onChange={(e) => setApplyForm((f) => ({ ...f, employeeName: e.target.value }))} placeholder="Full name"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${applyErrors.employeeName ? 'border-red-400' : 'border-slate-200'}`} />
              {applyErrors.employeeName && <p className="text-[10px] text-red-500 mt-1">{applyErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee ID</label>
              <input type="text" value={applyForm.employeeId} onChange={(e) => setApplyForm((f) => ({ ...f, employeeId: e.target.value }))} placeholder="EMP-XXXXX"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (USD, if applicable)</label>
            <input type="number" value={applyForm.amount} onChange={(e) => setApplyForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes / Description</label>
            <textarea value={applyForm.description} onChange={(e) => setApplyForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Additional details..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowApplyModal(false)} className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs cursor-pointer">Cancel</button>
            <button onClick={handleApply} disabled={isSubmitting} className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollBenefitAdvancePage;
