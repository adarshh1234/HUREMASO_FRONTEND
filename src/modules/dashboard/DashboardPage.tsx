import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  UserCheck,
  UserMinus,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Camera,
  List,
  CalendarClock,
  ClipboardList,
  FileText,
  Briefcase,
  ArrowRight,
  ArrowUp,
  Check,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { employeeService } from '../../services/employeeService';
import { leaveService } from '../../services/leaveService';
import {
  DashboardOverviewResponse,
  TimeAtWorkMetric,
  WorkforceMetrics,
  AttendanceLeaveMetrics,
  BuzzPost,
  RecentActivityItem,
  DistributionItem,
  EmployeeOnLeaveItem,
} from '../../types/dashboard';
import { Employee } from '../../types';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';

// Distribution Chart Colors
const PIE_COLORS = ['#0473b8', '#ecc94b', '#004848', '#9333ea', '#f97316', '#e11d48', '#10b981', '#64748b'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Overview Data
  const [timeAtWork, setTimeAtWork] = useState<TimeAtWorkMetric | null>(null);
  const [workforce, setWorkforce] = useState<WorkforceMetrics | null>(null);
  const [attendanceLeave, setAttendanceLeave] = useState<AttendanceLeaveMetrics | null>(null);
  const [myActions, setMyActions] = useState<any | null>(null);
  const [buzzPosts, setBuzzPosts] = useState<BuzzPost[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);

  // Clock In / Clock Out State
  const [isClocking, setIsClocking] = useState(false);
  const [showClockModal, setShowClockModal] = useState(false);
  const [clockAction, setClockAction] = useState<'in' | 'out'>('in');
  const [clockNote, setClockNote] = useState('');

  // Live timer for working minutes
  const [liveDurationMinutes, setLiveDurationMinutes] = useState(0);

  // Modals for SubUnit & Location Drilldowns
  const [selectedSubUnit, setSelectedSubUnit] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Buzz Modals
  const [showCreateBuzzModal, setShowCreateBuzzModal] = useState(false);
  const [editingBuzzPost, setEditingBuzzPost] = useState<BuzzPost | null>(null);
  const [buzzForm, setBuzzForm] = useState({
    author: 'Sarah Joseph',
    title: '',
    content: '',
    type: 'post',
  });
  const [isSubmittingBuzz, setIsSubmittingBuzz] = useState(false);

  // Quick Action: Assign Leave Modal
  const [showAssignLeaveModal, setShowAssignLeaveModal] = useState(false);
  const [assignLeaveForm, setAssignLeaveForm] = useState({
    employeeName: '',
    leaveType: 'Annual Leave',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    comment: '',
  });
  const [isSubmittingAssignLeave, setIsSubmittingAssignLeave] = useState(false);

  // Quick Action: Apply Leave Modal
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [applyLeaveForm, setApplyLeaveForm] = useState({
    leaveType: 'Annual Leave',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [isSubmittingApplyLeave, setIsSubmittingApplyLeave] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [overviewData, emps] = await Promise.all([
        dashboardService.getOverview().catch(() => null),
        employeeService.getAll().catch(() => []),
      ]);

      if (overviewData) {
        setTimeAtWork(overviewData.timeAtWork);
        setWorkforce(overviewData.workforce);
        setAttendanceLeave(overviewData.attendanceLeave);
        setMyActions(overviewData.myActions);
        setBuzzPosts(overviewData.buzzPosts);
        setRecentActivities(overviewData.recentActivities);
        setLiveDurationMinutes(overviewData.timeAtWork.todayDurationMinutes || 0);
      }

      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Could not refresh dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Live timer tick when punched in
  useEffect(() => {
    if (!timeAtWork?.punchedIn) return;
    const interval = setInterval(() => {
      setLiveDurationMinutes((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [timeAtWork?.punchedIn]);

  // Format live duration
  const formatLiveDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m Today`;
  };

  // Clock In / Out Triggers
  const handleOpenClockModal = (action: 'in' | 'out') => {
    setClockAction(action);
    setClockNote('');
    setShowClockModal(true);
  };

  const handleExecuteClock = async () => {
    setIsClocking(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];

      if (clockAction === 'in') {
        const updated = await dashboardService.clockIn({
          note: clockNote || undefined,
          time: timeStr,
          date: dateStr,
        });
        setTimeAtWork(updated);
        setLiveDurationMinutes(updated.todayDurationMinutes || 0);
        toast.success('Punched in successfully!');
      } else {
        const updated = await dashboardService.clockOut({
          note: clockNote || undefined,
          time: timeStr,
          date: dateStr,
        });
        setTimeAtWork(updated);
        setLiveDurationMinutes(updated.todayDurationMinutes || 0);
        toast.success('Punched out successfully!');
      }

      setShowClockModal(false);
      await loadDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || `Failed to clock ${clockAction}.`);
    } finally {
      setIsClocking(false);
    }
  };

  // Quick Action: Submit Assign Leave
  const handleAssignLeaveSubmit = async () => {
    if (!assignLeaveForm.employeeName.trim()) {
      toast.error('Please choose or enter an employee name');
      return;
    }
    setIsSubmittingAssignLeave(true);
    try {
      await leaveService.assignLeave({
        employeeName: assignLeaveForm.employeeName,
        leaveType: assignLeaveForm.leaveType,
        fromDate: assignLeaveForm.fromDate,
        toDate: assignLeaveForm.toDate,
        comment: assignLeaveForm.comment,
      });
      toast.success(`Leave assigned to ${assignLeaveForm.employeeName} successfully!`);
      setShowAssignLeaveModal(false);
      await loadDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign leave.');
    } finally {
      setIsSubmittingAssignLeave(false);
    }
  };

  // Quick Action: Submit Apply Leave
  const handleApplyLeaveSubmit = async () => {
    setIsSubmittingApplyLeave(true);
    try {
      const from = new Date(applyLeaveForm.fromDate);
      const to = new Date(applyLeaveForm.toDate);
      const diffDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      await leaveService.createRequest({
        employeeName: timeAtWork?.employeeName || 'Sarah Joseph',
        department: 'Operations',
        leaveType: applyLeaveForm.leaveType,
        fromDate: applyLeaveForm.fromDate,
        toDate: applyLeaveForm.toDate,
        numberOfDays: diffDays,
        comments: applyLeaveForm.reason || 'Personal time off',
      });
      toast.success('Leave application submitted for approval!');
      setShowApplyLeaveModal(false);
      await loadDashboardData(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmittingApplyLeave(false);
    }
  };

  // Buzz Handlers
  const handleOpenCreateBuzz = () => {
    setEditingBuzzPost(null);
    setBuzzForm({
      author: timeAtWork?.employeeName || 'Sarah Joseph',
      title: '',
      content: '',
      type: 'post',
    });
    setShowCreateBuzzModal(true);
  };

  const handleOpenEditBuzz = (post: BuzzPost) => {
    setEditingBuzzPost(post);
    setBuzzForm({
      author: post.author,
      title: post.title || '',
      content: post.content,
      type: post.type || 'post',
    });
    setShowCreateBuzzModal(true);
  };

  const handleSaveBuzzPost = async () => {
    if (!buzzForm.content.trim()) {
      toast.error('Post content is required');
      return;
    }
    setIsSubmittingBuzz(true);
    try {
      if (editingBuzzPost) {
        await dashboardService.updateBuzzPost(editingBuzzPost.id, {
          title: buzzForm.title || undefined,
          content: buzzForm.content,
          type: buzzForm.type,
        });
        toast.success('Post updated!');
      } else {
        await dashboardService.createBuzzPost({
          author: buzzForm.author,
          title: buzzForm.title || undefined,
          content: buzzForm.content,
          type: buzzForm.type,
          avatar: timeAtWork?.employeeAvatar,
        });
        toast.success('Buzz post published!');
      }
      setShowCreateBuzzModal(false);
      const updatedBuzz = await dashboardService.getBuzzPosts();
      setBuzzPosts(updatedBuzz);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save post.');
    } finally {
      setIsSubmittingBuzz(false);
    }
  };

  const handleDeleteBuzzPost = async (id: string) => {
    try {
      await dashboardService.deleteBuzzPost(id);
      toast.success('Post removed.');
      setBuzzPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  // Helper for generating dynamic conic gradients for pie charts
  const getConicGradient = (items: DistributionItem[] = []) => {
    if (!items || items.length === 0) {
      return 'conic-gradient(#0473b8 0% 100%)';
    }
    const total = items.reduce((acc, curr) => acc + curr.count, 0);
    if (total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';

    let currentPercent = 0;
    const parts = items.map((item, idx) => {
      const color = PIE_COLORS[idx % PIE_COLORS.length];
      const start = currentPercent;
      const pct = (item.count / total) * 100;
      currentPercent += pct;
      return `${color} ${start.toFixed(1)}% ${currentPercent.toFixed(1)}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  };

  // Fallback / Initial Values
  const totalEmployees = workforce?.totalEmployees ?? employees.length;
  const presentCount = attendanceLeave?.todayPresents ?? (timeAtWork?.punchedIn ? 1 : 0);
  const onLeaveCount = attendanceLeave?.onLeaveToday ?? 0;
  const absenceCount = attendanceLeave?.todayAbsence ?? Math.max(0, totalEmployees - (presentCount + onLeaveCount));

  const subunitDistribution = workforce?.subUnitDistribution?.length
    ? workforce.subUnitDistribution
    : [
        { name: 'Texas R&D', count: employees.filter((e) => e.subUnit === 'Texas R&D').length || 1, percentage: 75 },
        { name: 'Unassigned', count: employees.filter((e) => !e.subUnit).length || 0, percentage: 25 },
      ];

  const locationDistribution = workforce?.locationDistribution?.length
    ? workforce.locationDistribution
    : [
        { name: 'Human Resources', count: employees.filter((e) => e.location === 'Human Resources').length || 1, percentage: 90 },
        { name: 'Unassigned', count: employees.filter((e) => !e.location).length || 0, percentage: 10 },
      ];

  const employeesOnLeave = attendanceLeave?.employeesOnLeaveToday || [];

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Refresh indicator */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time overview of workforce, attendance, actions, and company buzz.</p>
        </div>
        <button
          onClick={() => loadDashboardData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          title="Refresh Dashboard Data"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Row 1: Time at Work Widget */}
      <div className="bg-[#e9eff4] rounded-xl border border-[#d6e2eb] p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left column: User Punched In/Out status */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Clock className="h-4.5 w-4.5 text-slate-500" />
            <span>Time at Work</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
              <img
                src={
                  timeAtWork?.employeeAvatar ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                }
                alt={timeAtWork?.employeeName || 'Sarah Joseph'}
                className="h-full w-full object-cover"
              />
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#e9eff4] ${
                  timeAtWork?.punchedIn ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
            </div>
            <div>
              <h4
                className="text-sm font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1.5"
                onClick={() => handleOpenClockModal(timeAtWork?.punchedIn ? 'out' : 'in')}
                title="Click to Clock In / Out"
              >
                <span>{timeAtWork?.statusText || (timeAtWork?.punchedIn ? 'Punched In' : 'Punched Out')}</span>
                <span className="text-[10px] font-normal text-slate-400">(Click to switch)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{timeAtWork?.punchedAt || 'Today'}</p>
            </div>
          </div>

          {/* Central stopwatch action pill button */}
          <button
            onClick={() => handleOpenClockModal(timeAtWork?.punchedIn ? 'out' : 'in')}
            className="flex items-center justify-between w-64 bg-white border border-slate-200 hover:border-slate-350 shadow-sm rounded-full py-2.5 px-5 cursor-pointer text-slate-800 transition-all select-none hover:shadow-md"
            title="Click to Clock In or Clock Out"
          >
            <span className="text-sm font-extrabold tracking-tight">
              {formatLiveDuration(liveDurationMinutes)}
            </span>
            <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>

        {/* Right column: 7 vertical hours bar columns */}
        <div className="flex flex-col items-end space-y-3 border-l border-slate-200 pl-6 h-full justify-between w-full">
          {/* Date info above the bars */}
          <div className="text-right w-full pr-2 select-none">
            <div className="text-[11px] font-bold text-slate-900 leading-none">This Week</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1">
              {timeAtWork?.weekRangeLabel || 'Jun 23 - Jun 29'}
            </div>
          </div>

          <div className="flex justify-between items-end h-20 gap-3 w-full px-2">
            {(timeAtWork?.weeklyHours?.length
              ? timeAtWork.weeklyHours
              : [
                  { shortDay: 'Mon', hours: 0 },
                  { shortDay: 'Tue', hours: 7.5 },
                  { shortDay: 'Wed', hours: 8.2 },
                  { shortDay: 'Thu', hours: 6.8 },
                  { shortDay: 'Fri', hours: 8.0 },
                  { shortDay: 'Sat', hours: 0 },
                  { shortDay: 'Sun', hours: 0 },
                ]
            ).map((dayMetric, idx) => {
              const maxHours = 10;
              const fillPct = Math.min(100, (dayMetric.hours / maxHours) * 100);
              return (
                <div key={`day-bar-${idx}`} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden group-hover:flex bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                    {dayMetric.hours}h
                  </div>
                  {/* Outer column */}
                  <div className="w-6 h-20 bg-white border border-slate-200 rounded-lg relative overflow-hidden flex flex-col justify-end">
                    {dayMetric.hours > 0 && (
                      <div
                        className="bg-[#0473b8] w-full rounded-b-md transition-all duration-500"
                        style={{ height: `${fillPct}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold w-full px-2 uppercase tracking-wide">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* Row 2: 4 Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <div
          onClick={() => navigate('/employees')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between h-28 select-none hover:border-slate-350 cursor-pointer transition-all hover:shadow-md"
          title="View Employee Management"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">Total Employees</span>
          </div>
          <div className="flex flex-col justify-between items-end h-full">
            <div className="relative">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              <span className="absolute -top-1 -right-1.5 text-[8px] font-bold text-emerald-500">+</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{totalEmployees}</span>
          </div>
        </div>

        {/* Today's Presents */}
        <div
          onClick={() => navigate('/time')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between h-28 select-none hover:border-slate-350 cursor-pointer transition-all hover:shadow-md"
          title="View Attendance Records"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">Today's Presents</span>
          </div>
          <div className="flex flex-col justify-between items-end h-full">
            <div className="relative">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
              <span className="absolute -top-1 -right-1.5 text-[8px] font-bold text-emerald-500">+</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{presentCount}</span>
          </div>
        </div>

        {/* Today's Absence */}
        <div
          onClick={() => navigate('/leave')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between h-28 select-none hover:border-slate-350 cursor-pointer transition-all hover:shadow-md"
          title="View Leave & Absence"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <UserMinus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">Today's Absence</span>
          </div>
          <div className="flex flex-col justify-between items-end h-full">
            <div className="relative">
              <TrendingDown className="h-4.5 w-4.5 text-rose-500" />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-rose-500">+</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{absenceCount}</span>
          </div>
        </div>

        {/* On Leave */}
        <div
          onClick={() => navigate('/leave')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between h-28 select-none hover:border-slate-350 cursor-pointer transition-all hover:shadow-md"
          title="View Active Leaves"
        >
          <div className="flex flex-col justify-between h-full">
            <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">On Leave</span>
          </div>
          <div className="flex flex-col justify-end items-end h-full">
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{onLeaveCount}</span>
          </div>
        </div>
      </div>

      {/* Row 3: 3 Columns Distribution Charts & On-Leave List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Sub Unit Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Employee Distribution by Sub Unit</h3>
          </div>
          <div className="flex justify-center my-4 relative">
            <div
              className="h-28 w-28 rounded-full border border-slate-100 shadow-sm cursor-pointer transition-transform hover:scale-105"
              style={{
                background: getConicGradient(subunitDistribution),
              }}
              title="Click a sub unit below to inspect team members"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 pt-2 border-t border-slate-100">
            {subunitDistribution.slice(0, 4).map((sub, idx) => (
              <div
                key={`sub-${idx}`}
                onClick={() => setSelectedSubUnit(sub.name)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-[#004848] transition-colors"
                title={`Click to view employees in ${sub.name}`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate">{sub.name} ({sub.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Employee Distribution by Location</h3>
          </div>
          <div className="flex justify-center my-4 relative">
            <div
              className="h-28 w-28 rounded-full border border-slate-100 shadow-sm cursor-pointer transition-transform hover:scale-105"
              style={{
                background: getConicGradient(locationDistribution),
              }}
              title="Click a location below to inspect office branch members"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 pt-2 border-t border-slate-100">
            {locationDistribution.slice(0, 4).map((loc, idx) => (
              <div
                key={`loc-${idx}`}
                onClick={() => setSelectedLocation(loc.name)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-[#004848] transition-colors"
                title={`Click to view employees in ${loc.name}`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate">{loc.name} ({loc.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employees on Leave Today List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Employees on Leave Today</h3>
            <button
              onClick={() => navigate('/leave')}
              className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1 max-h-[170px] overflow-y-auto">
            {employeesOnLeave.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CalendarDays className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                <p className="font-semibold">Nobody on leave today</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All active staff are scheduled.</p>
              </div>
            ) : (
              employeesOnLeave.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => navigate('/leave')}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-150 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-[10px] text-slate-700">
                      <img
                        src={
                          emp.avatar ||
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                        }
                        alt={emp.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-none">{emp.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        Emp ID: {emp.employeeId?.replace('EMP', '') || 'N/A'} · {emp.subUnit || emp.department}
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {emp.leaveType || 'On Leave'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Buzz & My Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Buzz Posts Card */}
        <div className="md:col-span-2 bg-[#f1f3f5] rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-slate-700" />
              <span>Buzz Latest Posts</span>
            </h3>
            <button
              onClick={handleOpenCreateBuzz}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 text-[#004848] text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="h-3 w-3" />
              <span>New Post</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {buzzPosts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No buzz announcements yet. Click &quot;New Post&quot; to publish one.
              </div>
            ) : (
              buzzPosts.map((post) => (
                <div key={post.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100 overflow-hidden shrink-0">
                        <img
                          src={
                            post.avatar ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                          }
                          alt={post.author}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-none">{post.author}</h4>
                        {post.title && <span className="text-[10px] font-semibold text-teal-800 block mt-0.5">{post.title}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-400 font-semibold">{post.formattedDate}</span>
                      <button
                        onClick={() => handleOpenEditBuzz(post)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="Edit Post"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteBuzzPost(post.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Delete Post"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-9 whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Actions Card */}
        <div className="bg-[#e2e4e7]/60 rounded-xl border border-slate-250 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200/50 pb-3 flex items-center gap-1.5">
            <List className="h-4.5 w-4.5 text-slate-700" />
            <span>My Actions</span>
          </h3>
          <div className="space-y-3 flex-1">
            <div
              className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200/60 hover:border-slate-350 cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
              onClick={() => navigate('/performance')}
              title="Navigate to Performance Appraisal"
            >
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  ({myActions?.pendingSelfReviews || 1}) Pending Self Review
                </h4>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200/60 hover:border-slate-350 cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
              onClick={() => navigate('/recruitment')}
              title="Navigate to Recruitment Candidates"
            >
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  ({myActions?.candidatesToInterview || 10}) Candidates to Interview
                </h4>
              </div>
            </div>
            <div
              className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200/60 hover:border-slate-350 cursor-pointer shadow-sm transition-all hover:scale-[1.02]"
              onClick={() => navigate('/time')}
              title="Navigate to Timesheet Approvals"
            >
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  ({myActions?.timesheetsToApprove || 2}) Timesheets to Approve
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Quick Actions (6 Dark Teal Cards) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {/* 1. Assign Leave */}
          <button
            onClick={() => setShowAssignLeaveModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="Open Assign Leave dialog"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <Users className="h-8 w-8 text-white" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <Check className="h-2.5 w-2.5 text-white font-extrabold" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">Assign Leave</span>
          </button>

          {/* 2. Leave List */}
          <button
            onClick={() => navigate('/leave')}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="View Full Leave List"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <Users className="h-8 w-8 text-white" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <List className="h-2.5 w-2.5 text-white font-extrabold" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">Leave List</span>
          </button>

          {/* 3. Timesheets */}
          <button
            onClick={() => navigate('/time')}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="View Timesheets"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <ClipboardList className="h-8 w-8 text-white" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <Clock className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">Timesheets</span>
          </button>

          {/* 4. Apply Leave */}
          <button
            onClick={() => setShowApplyLeaveModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="Apply for Employee Leave"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <FileText className="h-8 w-8 text-white" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <ArrowRight className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">Apply Leave</span>
          </button>

          {/* 5. My Leave */}
          <button
            onClick={() => navigate('/leave')}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="View My Leave Records"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <UserCheck className="h-8 w-8 text-white" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <ArrowUp className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">My Leave</span>
          </button>

          {/* 6. My Timesheet */}
          <button
            onClick={() => navigate('/time')}
            className="flex flex-col items-center justify-center p-4 bg-[#004848] hover:bg-[#003838] text-white rounded-xl transition-all text-center shadow-sm h-32 cursor-pointer select-none hover:shadow-md"
            title="View My Personal Timesheet"
          >
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <Briefcase className="h-8 w-8 text-white" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#004848] rounded-full flex items-center justify-center border border-white">
                  <Clock className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>
            <span className="text-xs font-bold mt-2">My Timesheet</span>
          </button>
        </div>
      </div>

      {/* Row 6: Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900">Recent Activity</h3>
          <button
            onClick={() => loadDashboardData(true)}
            className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Update Feed</span>
          </button>
        </div>
        <div className="space-y-4 text-xs">
          {recentActivities.length === 0 ? (
            <div className="p-4 text-slate-400 text-center">No recent activity logs recorded yet.</div>
          ) : (
            recentActivities.map((act) => {
              const isLeave = act.type === 'leave';
              const isRecruitment = act.type === 'recruitment';
              const isAttendance = act.type === 'attendance';

              return (
                <div key={act.id} className="flex gap-3 items-start group">
                  <div className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-500 bg-slate-50 shrink-0">
                    {isLeave ? (
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                    ) : isRecruitment ? (
                      <Search className="h-4 w-4 text-amber-600" />
                    ) : isAttendance ? (
                      <ClipboardList className="h-4 w-4 text-teal-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800">{act.title}</h4>
                      {act.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500">{act.description}</p>
                    <span className="text-[10px] text-slate-400 font-semibold block">{act.timeAgo}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clock In / Out Modal */}
      <Modal
        isOpen={showClockModal}
        onClose={() => setShowClockModal(false)}
        title={clockAction === 'in' ? 'Clock In / Punch In' : 'Clock Out / Punch Out'}
      >
        <div className="space-y-4 text-xs">
          <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg">
            <p className="font-semibold text-teal-900">
              Confirm {clockAction === 'in' ? 'Clock In' : 'Clock Out'} for {timeAtWork?.employeeName || 'Sarah Joseph'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Date:{' '}
              {new Date().toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Optional Note / Location {clockAction === 'in' ? '(e.g. Office, Remote)' : '(e.g. Completed daily tasks)'}
            </label>
            <textarea
              value={clockNote}
              onChange={(e) => setClockNote(e.target.value)}
              rows={2}
              placeholder="Add attendance note..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowClockModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteClock}
              disabled={isClocking}
              className={`px-6 py-2 text-white font-bold rounded-lg cursor-pointer disabled:opacity-60 ${
                clockAction === 'in' ? 'bg-[#004848] hover:bg-[#003333]' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isClocking ? 'Processing...' : clockAction === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sub Unit Team Breakdown Modal */}
      <Modal
        isOpen={!!selectedSubUnit}
        onClose={() => setSelectedSubUnit(null)}
        title={`Sub Unit: ${selectedSubUnit}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg">
            <span className="font-bold text-slate-700">Team Members</span>
            <span className="text-slate-500 font-semibold">
              Total: {employees.filter((e) => (e.subUnit || 'Unassigned') === selectedSubUnit).length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {employees
              .filter((e) => (e.subUnit || 'Unassigned') === selectedSubUnit)
              .map((emp) => (
                <div key={emp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}</p>
                    <p className="text-[10px] text-slate-400">{emp.jobTitle || emp.department || 'Staff'}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                    {emp.attendanceStatus || 'Active'}
                  </span>
                </div>
              ))}
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedSubUnit(null);
                navigate('/employees');
              }}
              className="text-[#004848] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              Open in Employee Directory <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => setSelectedSubUnit(null)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Location Office Breakdown Modal */}
      <Modal
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        title={`Location: ${selectedLocation}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg">
            <span className="font-bold text-slate-700">Employees at Location</span>
            <span className="text-slate-500 font-semibold">
              Total: {employees.filter((e) => (e.location || 'Unassigned') === selectedLocation).length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {employees
              .filter((e) => (e.location || 'Unassigned') === selectedLocation)
              .map((emp) => (
                <div key={emp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}</p>
                    <p className="text-[10px] text-slate-400">{emp.jobTitle || emp.department || 'Staff'}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                    {emp.subUnit || emp.department || 'Assigned'}
                  </span>
                </div>
              ))}
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setSelectedLocation(null);
                navigate('/employees');
              }}
              className="text-[#004848] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              Open in Employee Directory <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => setSelectedLocation(null)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Buzz Post Modal */}
      <Modal
        isOpen={showCreateBuzzModal}
        onClose={() => setShowCreateBuzzModal(false)}
        title={editingBuzzPost ? 'Edit Buzz Post' : 'Create Buzz Announcement'}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Author Name *</label>
              <input
                type="text"
                value={buzzForm.author}
                onChange={(e) => setBuzzForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="Your name"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
              <select
                value={buzzForm.type}
                onChange={(e) => setBuzzForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                <option value="post">General Post</option>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title (Optional)</label>
            <input
              type="text"
              value={buzzForm.title}
              onChange={(e) => setBuzzForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Welcome to Q3 All-Hands!"
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message Content *</label>
            <textarea
              value={buzzForm.content}
              onChange={(e) => setBuzzForm((f) => ({ ...f, content: e.target.value }))}
              rows={4}
              placeholder="Write your company announcement or social update..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreateBuzzModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBuzzPost}
              disabled={isSubmittingBuzz}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmittingBuzz ? 'Publishing...' : editingBuzzPost ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Action: Assign Leave Modal */}
      <Modal
        isOpen={showAssignLeaveModal}
        onClose={() => setShowAssignLeaveModal(false)}
        title="Assign Leave to Employee"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
            <select
              value={assignLeaveForm.employeeName}
              onChange={(e) => setAssignLeaveForm((f) => ({ ...f, employeeName: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name || emp.firstName}>
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} ({emp.department || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
            <select
              value={assignLeaveForm.leaveType}
              onChange={(e) => setAssignLeaveForm((f) => ({ ...f, leaveType: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
            >
              <option>Annual Leave</option>
              <option>Medical Leave</option>
              <option>Casual Leave</option>
              <option>Maternity / Paternity Leave</option>
              <option>Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">From Date *</label>
              <input
                type="date"
                value={assignLeaveForm.fromDate}
                onChange={(e) => setAssignLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">To Date *</label>
              <input
                type="date"
                value={assignLeaveForm.toDate}
                onChange={(e) => setAssignLeaveForm((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Note</label>
            <textarea
              value={assignLeaveForm.comment}
              onChange={(e) => setAssignLeaveForm((f) => ({ ...f, comment: e.target.value }))}
              rows={2}
              placeholder="HR leave assignment justification..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAssignLeaveModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignLeaveSubmit}
              disabled={isSubmittingAssignLeave}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmittingAssignLeave ? 'Assigning...' : 'Assign Leave'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Action: Apply Leave Modal */}
      <Modal
        isOpen={showApplyLeaveModal}
        onClose={() => setShowApplyLeaveModal(false)}
        title="Apply for Leave"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg">
            <p className="font-semibold text-teal-900">
              Applying as: <span className="font-bold">{timeAtWork?.employeeName || 'Sarah Joseph'}</span>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Leave Type *</label>
            <select
              value={applyLeaveForm.leaveType}
              onChange={(e) => setApplyLeaveForm((f) => ({ ...f, leaveType: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
            >
              <option>Annual Leave</option>
              <option>Medical Leave</option>
              <option>Casual Leave</option>
              <option>Personal Leave</option>
              <option>Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">From Date *</label>
              <input
                type="date"
                value={applyLeaveForm.fromDate}
                onChange={(e) => setApplyLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-[#004848]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">To Date *</label>
              <input
                type="date"
                value={applyLeaveForm.toDate}
                onChange={(e) => setApplyLeaveForm((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              value={applyLeaveForm.reason}
              onChange={(e) => setApplyLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              placeholder="State your reason for leave..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApplyLeaveModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyLeaveSubmit}
              disabled={isSubmittingApplyLeave}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmittingApplyLeave ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
