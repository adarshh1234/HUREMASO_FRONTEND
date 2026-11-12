import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  BarChart3, 
  Clock, 
  Zap, 
  BrainCircuit, 
  FileText, 
  Award, 
  ThumbsUp, 
  Target, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  User,
  Check,
  X,
  Eye,
  Download,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  Send,
  Sliders,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { performanceAppraisalService } from '../../services/performanceAppraisalService';
import {
  IPerformanceAppraisalRecord,
  AppraisalReportsSummary,
  IEsopItem,
} from '../../types/performanceAppraisal';

export const PerformanceAppraisalPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Data state
  const [records, setRecords] = useState<(IPerformanceAppraisalRecord & { id: string })[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [reportsSummary, setReportsSummary] = useState<AppraisalReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals state
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('Engineering');
  const [newCycle, setNewCycle] = useState<string>('Q3 2026');

  // SOP Document Viewer Modal
  const [selectedSop, setSelectedSop] = useState<IEsopItem | null>(null);

  // Add Endorsement Modal
  const [showEndorsementModal, setShowEndorsementModal] = useState<boolean>(false);
  const [endorserName, setEndorserName] = useState<string>('');
  const [endorserRole, setEndorserRole] = useState<string>('Engineering Lead');
  const [endorsementText, setEndorsementText] = useState<string>('');
  const [endorsementType, setEndorsementType] = useState<string>('Promotion');

  // Self Appraisal Edit State
  const [selfScore, setSelfScore] = useState<number>(4.8);
  const [selfComments, setSelfComments] = useState<string>('');
  const [selfStrengths, setSelfStrengths] = useState<string>('');
  const [selfImprovements, setSelfImprovements] = useState<string>('');

  // Manager Review Edit State
  const [managerScore, setManagerScore] = useState<number>(4.9);
  const [managerReviewer, setManagerReviewer] = useState<string>('Marcus Vance');
  const [managerComments, setManagerComments] = useState<string>('');

  // Add Smart Work Initiative Modal
  const [showInitiativeModal, setShowInitiativeModal] = useState<boolean>(false);
  const [initTitle, setInitTitle] = useState<string>('');
  const [initCategory, setInitCategory] = useState<string>('Automation');
  const [initHours, setInitHours] = useState<number>(20);

  const fetchAppraisalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recData, repData] = await Promise.all([
        performanceAppraisalService.getRecords(),
        performanceAppraisalService.getReportsSummary().catch(() => null),
      ]);
      setRecords(recData.items);
      if (recData.items.length > 0 && !selectedRecordId) {
        setSelectedRecordId(recData.items[0].id);
      }
      if (repData) {
        setReportsSummary(repData);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load appraisal records');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecordId, toast]);

  useEffect(() => {
    fetchAppraisalData();
  }, []);

  const selectedRecord = records.find((r) => r.id === selectedRecordId || r._id === selectedRecordId) || records[0];

  useEffect(() => {
    if (selectedRecord?.review) {
      setSelfScore(selectedRecord.review.selfAppraisal?.score || 4.8);
      setSelfComments(selectedRecord.review.selfAppraisal?.comments || '');
      setSelfStrengths(selectedRecord.review.selfAppraisal?.strengths || '');
      setSelfImprovements(selectedRecord.review.selfAppraisal?.improvementAreas || '');
      setManagerScore(selectedRecord.review.managerReview?.score || 4.9);
      setManagerReviewer(selectedRecord.review.managerReview?.reviewerName || 'Marcus Vance');
      setManagerComments(selectedRecord.review.managerReview?.comments || '');
    }
  }, [selectedRecordId, records]);

  // Route matches
  const isReportsAi = path.includes('/reports-ai') || path.endsWith('/performance-appraisal');
  const isAttendanceTime = path.includes('/attendance-time');
  const isSmartWork = path.includes('/smart-work');
  const isPsychometric = path.includes('/psychometric');
  const isEsops = path.includes('/e-sops');
  const isReview = path.includes('/review');
  const isReferences = path.includes('/references');
  const isStrategy = path.includes('/strategy');
  const isAnalyticsAi = path.includes('/analytics-ai');

  // Handlers
  const handleGenerateAiReport = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateReportsAi(selectedRecord.id, {
        overallAiScore: 4.85,
        peerSentimentRating: 97,
        performanceTier: 'Top 3% Performance Tier (Exceptional)',
        competencies: [
          { skill: 'Technical Architecture & Code Efficiency', score: '99%', status: 'Exceeds Expectation', benchmarkScore: '98%' },
          { skill: 'Cross-functional Collaboration & Leadership', score: '96%', status: 'Exceeds Expectation', benchmarkScore: '94%' },
          { skill: 'Strategic Project Delivery & Speed', score: '94%', status: 'Exceeds Expectation', benchmarkScore: '92%' },
          { skill: 'Mentorship & Knowledge Transfer', score: '97%', status: 'Exceeds Expectation', benchmarkScore: '95%' },
        ],
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`AI appraisal report regenerated successfully for ${selectedRecord.employeeName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate AI report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newRole.trim()) {
      toast.error('Please enter employee name and role');
      return;
    }
    setIsSaving(true);
    try {
      const created = await performanceAppraisalService.createRecord({
        employeeName: newEmpName.trim(),
        role: newRole.trim(),
        department: newDepartment,
        cycle: newCycle,
        status: 'Manager Review Pending',
      });
      setRecords((prev) => [created, ...prev]);
      setSelectedRecordId(created.id);
      setShowNewModal(false);
      setNewEmpName('');
      setNewRole('');
      toast.success(`Appraisal cycle created for ${created.employeeName}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create appraisal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitSelfAppraisal = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateReview(selectedRecord.id, {
        selfAppraisal: {
          status: 'Submitted',
          score: Number(selfScore),
          comments: selfComments,
          strengths: selfStrengths,
          improvementAreas: selfImprovements,
          submittedAt: new Date().toISOString().split('T')[0],
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Self appraisal submitted successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit self appraisal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOffManagerReview = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateReview(selectedRecord.id, {
        managerReview: {
          status: 'Signed Off',
          score: Number(managerScore),
          reviewerName: managerReviewer,
          comments: managerComments,
          signedAt: new Date().toISOString().split('T')[0],
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Manager review signed off and persisted in MongoDB!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign off review');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcknowledgeSop = async (sopId: string) => {
    if (!selectedRecord) return;
    const currentSops = selectedRecord.eSops?.sops || [];
    const updatedSops = currentSops.map((sop) =>
      sop.sopId === sopId ? { ...sop, acknowledged: !sop.acknowledged } : sop
    );
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateEsops(selectedRecord.id, updatedSops);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`SOP ${sopId} status updated!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update SOP status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !endorserName.trim() || !endorsementText.trim()) {
      toast.error('Please fill in author and recommendation text');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.addEndorsement(selectedRecord.id, {
        from: endorserName.trim(),
        role: endorserRole,
        text: endorsementText.trim(),
        recommendationType: endorsementType,
        verified: true,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowEndorsementModal(false);
      setEndorserName('');
      setEndorsementText('');
      toast.success('Peer endorsement added and verified!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add endorsement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleHipo = async () => {
    if (!selectedRecord) return;
    const currentNominated = selectedRecord.strategy?.hipoTrack?.nominated;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateStrategy(selectedRecord.id, {
        hipoTrack: {
          ...selectedRecord.strategy?.hipoTrack,
          nominated: !currentNominated,
          status: !currentNominated ? 'Active & In Progress' : 'Under Evaluation',
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`HiPo Track nomination updated!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update HiPo status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !initTitle.trim()) {
      toast.error('Please enter initiative title');
      return;
    }
    const currentInitiatives = selectedRecord.smartWork?.initiatives || [];
    const newInit = {
      id: `SW-${Date.now().toString().slice(-4)}`,
      title: initTitle.trim(),
      category: initCategory,
      hoursSaved: Number(initHours),
      status: 'Active',
    };
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateSmartWork(selectedRecord.id, {
        initiatives: [newInit, ...currentInitiatives],
        automatedWorkflowsCount: (selectedRecord.smartWork?.automatedWorkflowsCount || 0) + 1,
        hoursSavedPerMonth: (selectedRecord.smartWork?.hoursSavedPerMonth || 0) + Number(initHours),
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowInitiativeModal(false);
      setInitTitle('');
      toast.success('Smart Work initiative logged successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add initiative');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            <span>Performance Appraisal & AI Intelligence Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">
            {isReportsAi && 'Lists – Reports – AI Page'}
            {isAttendanceTime && 'Attendance & Time Appraisal Impact'}
            {isSmartWork && 'Smart Work & Efficiency Metrics'}
            {isPsychometric && 'Psychometric Assessments & EQ Profile'}
            {isEsops && 'E-SOPs (Standard Operating Procedures)'}
            {isReview && 'Performance Review & 360° Evaluation'}
            {isReferences && 'References & Recommendations'}
            {isStrategy && 'Special Strategy Program & HiPo Talent'}
            {isAnalyticsAi && 'Reports & Predictive Analytics – AI'}
          </h1>
          <p className="text-xs text-teal-100/80 mt-1">
            End-to-end employee appraisal lifecycle, continuous feedback, competence heatmaps, and AI predictive trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Appraisal Cycle</span>
          </button>
          <button
            onClick={fetchAppraisalData}
            title="Refresh Appraisal Data"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Employee Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#004848]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Appraisal Record</div>
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
                  selectedRecord.status === 'Completed' || selectedRecord.status === 'Approved'
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
              <span className="text-slate-400">Cycle: </span>
              <strong className="text-slate-800">{selectedRecord.cycle}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">AI Score: </span>
              <strong className="text-teal-800">{selectedRecord.reportsAi?.overallAiScore || 4.8} / 5.0</strong>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: Lists – reports – AI page */}
      {isReportsAi && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">AI Evaluation Score</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.reportsAi?.overallAiScore || 4.8} / 5.0
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.reportsAi?.performanceTier || 'Top 5% Performance Tier'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Peer Sentiment Rating</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.reportsAi?.peerSentimentRating || 96}% Positive
              </div>
              <span className="text-[11px] font-semibold text-teal-600">Based on 360° Feedback</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Core Competencies Met</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.reportsAi?.competenciesMetCount || 12} of {selectedRecord?.reportsAi?.totalCompetenciesCount || 12}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">100% Target Alignment</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Competency & Skill Gap Analysis</h3>
                <p className="text-xs text-slate-500 mt-0.5">Benchmark against global engineering standards</p>
              </div>
              <button
                onClick={handleGenerateAiReport}
                disabled={isSaving}
                className="px-4 py-2 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Recalibrating...' : 'Regenerate AI Report'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {(selectedRecord?.reportsAi?.competencies || [
                { skill: 'Technical Architecture & Code Efficiency', score: '98%', status: 'Exceeds Expectation', benchmarkScore: '98%' },
                { skill: 'Cross-functional Collaboration', score: '94%', status: 'Exceeds Expectation', benchmarkScore: '94%' },
                { skill: 'Strategic Project Delivery & Planning', score: '91%', status: 'Meets Expectation', benchmarkScore: '91%' },
              ]).map((row, idx) => (
                <div key={row.skill + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{row.skill}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      AI Benchmark Score: <strong className="text-slate-800">{row.score}</strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold self-start sm:self-auto">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Attendance and time */}
      {isAttendanceTime && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Punctuality Score</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.attendanceTime?.punctualityScore || 99.2}%
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.attendanceTime?.streakStatus || 'Perfect attendance streak'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Overtime Utilization</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.attendanceTime?.overtimeHoursPerMonth || 14.5} Hours / mo
              </div>
              <span className="text-[11px] font-semibold text-teal-600">
                {selectedRecord?.attendanceTime?.overtimeContribution || 'Approved OT Contribution'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Time-to-Task Completion</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.attendanceTime?.velocityMultiplier || '1.15x Velocity'}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.attendanceTime?.velocityNotes || 'Delivers ahead of schedule'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Monthly Attendance & Shift Impact Ledger</h3>
            <div className="space-y-3">
              {(selectedRecord?.attendanceTime?.logs || [
                { month: 'August 2026', shiftAdherence: '100%', punctualityPct: 100, notes: 'Zero delays, exceptional shift coverage' },
                { month: 'July 2026', shiftAdherence: '98.5%', punctualityPct: 98.5, notes: 'Approved late login compensated with OT' },
              ]).map((log, idx) => (
                <div key={log.month + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{log.month}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{log.notes}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-700">{log.shiftAdherence} Adherence</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                      {log.punctualityPct}% On-Time
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Smart work */}
      {isSmartWork && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Smart Work Indicators & Productivity Scorecard</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated workflows created and deep work efficiency</p>
              </div>
              <button
                onClick={() => setShowInitiativeModal(true)}
                className="px-4 py-2 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log Smart Work Initiative</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                <span className="text-xs font-bold text-slate-500">Workflow Automation Created</span>
                <div className="text-xl font-extrabold text-slate-900">
                  {selectedRecord?.smartWork?.automatedWorkflowsCount || 8} Automated Workflows
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Saved {selectedRecord?.smartWork?.hoursSavedPerMonth || 120} manual team hours per month
                </p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                <span className="text-xs font-bold text-slate-500">Focus Hours Ratio</span>
                <div className="text-xl font-extrabold text-[#004848]">
                  {selectedRecord?.smartWork?.focusHoursRatio || 68}% Deep Work Time
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {selectedRecord?.smartWork?.deepWorkBalanceNote || 'Optimal balance of meeting vs coding'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Logged Automation Initiatives</h4>
              {(selectedRecord?.smartWork?.initiatives || [
                { id: 'SW-1', title: 'Automated CI/CD Test Pipeline Reducer', category: 'Automation', hoursSaved: 45, status: 'Production Deployed' },
                { id: 'SW-2', title: 'AI Code Review Suggestion Bot', category: 'DevOps & AI', hoursSaved: 50, status: 'Active' },
              ]).map((init) => (
                <div key={init.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 m-0">{init.title}</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{init.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#004848]">+{init.hoursSaved} hrs/mo saved</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                      {init.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Psychometric assessments */}
      {isPsychometric && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">DISC Profile Archetype</span>
              <div className="text-xl font-extrabold text-[#004848]">
                {selectedRecord?.psychometric?.discProfileArchetype || 'Dominant-Influencer (Di)'}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedRecord?.psychometric?.archetypeDescription || 'Natural Problem Solver & Leader'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Cognitive Aptitude Index</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.psychometric?.cognitivePercentile || 95}th Percentile
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.psychometric?.cognitiveNotes || 'High analytical reasoning'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Emotional Intelligence (EQ)</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.psychometric?.eqScore || 138} / {selectedRecord?.psychometric?.eqMax || 150}
              </div>
              <span className="text-[11px] font-semibold text-teal-600">
                {selectedRecord?.psychometric?.eqNotes || 'Excellent empathy & conflict resolution'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Behavioral & Cognitive Competency Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedRecord?.psychometric?.behavioralTraits || [
                { trait: 'Strategic Problem Solving', score: 96, level: 'Exceptional' },
                { trait: 'Emotional Resilience & EQ', score: 92, level: 'High' },
                { trait: 'Team Synergy & Influence', score: 94, level: 'Exceptional' },
                { trait: 'Adaptability in Ambiguity', score: 90, level: 'High' },
              ]).map((t, idx) => (
                <div key={t.trait + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-900">{t.trait}</span>
                    <span className="text-emerald-700">{t.score}% ({t.level})</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#004848] h-full rounded-full transition-all duration-500" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: E-SOPs */}
      {isEsops && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Appraisal Standard Operating Procedures (E-SOPs)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mandatory corporate appraisal guidelines & calibration protocols</p>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedRecord?.eSops?.sops || [
                { sopId: 'SOP-1.0', title: 'SOP 1.0: Annual Appraisal Cycle Execution & Timeline', version: '2.1', status: 'Mandatory Read', updatedDate: 'August 2026', acknowledged: true },
                { sopId: 'SOP-2.0', title: 'SOP 2.0: 360-Degree Peer Feedback Guidelines & Ethics', version: '1.4', status: 'Active', updatedDate: 'July 2026', acknowledged: true },
                { sopId: 'SOP-3.0', title: 'SOP 3.0: Manager Rating Calibration & Bell-Curve Adjustments', version: '2.0', status: 'Active', updatedDate: 'June 2026', acknowledged: true },
                { sopId: 'SOP-4.0', title: 'SOP 4.0: Appraisal Appeal & Grievance Escalation Process', version: '1.2', status: 'Active', updatedDate: 'May 2026', acknowledged: true },
              ]).map((sop) => (
                <div key={sop.sopId} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{sop.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Version {sop.version} • Last Updated: {sop.updatedDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleAcknowledgeSop(sop.sopId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                        sop.acknowledged
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sop.acknowledged ? 'Acknowledged ✓' : 'Acknowledge'}
                    </button>
                    <button
                      onClick={() => setSelectedSop(sop)}
                      className="px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition"
                    >
                      View Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: Performance Review */}
      {isReview && (
        <div className="space-y-6 animate-fade-in">
          {/* Cycle Status Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 m-0">{selectedRecord?.cycle || 'Q3 2026'} Appraisal Status & Sign-off Flow</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-emerald-50/50 space-y-1">
                <span className="text-xs font-bold text-emerald-800">1. Self Appraisal</span>
                <div className="text-sm font-extrabold text-emerald-900">
                  {selectedRecord?.review?.selfAppraisal?.status || 'Submitted'} (Score: {selectedRecord?.review?.selfAppraisal?.score || 4.8})
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-amber-50/50 space-y-1">
                <span className="text-xs font-bold text-amber-800">2. Manager Review</span>
                <div className="text-sm font-extrabold text-amber-900">
                  {selectedRecord?.review?.managerReview?.status || 'In Progress'} (Score: {selectedRecord?.review?.managerReview?.score || 4.9})
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                <span className="text-xs font-bold text-slate-500">3. Final HR Calibration</span>
                <div className="text-sm font-extrabold text-slate-700">
                  {selectedRecord?.review?.hrCalibration?.status || 'Scheduled for Sep 15'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Self Appraisal Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Employee Self Appraisal</h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                  {selectedRecord?.review?.selfAppraisal?.status || 'Submitted'}
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Self Rating (out of 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={selfScore}
                    onChange={(e) => setSelfScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Quarterly Key Deliverables & Summary</label>
                  <textarea
                    rows={3}
                    value={selfComments}
                    onChange={(e) => setSelfComments(e.target.value)}
                    placeholder="Describe main achievements and project milestones..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Key Strengths Demonstrated</label>
                  <input
                    type="text"
                    value={selfStrengths}
                    onChange={(e) => setSelfStrengths(e.target.value)}
                    placeholder="e.g. Architecture, leadership, reliability"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                  />
                </div>

                <button
                  onClick={handleSubmitSelfAppraisal}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Submitting...' : 'Submit Self Appraisal'}
                </button>
              </div>
            </div>

            {/* Manager Review Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Manager Review & Calibration</h3>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-extrabold">
                  {selectedRecord?.review?.managerReview?.status || 'In Progress'}
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Manager Rating (out of 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={managerScore}
                      onChange={(e) => setManagerScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Reviewer Name</label>
                    <input
                      type="text"
                      value={managerReviewer}
                      onChange={(e) => setManagerReviewer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Manager Assessment & Promotion Endorsement</label>
                  <textarea
                    rows={4}
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Provide manager feedback, merit recommendations, and coaching notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                  />
                </div>

                <button
                  onClick={handleSignOffManagerReview}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Signing off...' : 'Sign Off Manager Review (Save to DB)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 7: References and recommendations */}
      {isReferences && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Endorsements & Peer Commendations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verified testimonials for promotions and merit recognitions</p>
              </div>
              <button
                onClick={() => setShowEndorsementModal(true)}
                className="px-4 py-2 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Write Peer Endorsement</span>
              </button>
            </div>

            <div className="space-y-3">
              {(selectedRecord?.references?.endorsements || [
                { id: 'REF-01', from: 'David Miller (Engineering Lead)', role: 'Peer / Lead', text: 'Sarah consistently displays exceptional leadership in architecture design and mentors junior engineers with remarkable dedication.', date: 'August 18, 2026', recommendationType: 'Promotion', verified: true },
                { id: 'REF-02', from: 'Emily Davis (Product Director)', role: 'Cross-functional Lead', text: 'Highly recommend Sarah for Senior Staff Engineer role. Her impact on Q2 product velocity was outstanding.', date: 'July 29, 2026', recommendationType: 'Excellence Award', verified: true },
              ]).map((rec) => (
                <div key={rec.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 m-0">{rec.from}</h4>
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-[10px] font-extrabold">
                      {rec.recommendationType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold italic">"{rec.text}"</p>
                  <span className="text-[10px] text-slate-400 font-bold block pt-1">{rec.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 8: Special Strategy Program */}
      {isStrategy && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-extrabold">
                  HiPo Talent Track
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  selectedRecord?.strategy?.hipoTrack?.nominated
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {selectedRecord?.strategy?.hipoTrack?.nominated ? 'Nominated ✓' : 'Eligible'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 m-0">
                {selectedRecord?.strategy?.hipoTrack?.trackName || 'Executive Fast-Track Promotion Program'}
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                {selectedRecord?.strategy?.hipoTrack?.description ||
                  'Nominated for Director of Engineering succession plan. Includes executive coaching & offshore leadership rotations.'}
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex justify-between">
                <span>Roadmap Progress:</span>
                <strong className="text-teal-800 font-bold">
                  {selectedRecord?.strategy?.hipoTrack?.roadmapStatus || 'Milestone 2 of 4 Completed'}
                </strong>
              </div>
              <button
                onClick={handleToggleHipo}
                className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl cursor-pointer transition"
              >
                {selectedRecord?.strategy?.hipoTrack?.nominated ? 'Update HiPo Milestone Roadmap' : 'Nominate for HiPo Track'}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold inline-block">
                Retention Grant
              </span>
              <h3 className="text-base font-extrabold text-slate-900 m-0">
                {selectedRecord?.strategy?.retentionGrant?.grantName || 'Key Talent Strategic Retention Bonus'}
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                {selectedRecord?.strategy?.retentionGrant?.description ||
                  'Tier-1 Retention Agreement active through December 2027 with quarterly equity acceleration.'}
              </p>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 flex justify-between">
                <span>Vesting Agreement Expiry:</span>
                <strong className="text-emerald-700 font-bold">
                  {selectedRecord?.strategy?.retentionGrant?.agreementExpiry || 'December 2027'}
                </strong>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 block">
                Status: {selectedRecord?.strategy?.retentionGrant?.vestingStatus || 'Active & Vesting'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 9: Reports and analytics - AI */}
      {isAnalyticsAi && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Predicted 1-Yr Performance Trajectory</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.analyticsAi?.predictedTrajectoryGrowth || '+18% Growth'}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.analyticsAi?.trajectoryGrowthTier || 'High Growth Potential'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">AI Attrition Risk Index</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.analyticsAi?.attritionRiskLevel || 'Low (2.1%)'}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {selectedRecord?.analyticsAi?.retentionLikelihood || 'High Retention Likelihood'}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Leadership Readiness Score</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.analyticsAi?.leadershipReadinessScore || 92} / 100
              </div>
              <span className="text-[11px] font-semibold text-teal-600">
                {selectedRecord?.analyticsAi?.promotionReadiness || 'Ready for Promotion'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">AI Performance Intelligence & Succession Summary</h3>
              <button
                onClick={() => toast.success(`Exported complete AI Appraisal Intelligence PDF for ${selectedRecord?.employeeName}`)}
                className="px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Intelligence Report</span>
              </button>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {selectedRecord?.analyticsAi?.aiSummary ||
                'Top-tier performer with clear high-velocity output, exemplary peer sentiment, and zero flight risk. Highly aligned for executive succession roadmap.'}
            </p>
          </div>
        </div>
      )}

      {/* Modal 1: New Appraisal Cycle Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#004848]" />
                <h3 className="text-base font-extrabold text-slate-900 m-0">Initiate Performance Appraisal Cycle</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppraisal} className="space-y-4 text-xs font-semibold text-slate-700">
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
                  <label className="block mb-1 font-bold text-slate-800">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Architect"
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

              <div>
                <label className="block mb-1 font-bold text-slate-800">Appraisal Cycle</label>
                <select
                  value={newCycle}
                  onChange={(e) => setNewCycle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                >
                  <option>Q3 2026</option>
                  <option>Q4 2026</option>
                  <option>Annual 2026</option>
                  <option>Mid-Year 2027</option>
                </select>
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
                  {isSaving ? 'Initiating...' : 'Create Cycle Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: SOP Viewer Modal */}
      {selectedSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">{selectedSop.title}</h3>
                <span className="text-[11px] text-slate-400">Version {selectedSop.version} • {selectedSop.updatedDate}</span>
              </div>
              <button
                onClick={() => setSelectedSop(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 font-medium leading-relaxed max-h-80 overflow-y-auto">
              <p>
                <strong>1. Objective:</strong> Standardize performance evaluation protocols, ensuring calibrated merit recognition, bias elimination, and alignment with corporate key results.
              </p>
              <p>
                <strong>2. Self-Appraisal & 360° Peer Feedback:</strong> Each employee must submit their self-appraisal with tangible milestone data by the designated cycle cutoff date.
              </p>
              <p>
                <strong>3. Manager Calibration:</strong> Direct managers will review output against team KPIs and apply standardized grading rubric (1.0 to 5.0).
              </p>
              <p>
                <strong>4. Appeals Process:</strong> Disputed ratings may be formally submitted to HR Operations within 14 calendar days.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
              <button
                onClick={() => {
                  handleAcknowledgeSop(selectedSop.sopId);
                  setSelectedSop(null);
                }}
                className="px-4 py-2 bg-[#004848] text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-[#006666]"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Endorsement Modal */}
      {showEndorsementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Write Peer Endorsement</h3>
              <button
                onClick={() => setShowEndorsementModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEndorsement} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Your Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Gallagher (Staff Engineer)"
                  value={endorserName}
                  onChange={(e) => setEndorserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Recommendation Category</label>
                <select
                  value={endorsementType}
                  onChange={(e) => setEndorsementType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                >
                  <option>Promotion Endorsement</option>
                  <option>Excellence Award</option>
                  <option>Technical Leadership Recognition</option>
                  <option>Team Spirit & Mentorship</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Endorsement Text *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your colleague's key contributions, leadership, and impact..."
                  value={endorsementText}
                  onChange={(e) => setEndorsementText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowEndorsementModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Posting...' : 'Post Endorsement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Smart Work Initiative Modal */}
      {showInitiativeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Log Smart Work Initiative</h3>
              <button
                onClick={() => setShowInitiativeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddInitiative} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Initiative Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Billing Reconciler"
                  value={initTitle}
                  onChange={(e) => setInitTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Category</label>
                  <select
                    value={initCategory}
                    onChange={(e) => setInitCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option>Automation</option>
                    <option>DevOps & AI</option>
                    <option>Process Streamlining</option>
                    <option>Infra Optimization</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Hours Saved / mo</label>
                  <input
                    type="number"
                    min="1"
                    value={initHours}
                    onChange={(e) => setInitHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowInitiativeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Logging...' : 'Log Initiative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAppraisalPage;
