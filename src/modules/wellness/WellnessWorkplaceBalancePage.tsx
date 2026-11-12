import React, { useState, useEffect } from 'react';
import {
  Home, Calendar, Baby, Users, DollarSign, Receipt,
  Plus, RefreshCw, Loader2, X, Check
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import { FringeClaim, FringeCategory, FringeClaimStatus } from '../../types/wellness.types';

type WorkplaceTab = 'flexi' | 'leave' | 'care' | 'family' | 'fringe';

const fringeStatusColor: Record<FringeClaimStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const FRINGE_CATEGORIES: FringeCategory[] = [
  'Connectivity', 'Commute', 'Equipment', 'Childcare', 'Housing', 'Meal', 'Other'
];

export const WellnessWorkplaceBalancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkplaceTab>('flexi');
  const [showFringeModal, setShowFringeModal] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);
  const [applyingStipend, setApplyingStipend] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState(false);

  const [newFringeClaim, setNewFringeClaim] = useState({
    title: '',
    category: 'Connectivity' as FringeCategory,
    amount: '',
    currency: 'USD',
    description: '',
  });

  const {
    workplace,
    workplaceLoading,
    fetchWorkplace,
    submitFringeClaim,
    updateFringeClaimStatus,
    registerFamilyEvent,
    applyChildCareStipend,
  } = useWellness();

  useEffect(() => {
    fetchWorkplace();
  }, [fetchWorkplace]);

  const handleSubmitFringeClaim = async () => {
    if (!newFringeClaim.title || !newFringeClaim.amount) return;
    const ok = await submitFringeClaim({
      ...newFringeClaim,
      amount: parseFloat(newFringeClaim.amount),
    });
    if (ok) {
      setShowFringeModal(false);
      setNewFringeClaim({ title: '', category: 'Connectivity', amount: '', currency: 'USD', description: '' });
    }
  };

  const handleUpdateFringeClaim = async (claimId: string, status: FringeClaimStatus) => {
    setUpdatingClaimId(claimId);
    await updateFringeClaimStatus(claimId, status);
    setUpdatingClaimId(null);
  };

  const handleRegisterFamilyEvent = async () => {
    setRegisteringEvent(true);
    await registerFamilyEvent('Annual Family Sports & Picnic Day 2026');
    setRegisteringEvent(false);
  };

  const handleApplyChildCare = async () => {
    setApplyingStipend(true);
    await applyChildCareStipend();
    setApplyingStipend(false);
  };

  const wellnessDaysRemaining = workplace ? workplace.wellnessDaysTotal - workplace.wellnessDaysUsed : 0;
  const isEventRegistered = workplace?.familyEventsRegistered?.includes('Annual Family Sports & Picnic Day 2026');

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Home className="h-3.5 w-3.5 text-teal-300" />
              <span>Workplace & Life Balance</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Workplace Life Balance</h1>
            <p className="text-xs text-teal-100/80 mt-1">Flexible work scheduling, sabbatical packages, dormitory & daycare assistance, family support, and fringe reimbursements.</p>
          </div>
          <button
            onClick={fetchWorkplace}
            disabled={workplaceLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${workplaceLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {workplaceLoading && !workplace && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading workplace data...</span>
        </div>
      )}

      {workplace && (
        <>
          {/* Top Page Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'flexi', label: 'Flexible Work Scheduling' },
              { id: 'leave', label: 'Paid Leave Package' },
              { id: 'care', label: 'Dormitory + Child Care' },
              { id: 'family', label: 'Family Wellbeing' },
              { id: 'fringe', label: 'Fringe Reimbursement', count: workplace.fringeClaims.filter(c => c.status === 'Pending').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkplaceTab)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Flexible Work Tab */}
          {activeTab === 'flexi' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Hybrid Work Schedule Agreement</h3>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                    {workplace.workScheduleType} ({workplace.officeDaysPerWeek} Days Office)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Core Hours</span>
                    <div className="text-base font-bold text-slate-900">
                      {workplace.coreHoursStart} AM - {workplace.coreHoursEnd} PM
                    </div>
                    <span className="text-[11px] text-teal-600 font-semibold">
                      Flexi-band: {workplace.flexiBandStart} - {workplace.flexiBandEnd}
                    </span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Remote Work Location</span>
                    <div className="text-base font-bold text-slate-900">{workplace.remoteWorkLocation || 'Not specified'}</div>
                  </div>
                </div>
                <div className="p-4 border border-[#004848]/20 rounded-xl bg-teal-50/30 flex items-center gap-3">
                  <div className="w-2 h-10 bg-[#004848] rounded-full" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Your hybrid schedule is {workplace.officeDaysPerWeek} days office, {7 - workplace.officeDaysPerWeek - 2} days remote.
                    All schedule changes require manager approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Paid Leave Tab */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Special Wellness & Paid Leave Allowances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Sabbatical Leave Balance</span>
                    <div className="text-xl font-extrabold text-slate-900">{workplace.sabbaticalLeaveWeeks} Weeks Paid</div>
                    <span className="text-[11px] text-teal-600 font-semibold">Eligible after 3 years tenure</span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Wellness & Caregiver Days</span>
                    <div className="text-xl font-extrabold text-slate-900">{wellnessDaysRemaining} Days Remaining</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-400 h-1.5 rounded-full"
                        style={{ width: `${Math.round(wellnessDaysRemaining / workplace.wellnessDaysTotal * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Fully paid mental wellness days</span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Parental Bonding Package</span>
                    <div className="text-xl font-extrabold text-slate-900">{workplace.parentalLeaveWeeks} Weeks Paid</div>
                    <span className="text-[11px] text-teal-600 font-semibold">Primary & secondary caregiver</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dormitory + Child Care Tab */}
          {activeTab === 'care' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Company Dormitory & Child Care Assistance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/20 transition-all">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Baby className="h-4 w-4" />
                      <span>On-Site Daycare & Childcare Subsidies</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Monthly ${workplace.childCareStipendMonthly} {workplace.childCareStipendCurrency} child care stipend for registered partner nurseries.
                    </p>
                    {workplace.childCareStipendActive ? (
                      <div className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Stipend Active
                      </div>
                    ) : (
                      <button
                        onClick={handleApplyChildCare}
                        disabled={applyingStipend}
                        className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {applyingStipend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Apply for Stipend
                      </button>
                    )}
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/20 transition-all">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Home className="h-4 w-4" />
                      <span>Executive Company Dormitory Allocation</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">Short-stay executive apartments available for business travel & relocation.</p>
                    {workplace.dormitoryAccessActive ? (
                      <div className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Access Enabled
                      </div>
                    ) : (
                      <button className="w-full py-1.5 border border-slate-200 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed">
                        Not Available
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Family Wellbeing Tab */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Family Support & Annual Events</h3>
                  {workplace.familyEventsRegistered.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">{workplace.familyEventsRegistered.length} event(s) registered</span>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Annual Family Sports & Picnic Day 2026', date: 'October 18, 2026', location: 'Grand Meadow Park' },
                    { name: 'Family Movie Night & Dinner 2026', date: 'December 5, 2026', location: 'Corporate Amphitheatre' },
                  ].map((event) => {
                    const isRegistered = workplace.familyEventsRegistered.includes(event.name);
                    return (
                      <div key={event.name} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 m-0">{event.name}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {event.date} • {event.location}
                          </p>
                        </div>
                        {isRegistered ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (event.name === 'Annual Family Sports & Picnic Day 2026') handleRegisterFamilyEvent();
                            }}
                            disabled={registeringEvent}
                            className="px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {registeringEvent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Get Family Pass
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Fringe Reimbursement Tab */}
          {activeTab === 'fringe' && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Monthly Internet & Phone Allowance</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeMonthlyInternetAllowance} / mo
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Auto-reimbursed with payroll</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Commute & Travel Stipend</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeMonthlyCommuteAllowance} / mo
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold">Transit & EV charging credits</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Total YTD Fringe Reimbursed</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeTotalYTDReimbursed.toLocaleString()} {workplace.fringeCurrency}
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold">Tax-exempt benefits</span>
                </div>
              </div>

              {/* Claims List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Fringe Benefit Reimbursement Claims</h3>
                  <button
                    onClick={() => setShowFringeModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Submit Fringe Claim</span>
                  </button>
                </div>

                {workplace.fringeClaims.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Receipt className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">No fringe claims submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workplace.fringeClaims.map((item: FringeClaim) => (
                      <div key={item._id || item.claimId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 m-0">{item.claimId}: {item.title}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} •
                            Category: {item.category} •
                            Amount: ${item.amount.toFixed(2)} {item.currency}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${fringeStatusColor[item.status]}`}>
                            {item.status}
                          </span>
                          {item.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateFringeClaim(item.claimId, 'Approved')}
                              disabled={updatingClaimId === item.claimId}
                              className="px-2 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 cursor-pointer transition-all disabled:opacity-50"
                            >
                              {updatingClaimId === item.claimId ? <Loader2 className="h-3 w-3 animate-spin inline" /> : 'Approve'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit Fringe Claim Modal */}
      {showFringeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-5 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Submit Fringe Benefit Claim</h3>
              <button onClick={() => setShowFringeModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Claim Title *</label>
                <input
                  value={newFringeClaim.title}
                  onChange={e => setNewFringeClaim(c => ({ ...c, title: e.target.value }))}
                  placeholder="e.g. Home Fiber Internet Bill"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newFringeClaim.category}
                    onChange={e => setNewFringeClaim(c => ({ ...c, category: e.target.value as FringeCategory }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                  >
                    {FRINGE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newFringeClaim.amount}
                    onChange={e => setNewFringeClaim(c => ({ ...c, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description (optional)</label>
                <textarea
                  value={newFringeClaim.description}
                  onChange={e => setNewFringeClaim(c => ({ ...c, description: e.target.value }))}
                  rows={2}
                  placeholder="Additional details about this claim..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowFringeModal(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSubmitFringeClaim}
                disabled={!newFringeClaim.title || !newFringeClaim.amount || workplaceLoading}
                className="flex-1 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {workplaceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessWorkplaceBalancePage;
