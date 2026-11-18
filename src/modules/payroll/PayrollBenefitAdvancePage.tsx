import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MoreVertical, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, Check, X, Eye, Settings, ShieldCheck, Sparkles, User } from 'lucide-react';
import { benefitAdvanceService, benefitSchemeService, getEmployees } from '../../services/payrollService';
import { PayrollBenefitAdvance, BenefitScheme, EmployeeReference } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import PayrollAIFloat from './PayrollAIFloat';

const PAGE_SIZE = 9;

type BenefitCategory = 'employee-benefits' | 'performance-benefits' | 'other-benefits' | 'benefit-advance';

interface SectionConfig {
  title: string;
  subtitle: string;
  category: BenefitCategory;
  tabs: string[];
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

const STATIC_BENEFIT_CARDS: Record<string, { title: string; description: string; maxLimit?: number; frequency?: string }[]> = {
  'Bonus': [
    { title: 'Annual Performance Bonus', description: 'Year-end bonus based on individual performance ratings and company targets.', maxLimit: 10000, frequency: 'Annual' },
    { title: 'Festive Bonus', description: 'Special seasonal bonus disbursed during annual holiday festivals.', maxLimit: 2500, frequency: 'Annual' },
  ],
  'Stock Options': [
    { title: 'ESOP Plan 2025', description: 'Employee Stock Ownership Plan options vested over a 4-year period with 1-year cliff.', maxLimit: 50000, frequency: 'One-time' },
    { title: 'RSU Grants', description: 'Restricted Stock Units granted for exceptional quarterly performance milestones.', maxLimit: 25000, frequency: 'Annual' },
  ],
  'Performance Benefits': [
    { title: 'Quarterly Incentive Scheme', description: 'Direct cash incentives tied to KPI achievements and project completion.', maxLimit: 5000, frequency: 'Quarterly' },
    { title: 'Top Performer Award', description: 'Recognition reward including gift vouchers and extra paid days off.', maxLimit: 1500, frequency: 'Quarterly' },
  ],
  "Directors' Benefits": [
    { title: 'Executive Health Cover', description: 'Comprehensive global medical coverage for leadership team members and families.', maxLimit: 20000, frequency: 'Annual' },
    { title: 'Car Allowance', description: 'Dedicated executive transport allowance and maintenance budget.', maxLimit: 12000, frequency: 'Monthly' },
  ],
  'Incentives': [
    { title: 'Sales Commission Incentive', description: 'Tiered commission payouts for achieving monthly revenue targets.', maxLimit: 8000, frequency: 'Monthly' },
    { title: 'Quarterly Target Bonus', description: 'Direct incentives tied to KPI achievements and project milestones.', maxLimit: 4000, frequency: 'Quarterly' },
  ],
  'Increments': [
    { title: 'Annual Merit Salary Increment', description: 'Standard annual salary revision based on 360-degree performance reviews.', frequency: 'Annual' },
  ],
  'EPF': [{ title: 'Employees Provident Fund', description: 'Statutory 12% employer and employee contribution with full tax benefits.', frequency: 'Monthly' }],
  'Gratuity': [{ title: 'Gratuity Fund', description: 'Retirement benefit for employees completing 5+ years of continuous service.', frequency: 'One-time' }],
  'ELI': [{ title: 'Employee Life Insurance', description: 'Group term life insurance coverage up to 5x annual salary.', frequency: 'Annual' }],
  'ESI': [{ title: 'Employee State Insurance', description: 'Full medical care and sickness benefits for eligible wage brackets.', frequency: 'Monthly' }],
  'Insurance': [{ title: 'Group Mediclaim Insurance', description: 'Family floater health insurance covering hospitalization and OPD.', frequency: 'Annual' }],
  'Paid Leave': [{ title: 'Encashable Paid Leave', description: 'Unused earned leave encashment at the end of the financial year.', frequency: 'Annual' }],
  'Travel': [{ title: 'Travel Allowance (LTA)', description: 'Leave Travel Allowance for annual domestic vacations with tax exemption.', frequency: 'Annual' }],
  'benefit-advance-default': [
    { title: 'Annual Health Check-ups', description: 'Free or discounted full-body check-ups provided yearly for preventive health.', maxLimit: 500 },
    { title: 'Workshops & Conferences', description: 'Sponsorship for attending or speaking at industry technical conferences.', maxLimit: 2000 },
    { title: 'Cab / Transport Facilities', description: 'Subsidized transportation for commuting to and from the workplace.', maxLimit: 800 },
    { title: 'Meal & Food Allowance', description: 'Subsidized cafeteria meals or prepaid meal card for all employees.', maxLimit: 600 },
    { title: 'Child Care Allowance', description: 'Reimbursement for daycare expenses for children under 5 years of age.', maxLimit: 3000 },
    { title: 'Gym & Wellness Benefit', description: 'Annual gym membership reimbursement for employee physical health.', maxLimit: 1200 },
  ],
};

interface ApplyForm {
  employeeName: string;
  employeeId: string;
  department: string;
  amount: string;
  description: string;
  // Contextual metadata
  currentSalary?: string;
  proposedSalary?: string;
  percentage?: string;
  grantUnits?: string;
  strikePrice?: string;
  vestingPeriod?: string;
  daysEncashing?: string;
  policyType?: string;
}

const initialApplyForm: ApplyForm = {
  employeeName: '',
  employeeId: '',
  department: 'Operations',
  amount: '',
  description: '',
  currentSalary: '',
  proposedSalary: '',
  percentage: '',
  grantUnits: '',
  strikePrice: '',
  vestingPeriod: '4 years',
  daysEncashing: '',
  policyType: 'Standard Floater',
};

export const PayrollBenefitAdvancePage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const config = getSectionConfig(location.pathname);

