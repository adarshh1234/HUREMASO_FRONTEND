import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, DollarSign, BookOpen, ShieldCheck,
  RefreshCw, Loader2, Plus, ChevronRight, Check, X,
  PieChart, Calendar, BadgeCheck
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import { EsopVestingTranche, IncentiveRecord } from '../../types/wellness.types';

type FinancialTab = 'esop' | 'bonus' | 'incentives' | 'literacy';

const LITERACY_WORKSHOPS = [
  { title: 'Personal Tax Planning & Deductions 2026', date: 'September 12, 2026', speaker: 'Senior Tax Consultant', registered: false },
  { title: 'Investment Strategies: 401(k) & Mutual Funds', date: 'September 24, 2026', speaker: 'Certified Wealth Planner', registered: false },
  { title: 'Retirement Planning & Pension Optimization', date: 'October 15, 2026', speaker: 'Certified Financial Planner', registered: false },
  { title: 'Crypto & Alternative Assets: Risk & Reward', date: 'October 30, 2026', speaker: 'Digital Assets Advisor', registered: false },
];

const statusColor: Record<string, string> = {
  Vested: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Vested & Exercisable': 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
  const [registeredWorkshops, setRegisteredWorkshops] = useState<Set<number>>(new Set());
  const [exercisingTranche, setExercisingTranche] = useState<number | null>(null);

  const {
    financialIncentive: fi,
    financialLoading,
    fetchFinancialIncentive,
    exerciseEsop,
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

  const handleRegisterWorkshop = (idx: number) => {
    setRegisteredWorkshops(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
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
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="h-3.5 w-3.5 text-teal-300" />
              <span>Wellness & Development</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Financial Incentives</h1>
            <p className="text-xs text-teal-100/80 mt-1">Manage ESOP stock grants, performance bonus plans, target incentives, and financial literacy workshops.</p>
          </div>
          <button
            onClick={fetchFinancialIncentive}
            disabled={financialLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${financialLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
                  <span className="text-[11px] text-emerald-600 font-semibold">Available for exercise</span>
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
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Vesting Schedule Roster</h3>
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
                        <span className={`px-2 py-0.5 border rounded-full text-[10px] font-extrabold ${statusColor[tranche.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {tranche.status}
                        </span>
                        {tranche.status === 'Vested' ? (
                          <button
                            onClick={() => handleExercise(tranche)}
                            disabled={exercisingTranche === tranche.trancheNumber || financialLoading}
                            className="px-3 py-1.5 bg-[#004848] text-white rounded-lg text-xs font-bold hover:bg-[#006666] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {exercisingTranche === tranche.trancheNumber ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Exercise Options
                          </button>
                        ) : tranche.status === 'Exercised' ? (
                          <span className="px-3 py-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Exercised
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed">
                            Unvested
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bonus Tab */}
          {activeTab === 'bonus' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Annual Performance Bonus Tracker</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    fi.bonusTargetAchievement >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    Q3 Target: {fi.bonusTargetAchievement}% {fi.bonusTargetAchievement >= 100 ? '✓ Met' : 'In Progress'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 space-y-1">
                    <span className="text-xs font-bold text-teal-700">Bonus Year</span>
                    <div className="text-xl font-extrabold text-slate-900">{fi.bonusYear}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-xs font-bold text-blue-700">Base Multiplier</span>
                    <div className="text-xl font-extrabold text-slate-900">{fi.bonusMultiplier}x Base Pay</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 space-y-1">
                    <span className="text-xs font-bold text-emerald-700">Estimated Bonus</span>
                    <div className="text-xl font-extrabold text-emerald-600">${fi.estimatedBonusAmount.toLocaleString()} USD</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Payout Status</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-extrabold border ${
                      fi.bonusStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      fi.bonusStatus === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
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
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {fi.bonusTargetAchievement >= 100
                      ? '🎉 Target exceeded! Bonus approved for payout.'
                      : `${100 - fi.bonusTargetAchievement}% remaining to achieve target bonus.`}
                  </p>
                </div>
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
                <div className="py-12 text-center text-sm text-slate-400">No incentive records found.</div>
              ) : (
                <div className="space-y-3">
                  {fi.incentives.map((item: IncentiveRecord) => (
                    <div key={item._id || item.title} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Target: {item.target} • Reward: {item.reward} • {item.quarter}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.rewardAmount > 0 && (
                          <span className="text-xs font-bold text-[#004848]">
                            ${item.rewardAmount.toLocaleString()}
                          </span>
                        )}
                        <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${incentiveStatusColor[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {item.status.replace('_', ' ')}
                        </span>
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
                  <h3 className="text-sm font-bold text-slate-900 m-0">Financial Literacy & Wealth Management Workshops</h3>
                  <span className="text-xs font-semibold text-slate-500">{fi.financialLiteracySessionsAttended} Sessions Attended</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LITERACY_WORKSHOPS.map((w, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/30 hover:bg-teal-50/30 transition-all">
                      <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                        <BookOpen className="h-4 w-4" />
                        <span>{w.speaker}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 m-0">{w.title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{w.date}</span>
                      </div>
                      {registeredWorkshops.has(idx) ? (
                        <div className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          Registered
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegisterWorkshop(idx)}
                          className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all"
                        >
                          Register Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WellnessFinancialIncentivesPage;
