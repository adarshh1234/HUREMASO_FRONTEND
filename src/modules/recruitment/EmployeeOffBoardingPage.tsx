import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  UserMinus, 
  Sparkles, 
  FileText, 
  Laptop, 
  User, 
  Award, 
  Globe, 
  ShieldCheck, 
  BarChart3, 
  Send, 
  CheckCircle2, 
  Clock, 
  Download, 
  Lock, 
  FileCheck, 
  Car, 
  Plane, 
  DollarSign, 
  Briefcase, 
  History, 
  AlertCircle, 
  CheckSquare, 
  RotateCcw, 
  TrendingUp, 
  Activity,
  Layers,
  Heart,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  CreditCard,
  Building,
  UserCheck
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { offboardingService } from '../../services/offboardingService';
import { IOffboardingRecord, OffboardingReportsSummary } from '../../types/offboarding';

export const EmployeeOffBoardingPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Data state
  const [records, setRecords] = useState<(IOffboardingRecord & { id: string })[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [reportsSummary, setReportsSummary] = useState<OffboardingReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Record Modal State
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('Engineering');
  const [newSeparationType, setNewSeparationType] = useState<'Resignation' | 'Termination' | 'Mutual Separation' | 'Retirement'>('Resignation');
  const [newReason, setNewReason] = useState<string>('');
  const [newNoticeDuration, setNewNoticeDuration] = useState<string>('30 Days');

  // Active page-level green pill tab states
  const [docTab, setDocTab] = useState<'resignation-ai' | 'termination-ai'>('resignation-ai');
  const [perfTab, setPerfTab] = useState<'history' | 'appraisal' | 'reference'>('history');
  const [settlementTab, setSettlementTab] = useState<'compensation' | 'gratuity' | 'notice-salary' | 'pending-salary' | 'other-benefits'>('compensation');
  const [legalTab, setLegalTab] = useState<'cheque' | 'visa-cancel' | 'insurance' | 'pcc'>('cheque');
  const [assetTab, setAssetTab] = useState<'possessed' | 'return' | 'dependencies' | 'missing' | 'cost-calc' | 'asset-settlement'>('possessed');
  const [travelTab, setTravelTab] = useState<'tickets' | 'misc-custom'>('tickets');
  const [reportTab, setReportTab] = useState<'reports-ai' | 'analytics-ai'>('reports-ai');

  // AI Drafting form state (local edits synced to selected record)
  const [isDraftingDoc, setIsDraftingDoc] = useState(false);
  const [docNoticeDuration, setDocNoticeDuration] = useState('30 Days (Standard)');
  const [docReasonText, setDocReasonText] = useState('Pursuing higher studies & career transition');
  const [termType, setTermType] = useState('Mutual Separation Agreement');
  const [severanceText, setSeveranceText] = useState('Includes 2 months severance pay, COBRA health insurance continuation, and NDA non-solicitation reminder.');

  const fetchOffboardingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recData, repData] = await Promise.all([
        offboardingService.getRecords(),
        offboardingService.getReportsSummary().catch(() => null),
      ]);
      setRecords(recData.items);
      if (recData.items.length > 0 && !selectedRecordId) {
        setSelectedRecordId(recData.items[0].id);
      }
      if (repData) {
        setReportsSummary(repData);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load offboarding records');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecordId, toast]);

  useEffect(() => {
    fetchOffboardingData();
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedRecordId || r._id === selectedRecordId) || records[0];

  useEffect(() => {
    if (selectedRecord) {
      setDocNoticeDuration(selectedRecord.documents?.resignationLetter?.noticeDuration || '30 Days (Standard)');
      setDocReasonText(selectedRecord.documents?.resignationLetter?.reason || 'Pursuing higher studies & career transition');
      setTermType(selectedRecord.documents?.terminationLetter?.terminationType || 'Mutual Separation Agreement');
      setSeveranceText(selectedRecord.documents?.terminationLetter?.severanceDetails || 'Includes 2 months severance pay, COBRA health continuation, and standard release.');
    }
  }, [selectedRecordId, records]);

  // Handlers
  const handleDraftResignation = async () => {
    if (!selectedRecord) return;
    setIsDraftingDoc(true);
    try {
      const updated = await offboardingService.updateDocument(selectedRecord.id, {
        type: 'resignation',
        status: 'Drafted',
        noticeDuration: docNoticeDuration,
        reason: docReasonText,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`AI Resignation Letter drafted and saved for ${selectedRecord.employeeName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to draft resignation letter');
    } finally {
      setIsDraftingDoc(false);
    }
  };

  const handleDraftTermination = async () => {
    if (!selectedRecord) return;
    setIsDraftingDoc(true);
    try {
      const updated = await offboardingService.updateDocument(selectedRecord.id, {
        type: 'termination',
        status: 'Issued',
        terminationType: termType,
        severanceDetails: severanceText,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`AI Termination Letter generated and saved for ${selectedRecord.employeeName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to draft termination letter');
    } finally {
      setIsDraftingDoc(false);
    }
  };

  const handleUpdateSettlementStatus = async (newStatus: 'Pending Audit' | 'Approved' | 'Disbursed') => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateSettlement(selectedRecord.id, {
        status: newStatus,
        disbursedDate: newStatus === 'Disbursed' ? new Date().toISOString().split('T')[0] : selectedRecord.settlement?.disbursedDate,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Settlement status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update settlement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLegalField = async (payload: Partial<IOffboardingRecord['legal']>) => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateLegal(selectedRecord.id, payload);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Legal clearance status updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update legal status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAssetItem = async (itemTag: string, newStatus: 'Possessed' | 'Pending Return' | 'Returned' | 'Missing' | 'Damaged') => {
    if (!selectedRecord) return;
    const currentItems = selectedRecord.assets?.items || [];
    const updatedItems = currentItems.map((item) =>
      item.tag === itemTag
        ? { ...item, status: newStatus, returnDate: newStatus === 'Returned' ? new Date().toISOString().split('T')[0] : undefined }
        : item
    );
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        items: updatedItems,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Asset ${itemTag} marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update asset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDependency = async (taskName: string, newStatus: 'Pending' | 'In Progress' | 'Completed' | 'Signed Off') => {
    if (!selectedRecord) return;
    const currentDeps = selectedRecord.assets?.dependencies || [];
    const updatedDeps = currentDeps.map((dep) =>
      dep.task === taskName ? { ...dep, status: newStatus } : dep
    );
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        dependencies: updatedDeps,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Access item "${taskName}" updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update dependency');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOffITClearance = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateAssets(selectedRecord.id, {
        isFullyCleared: true,
        clearedBy: 'Marcus Vance (Head of IT Infrastructure)',
        inspectionPassed: true,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('IT & Asset Clearance signed off successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign off IT clearance');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTravel = async (payload: Partial<IOffboardingRecord['travel']>) => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await offboardingService.updateTravel(selectedRecord.id, payload);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Travel & Repatriation details updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update travel info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newRole.trim()) {
      toast.error('Please enter employee name and role');
      return;
    }
    setIsSaving(true);
    try {
      const created = await offboardingService.createRecord({
        employeeName: newEmpName.trim(),
        role: newRole.trim(),
        department: newDepartment,
        separationType: newSeparationType,
        noticeDuration: newNoticeDuration,
        reason: newReason.trim() || 'Voluntary resignation',
        status: 'Initiated',
      });
      setRecords((prev) => [created, ...prev]);
      setSelectedRecordId(created.id);
      setShowNewModal(false);
      setNewEmpName('');
      setNewRole('');
      setNewReason('');
      toast.success(`Offboarding record initiated for ${created.employeeName}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initiate offboarding');
    } finally {
      setIsSaving(false);
    }
  };

  const isDocument = path.includes('/offboarding/document');
  const isPerformance = path.includes('/offboarding/performance');
  const isSettlement = path.includes('/offboarding/settlement');
  const isLegal = path.includes('/offboarding/legal');
  const isAssets = path.includes('/offboarding/assets');
  const isTravel = path.includes('/offboarding/travel');
  const isReport = path.includes('/offboarding/report');

  const filteredRecords = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <UserMinus className="h-3.5 w-3.5 text-teal-300" />
            <span>Off-Boarding & Separation Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">
            {isDocument && 'Off-Boarding Document Studio'}
            {isPerformance && 'Performance Retrospective'}
            {isSettlement && 'Final Financial Settlement (F&F)'}
            {isLegal && 'Legal Clearance & Revocation'}
            {isAssets && 'Asset Return & IT Clearance'}
            {isTravel && 'Repatriation & Travel'}
            {(isReport || (!isDocument && !isPerformance && !isSettlement && !isLegal && !isAssets && !isTravel)) && 'Off-Boarding Reports & AI Analytics'}
          </h1>
          <p className="text-xs text-teal-100/80 mt-1">
            Seamless employee exit lifecycle management, automated documentation, asset handover, and final settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Offboarding</span>
          </button>
          <button
            onClick={fetchOffboardingData}
            title="Refresh Data"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#004848]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Offboarding Case</div>
            <div className="flex items-center gap-2">
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="font-extrabold text-slate-900 bg-transparent text-sm outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5 focus:border-[#004848]"
              >
                {records.map((rec) => (
                  <option key={rec.id || rec._id} value={rec.id || rec._id}>
                    {rec.employeeName} ({rec.role} • {rec.department})
                  </option>
                ))}
              </select>
              {selectedRecord && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  selectedRecord.status === 'Completed' || selectedRecord.status === 'Settled'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedRecord.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedRecord && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400">Record ID: </span>
              <strong className="text-slate-800 font-mono">{selectedRecord.recordId}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">Exit Date: </span>
              <strong className="text-slate-800">{selectedRecord.exitDate}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">Separation Type: </span>
              <strong className="text-teal-800">{selectedRecord.separationType}</strong>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: DOCUMENT */}
      {isDocument && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'resignation-ai' as const, label: 'Resignation Letter Drafting with AI' },
              { id: 'termination-ai' as const, label: 'Termination Letter Drafting with AI' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDocTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  docTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Resignation */}
          {docTab === 'resignation-ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-extrabold text-slate-900">AI Resignation Letter Studio</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[11px] font-extrabold">Legal AI Studio</span>
                </div>

                <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Employee Name</label>
                      <input 
                        type="text"
                        disabled
                        value={selectedRecord?.employeeName || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Role / Position</label>
                      <input 
                        type="text"
                        disabled
                        value={selectedRecord?.role || ''}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Notice Period</label>
                      <select 
                        value={docNoticeDuration}
                        onChange={(e) => setDocNoticeDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      >
                        <option>30 Days (Standard)</option>
                        <option>60 Days (Executive)</option>
                        <option>90 Days (Key Personnel)</option>
                        <option>Notice Period Waiver Request (Immediate)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Resignation Reason</label>
                      <input 
                        type="text"
                        value={docReasonText}
                        onChange={(e) => setDocReasonText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span className="flex items-center gap-1.5 text-purple-950">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        AI Labor Law Benchmarking
                      </span>
                      <span className="text-xs text-emerald-600 font-extrabold">Labor Law Compliant</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Includes standard exit acknowledgement, knowledge transfer timeline, and final settlement release clause with auto-populated dates.
                    </p>
                  </div>

                  <button
                    onClick={handleDraftResignation}
                    disabled={isDraftingDoc}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isDraftingDoc ? 'Drafting Resignation Letter...' : 'Draft Resignation Letter with AI'}</span>
                  </button>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Document Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Resignation Status</div>
                    <div className="text-sm font-extrabold text-purple-700">
                      {selectedRecord?.documents?.resignationLetter?.status || 'Drafted'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Submitted / Drafted Date</div>
                    <div className="font-bold text-slate-800">
                      {selectedRecord?.documents?.resignationLetter?.submittedDate || 'Current'}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success("Resignation letter PDF generated successfully")}
                    className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Resignation Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Termination */}
          {docTab === 'termination-ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-extrabold text-slate-900">AI Termination Letter Generator</span>
                  </div>
                  <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-extrabold">Executive Separation</span>
                </div>

                <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Target Employee</label>
                      <input 
                        type="text"
                        disabled
                        value={`${selectedRecord?.employeeName || ''} (${selectedRecord?.role || ''})`}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Termination Type</label>
                      <select 
                        value={termType}
                        onChange={(e) => setTermType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                      >
                        <option>Mutual Separation Agreement</option>
                        <option>Redundancy / Structural Restructure</option>
                        <option>End of Fixed-Term Contract</option>
                        <option>For Cause Separation</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Severance & Separation Clauses</label>
                    <textarea 
                      rows={3}
                      value={severanceText}
                      onChange={(e) => setSeveranceText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>Severance & Benefits Clause</span>
                      <span className="text-xs text-purple-700 font-extrabold">Auto-Calculated</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Includes 2 months severance pay calculation, insurance continuation certificate, and confidential IP non-disclosure clauses.
                    </p>
                  </div>

                  <button
                    onClick={handleDraftTermination}
                    disabled={isDraftingDoc}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isDraftingDoc ? 'Drafting Termination Letter...' : 'Draft Termination Letter with AI'}</span>
                  </button>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Termination Status</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Separation Status</div>
                    <div className="text-sm font-extrabold text-red-700">
                      {selectedRecord?.documents?.terminationLetter?.status || 'Drafted'}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-slate-400 font-semibold">Issued Date</div>
                    <div className="font-bold text-slate-800">
                      {selectedRecord?.documents?.terminationLetter?.issuedDate || 'Pending'}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success("Termination letter PDF generated successfully")}
                    className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Termination Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PERFORMANCE */}
      {isPerformance && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'history' as const, label: "It's story (History)" },
              { id: 'appraisal' as const, label: 'Appraisal' },
              { id: 'reference' as const, label: 'reference' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPerfTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  perfTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {perfTab === 'history' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                Tenure Timeline & Career Milestones Story for {selectedRecord?.employeeName}
              </h3>
              <div className="space-y-3">
                {(selectedRecord?.performance?.milestones || [
                  { date: 'March 2023', event: 'Joined Huremaso as Senior Engineer', detail: 'Onboarded into Core Platform Team' },
                  { date: 'January 2024', event: 'Promoted to Principal Software Engineer', detail: 'Led UI Micro-frontend Redesign' },
                  { date: 'June 2025', event: 'Received Excellence Award', detail: 'Delivered High-Availability Architecture' },
                ]).map((m, idx) => (
                  <div key={m.event + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-[#004848]" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 m-0">{m.event} ({m.date})</h4>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{m.detail}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold">Milestone</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {perfTab === 'appraisal' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                Historical Appraisal Scores & Exit Assessment ({selectedRecord?.employeeName})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Overall Cumulative Rating</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    {selectedRecord?.performance?.overallRating ? `${selectedRecord.performance.overallRating} / 5.0` : '4.85 / 5.0'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold font-bold">Consistently Exceeded Expectations</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Exit Assessment</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.performance?.exitScore || 'Highly Recommended'}
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold font-bold">
                    {selectedRecord?.performance?.rehireEligible ? 'Eligible for Re-hire' : 'Standard Exit'}
                  </span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Project Deliverables</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.performance?.projectHandoverComplete ? '100% Cleared' : 'In Progress'}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold font-bold">Handover Complete</span>
                </div>
              </div>
            </div>
          )}

          {perfTab === 'reference' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Verified Experience Certificate & Reference Letter</h3>
                <button 
                  onClick={() => toast.success(`Downloaded Experience Certificate & Reference Letter PDF for ${selectedRecord?.employeeName}`)}
                  className="px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Official Endorsement Status</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                    {selectedRecord?.performance?.experienceCertificateIssued ? 'Signed & Stamped' : 'Ready for Issuance'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Valid corporate digital signature applied. Verified by HR Operations.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: SETTLEMENT */}
      {isSettlement && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'compensation' as const, label: 'Compensation' },
              { id: 'gratuity' as const, label: 'gratuity' },
              { id: 'notice-salary' as const, label: 'Notice Period Salary' },
              { id: 'pending-salary' as const, label: 'Pending Salary' },
              { id: 'other-benefits' as const, label: 'Other Benefits (Custom)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSettlementTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  settlementTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {settlementTab === 'compensation' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Full & Final (F&F) Payout Summary</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Calculated final settlement ledger for {selectedRecord?.employeeName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    selectedRecord?.settlement?.status === 'Disbursed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedRecord?.settlement?.status === 'Approved'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedRecord?.settlement?.status || 'Pending Audit'}
                  </span>
                  {selectedRecord?.settlement?.status !== 'Disbursed' && (
                    <button
                      onClick={() => handleUpdateSettlementStatus('Disbursed')}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                    >
                      Mark Disbursed
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Gross Exit Payout</span>
                  <div className="text-2xl font-extrabold text-[#004848]">
                    ${(selectedRecord?.settlement?.grossPayout || 28450).toLocaleString()} USD
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold font-bold">Calculated & Audited</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Encashable Leave Days</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {selectedRecord?.settlement?.encashableLeaveDays || 14} Days (${(selectedRecord?.settlement?.leaveEncashmentAmount || 7600).toLocaleString()})
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold font-bold">PTO Balance Encashed</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <span className="text-xs font-bold text-slate-500">Deductions (Asset/Tax)</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${(selectedRecord?.settlement?.deductions || 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold font-bold">Zero Deductions</span>
                </div>
                <div className="p-4 border border-teal-200 rounded-xl bg-teal-50/60 space-y-1">
                  <span className="text-xs font-bold text-teal-900">Net Payable Amount</span>
                  <div className="text-2xl font-extrabold text-teal-950">
                    ${(selectedRecord?.settlement?.netPayout || 28450).toLocaleString()} USD
                  </div>
                  <span className="text-[11px] text-teal-700 font-bold">Final Release Sum</span>
                </div>
              </div>
            </div>
          )}

          {settlementTab === 'gratuity' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                End of Service Gratuity Calculation for {selectedRecord?.employeeName}
              </h3>
              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Total Tenure Served:</span>
                  <strong className="text-slate-900">{selectedRecord?.settlement?.tenureServed || '3 Years 6 Months'}</strong>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Basic Salary Entitlement Formula:</span>
                  <strong className="text-slate-900">{selectedRecord?.settlement?.gratuityFormula || '21 Days per Year'}</strong>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                  <span>Net Approved Gratuity Payout:</span>
                  <strong className="text-emerald-700 text-sm font-extrabold">
                    ${(selectedRecord?.settlement?.gratuityAmount || 14850).toLocaleString()} USD
                  </strong>
                </div>
              </div>
            </div>
          )}

          {settlementTab === 'notice-salary' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Notice Period Salary Particulars</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">
                    Served Notice Period Salary ({selectedRecord?.settlement?.noticeDays || 30} Days)
                  </span>
                  <span className="text-sm font-extrabold text-[#004848]">
                    ${(selectedRecord?.settlement?.noticePeriodSalary || 13750).toLocaleString()} USD
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Included in final monthly disbursement cycle.</p>
              </div>
            </div>
          )}

          {settlementTab === 'pending-salary' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Unprocessed Pending Salary & Expenses</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Pending Expenses Reimbursement</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Travel & Client Dinner Receipts Cleared</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-700">
                  ${(selectedRecord?.settlement?.pendingExpenseAmount || 1250).toLocaleString()} USD
                </span>
              </div>
            </div>
          )}

          {settlementTab === 'other-benefits' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Other Custom Exit Allowances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 m-0">Vested Stock Options Acceleration</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">2,500 Vested Options exercisable within 90 days</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold">Active Window</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 m-0">COBRA Health Plan Subsidy</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">3 Months company subsidized medical continuation</p>
                  <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-extrabold font-bold">Approved</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: LEGAL */}
      {isLegal && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'cheque' as const, label: 'Legal Cheque' },
              { id: 'visa-cancel' as const, label: 'Visa Cancellation' },
              { id: 'insurance' as const, label: 'Insurance' },
              { id: 'pcc' as const, label: 'PCC' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLegalTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  legalTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {legalTab === 'cheque' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Legal Cheque & Payment Release Voucher</h3>
                <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold">
                  {selectedRecord?.legal?.chequeStatus || 'Prepared'}
                </span>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Legal Cheque Voucher #</span>
                  <span className="text-xs font-mono font-bold text-[#004848]">
                    {selectedRecord?.legal?.chequeVoucherNo || 'CHQ-2026-OFF-8841'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-600">Cheque Release Amount:</span>
                  <strong className="text-slate-900">${(selectedRecord?.legal?.chequeAmount || 28450).toLocaleString()} USD</strong>
                </div>
                <p className="text-xs text-slate-600 font-medium">Bank Cashier Cheque prepared and ready for handover upon final clearance sign-off.</p>
              </div>
            </div>
          )}

          {legalTab === 'visa-cancel' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Labor & Residency Visa Cancellation</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">MOHRE & Immigration Work Permit Revocation</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Status: Grace Period Active ({selectedRecord?.legal?.visaGracePeriodDays || 30} Days Remaining)
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ visaCancellationStatus: 'Cancelled' })}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.visaCancellationStatus === 'Cancelled' ? 'Cancelled ✓' : 'Mark Cancelled'}
                </button>
              </div>
            </div>
          )}

          {legalTab === 'insurance' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Group Insurance Delisting</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Health & Life Policy Cancellation Notice</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Transitioned to COBRA Individual Continuation</p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ insuranceDelisted: true })}
                  className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold hover:bg-teal-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.insuranceDelisted ? 'Delisted ✓' : 'Confirm Delist'}
                </button>
              </div>
            </div>
          )}

          {legalTab === 'pcc' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Police Clearance Certificate & NOC</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Police Conduct Clearance (PCC) & Employer NOC</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {selectedRecord?.legal?.nocIssued ? 'No Objection Certificate Issued' : 'Pending Verification'}
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateLegalField({ pccStatus: 'Clear', nocIssued: true })}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.legal?.pccStatus === 'Clear' ? 'Clear ✓' : 'Verify & Clear'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: ASSETS */}
      {isAssets && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'possessed' as const, label: 'Assets List - Possessed' },
              { id: 'return' as const, label: 'Assets Return' },
              { id: 'dependencies' as const, label: 'Dependencies' },
              { id: 'missing' as const, label: 'Missing' },
              { id: 'cost-calc' as const, label: 'Cost Calculation' },
              { id: 'asset-settlement' as const, label: 'Settlement' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAssetTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  assetTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {assetTab === 'possessed' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">
                Currently Possessed Company Hardware & Tokens ({selectedRecord?.employeeName})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedRecord?.assets?.items || [
                  { name: 'MacBook Pro M3 Max 64GB', tag: 'ASSET-2026-IT-901', status: 'Pending Return' as const },
                  { name: 'Dual Dell 27" 4K Monitors', tag: 'ASSET-2026-IT-902', status: 'Pending Return' as const },
                  { name: 'YubiKey 5C NFC Token', tag: 'ASSET-2026-IT-903', status: 'Returned' as const },
                  { name: 'Smart Keycard Badge', tag: 'ASSET-SEC-402', status: 'Returned' as const },
                ]).map((a) => (
                  <div key={a.tag} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 m-0">{a.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.tag}</p>
                    </div>
                    <button
                      onClick={() => handleToggleAssetItem(a.tag, a.status === 'Returned' ? 'Possessed' : 'Returned')}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition ${
                        a.status === 'Returned' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {a.status === 'Returned' ? 'Returned ✓' : 'Mark Returned'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assetTab === 'return' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Physical Asset Return Inspection Log</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">IT Hardware Inspection Report</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">Passed Condition Check</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">All returned hardware thoroughly inspected with zero damage or missing cables.</p>
              </div>
            </div>
          )}

          {assetTab === 'dependencies' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Project Handovers & Access Revocation Checklist</h3>
              <div className="space-y-3">
                {(selectedRecord?.assets?.dependencies || [
                  { task: 'GitHub Repository Admin Access Revocation', status: 'Completed' as const },
                  { task: 'AWS Cloud Console IAM Account Deactivation', status: 'Completed' as const },
                  { task: 'Project Architecture Knowledge Transfer Session', status: 'Signed Off' as const },
                ]).map((d) => (
                  <div key={d.task} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{d.task}</span>
                    <button
                      onClick={() => handleToggleDependency(d.task, d.status === 'Completed' || d.status === 'Signed Off' ? 'Pending' : 'Completed')}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                    >
                      {d.status} ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assetTab === 'missing' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Missing or Damaged Assets Audit</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Missing Asset Items</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">0 Missing Items</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">No missing or damaged company equipment logged.</p>
              </div>
            </div>
          )}

          {assetTab === 'cost-calc' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Asset Depreciation & Deduction Cost Calculation</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Total Asset Liability Deduction</span>
                  <span className="text-sm font-extrabold text-[#004848]">$0.00 USD</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">All hardware accounted for and returned in original condition.</p>
              </div>
            </div>
          )}

          {assetTab === 'asset-settlement' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">IT & Asset Clearance Sign-Off</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">Head of IT Infrastructure Clearance</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    {selectedRecord?.assets?.clearedBy || 'Marcus Vance'}
                  </p>
                </div>
                <button
                  onClick={handleSignOffITClearance}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow cursor-pointer transition disabled:opacity-50"
                >
                  {selectedRecord?.assets?.isFullyCleared ? 'Fully Cleared ✓' : 'Sign Off Clearance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: TRAVEL */}
      {isTravel && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'tickets' as const, label: 'Tickets' },
              { id: 'misc-custom' as const, label: 'MISC (Custom Fields)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTravelTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  travelTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {travelTab === 'tickets' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Repatriation Flight Ticket Booking</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 m-0">
                    {selectedRecord?.travel?.airline || 'Emirates Business Class'} Return Ticket
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Destination: {selectedRecord?.travel?.destination || 'London Heathrow (LHR)'} • {selectedRecord?.travel?.flightDate || 'Oct 15, 2026'}
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateTravel({ ticketStatus: 'Issued' })}
                  className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                >
                  {selectedRecord?.travel?.ticketStatus === 'Issued' ? 'Issued ✓' : 'Issue Ticket'}
                </button>
              </div>
            </div>
          )}

          {travelTab === 'misc-custom' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Custom Excess Cargo & Relocation Allowance</h3>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Excess Baggage Relocation Stipend</span>
                  <span className="text-sm font-extrabold text-[#004848]">
                    ${(selectedRecord?.travel?.excessBaggageAllowance || 1500).toLocaleString()} USD
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Reimbursed directly via corporate travel portal.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 7: REPORTS (OR DEFAULT) */}
      {(isReport || (!isDocument && !isPerformance && !isSettlement && !isLegal && !isAssets && !isTravel)) && (
        <div className="space-y-6 animate-fade-in">
          {/* Pill Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'reports-ai' as const, label: 'Reports + AI' },
              { id: 'analytics-ai' as const, label: 'Analytics + AI' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setReportTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  reportTab === t.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {reportTab === 'reports-ai' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">AI Exit Sentiment & Attrition Reports</h3>
              <div className="space-y-3">
                {[
                  { title: 'Q3 Exit Interview AI Sentiment Audit.pdf', status: 'Generated by AI' },
                  { title: 'Engineering Attrition & Key Risk Drivers Report.pdf', status: 'Ready for Review' },
                  { title: 'Executive Asset & Non-Disclosure Clearance Log.pdf', status: 'Audited & Signed' },
                ].map((r) => (
                  <div key={r.title} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-slate-900">{r.title}</span>
                    </div>
                    <button
                      onClick={() => toast.success(`Downloaded ${r.title}`)}
                      className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="h-3 w-3" />
                      <span>{r.status}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportTab === 'analytics-ai' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500">Average Clearance Velocity</span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {reportsSummary ? `${reportsSummary.averageClearanceDays} Days` : '2.1 Days'}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold font-bold">100% Automated F&F Clearance</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500">Annualized Attrition Rate</span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {reportsSummary ? `${reportsSummary.annualizedAttritionRate}%` : '4.2%'}
                </div>
                <span className="text-[11px] text-teal-600 font-semibold font-bold">Well Below Tech Benchmark</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500">Re-hire Eligibility Score</span>
                <div className="text-2xl font-extrabold text-slate-900">
                  {reportsSummary ? `${reportsSummary.rehireEligibilityRate}%` : '92%'}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold font-bold">High Employer Branding</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initiate Offboarding Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-[#004848]" />
                <h3 className="text-base font-extrabold text-slate-900 m-0">Initiate Employee Offboarding</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecord} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Role / Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Staff Architect"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option>Engineering</option>
                    <option>Operations</option>
                    <option>Product</option>
                    <option>Marketing</option>
                    <option>Design</option>
                    <option>Human Resources</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Separation Type</label>
                  <select
                    value={newSeparationType}
                    onChange={(e) => setNewSeparationType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Resignation">Resignation</option>
                    <option value="Termination">Termination</option>
                    <option value="Mutual Separation">Mutual Separation</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Notice Duration</label>
                  <select
                    value={newNoticeDuration}
                    onChange={(e) => setNewNoticeDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                    <option>Immediate / Waived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Higher studies transition"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Initiating...' : 'Create Offboarding Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeOffBoardingPage;
