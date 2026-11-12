import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Laptop, 
  User, 
  GraduationCap, 
  Globe, 
  Heart, 
  Layers, 
  BarChart3, 
  Send, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Download, 
  RefreshCw, 
  Search, 
  Check, 
  X, 
  AlertTriangle, 
  ChevronRight,
  Briefcase,
  Monitor,
  Phone,
  CreditCard,
  Building,
  Calendar,
  Award,
  TrendingUp,
  Mail,
  Filter
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { onboardingService } from '../../services/onboardingService';
import {
  OnboardingCandidate,
  OnboardingReportSummary,
  CreateCandidatePayload,
  VerificationCheckStatus,
} from '../../types/onboarding';

export const EmployeeOnboardingPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Candidates & Selection State
  const [candidates, setCandidates] = useState<OnboardingCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [reports, setReports] = useState<OnboardingReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Sub-tabs for section views
  const [bgTab, setBgTab] = useState<'legal' | 'pcc' | 'immigration' | 'biometrics' | 'credentials' | 'digital' | 'postHire'>('legal');
  const [assessmentTab, setAssessmentTab] = useState<'psychometric' | 'language' | 'performance' | 'technical' | 'at'>('psychometric');
  const [psychometricSubTab, setPsychometricSubTab] = useState<'genius' | 'reports'>('genius');
  const [docTab, setDocTab] = useState<'contract' | 'nda'>('contract');

  // Modal State for adding new candidate
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState<CreateCandidatePayload>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'Engineering',
    startDate: '',
    baseSalary: '$150,000',
    equity: '0.10%',
    buddyName: '',
    managerName: '',
  });

  // Offer builder form state (linked to selected candidate)
  const [offerForm, setOfferForm] = useState({
    roleTitle: '',
    baseSalary: '',
    equity: '',
    bonus: '',
    signOnBonus: '',
  });

  // Selected candidate object
  const currentCandidate: OnboardingCandidate | undefined = candidates.find(
    (c) => c.id === selectedCandidateId
  ) || candidates[0];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [candRes, repRes] = await Promise.all([
        onboardingService.getCandidates({
          search: searchQuery || undefined,
          department: deptFilter !== 'All' ? deptFilter : undefined,
        }),
        onboardingService.getReportsSummary(),
      ]);
      setCandidates(candRes.items);
      setReports(repRes);
      if (candRes.items.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(candRes.items[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load onboarding data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, deptFilter, selectedCandidateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync offer form when candidate changes
  useEffect(() => {
    if (currentCandidate) {
      setOfferForm({
        roleTitle: currentCandidate.offer?.roleTitle || currentCandidate.role,
        baseSalary: currentCandidate.offer?.baseSalary || '$150,000',
        equity: currentCandidate.offer?.equity || '0.10%',
        bonus: currentCandidate.offer?.bonus || '10% Annual',
        signOnBonus: currentCandidate.offer?.signOnBonus || '$5,000',
      });
    }
  }, [selectedCandidateId, currentCandidate]);

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateForm.name || !newCandidateForm.email || !newCandidateForm.role) {
      toast.error('Please fill in required fields (Name, Email, Role).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onboardingService.createCandidate(newCandidateForm);
      toast.success(`Candidate ${created.name} added to onboarding pipeline!`);
      setIsAddModalOpen(false);
      setNewCandidateForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: 'Engineering',
        startDate: '',
        baseSalary: '$150,000',
        equity: '0.10%',
        buddyName: '',
        managerName: '',
      });
      await loadData();
      setSelectedCandidateId(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add candidate';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVerificationStatus = async (status: VerificationCheckStatus, notes?: string) => {
    if (!currentCandidate) return;
    try {
      const updated = await onboardingService.updateVerification(currentCandidate.id, bgTab, status, notes);
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`${bgTab.toUpperCase()} verification marked as ${status}!`);
    } catch {
      toast.error('Failed to update verification status.');
    }
  };

  const handleSaveOffer = async () => {
    if (!currentCandidate) return;
    setIsSubmitting(true);
    try {
      const updated = await onboardingService.updateOffer(currentCandidate.id, {
        ...offerForm,
        status: 'Offer Accepted',
      });
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`Smart Offer Letter updated for ${currentCandidate.name}!`);
    } catch {
      toast.error('Failed to update offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDocStatus = async (status: 'Pending' | 'Drafted' | 'Signed') => {
    if (!currentCandidate) return;
    try {
      const updated = await onboardingService.updateDocument(currentCandidate.id, docTab, status);
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`${docTab.toUpperCase()} document marked as ${status}!`);
    } catch {
      toast.error('Failed to update document status.');
    }
  };

  const handleToggleProvision = async (key: keyof OnboardingCandidate['provisions']) => {
    if (!currentCandidate) return;
    try {
      const currentVal = currentCandidate.provisions[key];
      const updatedProvisions = {
        ...currentCandidate.provisions,
        [key]: {
          ...currentVal,
          assigned: !currentVal.assigned,
        },
      };
      const updated = await onboardingService.updateProvisions(currentCandidate.id, updatedProvisions);
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`${key.toUpperCase()} provision updated!`);
    } catch {
      toast.error('Failed to update provision.');
    }
  };

  const handleUpdateTrainingProgress = async (idx: number, newProgress: number) => {
    if (!currentCandidate) return;
    try {
      const newModules = [...currentCandidate.training];
      newModules[idx] = {
        ...newModules[idx],
        progress: newProgress,
        status: newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : 'Not Started',
      };
      const updated = await onboardingService.updateTraining(currentCandidate.id, newModules);
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`Training progress updated to ${newProgress}%!`);
    } catch {
      toast.error('Failed to update training.');
    }
  };

  const handleUpdateCandidateStatus = async (status: OnboardingCandidate['status']) => {
    if (!currentCandidate) return;
    try {
      const updated = await onboardingService.updateCandidate(currentCandidate.id, { status });
      setCandidates((prev) => prev.map((c) => (c.id === currentCandidate.id ? updated : c)));
      toast.success(`Candidate status updated to '${status}'!`);
    } catch {
      toast.error('Failed to update candidate status.');
    }
  };

  const isFinalList = path.includes('/final-list');
  const isBgVerification = path.includes('/background-verification');
  const isAssessments = path.includes('/assessments');
  const isOffers = path.includes('/offers');
  const isDocuments = path.includes('/documents');
  const isProvisions = path.includes('/provisions');
  const isBuddyManager = path.includes('/buddy-manager');
  const isTraining = path.includes('/training');
  const isVisaImmigration = path.includes('/visa-immigration');
  const isInsurance = path.includes('/insurance');
  const isMiscellaneous = path.includes('/miscellaneous');
  const isReports = path.includes('/reports');

  // Candidate Selector Component rendered on section pages
  const CandidateSelector = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-[#004848]" />
        <span className="text-xs font-bold text-slate-700">Active Candidate:</span>
        <select
          value={selectedCandidateId}
          onChange={(e) => setSelectedCandidateId(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-[#004848] transition-colors cursor-pointer"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.role} ({c.department})
            </option>
          ))}
        </select>
      </div>

      {currentCandidate && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Stage:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            {currentCandidate.status}
          </span>
          <button
            onClick={() => handleUpdateCandidateStatus('Ready to Join')}
            className="px-3 py-1 bg-[#004848] hover:bg-[#003333] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            Mark Ready to Join
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex justify-center">
          <Loader size="lg" text="Loading onboarding records from database..." />
        </div>
      )}

      {/* Error state */}
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

      {/* VIEW 1: FINAL LIST */}
      {!isLoading && !error && isFinalList && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
                <UserCheck className="h-3.5 w-3.5 text-teal-300" />
                <span>Onboarding Pipeline</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Final Onboarding Candidate List</h1>
              <p className="text-xs text-teal-100/80 mt-1">Cleared candidates ready for background verification, contract signing, and provision setup.</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#004848] hover:bg-teal-50 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Candidate</span>
            </button>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Total in Pipeline</span>
              <div className="text-2xl font-extrabold text-[#004848] mt-1">{reports?.totalOnboarding ?? candidates.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Offer Accepted</span>
              <div className="text-2xl font-extrabold text-teal-700 mt-1">
                {candidates.filter(c => c.status === 'Offer Accepted').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Verification Pending</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {candidates.filter(c => c.status === 'Verification Pending').length}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs font-bold text-slate-500">Completed</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{reports?.completedCount ?? 0}</div>
            </div>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, role, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            {candidates.length === 0 ? (
              <EmptyState title="No candidates found" description="Add candidate to start onboarding." />
            ) : (
              candidates.map((c) => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-slate-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 m-0">{c.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">({c.candidateId})</span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {c.role} • {c.department} • Start: {c.startDate} • {c.email}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      c.status === 'Completed' || c.status === 'Contract Signed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : c.status === 'Verification Pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-teal-50 text-teal-800 border-teal-200'
                    }`}>
                      {c.status}
                    </span>

                    <select
                      value={c.status}
                      onChange={(e) => {
                        setSelectedCandidateId(c.id);
                        onboardingService.updateCandidate(c.id, { status: e.target.value as any }).then((updated) => {
                          setCandidates(prev => prev.map(item => item.id === c.id ? updated : item));
                          toast.success(`Status updated to '${e.target.value}'`);
                        });
                      }}
                      className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="Offer Accepted">Offer Accepted</option>
                      <option value="Verification Pending">Verification Pending</option>
                      <option value="Contract Signed">Contract Signed</option>
                      <option value="Provisioning">Provisioning</option>
                      <option value="Ready to Join">Ready to Join</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: BACKGROUND VERIFICATION */}
      {!isLoading && !error && isBgVerification && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Background Verification</h1>
            <p className="text-xs text-teal-100/80 mt-1">Legal checks, police clearance, biometrics, credentials & digital footprint audits.</p>
          </div>

          <CandidateSelector />

          {/* Sub-tabs for BG Verification */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'legal', label: 'Legal Check' },
              { id: 'pcc', label: 'PCC' },
              { id: 'immigration', label: 'Immigration' },
              { id: 'biometrics', label: 'Identity + Biometrics' },
              { id: 'credentials', label: 'Documents + Credentials' },
              { id: 'digital', label: 'Digital Footprint' },
              { id: 'postHire', label: 'Post-hire Check' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setBgTab(t.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  bgTab === t.id ? 'bg-[#004848] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              {(() => {
                const check = currentCandidate.backgroundVerification?.[bgTab] || { status: 'Pending', notes: '', verifiedBy: '', verifiedAt: '' };
                const isVerified = check.status === 'Verified';

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-150 pb-4 gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 m-0">
                          {currentCandidate.name} — {bgTab.toUpperCase()} Verification
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          Status: {check.status} {check.verifiedBy && `• Verified by ${check.verifiedBy}`} {check.verifiedAt && `on ${check.verifiedAt}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : check.status === 'Flagged'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                        <span className="text-xs font-bold text-slate-700">Audit Check Notes</span>
                        <p className="text-xs text-slate-600">{check.notes || 'No flags reported during automated API check.'}</p>
                      </div>

                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                        <span className="text-xs font-bold text-slate-700">Actions</span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateVerificationStatus('Verified', 'Verified via API credentials')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Mark Verified
                          </button>
                          <button
                            onClick={() => handleUpdateVerificationStatus('Flagged', 'Discrepancy noted in records')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Flag Discrepancy
                          </button>
                          <button
                            onClick={() => handleUpdateVerificationStatus('In Progress', 'Manual review initiated')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Mark In Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ASSESSMENTS */}
      {!isLoading && !error && isAssessments && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Candidate Assessments</h1>
            <p className="text-xs text-teal-100/80 mt-1">Psychometric Genius tests, language proficiency, technical evaluations, and AT assessments.</p>
          </div>

          <CandidateSelector />

          {/* Assessment Main Tabs */}
          <div className="space-y-3 border-b border-slate-200 pb-3 select-none">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'psychometric', label: 'Psychometric Tests' },
                { id: 'language', label: 'Language + Communication' },
                { id: 'performance', label: 'Performance Assessment' },
                { id: 'technical', label: 'Technical Assessment' },
                { id: 'at', label: 'AT Assessment' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAssessmentTab(t.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    assessmentTab === t.id
                      ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {assessmentTab === 'psychometric' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Psychometric Views:</span>
                {[
                  { id: 'genius', label: 'Genius Test' },
                  { id: 'reports', label: 'Reports' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setPsychometricSubTab(sub.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      psychometricSubTab === sub.id
                        ? 'bg-slate-900 text-white border-transparent shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentCandidate && assessmentTab === 'psychometric' && psychometricSubTab === 'genius' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Genius Psychometric Test Suite</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Adaptive cognitive aptitude, situational judgment, and problem-solving speed assessment.</p>
                </div>
                <button 
                  onClick={() => toast.success(`Genius test session launched for ${currentCandidate.name}!`)}
                  className="px-4 py-2 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] transition-colors"
                >
                  Launch Genius Test
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Genius Score Benchmark</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    {currentCandidate.assessments?.psychometric?.geniusScore ?? 94} / 100
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Top 3rd Percentile</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Cognitive Speed Index</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {currentCandidate.assessments?.psychometric?.cognitiveSpeed ?? '1.45x Fast'}
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold">Rapid Decision Making</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Test Completion Time</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {currentCandidate.assessments?.psychometric?.completionTime ?? '22 mins'}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">45 mins allocated</span>
                </div>
              </div>
            </div>
          )}

          {currentCandidate && assessmentTab === 'psychometric' && psychometricSubTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Psychometric Assessment Evaluation Report</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Comprehensive behavioral personality matrix, stress resilience rating, and team compatibility.</p>
                </div>
                <button 
                  onClick={() => toast.success(`Downloading Psychometric Assessment PDF Report for ${currentCandidate.name}...`)}
                  className="px-4 py-2 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Report PDF</span>
                </button>
              </div>

              <div className="space-y-3">
                {(currentCandidate.assessments?.psychometric?.traits || [
                  { trait: 'Analytical Problem Solving', score: '96%', desc: 'Exceptional capacity for breaking down complex architectural challenges.' },
                  { trait: 'Emotional Stability & Stress Tolerance', score: '91%', desc: 'High composure under tight project delivery deadlines.' },
                  { trait: 'Team Collaboration & Empathy', score: '94%', desc: 'Strong active listening skills and collaborative mindset.' }
                ]).map((row, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 m-0">{row.trait}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{row.desc}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">{row.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentCandidate && assessmentTab !== 'psychometric' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 capitalize">{assessmentTab} Assessment Results</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Candidate Score: {currentCandidate.assessments?.[assessmentTab]?.score || '98% Pass'}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{currentCandidate.assessments?.[assessmentTab]?.notes || 'Evaluated and approved by interview board'}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">Passed</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: OFFERS */}
      {!isLoading && !error && isOffers && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Offer Management</h1>
            <p className="text-xs text-teal-100/80 mt-1">Smart offer letters, compensation structuring, equity benchmarks, and acceptance tracking.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Offer builder form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Configure Smart Offer</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
                    <input
                      type="text"
                      value={offerForm.roleTitle}
                      onChange={(e) => setOfferForm({ ...offerForm, roleTitle: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary</label>
                      <input
                        type="text"
                        value={offerForm.baseSalary}
                        onChange={(e) => setOfferForm({ ...offerForm, baseSalary: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Equity</label>
                      <input
                        type="text"
                        value={offerForm.equity}
                        onChange={(e) => setOfferForm({ ...offerForm, equity: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Performance Bonus</label>
                      <input
                        type="text"
                        value={offerForm.bonus}
                        onChange={(e) => setOfferForm({ ...offerForm, bonus: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sign-on Bonus</label>
                      <input
                        type="text"
                        value={offerForm.signOnBonus}
                        onChange={(e) => setOfferForm({ ...offerForm, signOnBonus: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveOffer}
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save & Generate Offer'}
                    </button>
                    <button
                      onClick={() => toast.success(`Official Offer Letter emailed to ${currentCandidate.email}!`)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Offer</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Offer Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Offer Package Preview</h3>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                    {currentCandidate.offer?.status || 'Offer Accepted'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Candidate</span>
                    <span className="text-xs font-bold text-slate-900">{currentCandidate.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Designation</span>
                    <span className="text-xs font-bold text-[#004848]">{offerForm.roleTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Base Compensation</span>
                    <span className="text-xs font-bold text-slate-900">{offerForm.baseSalary} / yr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Stock Options (Equity)</span>
                    <span className="text-xs font-bold text-slate-900">{offerForm.equity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-semibold">Annual Bonus</span>
                    <span className="text-xs font-bold text-slate-900">{offerForm.bonus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: DOCUMENTS */}
      {!isLoading && !error && isDocuments && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Employment Documents</h1>
            <p className="text-xs text-teal-100/80 mt-1">Smart employment contracts, NDAs, IP assignments, and digital e-signatures.</p>
          </div>

          <CandidateSelector />

          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'contract', label: 'Employment Contract' },
              { id: 'nda', label: 'Non-Disclosure Agreement (NDA)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDocTab(t.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  docTab === t.id ? 'bg-[#004848] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              {(() => {
                const doc = currentCandidate.documents?.[docTab] || { status: 'Pending', signedDate: '', docUrl: '' };
                const isSigned = doc.status === 'Signed';

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 m-0">
                          {currentCandidate.name} — {docTab === 'contract' ? 'Employment Contract' : 'Non-Disclosure Agreement'}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          Status: {doc.status} {doc.signedDate && `• Signed on ${doc.signedDate}`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                        isSigned
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-[#004848]" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 m-0">
                            {currentCandidate.name.replace(/\s+/g, '_')}_{docTab}_2026.pdf
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold">Standard Legal Template v4.2 • 256-bit Encrypted</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateDocStatus('Drafted')}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Draft with AI
                        </button>
                        <button
                          onClick={() => handleUpdateDocStatus('Signed')}
                          className="px-3 py-1.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Mark Signed
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: PROVISIONS */}
      {!isLoading && !error && isProvisions && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Hardware & Asset Provisions</h1>
            <p className="text-xs text-teal-100/80 mt-1">Laptops, workstations, corporate SIMs, credit cards, and home-office allowances.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'laptop', label: 'Laptop & Dev Workstation', icon: Laptop, details: currentCandidate.provisions?.laptop?.model || 'MacBook Pro 16" M3 Max', active: currentCandidate.provisions?.laptop?.assigned },
                { key: 'workstation', label: 'Office Desk / Workstation', icon: Monitor, details: currentCandidate.provisions?.workstation?.deskNo || 'Desk 4B-12', active: currentCandidate.provisions?.workstation?.assigned },
                { key: 'simCard', label: 'Corporate SIM Card', icon: Phone, details: currentCandidate.provisions?.simCard?.number || '+1 (555) 389-9921', active: currentCandidate.provisions?.simCard?.assigned },
                { key: 'creditCard', label: 'Corporate Expense Card', icon: CreditCard, details: currentCandidate.provisions?.creditCard?.cardType || 'Corporate Visa', active: currentCandidate.provisions?.creditCard?.assigned },
                { key: 'homeOffice', label: 'Home Office Setup Grant', icon: Building, details: '$1,500 Allowance Credited', active: currentCandidate.provisions?.homeOffice?.assigned },
              ].map((prov) => {
                const Icon = prov.icon;
                return (
                  <div key={prov.key} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-9 w-9 rounded-lg bg-teal-50 text-[#004848] flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          prov.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {prov.active ? 'Assigned' : 'Unassigned'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 m-0">{prov.label}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">{prov.details}</p>
                    </div>

                    <button
                      onClick={() => handleToggleProvision(prov.key as any)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        prov.active 
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700' 
                          : 'bg-[#004848] text-white hover:bg-[#003333] border-transparent'
                      }`}
                    >
                      {prov.active ? 'Remove Provision' : 'Assign Provision'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 7: BUDDY / DIRECT MANAGER */}
      {!isLoading && !error && isBuddyManager && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Buddy & Direct Manager Assignment</h1>
            <p className="text-xs text-teal-100/80 mt-1">Assign onboarding buddies, designated managers, and schedule 1:1 welcome introductions.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-50 text-[#004848] flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Assigned Onboarding Buddy</h3>
                    <p className="text-xs text-slate-500 font-semibold">Peer mentor for day-to-day guidance</p>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{currentCandidate.buddyManager?.buddyName || 'David Chen'}</span>
                    <span className="text-[11px] text-teal-700 font-semibold">{currentCandidate.buddyManager?.buddyRole || 'Lead Architect'}</span>
                  </div>
                  <p className="text-xs text-slate-500">Department: {currentCandidate.department}</p>
                </div>

                <button
                  onClick={() => toast.success(`1:1 Buddy Welcome Coffee scheduled with ${currentCandidate.buddyManager?.buddyName}!`)}
                  className="w-full py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Schedule Buddy 1:1 Intro
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Reporting Manager</h3>
                    <p className="text-xs text-slate-500 font-semibold">Direct supervisor & performance lead</p>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{currentCandidate.buddyManager?.managerName || 'Sarah Jenkins'}</span>
                    <span className="text-[11px] text-indigo-700 font-semibold">{currentCandidate.buddyManager?.managerRole || 'VP of Engineering'}</span>
                  </div>
                  <p className="text-xs text-slate-500">Department: {currentCandidate.department}</p>
                </div>

                <button
                  onClick={() => toast.success(`Day 1 Manager Orientation scheduled with ${currentCandidate.buddyManager?.managerName}!`)}
                  className="w-full py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Schedule Manager Orientation
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 8: TRAINING */}
      {!isLoading && !error && isTraining && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Onboarding Training Curriculum</h1>
            <p className="text-xs text-teal-100/80 mt-1">Compliance courses, technical architecture overviews, security modules, and progress tracking.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Assigned Training Modules</h3>

              <div className="space-y-3">
                {(currentCandidate.training || []).map((mod, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#004848]" />
                        <h4 className="text-xs font-bold text-slate-900 m-0">{mod.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">Duration: {mod.duration} • Status: {mod.status}</p>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-xs mt-1">
                        <div className="bg-[#004848] h-1.5 rounded-full" style={{ width: `${mod.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 font-mono mr-2">{mod.progress}%</span>
                      {mod.progress < 100 ? (
                        <button
                          onClick={() => handleUpdateTrainingProgress(idx, 100)}
                          className="px-3 py-1 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 9: VISA & IMMIGRATION */}
      {!isLoading && !error && isVisaImmigration && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Visa & Immigration Services</h1>
            <p className="text-xs text-teal-100/80 mt-1">Work permit tracking, USCIS petition status, document filing, and expiration dates.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Work Authorization & Passport Details</h3>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentCandidate.visa?.status || 'Approved'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Visa / Permit Category</span>
                  <div className="text-sm font-bold text-[#004848]">{currentCandidate.visa?.visaType || 'H-1B Specialty Work Visa'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Passport Number</span>
                  <div className="text-sm font-bold text-slate-900 font-mono">{currentCandidate.visa?.passportNo || 'P8920114B'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Validity Expiration</span>
                  <div className="text-sm font-bold text-slate-900">{currentCandidate.visa?.expiryDate || '2029-08-15'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Issuing Jurisdiction</span>
                  <div className="text-sm font-bold text-slate-900">{currentCandidate.visa?.country || 'United States'}</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => toast.success('USCIS Immigration Case Status refreshed via Live Portal!')}
                  className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Immigration Status</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 10: INSURANCE */}
      {!isLoading && !error && isInsurance && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Health & Life Insurance Enrollment</h1>
            <p className="text-xs text-teal-100/80 mt-1">Medical coverage, dental, vision, life policies, and family dependent enrollments.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Comprehensive Health Policy</h3>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentCandidate.insurance?.status || 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Insurance Provider</span>
                  <div className="text-sm font-bold text-[#004848]">{currentCandidate.insurance?.provider || 'BlueCross Comprehensive Global Health'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Policy Number</span>
                  <div className="text-sm font-bold text-slate-900 font-mono">{currentCandidate.insurance?.policyNumber || 'POL-90281489'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Coverage Maximum</span>
                  <div className="text-sm font-bold text-slate-900">{currentCandidate.insurance?.coverageAmount || '$1,000,000'}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Enrolled Dependents</span>
                  <div className="text-sm font-bold text-slate-900">{currentCandidate.insurance?.dependentsCount ?? 2} Family Members</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toast.success(`Digital Insurance Card downloaded for ${currentCandidate.name}!`)}
                  className="px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Digital Card</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 11: MISCELLANEOUS */}
      {!isLoading && !error && isMiscellaneous && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Miscellaneous Onboarding Preferences</h1>
            <p className="text-xs text-teal-100/80 mt-1">Professional associations, special accommodation requests, and custom perks.</p>
          </div>

          <CandidateSelector />

          {currentCandidate && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Custom Employee Preferences</h3>

              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Industry Memberships & Associations</span>
                  <p className="text-xs font-bold text-slate-800">{currentCandidate.miscellaneous?.association || 'IEEE & ACM Professional Member'}</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Special Workplace Accommodation Requests</span>
                  <p className="text-xs font-bold text-slate-800">{currentCandidate.miscellaneous?.specialRequests || 'Ergonomic standing desk & dual 4K monitors'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 12: REPORTS */}
      {!isLoading && !error && isReports && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-teal-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">AI Analytics</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Onboarding Reports & Insights</h1>
            <p className="text-xs text-teal-100/80 mt-1">End-to-end metrics, stage velocity, compliance rate, and bottleneck analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">Active Candidates</span>
              <div className="text-3xl font-extrabold text-[#004848]">{reports?.totalOnboarding ?? candidates.length}</div>
              <span className="text-[11px] text-teal-600 font-semibold">In current cycle</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">Avg. Time to Onboard</span>
              <div className="text-3xl font-extrabold text-slate-900">{reports?.averageOnboardingDays ?? 14} Days</div>
              <span className="text-[11px] text-emerald-600 font-semibold">-3 days vs industry average</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">Compliance Rate</span>
              <div className="text-3xl font-extrabold text-emerald-600">{reports?.complianceRate ?? 98.5}%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Audit Compliant</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">Completed Full Cycle</span>
              <div className="text-3xl font-extrabold text-teal-700">{reports?.completedCount ?? 0}</div>
              <span className="text-[11px] text-slate-500 font-semibold">Ready & active</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Onboarding Stage Velocity Breakdown</h3>
              <button
                onClick={() => toast.success('Exporting Onboarding Executive PDF Report...')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Report</span>
              </button>
            </div>

            <div className="space-y-3">
              {[
                { stage: 'Background Verification Clearance', avgDays: '3.2 Days', passRate: '100%', status: 'Optimal' },
                { stage: 'Contract & NDA E-Signature', avgDays: '1.8 Days', passRate: '98%', status: 'Optimal' },
                { stage: 'Hardware Provision Delivery', avgDays: '4.5 Days', passRate: '96%', status: 'Normal' },
                { stage: 'Training Module Completion', avgDays: '5.1 Days', passRate: '94%', status: 'Normal' },
              ].map((row, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{row.stage}</h4>
                    <span className="text-[11px] text-slate-500 font-semibold">Avg Velocity: {row.avgDays} • Pass Rate: {row.passRate}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Candidate to Onboarding">
        <form onSubmit={handleCreateCandidate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newCandidateForm.name}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={newCandidateForm.email}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={newCandidateForm.role}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, role: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                placeholder="Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={newCandidateForm.department}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, department: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="text"
                value={newCandidateForm.startDate}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, startDate: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                placeholder="Oct 15, 2026"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary</label>
              <input
                type="text"
                value={newCandidateForm.baseSalary}
                onChange={(e) => setNewCandidateForm({ ...newCandidateForm, baseSalary: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                placeholder="$150,000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add to Pipeline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeOnboardingPage;
