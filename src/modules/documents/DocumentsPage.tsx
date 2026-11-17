import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  UserPlus,
  UserCheck,
  UserMinus,
  Award,
  CheckSquare,
  Smartphone,
  HeartPulse,
  CalendarDays,
  Download,
  Filter,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Medal,
  Star,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Eye,
  Crown,
  Sparkles,
  Info,
  Check,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  reportingService,
  GenericReportData,
  EmployeeOfPeriodRecord,
  RecognitionCandidate,
  ReportFilterParams,
} from '../../services/reportingService';

// Report Metadata Configuration
interface ReportMeta {
  key: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badge: string;
  columns: Array<{ key: string; label: string }>;
}

const REPORT_DEFINITIONS: ReportMeta[] = [
  {
    key: 'employees',
    title: 'Employee Directory Report',
    category: 'Workforce',
    description: 'Master employee directory, demographic distributions, tenure analysis, and active status tracking.',
    icon: Users,
    accentColor: 'from-teal-600 to-emerald-700',
    badge: 'Core HR',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Work Email' },
      { key: 'department', label: 'Department' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'employmentStatus', label: 'Status' },
      { key: 'joinedDate', label: 'Hire Date' },
    ],
  },
  {
    key: 'attendance-time',
    title: 'Attendance & Time Report',
    category: 'Time & Attendance',
    description: 'Punctuality metrics, daily check-in / check-out telemetry, work hours calculation, and overtime logs.',
    icon: Clock,
    accentColor: 'from-blue-600 to-cyan-700',
    badge: 'Timesheet',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'date', label: 'Date' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'checkOut', label: 'Check Out' },
      { key: 'status', label: 'Status' },
      { key: 'workHours', label: 'Work Hours' },
    ],
  },
  {
    key: 'leave',
    title: 'Leave & Time-Off Report',
    category: 'Absence Management',
    description: 'Leave request volume, approval workflow tracking, leave balance consumption, and departmental absence rates.',
    icon: CalendarDays,
    accentColor: 'from-amber-600 to-orange-700',
    badge: 'Leaves',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'leaveType', label: 'Leave Type' },
      { key: 'fromDate', label: 'From Date' },
      { key: 'toDate', label: 'To Date' },
      { key: 'numberOfDays', label: 'Days' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'payroll',
    title: 'Payroll Disbursal Report',
    category: 'Compensation',
    description: 'Gross and net salary disbursals, tax withholdings, payment status reconciliation, and departmental spend.',
    icon: DollarSign,
    accentColor: 'from-emerald-600 to-teal-800',
    badge: 'Financials',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'period', label: 'Pay Period' },
      { key: 'amount', label: 'Gross ($)' },
      { key: 'paidAmount', label: 'Disbursed ($)' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'recruitment',
    title: 'Recruitment Pipeline Report',
    category: 'Talent Acquisition',
    description: 'Active vacancies, applicant funnel stages, interview completions, and offer acceptance conversion rates.',
    icon: UserPlus,
    accentColor: 'from-indigo-600 to-violet-700',
    badge: 'Talent',
    columns: [
      { key: 'candidateId', label: 'Candidate ID' },
      { key: 'name', label: 'Applicant Name' },
      { key: 'role', label: 'Target Position' },
      { key: 'department', label: 'Department' },
      { key: 'stage', label: 'Current Stage' },
      { key: 'rating', label: 'Rating' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'onboarding',
    title: 'Onboarding Tracking Report',
    category: 'Talent Acquisition',
    description: 'New hire checklist completion, document verification telemetry, asset provisioning, and mentor assignment.',
    icon: UserCheck,
    accentColor: 'from-cyan-600 to-blue-800',
    badge: 'New Hires',
    columns: [
      { key: 'candidateId', label: 'Candidate ID' },
      { key: 'fullName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'joiningDate', label: 'Start Date' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'offboarding',
    title: 'Offboarding & Clearance Report',
    category: 'Exit Management',
    description: 'Employee exit clearance tracking, notice period compliance, asset recovery, and exit interview documentation.',
    icon: UserMinus,
    accentColor: 'from-rose-600 to-red-700',
    badge: 'Exits',
    columns: [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'reason', label: 'Exit Reason' },
      { key: 'lastWorkingDate', label: 'LWD' },
      { key: 'status', label: 'Clearance' },
    ],
  },
  {
    key: 'performance',
    title: 'Performance Appraisal Report',
    category: 'Performance',
    description: 'Quarterly and annual review cycles, AI-evaluated competency scores, top performer tiers, and feedback completion.',
    icon: Award,
    accentColor: 'from-purple-600 to-fuchsia-700',
    badge: 'Appraisals',
    columns: [
      { key: 'recordId', label: 'Appraisal ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'cycle', label: 'Cycle' },
      { key: 'overallAiScore', label: 'AI Score' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'tasks',
    title: 'Task & Productivity Report',
    category: 'Operations',
    description: 'Kanban sprint progress, task priority distribution, completion velocity, and individual employee assignments.',
    icon: CheckSquare,
    accentColor: 'from-teal-700 to-slate-800',
    badge: 'Tasks',
    columns: [
      { key: 'title', label: 'Task Title' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'column', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'type', label: 'Type' },
      { key: 'dueDate', label: 'Due Date' },
    ],
  },
  {
    key: 'employee-app',
    title: 'Employee App Usage Report',
    category: 'Engagement',
    description: 'Mobile HRMS application adoption, active sessions by platform (iOS, Android, Web), and self-service requests.',
    icon: Smartphone,
    accentColor: 'from-sky-600 to-indigo-700',
    badge: 'Mobile App',
    columns: [
      { key: 'appUserId', label: 'User ID' },
      { key: 'fullName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      { key: 'role', label: 'Role' },
      { key: 'deviceType', label: 'Platform' },
      { key: 'status', label: 'Account Status' },
    ],
  },
  {
    key: 'wellness',
    title: 'Wellness & Benefits Report',
    category: 'Benefits & Wellness',
    description: 'Financial bonus awards, health benefit reimbursement claims, professional development grants, and work-life balance.',
    icon: HeartPulse,
    accentColor: 'from-pink-600 to-rose-700',
    badge: 'Wellness',
    columns: [
      { key: 'employeeName', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'type', label: 'Benefit Type' },
      { key: 'amount', label: 'Amount ($)' },
      { key: 'status', label: 'Status' },
      { key: 'effectiveDate', label: 'Effective Date' },
    ],
  },
  {
    key: 'events',
    title: 'Events & Training Report',
    category: 'Learning & Dev',
    description: 'Corporate enablement workshops, town halls, safety certifications, attendee turnout, and budget utilization.',
    icon: Calendar,
    accentColor: 'from-emerald-700 to-teal-900',
    badge: 'Events',
    columns: [
      { key: 'title', label: 'Event Title' },
      { key: 'eventType', label: 'Type' },
      { key: 'startDate', label: 'Scheduled Date' },
      { key: 'venue', label: 'Venue / Platform' },
      { key: 'attendeeCount', label: 'Attendees' },
      { key: 'status', label: 'Status' },
    ],
  },
];

export const DocumentsPage: React.FC = () => {
  const toast = useToast();

  // State for Recognition Section
  const [eopLoading, setEopLoading] = useState(true);
  const [employeeOfWeek, setEmployeeOfWeek] = useState<EmployeeOfPeriodRecord | null>(null);
  const [employeeOfMonth, setEmployeeOfMonth] = useState<EmployeeOfPeriodRecord | null>(null);
  const [employeeOfYear, setEmployeeOfYear] = useState<EmployeeOfPeriodRecord | null>(null);
  const [hallOfFame, setHallOfFame] = useState<EmployeeOfPeriodRecord[]>([]);

  // Recognition Studio Modal State
  const [recognitionModalOpen, setRecognitionModalOpen] = useState(false);
  const [activeRecognitionPeriod, setActiveRecognitionPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidates, setCandidates] = useState<RecognitionCandidate[]>([]);
  const [approvingEmployeeId, setApprovingEmployeeId] = useState<string | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const [selectedCandidateToApprove, setSelectedCandidateToApprove] = useState<RecognitionCandidate | null>(null);

  // Report Studio Modal State
  const [selectedReport, setSelectedReport] = useState<ReportMeta | null>(null);
  const [reportData, setReportData] = useState<GenericReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters for Report Studio
  const [filters, setFilters] = useState<ReportFilterParams>({
    department: 'All',
    status: 'All',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  // Load Recognition Analytics on Mount
  useEffect(() => {
    loadRecognitionData();
  }, []);

  const loadRecognitionData = async () => {
    try {
      setEopLoading(true);
      const data = await reportingService.getEmployeeOfPeriod();
      setEmployeeOfWeek(data.employeeOfWeek);
      setEmployeeOfMonth(data.employeeOfMonth);
      setEmployeeOfYear(data.employeeOfYear);
      setHallOfFame(data.hallOfFame || []);
    } catch (err) {
      console.error('Failed to load recognition data:', err);
      toast.error('Unable to load employee recognition statistics');
    } finally {
      setEopLoading(false);
    }
  };

  // Open Recognition Studio
  const handleOpenRecognitionStudio = (period: 'week' | 'month' | 'year') => {
    setActiveRecognitionPeriod(period);
    setRecognitionModalOpen(true);
    loadCandidates(period);
  };

  const loadCandidates = async (period: 'week' | 'month' | 'year') => {
    try {
      setCandidatesLoading(true);
      const list = await reportingService.getRecognitionCandidates(period);
      setCandidates(list);
    } catch (err) {
      console.error('Failed to load recognition candidates:', err);
      toast.error('Could not compute candidate rankings');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Approve Recognition Winner
  const handleApproveWinner = async () => {
    if (!selectedCandidateToApprove) return;
    try {
      setApprovingEmployeeId(selectedCandidateToApprove.employeeId);
      const periodLabelMap = {
        week: 'Week 28, 2026',
        month: 'June 2026',
        year: 'Year 2025 / 2026',
      };

      const result = await reportingService.approveWinner({
        periodType: activeRecognitionPeriod,
        periodLabel: periodLabelMap[activeRecognitionPeriod],
        employeeId: selectedCandidateToApprove.employeeId,
        remarks: approvalRemarks || 'Approved based on verified multi-dimensional performance excellence.',
        approvedBy: 'HR Operations Directorate',
      });

      toast.success(
        `Approved ${result.employeeName} as official ${
          activeRecognitionPeriod === 'week' ? 'Employee of the Week' : activeRecognitionPeriod === 'month' ? 'Employee of the Month' : 'Employee of the Year'
        }!`
      );

      setShowApprovalPrompt(false);
      setSelectedCandidateToApprove(null);
      setApprovalRemarks('');

      // Refresh recognition state and candidates
      await loadRecognitionData();
      await loadCandidates(activeRecognitionPeriod);
    } catch (err: any) {
      console.error('Failed to approve winner:', err);
      toast.error(err.message || 'Approval submission failed');
    } finally {
      setApprovingEmployeeId(null);
    }
  };

  // Open Report Studio Modal
  const handleOpenReport = (meta: ReportMeta) => {
    setSelectedReport(meta);
    setFilters({
      department: 'All',
      status: 'All',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
    loadReportData(meta.key, {
      department: 'All',
      status: 'All',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const loadReportData = async (reportKey: string, params: ReportFilterParams) => {
    try {
      setReportLoading(true);
      const data = await reportingService.getReport(reportKey, params);
      setReportData(data);
    } catch (err) {
      console.error(`Failed to load ${reportKey} report:`, err);
      toast.error(`Unable to retrieve data for ${reportKey} report`);
    } finally {
      setReportLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilterParams, val: any) => {
    const updated = { ...filters, [key]: val, page: 1 };
    setFilters(updated);
    if (selectedReport) {
      loadReportData(selectedReport.key, updated);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!reportData || newPage < 1 || newPage > reportData.pagination.totalPages) return;
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    if (selectedReport) {
      loadReportData(selectedReport.key, updated);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (!selectedReport) return;
    try {
      setExportLoading(true);
      await reportingService.downloadReport(selectedReport.key, format, filters);
      toast.success(`${selectedReport.title} exported as ${format.toUpperCase()} successfully!`);
    } catch (err: any) {
      console.error('Export failed:', err);
      toast.error(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  // Helper to render status badge
  const renderStatusPill = (status: string) => {
    const s = String(status || '').toLowerCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (s.includes('active') || s.includes('present') || s.includes('approved') || s.includes('completed') || s.includes('hired')) {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (s.includes('pending') || s.includes('scheduled') || s.includes('in-progress') || s.includes('notice') || s.includes('interview')) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (s.includes('terminated') || s.includes('absent') || s.includes('rejected') || s.includes('high')) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Module Header */}
      <div className="bg-gradient-to-r from-[#003838] via-[#004848] to-[#005a5a] text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Production Telemetry & Recognition Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Reporting & Analytics Studio
            </h1>
            <p className="mt-2 text-sm text-white/80 max-w-2xl leading-relaxed">
              Consolidated operational intelligence across 12 core organizational domains. Dynamic data streaming from live
              employee rosters, biometric attendance, payroll logs, and automated weighted recognition leaderboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                loadRecognitionData();
                toast.success('Analytics & reporting cache synced with live database!');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shadow-sm backdrop-blur-sm border border-white/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Telemetry</span>
            </button>
            <button
              onClick={() => handleOpenRecognitionStudio('month')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-all shadow-md"
            >
              <Trophy className="w-4 h-4 text-slate-900" />
              <span>Recognition Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Reporting Section - 12 Cards in 4-Column Responsive Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#004848]" />
              <span>Enterprise Operational Reports</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-[#004848] font-bold border border-teal-200">
                12 Reports
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any operational domain to launch the interactive generation studio, apply multi-parameter filters, and export PDF / Excel / CSV.
            </p>
          </div>
        </div>

        {/* 4-column responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {REPORT_DEFINITIONS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                onClick={() => handleOpenReport(card)}
                className="group relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden transform hover:-translate-y-1"
              >
                {/* Decorative top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accentColor} opacity-70 group-hover:opacity-100 transition-opacity`} />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#004848] group-hover:scale-110 group-hover:bg-teal-50 group-hover:text-teal-700 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#004848] transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#004848] group-hover:text-teal-600">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View & Export</span>
                  </span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Analytics Section - 3 Recognition Cards in 3-Column Responsive Grid */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Employee Recognition & Excellence Honorees</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                Live Scoring
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Weighted formula: Appraisal (35%) + Goals (20%) + Tasks (20%) + Attendance (15%) + Peer Contributions (10%).
            </p>
          </div>
          <button
            onClick={() => handleOpenRecognitionStudio('month')}
            className="text-xs font-bold text-[#004848] hover:text-teal-600 flex items-center gap-1.5"
          >
            <span>Review Full Leaderboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-column responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Employee of the Month */}
          <div className="relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Employee of the Month</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    employeeOfMonth?.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {employeeOfMonth?.status === 'Approved' ? 'Approved Winner' : 'Proposed Contender'}
                </span>
              </div>

              {eopLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading honoree data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        employeeOfMonth?.avatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
                      }
                      alt={employeeOfMonth?.employeeName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/40 shadow-sm"
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {employeeOfMonth?.employeeName || 'Michael Torres'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">{employeeOfMonth?.role || 'Principal Systems Engineer'}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{employeeOfMonth?.department || 'Operations'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Composite Score</span>
                      <span className="text-base font-extrabold text-amber-600">
                        {employeeOfMonth?.ratingScore?.toFixed(2) || '4.92'} <span className="text-xs text-slate-400">/ 5.0</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Punctuality</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        {employeeOfMonth?.punctualityScore?.toFixed(1) || '99.5'}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-2 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/60">
                    "{employeeOfMonth?.keyQuote || 'Outstanding operational leadership and technical rigor.'}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenRecognitionStudio('month')}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Trophy className="w-3.5 h-3.5 text-slate-900" />
                <span>Review Month Candidates & Approval</span>
              </button>
            </div>
          </div>

          {/* 2. Employee of the Year */}
          <div className="relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:border-purple-400/50 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
                  <Medal className="w-3.5 h-3.5 text-purple-600" />
                  <span>Employee of the Year</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    employeeOfYear?.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {employeeOfYear?.status === 'Approved' ? 'Approved Winner' : 'Proposed Contender'}
                </span>
              </div>

              {eopLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading honoree data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        employeeOfYear?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
                      }
                      alt={employeeOfYear?.employeeName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-400/40 shadow-sm"
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {employeeOfYear?.employeeName || 'Priya Nair'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">{employeeOfYear?.role || 'VP of Engineering'}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{employeeOfYear?.department || 'Leadership'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Annual Score</span>
                      <span className="text-base font-extrabold text-purple-600">
                        {employeeOfYear?.ratingScore?.toFixed(2) || '4.98'} <span className="text-xs text-slate-400">/ 5.0</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Attendance</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        {employeeOfYear?.punctualityScore?.toFixed(1) || '100.0'}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-2 bg-purple-50/40 p-2.5 rounded-lg border border-purple-100/60">
                    "{employeeOfYear?.keyQuote || 'Transformational engineering scale and cultural mentorship.'}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenRecognitionStudio('year')}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Trophy className="w-3.5 h-3.5 text-white" />
                <span>Review Year Candidates & Approval</span>
              </button>
            </div>
          </div>

          {/* 3. Employee of the Week */}
          <div className="relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-700" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200">
                  <Star className="w-3.5 h-3.5 text-teal-600" />
                  <span>Employee of the Week</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    employeeOfWeek?.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {employeeOfWeek?.status === 'Approved' ? 'Approved Winner' : 'Proposed Contender'}
                </span>
              </div>

              {eopLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading honoree data...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        employeeOfWeek?.avatar ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80'
                      }
                      alt={employeeOfWeek?.employeeName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-400/40 shadow-sm"
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {employeeOfWeek?.employeeName || 'Sarah Johnson'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">{employeeOfWeek?.role || 'Lead Cloud Architect'}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{employeeOfWeek?.department || 'Engineering'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Weekly Score</span>
                      <span className="text-base font-extrabold text-teal-600">
                        {employeeOfWeek?.ratingScore?.toFixed(2) || '4.95'} <span className="text-xs text-slate-400">/ 5.0</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Attendance</span>
                      <span className="text-base font-extrabold text-emerald-600">
                        {employeeOfWeek?.punctualityScore?.toFixed(1) || '99.8'}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-2 bg-teal-50/40 p-2.5 rounded-lg border border-teal-100/60">
                    "{employeeOfWeek?.keyQuote || 'Zero-downtime database deployment and sprint velocity mastery.'}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenRecognitionStudio('week')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#004848] hover:bg-[#003838] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Trophy className="w-3.5 h-3.5 text-teal-300" />
                <span>Review Week Candidates & Approval</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Interactive Report Studio Modal */}
      {/* ========================================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003838] to-[#004848] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
                  <selectedReport.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                      {selectedReport.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/70">{selectedReport.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Export Dropdown / Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={exportLoading}
                    onClick={() => handleExport('pdf')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all disabled:opacity-50"
                    title="Export as PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-red-300" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    disabled={exportLoading}
                    onClick={() => handleExport('excel')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all disabled:opacity-50"
                    title="Export as Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    disabled={exportLoading}
                    onClick={() => handleExport('csv')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-900 text-xs font-bold transition-all disabled:opacity-50"
                    title="Export as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 grow">
              {/* Filter Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-[#004848]" />
                  <span>Filters:</span>
                </div>

                {/* Department filter */}
                <select
                  value={filters.department || 'All'}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                </select>

                {/* Status filter */}
                <select
                  value={filters.status || 'All'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Present">Present</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>

                {/* Search */}
                <div className="relative grow max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium text-slate-700"
                  />
                </div>

                <button
                  onClick={() => {
                    const reset = { department: 'All', status: 'All', search: '', page: 1, limit: 10 };
                    setFilters(reset);
                    loadReportData(selectedReport.key, reset);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold ml-auto"
                >
                  Reset Filters
                </button>
              </div>

              {/* Summary KPI Cards from Report Data */}
              {reportData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary)
                    .slice(0, 4)
                    .map(([key, val]) => (
                      <div key={key} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                        <span className="text-[11px] text-slate-500 font-medium capitalize block truncate">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-lg font-extrabold text-[#004848] mt-0.5 block">
                          {typeof val === 'number' ? val.toLocaleString() : String(val)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {reportLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                    <span>Loading operational records...</span>
                  </div>
                ) : !reportData?.records || reportData.records.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    No records found matching the applied filter criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          {selectedReport.columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 font-semibold">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.records.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            {selectedReport.columns.map((col) => {
                              const cellValue = row[col.key];
                              return (
                                <td key={col.key} className="px-4 py-3 text-slate-700">
                                  {col.key.toLowerCase().includes('status') ? (
                                    renderStatusPill(String(cellValue || 'Active'))
                                  ) : (
                                    <span className="font-medium">{cellValue !== undefined ? String(cellValue) : '—'}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {reportData?.pagination && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>
                    Showing Page <strong className="text-slate-800">{reportData.pagination.page}</strong> of{' '}
                    <strong className="text-slate-800">{reportData.pagination.totalPages || 1}</strong> (
                    {reportData.pagination.total} total records)
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={reportData.pagination.page <= 1}
                      onClick={() => handlePageChange(reportData.pagination.page - 1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={reportData.pagination.page >= reportData.pagination.totalPages}
                      onClick={() => handlePageChange(reportData.pagination.page + 1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Recognition Management & Scoring Studio Modal */}
      {/* ========================================================================= */}
      {recognitionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003838] via-[#004848] to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Employee Recognition Studio</h3>
                  <p className="text-xs text-white/70">
                    Transparent weighted scoring engine & authorized executive approval persistence
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRecognitionModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-3 shrink-0">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setActiveRecognitionPeriod(period);
                    loadCandidates(period);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    activeRecognitionPeriod === period
                      ? 'bg-[#004848] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  Employee of the {period}
                </button>
              ))}

              <div className="ml-auto text-xs text-slate-500 font-medium hidden sm:flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-teal-600" />
                <span>35% Appraisal · 20% Goals · 20% Tasks · 15% Attendance · 10% Contributions</span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 grow">
              {/* Leaderboard Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span>Eligible Candidate Rankings & Composite Scores</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    Showing top calculated contenders for {activeRecognitionPeriod.toUpperCase()}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {candidatesLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                      <span>Computing weighted performance scores...</span>
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      No eligible candidates found for this recognition cycle.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="px-4 py-3">Rank</th>
                            <th className="px-4 py-3">Employee Name</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-center">Appraisal (35%)</th>
                            <th className="px-4 py-3 text-center">Tasks (20%)</th>
                            <th className="px-4 py-3 text-center">Attendance (15%)</th>
                            <th className="px-4 py-3 text-center">Total (5.00)</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Approval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {candidates.map((cand) => (
                            <tr
                              key={cand.employeeId}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                cand.isApprovedWinner ? 'bg-emerald-50/30' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-bold text-slate-700">
                                {cand.rank === 1 ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600 font-extrabold">
                                    <Crown className="w-3.5 h-3.5" /> #1
                                  </span>
                                ) : (
                                  `#${cand.rank}`
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">{cand.employeeName}</td>
                              <td className="px-4 py-3 text-slate-600">{cand.department}</td>
                              <td className="px-4 py-3 text-slate-600">{cand.role}</td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {cand.scoringBreakdown.appraisalScore.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {cand.scoringBreakdown.taskScore.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {cand.scoringBreakdown.attendanceScore.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm font-extrabold text-[#004848]">
                                  {cand.totalScore.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    cand.isApprovedWinner
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {cand.isApprovedWinner ? 'Approved Winner' : 'Proposed'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {cand.isApprovedWinner ? (
                                  <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedCandidateToApprove(cand);
                                      setShowApprovalPrompt(true);
                                    }}
                                    className="px-3 py-1 rounded-lg bg-[#004848] hover:bg-[#003838] text-white text-xs font-bold transition-all shadow-2xs"
                                  >
                                    Approve Winner
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Hall of Fame Archive */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Historical Hall of Fame Archive</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {hallOfFame.map((winner, idx) => (
                    <div
                      key={winner.employeeId + idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5"
                    >
                      <img
                        src={
                          winner.avatar ||
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80'
                        }
                        alt={winner.employeeName}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/30 shrink-0"
                      />
                      <div className="grow min-w-0">
                        <span className="text-[10px] font-bold text-[#004848] uppercase tracking-wider block truncate">
                          {winner.badge || `${winner.periodType} Winner`}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate">{winner.employeeName}</h5>
                        <p className="text-[11px] text-slate-500 truncate">{winner.role}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Awarded: {winner.awardedDate || '2026-06-30'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Winner Approval */}
      {showApprovalPrompt && selectedCandidateToApprove && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Authorize Winner Selection</h4>
                <p className="text-xs text-slate-500">
                  Confirm official recognition for {activeRecognitionPeriod.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Candidate:</span>
                <span className="font-bold text-slate-900">{selectedCandidateToApprove.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-700">{selectedCandidateToApprove.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Composite Score:</span>
                <span className="font-extrabold text-teal-700">{selectedCandidateToApprove.totalScore.toFixed(2)} / 5.0</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Official Commendation Remarks (Optional)</label>
              <textarea
                rows={3}
                placeholder="Exemplary contributions to architecture, sprint velocity, and cross-team culture..."
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowApprovalPrompt(false);
                  setSelectedCandidateToApprove(null);
                  setApprovalRemarks('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={approvingEmployeeId !== null}
                onClick={handleApproveWinner}
                className="px-4 py-2 rounded-xl bg-[#004848] hover:bg-[#003838] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {approvingEmployeeId !== null ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Persist Winner</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
