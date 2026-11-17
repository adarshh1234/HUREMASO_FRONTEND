import React, { useState, useEffect } from 'react';
import {
  Heart, ShieldCheck, Smile, Activity, FileText,
  Plus, RefreshCw, Loader2, X, Download, UserPlus,
  Trash2, Calendar, Clock, Flame, Award, CheckCircle2,
  AlertCircle, QrCode
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import {
  HealthClaim,
  ClaimType,
  ClaimStatus,
  InsuranceDependent,
  CounsellingAppointment,
  FitnessActivity
} from '../../types/wellness.types';

type HealthTab = 'insurance' | 'reimbursement' | 'mental' | 'fitness';

const claimStatusColor: Record<ClaimStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-purple-50 text-purple-700 border-purple-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CLAIM_TYPES: ClaimType[] = ['Medical', 'Dental', 'Vision', 'Mental_Health', 'Pharmacy', 'Fitness', 'Other'];

export const WellnessHealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HealthTab>('insurance');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDependentModal, setShowDependentModal] = useState(false);
  const [showECardModal, setShowECardModal] = useState(false);
  const [showBookSessionModal, setShowBookSessionModal] = useState(false);
  const [showFitnessModal, setShowFitnessModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);

  // Forms
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

  const [sessionForm, setSessionForm] = useState({
    counsellorName: 'Dr. Rachel Adams, LMFT',
    appointmentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    appointmentTime: '14:00',
    topic: 'Stress Management & Work-Life Equilibrium',
  });

  const [fitnessForm, setFitnessForm] = useState({
    activityName: 'Outdoor Run & High Tempo Cardio',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 45,
    stepsCount: 6500,
    caloriesBurned: 420,
  });

  const [challengeForm, setChallengeForm] = useState({
    challengeName: 'Corporate 100,000 Step Challenge',
    stepsGoal: 100000,
  });

  const {
    health,
    healthLoading,
    fetchHealth,
    submitHealthClaim,
    updateHealthClaimStatus,
    addInsuranceDependent,
    removeInsuranceDependent,
    bookCounselling,
    cancelCounselling,
    logFitnessActivity,
    enrollFitnessChallenge,
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

  const handleRemoveDependent = async (depId: string) => {
    await removeInsuranceDependent(depId);
  };

  const handleUpdateClaimStatus = async (claimId: string, status: ClaimStatus, rejectionReason?: string) => {
    setUpdatingClaimId(claimId);
    await updateHealthClaimStatus(claimId, status, rejectionReason);
    setUpdatingClaimId(null);
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await bookCounselling(sessionForm);
    if (ok) setShowBookSessionModal(false);
  };

  const handleLogFitness = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await logFitnessActivity(fitnessForm);
    if (ok) setShowFitnessModal(false);
  };

  const handleEnrollChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await enrollFitnessChallenge(challengeForm.challengeName, challengeForm.stepsGoal);
    if (ok) setShowEnrollModal(false);
  };

  const eapRemaining = health ? health.eapSessionsAvailable - health.eapSessionsUsed : 0;
  const fitnessPercent = health && health.fitnessChallengeStepsGoal
    ? Math.round((health.fitnessChallengeCurrentSteps || 0) / health.fitnessChallengeStepsGoal * 100)
    : 0;

  const totalClaimed = health ? health.healthClaims.reduce((sum, c) => sum + (c.amount || 0), 0) : 0;
  const approvedClaimed = health
    ? health.healthClaims.filter(c => c.status === 'Approved' || c.status === 'Paid').reduce((sum, c) => sum + (c.amount || 0), 0)
    : 0;
  const annualLimit = health?.annualReimbursementAllowance || 1500;
  const remainingAllowance = Math.max(annualLimit - approvedClaimed, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Heart className="h-3.5 w-3.5 text-teal-300" />
              <span>Health & Wellness</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Health & Wellness</h1>
            <p className="text-xs text-teal-100/80 mt-1">Group insurance coverage, OPD medical claims, mental health counseling, and corporate fitness programs.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchHealth}
              disabled={healthLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'insurance' && (
              <button
                onClick={() => setShowDependentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Dependent</span>
              </button>
            )}
            {activeTab === 'reimbursement' && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Claim</span>
              </button>
            )}
            {activeTab === 'mental' && (
              <button
                onClick={() => setShowBookSessionModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Book Session</span>
              </button>
            )}
            {activeTab === 'fitness' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEnrollModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Enroll Challenge</span>
                </button>
                <button
                  onClick={() => setShowFitnessModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Activity</span>
                </button>
              </div>
            )}
          </div>
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
              { id: 'insurance', label: 'Group Insurance', count: health.insuranceDependents.length },
              { id: 'reimbursement', label: 'Health Reimbursement', count: health.healthClaims.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length },
              { id: 'mental', label: 'Mental Wellbeing', count: health.counsellingAppointments?.length },
              { id: 'fitness', label: 'Fitness Program', count: health.fitnessActivities?.length },
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
                  <span className={`px-1.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
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
                    <span>Policy Active • Comprehensive Corporate Health Shield</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 m-0">Policy Number: {health.groupInsurancePolicyNumber}</h3>
                  <p className="text-xs text-slate-500 font-semibold m-0">
                    Total Sum Insured: ${health.groupInsuranceSumInsured.toLocaleString()} {health.groupInsuranceCurrency} •
                    Expires: {new Date(health.groupInsuranceExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowECardModal(true)}
                  className="px-4 py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  View & Download Insurance E-Card
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Covered Dependents ({health.insuranceDependents.length})</h3>
                  <span className="text-xs text-slate-500 font-semibold">Includes primary employee & declared family</span>
                </div>
                {health.insuranceDependents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No dependents on record.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {health.insuranceDependents.map((d: InsuranceDependent) => {
                      const depId = d._id || d.id;
                      return (
                        <div key={depId || d.name} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-bold text-slate-900 m-0">{d.name}</h4>
                              {depId && d.relationship !== 'Primary Insured' && (
                                <button
                                  onClick={() => handleRemoveDependent(depId)}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">{d.relationship}</p>
                          </div>
                          <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold w-fit ${
                            d.status === 'Covered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>{d.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Reimbursement Tab */}
          {activeTab === 'reimbursement' && (
            <div className="space-y-6">
              {/* Allowance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Annual OPD Allowance</span>
                  <div className="text-2xl font-extrabold text-slate-900">${annualLimit.toLocaleString()} USD</div>
                  <span className="text-[11px] text-teal-600 font-semibold">For outpatient medical & dental expenses</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Approved / Reimbursed YTD</span>
                  <div className="text-2xl font-extrabold text-emerald-600">${approvedClaimed.toLocaleString()} USD</div>
                  <span className="text-[11px] text-emerald-700 font-semibold">{Math.round((approvedClaimed / annualLimit) * 100)}% utilized</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Remaining Eligible Balance</span>
                  <div className="text-2xl font-extrabold text-[#004848]">${remainingAllowance.toLocaleString()} USD</div>
                  <span className="text-[11px] text-teal-600 font-semibold">Available for current year claims</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">OPD & Medical Reimbursement Claims</h3>
                  <span className="text-xs text-slate-500 font-semibold">{health.healthClaims.length} Claims Total</span>
                </div>

                {health.healthClaims.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">No claims submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {health.healthClaims.map((claim: HealthClaim) => {
                      const claimId = claim.claimId || claim._id;
                      return (
                        <div key={claimId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 m-0">
                                {claim.claimId}: {claim.description}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                                {claim.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Date: {new Date(claim.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} •
                              Amount: <span className="font-extrabold text-slate-900">${claim.amount.toFixed(2)} {claim.currency}</span>
                            </p>
                            {claim.rejectionReason && (
                              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Rejection Reason: {claim.rejectionReason}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${claimStatusColor[claim.status] || 'bg-slate-100 text-slate-600'}`}>
                              {claim.status}
                            </span>
                            {claimId && (
                              <div className="flex items-center gap-1">
                                {claim.status !== 'Approved' && claim.status !== 'Paid' && (
                                  <button
                                    onClick={() => handleUpdateClaimStatus(claim.claimId, 'Approved')}
                                    disabled={updatingClaimId === claim.claimId}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Approve
                                  </button>
                                )}
                                {claim.status === 'Approved' && (
                                  <button
                                    onClick={() => handleUpdateClaimStatus(claim.claimId, 'Paid')}
                                    disabled={updatingClaimId === claim.claimId}
                                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                                {claim.status !== 'Rejected' && (
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt('Enter rejection reason:');
                                      if (reason) handleUpdateClaimStatus(claim.claimId, 'Rejected', reason);
                                    }}
                                    disabled={updatingClaimId === claim.claimId}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded text-xs font-bold cursor-pointer transition-all"
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mental Wellbeing Tab */}
          {activeTab === 'mental' && (
            <div className="space-y-6">
              {/* EAP Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">EAP Sessions Available</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.eapSessionsAvailable} Sessions</div>
                  <span className="text-[11px] text-teal-600 font-semibold">Annual entitlement for employee & family</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Sessions Used</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.eapSessionsUsed} Sessions</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">{eapRemaining} confidential sessions remaining</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Mindfulness App Access</span>
                  <div className="text-2xl font-extrabold text-slate-900">{health.mindfulnessAppAccess ? 'Active Premium' : 'Inactive'}</div>
                  <span className="text-[11px] text-teal-600 font-semibold">Headspace & Calm Enterprise License</span>
                </div>
              </div>

              {/* Counselling Appointments Log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Booked Counseling Appointments</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Strictly confidential employee assistance sessions.</p>
                  </div>
                  <button
                    onClick={() => setShowBookSessionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Book Appointment</span>
                  </button>
                </div>

                {(!health.counsellingAppointments || health.counsellingAppointments.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No counseling appointments booked yet.</div>
                ) : (
                  <div className="space-y-3">
                    {health.counsellingAppointments.map((app: CounsellingAppointment, idx: number) => {
                      const appId = app.id || app._id;
                      return (
                        <div key={appId || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 m-0">{app.topic}</h4>
                            <p className="text-[11px] text-slate-600">
                              Counsellor: <span className="font-semibold">{app.counsellorName}</span>
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {app.appointmentDate}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {app.appointmentTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                              app.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              app.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>{app.status}</span>
                            {appId && app.status === 'Scheduled' && (
                              <button
                                onClick={() => cancelCounselling(appId)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded text-xs font-bold cursor-pointer transition-all"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fitness Tab */}
          {activeTab === 'fitness' && (
            <div className="space-y-6">
              {/* Challenge Overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Corporate Fitness Challenge</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Participate in monthly wellness challenges & earn corporate health points.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Reward Points: {health.fitnessRewardPoints || 1200} pts
                    </span>
                  </div>
                </div>

                {health.fitnessChallengeName ? (
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
                      {health.fitnessChallengeRank && `Current Rank: #${health.fitnessChallengeRank} • `}
                      {(health.fitnessChallengeCurrentSteps || 0).toLocaleString()} steps completed this month
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
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Activity className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">No active fitness challenge. Click &quot;Enroll Challenge&quot; to join.</p>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Recent Activity Logs</h3>
                  <button
                    onClick={() => setShowFitnessModal(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#004848] text-white rounded-lg text-xs font-bold hover:bg-[#006666] cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Log Activity
                  </button>
                </div>
                {(!health.fitnessActivities || health.fitnessActivities.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No workout activities logged yet.</div>
                ) : (
                  <div className="space-y-2.5">
                    {health.fitnessActivities.map((act: FitnessActivity, idx: number) => (
                      <div key={act.id || act._id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{act.activityName}</div>
                          <div className="text-[11px] text-slate-500">
                            {act.date} • {act.durationMinutes} mins • {act.stepsCount.toLocaleString()} steps
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-orange-600 flex items-center gap-1 justify-end">
                            <Flame className="h-3.5 w-3.5" /> {act.caloriesBurned || 0} kcal
                          </span>
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

      {/* Insurance E-Card Modal */}
      {showECardModal && health && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Digital Card Preview */}
            <div className="bg-gradient-to-br from-[#002222] via-[#004848] to-[#006666] p-6 text-white relative">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] tracking-widest font-extrabold text-teal-300 uppercase">Huremaso Corporate Health Shield</span>
                  <h3 className="text-xl font-extrabold text-white mt-1">E-Health Insurance Card</h3>
                </div>
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <QrCode className="h-8 w-8 text-teal-200" />
                </div>
              </div>
              <div className="mt-6 space-y-1">
                <div className="text-[11px] text-teal-200 font-semibold">Primary Insured Member</div>
                <div className="text-lg font-extrabold">{health.employeeName}</div>
                <div className="text-xs text-teal-100">ID: {health.employeeId} • Dept: {health.department}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-teal-200 text-[10px] block">Policy Number</span>
                  <span className="font-bold font-mono">{health.groupInsurancePolicyNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-teal-200 text-[10px] block">Sum Insured</span>
                  <span className="font-extrabold text-teal-300">${health.groupInsuranceSumInsured.toLocaleString()} USD</span>
                </div>
              </div>
            </div>
            {/* Dependents list */}
            <div className="p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 m-0">Covered Members Under This Card:</h4>
              <div className="space-y-2">
                {health.insuranceDependents.map((dep, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-900">{dep.name}</span>
                    <span className="text-slate-500">{dep.relationship}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowECardModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Print / Download Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Submit Medical Claim</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Claim Type *</label>
                <select
                  value={newClaim.type}
                  onChange={e => setNewClaim(c => ({ ...c, type: e.target.value as ClaimType }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  {CLAIM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description *</label>
                <input
                  value={newClaim.description}
                  onChange={e => setNewClaim(c => ({ ...c, description: e.target.value }))}
                  placeholder="e.g. Dental Consultation & Cleaning at City Clinic"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Currency</label>
                  <select
                    value={newClaim.currency}
                    onChange={e => setNewClaim(c => ({ ...c, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receipt / Invoice Notes</label>
                <textarea
                  value={newClaim.notes}
                  onChange={e => setNewClaim(c => ({ ...c, notes: e.target.value }))}
                  rows={2}
                  placeholder="Receipt verified with tax invoice..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowClaimModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={!newClaim.description || !newClaim.amount || healthLoading}
                className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Add Insurance Dependent</h3>
              <button onClick={() => setShowDependentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  value={newDependent.name}
                  onChange={e => setNewDependent(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Emma Johnson"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Relationship *</label>
                <select
                  value={newDependent.relationship}
                  onChange={e => setNewDependent(d => ({ ...d, relationship: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  <option value="">Select relationship...</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowDependentModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAddDependent}
                disabled={!newDependent.name || !newDependent.relationship || healthLoading}
                className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {healthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Add Dependent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Counselling Modal */}
      {showBookSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Book Confidential Counseling Session</h3>
              <button onClick={() => setShowBookSessionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleBookSession} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Counsellor / Specialist</label>
                <input
                  type="text"
                  required
                  value={sessionForm.counsellorName}
                  onChange={e => setSessionForm({ ...sessionForm, counsellorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.appointmentDate}
                    onChange={e => setSessionForm({ ...sessionForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.appointmentTime}
                    onChange={e => setSessionForm({ ...sessionForm, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topic / Area of Focus</label>
                <input
                  type="text"
                  required
                  value={sessionForm.topic}
                  onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  placeholder="e.g. Workplace Stress, Work-Life Balance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookSessionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Fitness Modal */}
      {showFitnessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Log Workout Activity</h3>
              <button onClick={() => setShowFitnessModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLogFitness} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={fitnessForm.activityName}
                  onChange={e => setFitnessForm({ ...fitnessForm, activityName: e.target.value })}
                  placeholder="e.g. Morning Jog, Cycling, Swimming"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={fitnessForm.date}
                    onChange={e => setFitnessForm({ ...fitnessForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={fitnessForm.durationMinutes}
                    onChange={e => setFitnessForm({ ...fitnessForm, durationMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Steps Count</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fitnessForm.stepsCount}
                    onChange={e => setFitnessForm({ ...fitnessForm, stepsCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Calories Burned (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={fitnessForm.caloriesBurned}
                    onChange={e => setFitnessForm({ ...fitnessForm, caloriesBurned: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFitnessModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Log Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Challenge Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Enroll in Fitness Challenge</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEnrollChallenge} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Challenge Name</label>
                <input
                  type="text"
                  required
                  value={challengeForm.challengeName}
                  onChange={e => setChallengeForm({ ...challengeForm, challengeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Steps Goal</label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={challengeForm.stepsGoal}
                  onChange={e => setChallengeForm({ ...challengeForm, stepsGoal: parseInt(e.target.value) || 100000 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Enroll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessHealthPage;
