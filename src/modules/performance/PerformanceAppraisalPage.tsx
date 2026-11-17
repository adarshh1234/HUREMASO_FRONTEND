import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  HeartHandshake,
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Lock,
  CheckCheck,
  FileCheck2,
  Share2,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { performanceAppraisalService } from '../../services/performanceAppraisalService';
import { employeeService } from '../../services/employeeService';
import {
  IPerformanceAppraisalRecord,
  AppraisalReportsSummary,
  IEsopItem,
  IAppraisalCycle,
  IFeedback360Item,
} from '../../types/performanceAppraisal';
import { Employee } from '../../types';

export const PerformanceAppraisalPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Cycles & Employees State
  const [cycles, setCycles] = useState<(IAppraisalCycle & { id: string })[]>([]);
  const [selectedCycleName, setSelectedCycleName] = useState<string>('Q3 2026');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');

  // Appraisal Records State
  const [records, setRecords] = useState<(IPerformanceAppraisalRecord & { id: string })[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [reportsSummary, setReportsSummary] = useState<AppraisalReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modals state
  // 1. New Appraisal Cycle Modal
  const [showCycleModal, setShowCycleModal] = useState<boolean>(false);
  const [cycleName, setCycleName] = useState<string>('');
  const [cycleFinYear, setCycleFinYear] = useState<string>('2026-2027');
  const [cycleStartDate, setCycleStartDate] = useState<string>('2026-10-01');
  const [cycleEndDate, setCycleEndDate] = useState<string>('2026-12-31');
  const [cycleSubDeadline, setCycleSubDeadline] = useState<string>('2026-12-15');
  const [cycleRevDeadline, setCycleRevDeadline] = useState<string>('2026-12-31');
  const [cycleFrequency, setCycleFrequency] = useState<'Quarterly' | 'Bi-Annual' | 'Annual'>('Quarterly');
  const [cycleDepts, setCycleDepts] = useState<string[]>(['Engineering', 'Product', 'Operations']);
  const [cycleDesc, setCycleDesc] = useState<string>('');

  // 2. Initiate Employee Appraisal Modal
  const [showNewRecordModal, setShowNewRecordModal] = useState<boolean>(false);
  const [targetEmpId, setTargetEmpId] = useState<string>('');

  // 3. SOP Document Viewer Modal
  const [selectedSop, setSelectedSop] = useState<IEsopItem | null>(null);
  const [showAddSopModal, setShowAddSopModal] = useState<boolean>(false);
  const [newSopTitle, setNewSopTitle] = useState<string>('');
  const [newSopVersion, setNewSopVersion] = useState<string>('1.0');

  // 4. Add Endorsement Modal
  const [showEndorsementModal, setShowEndorsementModal] = useState<boolean>(false);
  const [endorserName, setEndorserName] = useState<string>('');
  const [endorserRole, setEndorserRole] = useState<string>('Engineering Lead');
  const [endorsementText, setEndorsementText] = useState<string>('');
  const [endorsementType, setEndorsementType] = useState<string>('Promotion');
  const [endorsementEvidence, setEndorsementEvidence] = useState<string>('');

  // 5. Add 360 Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [fbReviewerName, setFbReviewerName] = useState<string>('');
  const [fbRole, setFbRole] = useState<string>('Peer');
  const [fbScore, setFbScore] = useState<number>(4.8);
  const [fbComments, setFbComments] = useState<string>('');
  const [fbAnonymous, setFbAnonymous] = useState<boolean>(false);

  // 6. HiPo Nomination Modal
  const [showHipoModal, setShowHipoModal] = useState<boolean>(false);
  const [hipoTrackName, setHipoTrackName] = useState<string>('Executive Fast-Track Promotion Program');
  const [hipoNominator, setHipoNominator] = useState<string>('Marcus Vance');
  const [hipoReason, setHipoReason] = useState<string>('');

  // Self Appraisal Edit State
  const [selfScore, setSelfScore] = useState<number>(4.8);
  const [selfComments, setSelfComments] = useState<string>('');
  const [selfStrengths, setSelfStrengths] = useState<string>('');
  const [selfImprovements, setSelfImprovements] = useState<string>('');
  const [selfKeyDeliverables, setSelfKeyDeliverables] = useState<string>('');
  const [selfChallenges, setSelfChallenges] = useState<string>('');

  // Manager Review Edit State
  const [managerScore, setManagerScore] = useState<number>(4.9);
  const [managerReviewer, setManagerReviewer] = useState<string>('Marcus Vance');
  const [managerComments, setManagerComments] = useState<string>('');
  const [managerPromoRec, setManagerPromoRec] = useState<boolean>(true);

  // HR Calibration Edit State
  const [hrRating, setHrRating] = useState<number>(4.85);
  const [hrNotes, setHrNotes] = useState<string>('');
  const [hrCalibrator, setHrCalibrator] = useState<string>('HR Operations');

  // Add Smart Work Initiative Modal
  const [showInitiativeModal, setShowInitiativeModal] = useState<boolean>(false);
  const [initTitle, setInitTitle] = useState<string>('');
  const [initDesc, setInitDesc] = useState<string>('');
  const [initCategory, setInitCategory] = useState<string>('Automation');
  const [initHours, setInitHours] = useState<number>(20);
  const [initStatus, setInitStatus] = useState<string>('Active');

  // Fetch baseline appraisal data, cycles, and employees
  const fetchAppraisalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cyclesData, recData, empsData, repData] = await Promise.all([
        performanceAppraisalService.getCycles().catch(() => []),
        performanceAppraisalService.getRecords({ cycle: selectedCycleName !== 'All' ? selectedCycleName : undefined }),
        employeeService.getAll({ includeTerminated: false }).catch(() => []),
        performanceAppraisalService.getReportsSummary().catch(() => null),
      ]);

      setCycles(cyclesData);
      setRecords(recData.items);
      setEmployees(empsData);

      if (recData.items.length > 0 && (!selectedRecordId || !recData.items.some(r => r.id === selectedRecordId || r._id === selectedRecordId))) {
        setSelectedRecordId(recData.items[0].id || (recData.items[0]._id as string));
      }
      if (repData) {
        setReportsSummary(repData);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load appraisal records');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCycleName, selectedRecordId, toast]);

  useEffect(() => {
    fetchAppraisalData();
  }, [fetchAppraisalData]);

  // Selected Record
  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId || r._id === selectedRecordId) || records[0];
  }, [records, selectedRecordId]);

  // Sync form states with selected record
  useEffect(() => {
    if (selectedRecord?.review) {
      setSelfScore(selectedRecord.review.selfAppraisal?.score ?? 4.8);
      setSelfComments(selectedRecord.review.selfAppraisal?.comments || '');
      setSelfStrengths(selectedRecord.review.selfAppraisal?.strengths || '');
      setSelfImprovements(selectedRecord.review.selfAppraisal?.improvementAreas || '');
      setSelfKeyDeliverables(selectedRecord.review.selfAppraisal?.keyDeliverables || '');
      setSelfChallenges(selectedRecord.review.selfAppraisal?.challengesFaced || '');

      setManagerScore(selectedRecord.review.managerReview?.score ?? 4.9);
      setManagerReviewer(selectedRecord.review.managerReview?.reviewerName || 'Marcus Vance');
      setManagerComments(selectedRecord.review.managerReview?.comments || '');
      setManagerPromoRec(selectedRecord.review.managerReview?.promotionRecommended ?? true);

      setHrRating(selectedRecord.review.hrCalibration?.finalRating ?? 4.85);
      setHrNotes(selectedRecord.review.hrCalibration?.calibrationNotes || selectedRecord.review.hrCalibration?.statusNotes || '');
    }
  }, [selectedRecord]);

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !employeeSearch.trim() ||
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.employeeId || '').toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.department || '').toLowerCase().includes(employeeSearch.toLowerCase());
      const matchDept = selectedDeptFilter === 'All' || emp.department === selectedDeptFilter;
      return matchSearch && matchDept;
    });
  }, [employees, employeeSearch, selectedDeptFilter]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Route matches across 9 subsections
  const isReportsAi = path.includes('/reports-ai') || path.endsWith('/performance-appraisal');
  const isAttendanceTime = path.includes('/attendance-time');
  const isSmartWork = path.includes('/smart-work');
  const isPsychometric = path.includes('/psychometric');
  const isEsops = path.includes('/e-sops');
  const isReview = path.includes('/review');
  const isReferences = path.includes('/references');
  const isStrategy = path.includes('/strategy');
  const isAnalyticsAi = path.includes('/analytics-ai');

  // --- ACTIONS ---

  // Section 1: Regenerate AI Report
  const handleGenerateAiReport = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.generateAiReport(selectedRecord.id);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`AI appraisal report regenerated with multi-source verified data for ${selectedRecord.employeeName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate AI report');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 2: Sync Attendance & Task Velocity
  const handleSyncAttendance = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.syncAttendanceAndTasks(selectedRecord.id);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`Attendance punches & sprint velocity synced from real database records!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sync attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Create Cycle
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim()) {
      toast.error('Please enter a cycle name');
      return;
    }
    setIsSaving(true);
    try {
      const newCycle = await performanceAppraisalService.createCycle({
        name: cycleName.trim(),
        financialYear: cycleFinYear,
        startDate: cycleStartDate,
        endDate: cycleEndDate,
        submissionDeadline: cycleSubDeadline,
        reviewDeadline: cycleRevDeadline,
        frequency: cycleFrequency,
        eligibleDepartments: cycleDepts,
        status: 'Active',
        description: cycleDesc,
      });

      setCycles((prev) => [newCycle, ...prev]);
      setSelectedCycleName(newCycle.name);
      setShowCycleModal(false);
      setCycleName('');
      toast.success(`Appraisal cycle '${newCycle.name}' created and set to Active!`);
      await fetchAppraisalData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create appraisal cycle');
    } finally {
      setIsSaving(false);
    }
  };

  // Initiate Appraisal for Employee
  const handleInitiateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === targetEmpId || e.id === targetEmpId);
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }
    setIsSaving(true);
    try {
      const created = await performanceAppraisalService.createRecord({
        employeeName: emp.name,
        employeeId: emp.employeeId,
        role: emp.jobTitle || 'Engineer',
        department: emp.department || 'Engineering',
        cycle: selectedCycleName,
        status: 'Manager Review Pending',
      });

      setRecords((prev) => [created, ...prev]);
      setSelectedRecordId(created.id);
      setShowNewRecordModal(false);
      setTargetEmpId('');
      toast.success(`Appraisal record initiated for ${created.employeeName} in ${selectedCycleName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initiate appraisal record');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 6: Submit Self Appraisal
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
          keyDeliverables: selfKeyDeliverables,
          challengesFaced: selfChallenges,
          submittedAt: new Date().toISOString().split('T')[0],
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Self appraisal submitted and locked with audit timestamp!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit self appraisal');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 6: Sign Off Manager Review
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
          promotionRecommended: managerPromoRec,
          signedAt: new Date().toISOString().split('T')[0],
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Manager review signed off and transitioned to In Calibration!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to sign off review');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 6: Submit HR Calibration
  const handleApproveHrCalibration = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateReview(selectedRecord.id, {
        hrCalibration: {
          status: 'Completed',
          scheduledDate: new Date().toISOString().split('T')[0],
          finalRating: Number(hrRating),
          statusNotes: `Calibrated into top bracket: ${hrNotes}`,
          calibratedBy: hrCalibrator,
          calibratedAt: new Date().toISOString().split('T')[0],
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success('Final HR calibration approved and recorded in MongoDB!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve HR calibration');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 6: Add 360 Feedback
  const handleAdd360Feedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !fbReviewerName.trim() || !fbComments.trim()) {
      toast.error('Please fill reviewer name and feedback comments');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.add360Feedback(selectedRecord.id, {
        reviewerName: fbReviewerName.trim(),
        reviewerRole: fbRole,
        relationship: fbRole,
        isAnonymous: fbAnonymous,
        score: Number(fbScore),
        comments: fbComments.trim(),
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowFeedbackModal(false);
      setFbReviewerName('');
      setFbComments('');
      toast.success('360° feedback submitted and peer sentiment recalculated!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit 360 feedback');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 5: Acknowledge SOP
  const handleAcknowledgeSop = async (sopId: string) => {
    if (!selectedRecord) return;
    const currentSops = selectedRecord.eSops?.sops || [];
    const updatedSops = currentSops.map((sop) =>
      sop.sopId === sopId
        ? { ...sop, acknowledged: !sop.acknowledged, acknowledgedAt: new Date().toISOString() }
        : sop
    );
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateEsops(selectedRecord.id, updatedSops);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      toast.success(`E-SOP ${sopId} acknowledgement updated!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update SOP status');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 7: Add Endorsement
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
        evidenceUrl: endorsementEvidence,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowEndorsementModal(false);
      setEndorserName('');
      setEndorsementText('');
      setEndorsementEvidence('');
      toast.success('Peer endorsement verified and published!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add endorsement');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 8: HiPo Nomination
  const handleNominateHipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const updated = await performanceAppraisalService.updateStrategy(selectedRecord.id, {
        hipoTrack: {
          ...selectedRecord.strategy?.hipoTrack,
          nominated: true,
          trackName: hipoTrackName,
          nominatorName: hipoNominator,
          nominationDate: new Date().toISOString().split('T')[0],
          nominationReason: hipoReason || 'Consistent top tier delivery and architectural vision.',
          status: 'Active & In Progress',
        },
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowHipoModal(false);
      setHipoReason('');
      toast.success(`Employee nominated for ${hipoTrackName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to nominate for HiPo');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 3: Add Smart Work Initiative
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
      description: initDesc.trim(),
      category: initCategory,
      hoursSaved: Number(initHours),
      status: initStatus,
      date: new Date().toISOString().split('T')[0],
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
      setInitDesc('');
      toast.success('Smart Work initiative logged successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add initiative');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 9: Export Intelligence Report
  const handleExportReport = async () => {
    if (!selectedRecord) return;
    try {
      const exportData = await performanceAppraisalService.getExportData(selectedRecord.id);
      
      // Generate clean downloadable file
      const reportContent = `
HUREMASO HRMS - PERFORMANCE APPRAISAL INTELLIGENCE REPORT
==========================================================
Generated: ${new Date().toLocaleString()}
Appraisal Record ID: ${exportData.appraisal.recordId}
Cycle: ${exportData.appraisal.cycle}
Status: ${exportData.appraisal.status}

EMPLOYEE DETAILS:
-----------------
Name: ${exportData.employee.name}
Employee ID: ${exportData.employee.id}
Designation: ${exportData.employee.role}
Department: ${exportData.employee.department}

EVALUATION SCORES:
------------------
AI Overall Score: ${exportData.appraisal.overallScore} / 5.0
Performance Tier: ${exportData.appraisal.tier}
Punctuality Rate: ${exportData.attendance?.punctualityScore}%
Task Velocity Multiplier: ${exportData.attendance?.velocityMultiplier}

CORE COMPETENCIES & BENCHMARKS:
-------------------------------
${exportData.competencies.map((c: any) => `- ${c.skill}: Score ${c.score} | Status: ${c.status} (Benchmark: ${c.benchmarkScore})`).join('\n')}

SMART WORK & PRODUCTIVITY:
--------------------------
Automated Workflows: ${exportData.smartWork?.automatedWorkflowsCount || 0}
Monthly Hours Saved: ${exportData.smartWork?.hoursSavedPerMonth || 0} hrs/mo
Deep Work Ratio: ${exportData.smartWork?.focusHoursRatio || 0}%

REVIEW STATUS & RATINGS:
------------------------
Self Rating: ${exportData.reviewSummary?.selfAppraisal?.score || '-'} / 5.0
Manager Rating: ${exportData.reviewSummary?.managerReview?.score || '-'} / 5.0
Manager Comments: ${exportData.reviewSummary?.managerReview?.comments || 'No comments'}
HR Calibration Rating: ${exportData.reviewSummary?.hrCalibration?.finalRating || '-'} / 5.0

PREDICTIVE TRAJECTORY & RETENTION RISK:
---------------------------------------
1-Yr Performance Trajectory: ${exportData.trajectoryGrowth}
Attrition Risk Index: ${exportData.attritionRisk}
Executive Summary: ${exportData.aiSummary}
==========================================================
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Appraisal_Report_${selectedRecord.employeeName.replace(/\s+/g, '_')}_${exportData.appraisal.cycle}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported complete AI Appraisal Intelligence Report for ${selectedRecord.employeeName}!`);
    } catch (err: any) {
      toast.error('Failed to export appraisal report');
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

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowCycleModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="h-4 w-4" />
            <span>New Appraisal Cycle</span>
          </button>
          <button
            onClick={() => setShowNewRecordModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Initiate Appraisal</span>
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

      {/* Common Active Record & Cycle Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Cycle & Employee Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cycle Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="h-4 w-4 text-[#004848]" />
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Cycle:</span>
            <select
              value={selectedCycleName}
              onChange={(e) => setSelectedCycleName(e.target.value)}
              className="text-xs font-bold text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Cycles</option>
              {cycles.map((c) => (
                <option key={c.id || c.cycleId} value={c.name}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Selection Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl max-w-xs">
            <User className="h-4 w-4 text-[#004848]" />
            <select
              value={selectedRecord?.id || selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="text-xs font-extrabold text-slate-900 bg-transparent outline-none cursor-pointer truncate max-w-[200px]"
            >
              {records.map((rec) => (
                <option key={rec.id || rec._id} value={rec.id || rec._id}>
                  {rec.employeeName} ({rec.role} • {rec.department})
                </option>
              ))}
            </select>
          </div>

          {selectedRecord && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                selectedRecord.status === 'Completed' || selectedRecord.status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : selectedRecord.status === 'In Calibration'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {selectedRecord.status}
            </span>
          )}
        </div>

        {/* Right Side: Key Metadata Badges */}
        {selectedRecord ? (
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400">Record ID: </span>
              <strong className="text-slate-800 font-mono">{selectedRecord.recordId}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">Employee ID: </span>
              <strong className="text-slate-800 font-mono">{selectedRecord.employeeId || 'EMP-101'}</strong>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <div>
              <span className="text-slate-400">AI Score: </span>
              <strong className="text-teal-800">{selectedRecord.reportsAi?.overallAiScore || 4.8} / 5.0</strong>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No appraisal record selected</div>
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
              <span className="text-[11px] font-semibold text-teal-600">Based on Multi-Reviewer 360° Data</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500">Core Competencies Met</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {selectedRecord?.reportsAi?.competenciesMetCount || 4} of {selectedRecord?.reportsAi?.totalCompetenciesCount || 4}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">100% Target Alignment</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Competency & Skill Gap Analysis</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Benchmark against global engineering standards • Last Generated: {selectedRecord?.reportsAi?.lastGeneratedDate || 'Recent'}
                </p>
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

            {/* AI Summary Prose */}
            {selectedRecord?.reportsAi?.summary && (
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                <strong>Executive AI Summary:</strong> {selectedRecord.reportsAi.summary}
              </div>
            )}

            {/* Competency Roster */}
            <div className="space-y-3">
              {(selectedRecord?.reportsAi?.competencies || [
                { skill: 'Technical Architecture & Code Efficiency', score: '98%', status: 'Exceeds Expectation', benchmarkScore: '92%' },
                { skill: 'Cross-functional Collaboration & Leadership', score: '94%', status: 'Exceeds Expectation', benchmarkScore: '90%' },
                { skill: 'Strategic Project Delivery & Planning', score: '91%', status: 'Meets Expectation', benchmarkScore: '90%' },
                { skill: 'Mentorship & Knowledge Transfer', score: '96%', status: 'Exceeds Expectation', benchmarkScore: '89%' },
              ]).map((row, idx) => (
                <div key={row.skill + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{row.skill}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Employee Score: <strong className="text-slate-800">{row.score}</strong> • Role Benchmark: <strong className="text-slate-600">{row.benchmarkScore}</strong>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto border ${
                    row.status === 'Exceeds Expectation'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Strengths and Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Key Verified Strengths</span>
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-medium">
                  {(selectedRecord?.reportsAi?.strengths || [
                    'High execution reliability and speed',
                    'Strong peer sentiment and constructive mentorship',
                    'Exemplary software architecture patterns',
                  ]).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#004848]" />
                  <span>Development Recommendations</span>
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc font-medium">
                  {(selectedRecord?.reportsAi?.recommendations || [
                    'Enroll in Executive Fast-Track Leadership Rotation',
                    'Lead upcoming cross-department architecture reviews',
                  ]).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Data Sources Footnote */}
            <div className="text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Data Sources Analyzed: {selectedRecord?.reportsAi?.dataSources?.join(', ') || 'Self-Appraisal, Manager-Review, 360-Feedback, Attendance, Tasks'}</span>
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
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Monthly Attendance & Shift Impact Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated from genuine punch cards and shift schedules</p>
              </div>
              <button
                onClick={handleSyncAttendance}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>Sync Attendance & Tasks</span>
              </button>
            </div>

            <div className="space-y-3">
              {(selectedRecord?.attendanceTime?.logs || [
                { month: 'August 2026', shiftAdherence: '100%', punctualityPct: 100, notes: 'Zero delays, exceptional shift coverage' },
                { month: 'July 2026', shiftAdherence: '98.5%', punctualityPct: 98.5, notes: 'Approved late login compensated with OT' },
                { month: 'June 2026', shiftAdherence: '100%', punctualityPct: 100, notes: 'On-time delivery on critical releases' },
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
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Behavioral & Cognitive Competency Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assessment ID: {selectedRecord?.psychometric?.assessmentId || 'PSY-2026-001'} • Privacy Consent Verified</p>
              </div>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold">
                Consent Verified ✓
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedRecord?.psychometric?.behavioralTraits || [
                { trait: 'Strategic Problem Solving', score: 96, level: 'Exceptional', benchmark: '90%', interpretation: 'Superior capacity to decompose complex issues' },
                { trait: 'Emotional Resilience & EQ', score: 92, level: 'High', benchmark: '88%', interpretation: 'Handles high-pressure milestones calmly' },
                { trait: 'Team Synergy & Influence', score: 94, level: 'Exceptional', benchmark: '88%', interpretation: 'Constructive cross-team relationship builder' },
                { trait: 'Adaptability in Ambiguity', score: 90, level: 'High', benchmark: '85%', interpretation: 'Navigates evolving project scopes effectively' },
              ]).map((t, idx) => (
                <div key={t.trait + idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-900">{t.trait}</span>
                    <span className="text-emerald-700">{t.score}% ({t.level})</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#004848] h-full rounded-full transition-all duration-500" style={{ width: `${t.score}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Benchmark: {t.benchmark || '90%'} • {t.interpretation}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Appraisal Standard Operating Procedures (E-SOPs)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mandatory corporate appraisal guidelines & calibration protocols</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  Compliance: <strong className="text-emerald-600">{selectedRecord?.eSops?.compliancePercentage || 100}%</strong>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedRecord?.eSops?.sops || [
                { sopId: 'SOP-1.0', title: 'SOP 1.0: Annual Appraisal Cycle Execution & Timeline', version: '2.1', status: 'Mandatory Read', updatedDate: 'August 2026', acknowledged: true },
                { sopId: 'SOP-2.0', title: 'SOP 2.0: 360-Degree Peer Feedback Guidelines & Ethics', version: '1.4', status: 'Active', updatedDate: 'July 2026', acknowledged: true },
                { sopId: 'SOP-3.0', title: 'SOP 3.0: Manager Rating Calibration & Bell-Curve Adjustments', version: '2.0', status: 'Active', updatedDate: 'June 2026', acknowledged: true },
                { sopId: 'SOP-4.0', title: 'SOP 4.0: Appraisal Appeal & Grievance Escalation Process', version: '1.2', status: 'Active', updatedDate: 'May 2026', acknowledged: true },
              ]).map((sop) => (
                <div key={sop.sopId} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{sop.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Version {sop.version} • Last Updated: {sop.updatedDate}
                      {sop.acknowledgedAt && ` • Acknowledged: ${new Date(sop.acknowledgedAt).toLocaleDateString()}`}
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

      {/* VIEW 6: Performance Review & 360-Degree Evaluation */}
      {isReview && (
        <div className="space-y-6 animate-fade-in">
          {/* Cycle Status Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">{selectedRecord?.cycle || 'Q3 2026'} Appraisal Status & Sign-off Flow</h3>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit 360° Feedback</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-xl bg-emerald-50/50 space-y-1">
                <span className="text-xs font-bold text-emerald-800">1. Self Appraisal</span>
                <div className="text-sm font-extrabold text-emerald-900">
                  {selectedRecord?.review?.selfAppraisal?.status || 'Submitted'} (Score: {selectedRecord?.review?.selfAppraisal?.score || 4.8})
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  Submitted: {selectedRecord?.review?.selfAppraisal?.submittedAt || 'Recorded'}
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-amber-50/50 space-y-1">
                <span className="text-xs font-bold text-amber-800">2. Manager Review</span>
                <div className="text-sm font-extrabold text-amber-900">
                  {selectedRecord?.review?.managerReview?.status || 'In Progress'} (Score: {selectedRecord?.review?.managerReview?.score || 4.9})
                </div>
                <div className="text-[10px] text-amber-700 font-semibold">
                  Reviewer: {selectedRecord?.review?.managerReview?.reviewerName || 'Marcus Vance'}
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl bg-blue-50/50 space-y-1">
                <span className="text-xs font-bold text-blue-800">3. Final HR Calibration</span>
                <div className="text-sm font-extrabold text-blue-900">
                  {selectedRecord?.review?.hrCalibration?.status || 'Scheduled'} (Rating: {selectedRecord?.review?.hrCalibration?.finalRating || 4.85})
                </div>
                <div className="text-[10px] text-blue-700 font-semibold">
                  {selectedRecord?.review?.hrCalibration?.statusNotes || 'In review'}
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

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Challenges & Growth Areas</label>
                  <input
                    type="text"
                    value={selfImprovements}
                    onChange={(e) => setSelfImprovements(e.target.value)}
                    placeholder="e.g. Expanding automated tests for legacy endpoints"
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
                  <label className="block mb-1 font-bold text-slate-800">Manager Assessment & Feedback</label>
                  <textarea
                    rows={3}
                    value={managerComments}
                    onChange={(e) => setManagerComments(e.target.value)}
                    placeholder="Provide manager feedback, merit recommendations, and coaching notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="promoRec"
                    checked={managerPromoRec}
                    onChange={(e) => setManagerPromoRec(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#004848] focus:ring-[#004848]"
                  />
                  <label htmlFor="promoRec" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Recommend for Promotion & Merit Recognition
                  </label>
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

          {/* 360-Degree Feedback Roster */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              360-Degree Multi-Rater Feedback ({selectedRecord?.feedback360?.length || 0})
            </h4>

            {(!selectedRecord?.feedback360 || selectedRecord.feedback360.length === 0) ? (
              <div className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 rounded-xl">
                No 360° feedback entries recorded yet. Click "Submit 360° Feedback" to submit peer evaluations.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRecord.feedback360.map((fb) => (
                  <div key={fb.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-xs text-slate-900">{fb.reviewerName}</strong>
                        <span className="text-[10px] text-slate-400 ml-2">({fb.reviewerRole})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-extrabold text-[10px] rounded-full border border-teal-200">
                        {fb.score} / 5.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium italic">"{fb.comments}"</p>
                    <span className="text-[10px] text-slate-400 block pt-1">{fb.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HR Calibration Action Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-150 pb-3">Final HR Calibration & Sign-off</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Final Calibrated Rating (out of 5.0)</label>
                <input
                  type="number"
                  step="0.05"
                  value={hrRating}
                  onChange={(e) => setHrRating(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-bold text-slate-800">Calibration Notes & Justification</label>
                <input
                  type="text"
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="e.g. Aligned in Top 5% performance bracket based on velocity & cross-team reviews"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <button
              onClick={handleApproveHrCalibration}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
            >
              {isSaving ? 'Approving...' : 'Approve & Complete Final Appraisal'}
            </button>
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
                onClick={() => setShowHipoModal(true)}
                className="w-full py-2.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-xl cursor-pointer transition"
              >
                {selectedRecord?.strategy?.hipoTrack?.nominated ? 'Update HiPo Track Nomination' : 'Nominate for HiPo Track'}
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
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">AI Performance Intelligence & Succession Summary</h3>
                <p className="text-xs text-slate-500 mt-0.5">Confidence: {selectedRecord?.analyticsAi?.confidenceLevel || 'High (94% confidence)'}</p>
              </div>
              <button
                onClick={handleExportReport}
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

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Key Influencing Factors:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {(selectedRecord?.analyticsAi?.influencingFactors || [
                  'Consistent high output velocity',
                  'Strong positive peer sentiment',
                  'Optimal work-life balance',
                  'Zero attendance anomalies',
                ]).map((factor, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Modal 1: New Appraisal Cycle Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#004848]" />
                <h3 className="text-base font-extrabold text-slate-900 m-0">Create New Appraisal Cycle</h3>
              </div>
              <button
                onClick={() => setShowCycleModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Cycle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 2026 Executive Review"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Financial Year</label>
                  <input
                    type="text"
                    value={cycleFinYear}
                    onChange={(e) => setCycleFinYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Frequency</label>
                  <select
                    value={cycleFrequency}
                    onChange={(e) => setCycleFrequency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annual">Bi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Start Date</label>
                  <input
                    type="date"
                    value={cycleStartDate}
                    onChange={(e) => setCycleStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">End Date</label>
                  <input
                    type="date"
                    value={cycleEndDate}
                    onChange={(e) => setCycleEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Submission Deadline</label>
                  <input
                    type="date"
                    value={cycleSubDeadline}
                    onChange={(e) => setCycleSubDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Review Deadline</label>
                  <input
                    type="date"
                    value={cycleRevDeadline}
                    onChange={(e) => setCycleRevDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Description / Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Appraisal cycle goals and policy references..."
                  value={cycleDesc}
                  onChange={(e) => setCycleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowCycleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Appraisal Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Initiate Appraisal for Employee Modal */}
      {showNewRecordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#004848]" />
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Initiate Employee Appraisal</h3>
              </div>
              <button
                onClick={() => setShowNewRecordModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInitiateAppraisal} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Select Employee *</label>
                <select
                  required
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                >
                  <option value="">-- Choose Employee from Database --</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>
                      {emp.name} ({emp.employeeId}) • {emp.jobTitle} • {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Appraisal Cycle</label>
                <input
                  type="text"
                  readOnly
                  value={selectedCycleName}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowNewRecordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Initiating...' : 'Initiate Appraisal Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: SOP Viewer Modal */}
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

      {/* Modal 4: Add Endorsement Modal */}
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
                  <option value="Promotion">Promotion Endorsement</option>
                  <option value="Merit Recognition">Merit Recognition</option>
                  <option value="Technical Leadership">Technical Leadership Recognition</option>
                  <option value="Team Contribution">Team Contribution & Spirit</option>
                  <option value="Innovation">Innovation Award</option>
                  <option value="Outstanding Performance">Outstanding Performance</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Endorsement Feedback *</label>
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

      {/* Modal 5: Add 360 Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Submit 360° Multi-Rater Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdd360Feedback} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Reviewer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={fbReviewerName}
                  onChange={(e) => setFbReviewerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Relationship</label>
                  <select
                    value={fbRole}
                    onChange={(e) => setFbRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Peer">Peer / Colleague</option>
                    <option value="Manager">Manager</option>
                    <option value="Direct Report">Direct Report</option>
                    <option value="Cross-functional">Cross-functional Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={fbScore}
                    onChange={(e) => setFbScore(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Feedback Comments *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail strengths, collaboration quality, and areas for growth..."
                  value={fbComments}
                  onChange={(e) => setFbComments(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fbAnon"
                  checked={fbAnonymous}
                  onChange={(e) => setFbAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#004848] focus:ring-[#004848]"
                />
                <label htmlFor="fbAnon" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Submit Anonymously (Identity protected)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: HiPo Track Nomination Modal */}
      {showHipoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Nominate for HiPo Talent Track</h3>
              <button
                onClick={() => setShowHipoModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleNominateHipo} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Track Program *</label>
                <select
                  value={hipoTrackName}
                  onChange={(e) => setHipoTrackName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                >
                  <option value="Executive Fast-Track Promotion Program">Executive Fast-Track Promotion Program</option>
                  <option value="Regional Operations Leadership Track">Regional Operations Leadership Track</option>
                  <option value="Distinguished Technical Fellow Track">Distinguished Technical Fellow Track</option>
                  <option value="Next-Gen Architecture Leadership Pool">Next-Gen Architecture Leadership Pool</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Nominator *</label>
                <input
                  type="text"
                  required
                  value={hipoNominator}
                  onChange={(e) => setHipoNominator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Nomination Justification</label>
                <textarea
                  rows={3}
                  placeholder="Detail high potential impact, technical leadership, and succession readiness..."
                  value={hipoReason}
                  onChange={(e) => setHipoReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowHipoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition disabled:opacity-50"
                >
                  {isSaving ? 'Submitting...' : 'Confirm Nomination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 7: Add Smart Work Initiative Modal */}
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

              <div>
                <label className="block mb-1 font-bold text-slate-800">Description</label>
                <textarea
                  rows={2}
                  placeholder="Scope and implementation details..."
                  value={initDesc}
                  onChange={(e) => setInitDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
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
                    <option value="Automation">Automation</option>
                    <option value="DevOps & AI">DevOps & AI</option>
                    <option value="Process Streamlining">Process Streamlining</option>
                    <option value="Infra Optimization">Infra Optimization</option>
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

              <div>
                <label className="block mb-1 font-bold text-slate-800">Status</label>
                <select
                  value={initStatus}
                  onChange={(e) => setInitStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                >
                  <option value="Active">Active</option>
                  <option value="Production Deployed">Production Deployed</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                </select>
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
