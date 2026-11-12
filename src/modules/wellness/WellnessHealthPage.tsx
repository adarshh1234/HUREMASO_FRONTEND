import React, { useState, useEffect } from 'react';
import {
  Heart, ShieldCheck, Smile, Activity, FileText,
  Plus, RefreshCw, Loader2, X, Download, UserPlus
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import { HealthClaim, ClaimType, ClaimStatus } from '../../types/wellness.types';

type HealthTab = 'insurance' | 'reimbursement' | 'mental' | 'fitness';

const claimStatusColor: Record<ClaimStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Reimbursed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Under_Review: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CLAIM_TYPES: ClaimType[] = ['Medical', 'Dental', 'Vision', 'Mental_Health', 'Pharmacy', 'Fitness', 'Other'];

export const WellnessHealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>('insurance');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDependentModal, setShowDependentModal] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);

  const [newClaim, setNewClaim] = useState({
    description: '',
    type: 'Medical' as ClaimType,
    amount: '',
    currency: 'USD',
    notes: '',
  });

  const [newDependent, setNewDependent] = useState({
    name: '',
    relationship: '',
    status: 'Covered' as 'Covered' | 'Pending',
  });

  const {
    health,
    healthLoading,
    fetchHealth,
    submitHealthClaim,
    updateHealthClaimStatus,
    addInsuranceDependent,
  } = useWellness();

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleSubmitClaim = async () => {
    if (!newClaim.description || !newClaim.amount) return;
    const ok = await submitHealthClaim({
      ...newClaim,
      amount: parseFloat(newClaim.amount),
    });
    if (ok) {
      setShowClaimModal(false);
      setNewClaim({ description: '', type: 'Medical', amount: '', currency: 'USD', notes: '' });
    }
  };

  const handleAddDependent = async () => {
    if (!newDependent.name || !newDependent.relationship) return;
    const ok = await addInsuranceDependent(newDependent);
    if (ok) {
      setShowDependentModal(false);
      setNewDependent({ name: '', relationship: '', status: 'Covered' });
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, status: ClaimStatus) => {
    setUpdatingClaimId(claimId);
    await updateHealthClaimStatus(claimId, status);
    setUpdatingClaimId(null);
  };

  const eapRemaining = health ? health.eapSessionsAvailable - health.eapSessionsUsed : 0;
  const fitnessPercent = health && health.fitnessChallengeStepsGoal
    ? Math.round((health.fitnessChallengeCurrentSteps || 0) / health.fitnessChallengeStepsGoal * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Heart className="h-3.5 w-3.5 text-teal-300" />
              <span>Health & Wellness</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Health & Wellness</h1>
            <p className="text-xs text-teal-100/80 mt-1">Group insurance cards, OPD medical claims, mental health sessions, and corporate fitness programs.</p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {healthLoading && !health && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading health data...</span>
        </div>
      )}

      {health && (
        <>
          {/* Top Page Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'insurance', label: 'Group Insurance' },
              { id: 'reimbursement', label: 'Health Reimbursement', count: health.healthClaims.filter(c => c.status === 'Pending').length },
              { id: 'mental', label: 'Mental Wellbeing' },
              { id: 'fitness', label: 'Fitness Program' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HealthTab)}
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

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Policy Active (Group Health Cover)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Policy Number: {health.groupInsurancePolicyNumber}</h3>
                  <p className="text-xs text-slate-500 font-semibold m-0">
                    Total Sum Insured: ${health.groupInsuranceSumInsured.toLocaleString()} {health.groupInsuranceCurrency} •
                    Expires: {new Date(health.groupInsuranceExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  className="px-4 py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Insurance E-Card
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Covered Dependents</h3>
                  <button
                    onClick={() => setShowDependentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Dependent</span>
                  </button>
                </div>
                {health.insuranceDependents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No dependents on record.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {health.insuranceDependents.map((d) => (
                      <div key={d._id || d.name} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 m-0">{d.name}</h4>
                        <p className="text-[11px] text-slate-500 font-semibold">{d.relationship}</p>
                        <span className={`inline-block px-2 py-0.5 border rounded-full text-[10px] font-extrabold ${
                          d.status === 'Covered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Reimbursement Tab */}
          {activeTab === 'reimbursement' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">OPD & Medical Reimbursement Claims</h3>
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Submit New Claim
                </button>
              </div>

              {health.healthClaims.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No claims submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {health.healthClaims.map((claim: HealthClaim) => (
                    <div key={claim._id || claim.claimId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">
                          {claim.claimId}: {claim.description}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {new Date(claim.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} •
                          Type: {claim.type.replace('_', ' ')} •
                          Amount: ${claim.amount.toFixed(2)} {claim.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${claimStatusColor[claim.status]}`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                        {claim.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.claimId, 'Under_Review')}
                            disabled={updatingClaimId === claim.claimId}
                            className="px-2 py-1 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-100 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {updatingClaimId === claim.claimId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send for Review'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mental Wellbeing Tab */}
          {activeTab === 'mental' && (
            <div className="space-y-4">
              {/* EAP Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">EAP Sessions Available</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.eapSessionsAvailable} Sessions</div>
                  <span className="text-[11px] text-teal-600 font-semibold">Annual entitlement</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Sessions Used</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.eapSessionsUsed} Sessions</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">{eapRemaining} sessions remaining</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Mindfulness App</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.mindfulnessAppAccess ? 'Premium' : 'Not Active'}</div>
                  <span className="text-[11px] text-teal-600 font-semibold">{health.mindfulnessAppAccess ? 'Active access' : 'Contact HR to activate'}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Mental Wellbeing & EAP Counseling</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Smile className="h-4 w-4" />
                      <span>1-on-1 Confidential Counseling</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Book unlimited 1-on-1 sessions with licensed therapists at zero cost. {eapRemaining} sessions remaining this year.
                    </p>
                    <button className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all">
                      Book Counselor Session
                    </button>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Activity className="h-4 w-4" />
                      <span>Mindfulness App {health.mindfulnessAppAccess ? 'Premium' : ''} Access</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      {health.mindfulnessAppAccess
                        ? 'Free premium subscription to Headspace & Calm for employee & family.'
                        : 'Contact HR to activate mindfulness app access.'}
                    </p>
                    {health.mindfulnessAppAccess ? (
                      <button className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all">
                        Claim Premium Code
                      </button>
                    ) : (
                      <button className="w-full py-1.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed">
                        Not Activated
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fitness Tab */}
          {activeTab === 'fitness' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Corporate Fitness Programs</h3>
              {health.fitnessChallengeName ? (
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 m-0">{health.fitnessChallengeName}</h4>
                      <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${
                        health.fitnessChallengeStatus === 'Active'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : health.fitnessChallengeStatus === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {health.fitnessChallengeStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {health.fitnessChallengeRank && `Current Rank: #${health.fitnessChallengeRank} •`} {(health.fitnessChallengeCurrentSteps || 0).toLocaleString()} steps completed this month
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Progress to Goal</span>
                        <span className="text-[#004848]">{fitnessPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${fitnessPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>{(health.fitnessChallengeCurrentSteps || 0).toLocaleString()} steps</span>
                        <span>Goal: {(health.fitnessChallengeStepsGoal || 0).toLocaleString()} steps</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Activity className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No active fitness challenge. Contact HR to enroll.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-5 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Submit Medical Claim</h3>
              <button onClick={() => setShowClaimModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Claim Type *</label>
                <select
                  value={newClaim.type}
                  onChange={e => setNewClaim(c => ({ ...c, type: e.target.value as ClaimType }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                >
                  {CLAIM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description *</label>
                <input
                  value={newClaim.description}
                  onChange={e => setNewClaim(c => ({ ...c, description: e.target.value }))}
                  placeholder="e.g. Dental Consultation at City Clinic"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newClaim.amount}
                    onChange={e => setNewClaim(c => ({ ...c, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Currency</label>
                  <select
                    value={newClaim.currency}
                    onChange={e => setNewClaim(c => ({ ...c, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notes (optional)</label>
                <textarea
                  value={newClaim.notes}
                  onChange={e => setNewClaim(c => ({ ...c, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any additional details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowClaimModal(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={!newClaim.description || !newClaim.amount || healthLoading}
                className="flex-1 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {healthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dependent Modal */}
      {showDependentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-5 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Insurance Dependent</h3>
              <button onClick={() => setShowDependentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  value={newDependent.name}
                  onChange={e => setNewDependent(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Emma Johnson"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Relationship *</label>
                <select
                  value={newDependent.relationship}
                  onChange={e => setNewDependent(d => ({ ...d, relationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                >
                  <option value="">Select relationship...</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDependentModal(false)} className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAddDependent}
                disabled={!newDependent.name || !newDependent.relationship || healthLoading}
                className="flex-1 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {healthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Add Dependent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessHealthPage;
