import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, DollarSign, BookOpen, ShieldCheck,
  RefreshCw, Loader2, Plus, ChevronRight, Check, X,
  PieChart, Calendar, BadgeCheck, FileText, CheckCircle2, History
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import { EsopVestingTranche, IncentiveRecord, BonusPlan, FinancialLiteracyProgram, BonusStatus } from '../../types/wellness.types';

type FinancialTab = 'esop' | 'bonus' | 'incentives' | 'literacy';

const statusColor: Record<string, string> = {
  Vested: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Exercised: 'bg-blue-50 text-blue-700 border-blue-200',
  Granted: 'bg-amber-50 text-amber-700 border-amber-200',
  Forfeited: 'bg-rose-50 text-rose-700 border-rose-200',
  Expired: 'bg-slate-100 text-slate-500 border-slate-200',
};

const incentiveStatusColor: Record<string, string> = {
  Achieved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  In_Progress: 'bg-blue-50 text-blue-700 border-blue-200',
  Active: 'bg-teal-50 text-teal-700 border-teal-200',
  Missed: 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const WellnessFinancialIncentivesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinancialTab>('esop');
  const [exercisingTranche, setExercisingTranche] = useState<number | null>(null);

  // Modals state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showBonusPlanModal, setShowBonusPlanModal] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);

  // Form states
  const [grantForm, setGrantForm] = useState({
    shares: 2500,
    grantPrice: 12.5,
    currentFMV: 42.5,
    grantDate: new Date().toISOString().split('T')[0],
  });

  const [bonusForm, setBonusForm] = useState({
    planName: 'Enterprise Growth & Tech Excellence Plan',
    bonusYear: 2026,
    targetMetrics: 'ARR expansion > 25% and 99.99% system availability',
    targetAchievement: 110,
    bonusMultiplier: 1.25,
    estimatedBonusAmount: 20000,
    status: 'Pending Approval' as BonusStatus,
    notes: 'Approved by board for Q3 execution.',
  });

  const [incentiveForm, setIncentiveForm] = useState({
    title: 'Customer Satisfaction Score Excellence',
    target: 'Achieve Net Promoter Score >= 85 for Q4',
    reward: '$2,000 Spot Incentive',
    rewardAmount: 2000,
    quarter: 'Q4-2026',
  });

  const [workshopForm, setWorkshopForm] = useState({
    title: 'Executive Tax Strategies & Stock Grant Optimization',
    speaker: 'Marcus Sterling, CPA',
    date: '2026-11-28',
    category: 'Equity & Tax Planning',
    topics: '83(b) election, AMT calculation, long term gains',
  });

  const {
    financialIncentive: fi,
    financialLoading,
    fetchFinancialIncentive,
    createEsopGrant,
    exerciseEsop,
    updateBonusStatus,
    addBonusPlan,
    updateBonusPlanStatus,
    addIncentive,
    updateIncentiveStatus,
    addLiteracyProgram,
    enrollLiteracyProgram,
  } = useWellness();

  useEffect(() => {
    fetchFinancialIncentive();
  }, [fetchFinancialIncentive]);

  const handleExercise = async (tranche: EsopVestingTranche) => {
    if (tranche.status !== 'Vested') return;
    setExercisingTranche(tranche.trancheNumber);
    await exerciseEsop(tranche.trancheNumber);
    setExercisingTranche(null);
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createEsopGrant(grantForm);
    if (ok) setShowGrantModal(false);
  };

  const handleCreateBonusPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addBonusPlan(bonusForm);
    if (ok) setShowBonusPlanModal(false);
  };

  const handleCreateIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addIncentive(incentiveForm);
    if (ok) setShowIncentiveModal(false);
  };

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addLiteracyProgram(workshopForm);
    if (ok) setShowWorkshopModal(false);
  };

  const vestedValue = fi
    ? fi.vestingSchedule.filter(t => t.status === 'Vested').reduce((sum, t) => sum + t.shares, 0) * fi.currentFMV
    : 0;

  const totalPortfolioValue = fi ? fi.grantedEsopShares * fi.currentFMV : 0;
  const vestedShares = fi ? fi.vestingSchedule.filter(t => t.status === 'Vested').reduce((sum, t) => sum + t.shares, 0) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="h-3.5 w-3.5 text-teal-300" />
              <span>Wellness & Development</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Financial Incentives</h1>
            <p className="text-xs text-teal-100/80 mt-1">Manage ESOP stock grants, performance bonus plans, target incentives, and financial literacy workshops.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchFinancialIncentive}
              disabled={financialLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${financialLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'esop' && (
              <button
                onClick={() => setShowGrantModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New ESOP Grant</span>
              </button>
            )}
            {activeTab === 'bonus' && (
              <button
                onClick={() => setShowBonusPlanModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Bonus Plan</span>
              </button>
            )}
            {activeTab === 'incentives' && (
              <button
                onClick={() => setShowIncentiveModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Incentive</span>
              </button>
            )}
            {activeTab === 'literacy' && (
              <button
                onClick={() => setShowWorkshopModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Host Workshop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {financialLoading && !fi && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading financial data...</span>
        </div>
      )}

      {fi && (
        <>
          {/* Top Page Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'esop', label: 'ESOPs', icon: PieChart },
              { id: 'bonus', label: 'Performance Bonus', icon: TrendingUp },
              { id: 'incentives', label: 'Incentives', icon: Award },
              { id: 'literacy', label: 'Financial Literacy Programs', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FinancialTab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ESOP Tab */}
          {activeTab === 'esop' && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xs font-bold text-slate-500">Granted ESOP Units</span>
                  <div className="text-2xl font-extrabold text-slate-900">{fi.grantedEsopShares.toLocaleString()} Shares</div>
                  <span className="text-[11px] text-teal-600 font-semibold">Grant Price: ${fi.grantPrice.toFixed(2)} / share</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xs font-bold text-slate-500">Vested Shares</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {vestedShares.toLocaleString()} Shares ({fi.grantedEsopShares > 0 ? Math.round(vestedShares / fi.grantedEsopShares * 100) : 0}%)
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Available for exercise (${vestedValue.toLocaleString()} value)</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow">
                  <span className="text-xs font-bold text-slate-500">Estimated Portfolio Value</span>
                  <div className="text-2xl font-extrabold text-slate-900">${totalPortfolioValue.toLocaleString()}</div>
                  <span className="text-[11px] text-teal-600 font-semibold">
                    FMV: ${fi.currentFMV.toFixed(2)} / share (+{fi.grantPrice > 0 ? Math.round((fi.currentFMV - fi.grantPrice) / fi.grantPrice * 100) : 0}%)
                  </span>
                </div>
              </div>

              {/* Vesting Schedule */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">4-Year Vesting Schedule Roster</h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Grant Date: {fi.grantDate ? new Date(fi.grantDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Standard Grant'}
                  </span>
                </div>
                <div className="space-y-3">
                  {fi.vestingSchedule.map((tranche) => (
                    <div key={tranche.trancheNumber} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{tranche.period}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Vesting Date: {new Date(tranche.vestingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • {tranche.shares.toLocaleString()} Shares
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${statusColor[tranche.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {tranche.status}
                        </span>
                        {tranche.status === 'Vested' ? (
                          <button
                            onClick={() => handleExercise(tranche)}
                            disabled={exercisingTranche === tranche.trancheNumber || financialLoading}
                            className="px-3 py-1.5 bg-[#004848] text-white rounded-lg text-xs font-bold hover:bg-[#006666] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                          >
                            {exercisingTranche === tranche.trancheNumber ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Exercise Options
                          </button>
                        ) : tranche.status === 'Exercised' ? (
                          <span className="px-3 py-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <Check className="h-3.5 w-3.5" /> Exercised
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-200">
                            Unvested
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercise History */}
              {fi.exerciseHistory && fi.exerciseHistory.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <History className="h-4 w-4 text-[#004848]" />
                    <h3 className="text-sm font-bold text-slate-900 m-0">ESOP Exercise History</h3>
                  </div>
                  <div className="space-y-2.5">
                    {fi.exerciseHistory.map((rec, i) => (
                      <div key={rec.id || i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">Tranche {rec.trancheNumber} Exercised:</span> {rec.shares} shares @ ${rec.exercisePrice}/share
                          <div className="text-[11px] text-slate-500">
                            Date: {new Date(rec.exercisedAt).toLocaleDateString()} • Total Cost: ${rec.totalCost?.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-600">${rec.estimatedValue?.toLocaleString()}</span>
                          <div className="text-[10px] text-slate-400">Current Value</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bonus Tab */}
          {activeTab === 'bonus' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Annual Performance Bonus Tracker ({fi.bonusYear})</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Calculated based on strategic company milestones & personal KPIs.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      fi.bonusTargetAchievement >= 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      Achievement: {fi.bonusTargetAchievement}% {fi.bonusTargetAchievement >= 100 ? '✓ Met' : 'In Progress'}
                    </span>
                    <select
                      value={fi.bonusStatus}
                      onChange={(e) => updateBonusStatus(e.target.value as BonusStatus)}
                      className="px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Approved">Approved</option>
                      <option value="Paid">Paid</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 space-y-1">
                    <span className="text-xs font-bold text-teal-700">Bonus Year</span>
                    <div className="text-xl font-extrabold text-slate-900">{fi.bonusYear}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-xs font-bold text-blue-700">Base Multiplier</span>
                    <div className="text-xl font-extrabold text-slate-900">{fi.bonusMultiplier}x Target</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 space-y-1">
                    <span className="text-xs font-bold text-emerald-700">Estimated Bonus</span>
                    <div className="text-xl font-extrabold text-emerald-600">${fi.estimatedBonusAmount.toLocaleString()} USD</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Payout Status</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      fi.bonusStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      fi.bonusStatus === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      fi.bonusStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{fi.bonusStatus}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Target Achievement Progress</span>
                    <span className="text-[#004848]">{fi.bonusTargetAchievement}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#004848] to-teal-400 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(fi.bonusTargetAchievement, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bonus Plans Roster */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Performance Bonus Plans Roster</h3>
                  <span className="text-xs text-slate-500 font-semibold">{fi.bonusPlans?.length || 0} Registered Plans</span>
                </div>
                {(!fi.bonusPlans || fi.bonusPlans.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No bonus plans recorded yet. Click &quot;Add Bonus Plan&quot; to create one.</div>
                ) : (
                  <div className="space-y-3">
                    {fi.bonusPlans.map((plan: BonusPlan, idx: number) => (
                      <div key={plan.id || plan._id || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 m-0">{plan.planName}</h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              FY {plan.bonusYear}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">Metrics: {plan.targetMetrics}</p>
                          <p className="text-[11px] text-slate-500">
                            Achievement: <span className="font-bold text-slate-800">{plan.targetAchievement}%</span> • Multiplier: <span className="font-bold text-slate-800">{plan.bonusMultiplier}x</span> • Amount: <span className="font-extrabold text-emerald-600">${plan.estimatedBonusAmount?.toLocaleString()}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                            plan.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            plan.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            plan.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>{plan.status}</span>
                          {plan.id && (
                            <select
                              value={plan.status}
                              onChange={(e) => updateBonusPlanStatus(plan.id!, e.target.value as BonusStatus)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Pending Approval">Pending</option>
                              <option value="Approved">Approve</option>
                              <option value="Paid">Mark Paid</option>
                              <option value="Rejected">Reject</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incentives Tab */}
          {activeTab === 'incentives' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Quarterly Target Incentives</h3>
                <span className="text-xs font-semibold text-slate-500">{fi.incentives.length} Active Incentive Programs</span>
              </div>
              {fi.incentives.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No incentive records found. Click &quot;Add Incentive&quot; above to create one.</div>
              ) : (
                <div className="space-y-3">
                  {fi.incentives.map((item: IncentiveRecord, idx: number) => (
                    <div key={item.id || item._id || item.title || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 m-0">{item.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.quarter}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Target: {item.target} • Reward: {item.reward}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.rewardAmount > 0 && (
                          <span className="text-xs font-extrabold text-[#004848]">
                            ${item.rewardAmount.toLocaleString()}
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 border rounded-full text-xs font-extrabold ${incentiveStatusColor[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        {(item.id || item._id) && (
                          <div className="flex items-center gap-1">
                            {item.status !== 'Achieved' && (
                              <button
                                onClick={() => updateIncentiveStatus((item.id || item._id)!, 'Achieved')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer transition-all"
                              >
                                Mark Achieved
                              </button>
                            )}
                            {item.status !== 'In_Progress' && (
                              <button
                                onClick={() => updateIncentiveStatus((item.id || item._id)!, 'In_Progress')}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-bold cursor-pointer transition-all"
                              >
                                In Progress
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Financial Literacy Tab */}
          {activeTab === 'literacy' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Financial Literacy & Wealth Management Workshops</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Learn wealth building, stock taxation, retirement funds, and asset protection.</p>
                  </div>
                  <span className="text-xs font-bold text-[#004848] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {fi.financialLiteracySessionsAttended} Sessions Attended
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(fi.financialLiteracyPrograms || []).map((w: FinancialLiteracyProgram, idx: number) => (
                    <div key={w.id || w._id || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/30 hover:bg-teal-50/20 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[#004848] font-bold text-xs">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>{w.speaker}</span>
                          </div>
                          <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">
                            {w.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{w.title}</h4>
                        {w.topics && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">Topics: {w.topics}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{w.date}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        {w.registered ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                              <Check className="h-3.5 w-3.5" />
                              Registered
                            </div>
                            {(w.id || w._id) && (
                              <button
                                onClick={() => enrollLiteracyProgram((w.id || w._id)!, false)}
                                className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => (w.id || w._id) && enrollLiteracyProgram((w.id || w._id)!, true)}
                            className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all shadow-sm"
                          >
                            Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grant ESOP Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Issue New ESOP Grant</h3>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGrant} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total ESOP Shares Granted</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={grantForm.shares}
                  onChange={(e) => setGrantForm({ ...grantForm, shares: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Grant Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={grantForm.grantPrice}
                    onChange={(e) => setGrantForm({ ...grantForm, grantPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current FMV ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={grantForm.currentFMV}
                    onChange={(e) => setGrantForm({ ...grantForm, currentFMV: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Grant Date</label>
                <input
                  type="date"
                  required
                  value={grantForm.grantDate}
                  onChange={(e) => setGrantForm({ ...grantForm, grantDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                * An automatic 4-year equal tranche vesting schedule (25% per year) will be generated starting from this grant date.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Issue Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bonus Plan Modal */}
      {showBonusPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Add Performance Bonus Plan</h3>
              <button onClick={() => setShowBonusPlanModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBonusPlan} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={bonusForm.planName}
                  onChange={(e) => setBonusForm({ ...bonusForm, planName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bonus Year</label>
                  <input
                    type="number"
                    required
                    value={bonusForm.bonusYear}
                    onChange={(e) => setBonusForm({ ...bonusForm, bonusYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Achievement (%)</label>
                  <input
                    type="number"
                    required
                    value={bonusForm.targetAchievement}
                    onChange={(e) => setBonusForm({ ...bonusForm, targetAchievement: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bonus Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={bonusForm.bonusMultiplier}
                    onChange={(e) => setBonusForm({ ...bonusForm, bonusMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Est. Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={bonusForm.estimatedBonusAmount}
                    onChange={(e) => setBonusForm({ ...bonusForm, estimatedBonusAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Metrics & KPIs</label>
                <textarea
                  rows={2}
                  required
                  value={bonusForm.targetMetrics}
                  onChange={(e) => setBonusForm({ ...bonusForm, targetMetrics: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBonusPlanModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Incentive Modal */}
      {showIncentiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Add Target Incentive Program</h3>
              <button onClick={() => setShowIncentiveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateIncentive} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Incentive Title</label>
                <input
                  type="text"
                  required
                  value={incentiveForm.title}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Criteria</label>
                <input
                  type="text"
                  required
                  value={incentiveForm.target}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, target: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reward Description</label>
                  <input
                    type="text"
                    required
                    value={incentiveForm.reward}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, reward: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reward Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={incentiveForm.rewardAmount}
                    onChange={(e) => setIncentiveForm({ ...incentiveForm, rewardAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Quarter / Period</label>
                <input
                  type="text"
                  required
                  value={incentiveForm.quarter}
                  onChange={(e) => setIncentiveForm({ ...incentiveForm, quarter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncentiveModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Add Incentive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Workshop Modal */}
      {showWorkshopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Host Financial Literacy Workshop</h3>
              <button onClick={() => setShowWorkshopModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkshop} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Workshop Title</label>
                <input
                  type="text"
                  required
                  value={workshopForm.title}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Speaker / Facilitator</label>
                  <input
                    type="text"
                    required
                    value={workshopForm.speaker}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, speaker: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Session Date</label>
                  <input
                    type="date"
                    required
                    value={workshopForm.date}
                    onChange={(e) => setWorkshopForm({ ...workshopForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={workshopForm.category}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Key Topics</label>
                <textarea
                  rows={2}
                  value={workshopForm.topics}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, topics: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Create Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessFinancialIncentivesPage;