  const [activeTab, setActiveTab] = useState<string>(config.tabs[0] || '');
  const [items, setItems] = useState<PayrollBenefitAdvance[]>([]);
  const [schemes, setSchemes] = useState<BenefitScheme[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  // Employees
  const [employees, setEmployees] = useState<EmployeeReference[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<string>('');
  const [applyForm, setApplyForm] = useState<ApplyForm>(initialApplyForm);
  const [applyErrors, setApplyErrors] = useState<Partial<ApplyForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configure scheme modal
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<BenefitScheme | null>(null);
  const [schemeForm, setSchemeForm] = useState({
    name: '',
    category: config.category,
    tab: activeTab || 'General',
    description: '',
    maxLimit: '',
    eligibility: '',
    frequency: 'Annual',
  });

  // Review (Approve/Reject) modal
  const [reviewItem, setReviewItem] = useState<PayrollBenefitAdvance | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Detail view modal
  const [viewItem, setViewItem] = useState<PayrollBenefitAdvance | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => {});
  }, []);

  // Reset tab when route changes
  useEffect(() => {
    const newConfig = getSectionConfig(location.pathname);
    setActiveTab(newConfig.tabs[0] || '');
    setPage(1);
    setSchemeForm((f) => ({
      ...f,
      category: newConfig.category,
      tab: newConfig.tabs[0] || 'General',
    }));
  }, [location.pathname]);

  // Load schemes from DB
  const loadSchemes = useCallback(async () => {
    try {
      const list = await benefitSchemeService.getAll(config.category, activeTab || undefined);
      setSchemes(list);
    } catch {
      setSchemes([]);
    }
  }, [config.category, activeTab]);

  // Load applied requests
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await benefitAdvanceService.getAll({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: config.category,
        tab: activeTab || undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, config.category, activeTab]);

  useEffect(() => {
    loadSchemes();
    loadRequests();
  }, [loadSchemes, loadRequests]);

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setApplyForm((f) => ({
        ...f,
        employeeName: emp.name,
        employeeId: emp.id,
        department: emp.department || f.department,
      }));
    }
  };

  const openApply = (benefitTitle: string) => {
    setSelectedBenefit(benefitTitle);
    setSelectedEmpId('');
    setApplyForm(initialApplyForm);
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
      const metadata: Record<string, any> = {};
      if (applyForm.currentSalary) metadata.currentSalary = Number(applyForm.currentSalary);
      if (applyForm.proposedSalary) metadata.proposedSalary = Number(applyForm.proposedSalary);
      if (applyForm.percentage) metadata.percentage = Number(applyForm.percentage);
      if (applyForm.grantUnits) metadata.grantUnits = Number(applyForm.grantUnits);
      if (applyForm.strikePrice) metadata.strikePrice = Number(applyForm.strikePrice);
      if (applyForm.vestingPeriod) metadata.vestingPeriod = applyForm.vestingPeriod;
      if (applyForm.daysEncashing) metadata.daysEncashing = Number(applyForm.daysEncashing);
      if (applyForm.policyType) metadata.policyType = applyForm.policyType;

      await benefitAdvanceService.create({
        employeeName: applyForm.employeeName,
        employeeId: applyForm.employeeId || undefined,
        department: applyForm.department,
        benefitType: selectedBenefit,
        category: config.category,
        tab: activeTab || undefined,
        amount: Number(applyForm.amount) || 0,
        description: applyForm.description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      toast.success(`Applied for ${selectedBenefit}!`);
      setShowApplyModal(false);
      setPage(1);
      await loadRequests();
    } catch {
      toast.error('Failed to submit benefit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (item: PayrollBenefitAdvance, action: 'Approved' | 'Rejected') => {
    setReviewItem(item);
    setReviewAction(action);
    setReviewRemarks('');
  };

  const handleReviewSubmit = async () => {
    if (!reviewItem) return;
    setIsReviewing(true);
    try {
      await benefitAdvanceService.updateStatus(reviewItem.id, reviewAction, reviewRemarks || undefined);
      toast.success(`Request marked as ${reviewAction}!`);
      setReviewItem(null);
      await loadRequests();
    } catch {
      toast.error(`Failed to update status to ${reviewAction}.`);
    } finally {
      setIsReviewing(false);
    }
  };

  const openCreateScheme = () => {
    setEditingScheme(null);
    setSchemeForm({
      name: '',
      category: config.category,
      tab: activeTab || 'General',
      description: '',
      maxLimit: '',
      eligibility: '',
      frequency: 'Annual',
    });
    setShowSchemeModal(true);
  };

  const openEditScheme = (scheme: BenefitScheme) => {
    setEditingScheme(scheme);
    setSchemeForm({
      name: scheme.name || scheme.title || '',
      category: scheme.category as BenefitCategory,
      tab: scheme.tab || 'General',
      description: scheme.description || '',
      maxLimit: scheme.maxLimit ? String(scheme.maxLimit) : (scheme.annualLimit ? String(scheme.annualLimit) : ''),
      eligibility: scheme.eligibility || scheme.eligibilityCriteria || '',
      frequency: scheme.frequency || 'Annual',
    });
    setShowSchemeModal(true);
  };

  const handleSaveScheme = async () => {
    if (!schemeForm.name.trim()) {
      toast.error('Scheme name is required');
      return;
    }
    try {
      const payload = {
        name: schemeForm.name,
        category: schemeForm.category,
        tab: schemeForm.tab,
        description: schemeForm.description || undefined,
        maxLimit: schemeForm.maxLimit ? Number(schemeForm.maxLimit) : undefined,
        eligibility: schemeForm.eligibility || undefined,
        frequency: schemeForm.frequency || undefined,
      };
      if (editingScheme) {
        await benefitSchemeService.update(editingScheme.id, payload);
        toast.success('Benefit scheme updated successfully!');
      } else {
        await benefitSchemeService.create(payload);
        toast.success('Benefit scheme configured successfully!');
      }
      setShowSchemeModal(false);
      await loadSchemes();
    } catch {
      toast.error('Failed to save scheme.');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'error';
    return 'warning';
  };

  // Determine active cards: DB schemes or fallback static
  const cardsToRender = schemes.length > 0
    ? schemes.map((s) => ({
        id: s.id,
        isDbScheme: true,
        schemeObj: s,
        title: s.name || s.title,
        description: s.description || 'Configured organization benefit scheme.',
        maxLimit: s.maxLimit || s.annualLimit,
        frequency: s.frequency,
      }))
    : (config.tabs.length > 0 ? (STATIC_BENEFIT_CARDS[activeTab] || []) : (STATIC_BENEFIT_CARDS['benefit-advance-default'] || []))
        .map((c) => ({ ...c, isDbScheme: false, schemeObj: null, id: c.title }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">{config.title}</h1>
          <p className="text-xs text-slate-500 mt-1">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateScheme}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Settings className="h-4 w-4 text-[#004848]" />
            Configure Scheme
          </button>
        </div>
      </div>

      {/* Tabs */}
      {config.tabs.length > 0 && (
        <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
          {config.tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Benefit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        {cardsToRender.map((card, idx) => (
          <div
            key={`card-${idx}-${card.title}`}
            className="bg-[#e9eff4]/65 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[175px] hover:shadow-md transition-all"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-bold text-slate-800 leading-snug">{card.title}</h3>
                {card.isDbScheme && card.schemeObj && (
                  <button
                    onClick={() => openEditScheme(card.schemeObj!)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    title="Edit Scheme Settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{card.description}</p>
              {card.maxLimit && (
                <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-[#004848]">
                  <span>Max Limit: ${card.maxLimit.toLocaleString()}</span>
                  {card.frequency && <span className="text-slate-400">({card.frequency})</span>}
                </div>
              )}
            </div>
            <button
              onClick={() => openApply(card.title)}
              className="w-full mt-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-[#004848] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Apply / Configure
            </button>
          </div>
        ))}
      </div>

      {/* Applied Requests Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Applied Requests</h3>
            {activeTab && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-[#004848] rounded border border-teal-100">
                {activeTab}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#004848] bg-white w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1.5 bg-white outline-none focus:border-[#004848] cursor-pointer"
            >
              {['All', 'Pending', 'Approved', 'Rejected'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={loadRequests} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer" title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6"><Loader /></div>
          ) : items.length === 0 ? (
            <EmptyState title="No applied requests" description="Apply for a benefit scheme above to see employee records here." />
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
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600 font-medium">
                          {item.benefitType}
                          {item.tab && <span className="ml-1 text-[10px] text-slate-400">({item.tab})</span>}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">{item.dateRequested}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs font-bold text-slate-800">
                          {item.amount > 0 ? `$${item.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <Badge variant={statusBadge(item.status) as any} size="sm">{item.status}</Badge>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewItem(item)}
                              className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {item.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => openReviewModal(item, 'Approved')}
                                  className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded cursor-pointer hover:bg-emerald-100"
                                  title="Approve"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => openReviewModal(item, 'Rejected')}
                                  className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded cursor-pointer hover:bg-rose-100"
                                  title="Reject"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs">Logged</span>
                            )}
                          </div>
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
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), page + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-2.5 py-1 text-[10px] font-bold border rounded cursor-pointer ${
                          page === p ? 'bg-[#004848] text-white border-[#004848]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-500 disabled:opacity-40 cursor-pointer"
                    >
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
            <p className="text-xs font-semibold text-teal-800">
              Applying for: <span className="text-[#004848] font-bold">{selectedBenefit}</span>
            </p>
          </div>

          {/* Quick Employee Picker */}
          {employees.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Employee (or enter manually)</label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] bg-white cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee Name *</label>
              <input
                type="text"
                value={applyForm.employeeName}
                onChange={(e) => setApplyForm((f) => ({ ...f, employeeName: e.target.value }))}
                placeholder="Full name"
                className={`w-full border rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] ${
                  applyErrors.employeeName ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {applyErrors.employeeName && <p className="text-[10px] text-red-500 mt-1">{applyErrors.employeeName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <input
                type="text"
                value={applyForm.department}
                onChange={(e) => setApplyForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount (USD, if applicable)</label>
            <input
              type="number"
              value={applyForm.amount}
              onChange={(e) => setApplyForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              min="0"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848]"
            />
          </div>

          {/* Contextual Fields depending on active tab */}
          {activeTab === 'Increments' && (
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Base ($)</label>
                <input
                  type="number"
                  value={applyForm.currentSalary}
                  onChange={(e) => setApplyForm((f) => ({ ...f, currentSalary: e.target.value }))}
                  placeholder="5000"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Proposed Base ($)</label>
                <input
                  type="number"
                  value={applyForm.proposedSalary}
                  onChange={(e) => setApplyForm((f) => ({ ...f, proposedSalary: e.target.value }))}
                  placeholder="5800"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Increment %</label>
                <input
                  type="number"
                  value={applyForm.percentage}
                  onChange={(e) => setApplyForm((f) => ({ ...f, percentage: e.target.value }))}
                  placeholder="16"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'Stock Options' && (
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Grant Units</label>
                <input
                  type="number"
                  value={applyForm.grantUnits}
                  onChange={(e) => setApplyForm((f) => ({ ...f, grantUnits: e.target.value }))}
                  placeholder="1000"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Strike Price ($)</label>
                <input
                  type="number"
                  value={applyForm.strikePrice}
                  onChange={(e) => setApplyForm((f) => ({ ...f, strikePrice: e.target.value }))}
                  placeholder="25.00"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vesting Period</label>
                <input
                  type="text"
                  value={applyForm.vestingPeriod}
                  onChange={(e) => setApplyForm((f) => ({ ...f, vestingPeriod: e.target.value }))}
                  placeholder="4 years"
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'Paid Leave' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Number of Days Encashing</label>
              <input
                type="number"
                value={applyForm.daysEncashing}
                onChange={(e) => setApplyForm((f) => ({ ...f, daysEncashing: e.target.value }))}
                placeholder="e.g. 10"
                className="w-full border border-slate-200 rounded p-1.5 text-xs bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes / Description</label>
            <textarea
              value={applyForm.description}
              onChange={(e) => setApplyForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Additional details and justification..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApplyModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Configure Scheme Modal */}
      <Modal
        isOpen={showSchemeModal}
        onClose={() => setShowSchemeModal(false)}
        title={editingScheme ? 'Edit Benefit Scheme' : 'Configure New Benefit Scheme'}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheme Name *</label>
            <input
              type="text"
              value={schemeForm.name}
              onChange={(e) => setSchemeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Quarterly Performance Award"
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tab / Sub-Category</label>
              <input
                type="text"
                value={schemeForm.tab}
                onChange={(e) => setSchemeForm((f) => ({ ...f, tab: e.target.value }))}
                placeholder="e.g. Bonus, Incentives"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
              <select
                value={schemeForm.frequency}
                onChange={(e) => setSchemeForm((f) => ({ ...f, frequency: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {['Monthly', 'Quarterly', 'Annual', 'One-time'].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Benefit Limit ($)</label>
              <input
                type="number"
                value={schemeForm.maxLimit}
                onChange={(e) => setSchemeForm((f) => ({ ...f, maxLimit: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Eligibility Criteria</label>
              <input
                type="text"
                value={schemeForm.eligibility}
                onChange={(e) => setSchemeForm((f) => ({ ...f, eligibility: e.target.value }))}
                placeholder="e.g. Full-time 1+ years"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={schemeForm.description}
              onChange={(e) => setSchemeForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe the scheme terms and guidelines..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowSchemeModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScheme}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer"
            >
              {editingScheme ? 'Update Scheme' : 'Save Scheme'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal (Approve / Reject) */}
      <Modal
        isOpen={!!reviewItem}
        onClose={() => setReviewItem(null)}
        title={`${reviewAction === 'Approved' ? 'Approve' : 'Reject'} Benefit Application`}
      >
        {reviewItem && (
          <div className="space-y-4 text-xs">
            <div className={`p-3 rounded-lg border ${reviewAction === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
              <p className="font-bold">
                {reviewAction === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'} for {reviewItem.employeeName}
              </p>
              <p className="mt-1">
                Benefit: <span className="font-bold">{reviewItem.benefitType}</span> | Amount: ${reviewItem.amount.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Remarks / Decision Note {reviewAction === 'Rejected' ? '(Recommended)' : '(Optional)'}
              </label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                rows={3}
                placeholder="Enter review notes..."
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReviewItem(null)}
                className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={isReviewing}
                className={`px-6 py-2 text-white font-bold rounded-lg cursor-pointer disabled:opacity-60 ${reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {isReviewing ? 'Processing...' : `Confirm ${reviewAction}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Benefit Application Details"
      >
        {viewItem && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center text-[#004848]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewItem.employeeName}</h4>
                  <p className="text-[10px] text-slate-400">{viewItem.advanceId || viewItem.id}</p>
                </div>
              </div>
              <Badge variant={statusBadge(viewItem.status) as any} size="sm">{viewItem.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium">Benefit Scheme</span>
                <p className="font-semibold text-slate-800">{viewItem.benefitType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Category / Tab</span>
                <p className="font-semibold text-slate-800">{viewItem.category} {viewItem.tab ? `(${viewItem.tab})` : ''}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Requested Date</span>
                <p className="font-semibold text-slate-800">{viewItem.dateRequested}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Benefit Amount</span>
                <p className="font-extrabold text-slate-900 text-sm">${viewItem.amount.toLocaleString()}</p>
              </div>
            </div>

            {viewItem.metadata && Object.keys(viewItem.metadata).length > 0 && (
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100 space-y-1">
                <span className="text-teal-900 font-bold block mb-1">Scheme Details</span>
                {Object.entries(viewItem.metadata).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-slate-700">
                    <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            {viewItem.description && (
              <div>
                <span className="text-slate-500 font-bold block mb-1">Notes / Description</span>
                <p className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
                  {viewItem.description}
                </p>
              </div>
            )}

            {viewItem.remarks && (
              <div>
                <span className="text-slate-500 font-bold block mb-1">Review Remarks</span>
                <p className="p-2.5 bg-teal-50/60 border border-teal-100 rounded-lg text-teal-900 font-medium">
                  {viewItem.remarks}
                </p>
              </div>
            )}

            {viewItem.history && viewItem.history.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-slate-500 font-bold block">Audit Trail</span>
                {viewItem.history.map((h, i) => (
                  <div key={i} className="text-[10px] text-slate-500 flex justify-between bg-slate-50 px-2 py-1 rounded">
                    <span><strong>{h.action}</strong> by {h.performedBy || 'System'}</span>
                    <span>{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewItem(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Close
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

export default PayrollBenefitAdvancePage;
