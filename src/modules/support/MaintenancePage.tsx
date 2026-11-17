import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Wrench,
  RefreshCw,
  Database,
  Server,
  Activity,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  User,
  MessageSquare,
  Calendar,
  X,
  Eye,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  maintenanceService,
  SupportTicket,
  ScheduledMaintenanceLog,
  HuremasoOverviewData,
  SystemDiagnosticReport,
} from '../../services/maintenanceService';

export const MaintenancePage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  const isHuremasoMaintenance = path.includes('/huremaso');

  // ================= SUBSECTION A (TICKETS) STATE =================
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('All');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('All');

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low' | 'Critical'>('High');
  const [newCategory, setNewCategory] = useState<
    'System Error' | 'Access Issue' | 'Hardware' | 'Software' | 'Network' | 'Database' | 'Other'
  >('System Error');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newRequesterName, setNewRequesterName] = useState('Employee');

  // Ticket Details & Audit Modal State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [assignAgentName, setAssignAgentName] = useState('');
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolvePrompt, setShowResolvePrompt] = useState(false);

  // ================= SUBSECTION B (HUREMASO) STATE =================
  const [overviewData, setOverviewData] = useState<HuremasoOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<SystemDiagnosticReport | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // Schedules state
  const [schedules, setSchedules] = useState<ScheduledMaintenanceLog[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('All');

  // Schedule Maintenance Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingMaintenance, setSchedulingMaintenance] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDesc, setSchedDesc] = useState('');
  const [schedCategory, setSchedCategory] = useState('Infrastructure');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('02:00 AM');
  const [schedDuration, setSchedDuration] = useState('15 mins');
  const [schedPriority, setSchedPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [schedAdmin, setSchedAdmin] = useState('Infrastructure Lead');
  const [schedNotes, setSchedNotes] = useState('');

  // Schedule Details Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledMaintenanceLog | null>(null);
  const [showScheduleDetailsModal, setShowScheduleDetailsModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // ================= DATA FETCHING =================
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await maintenanceService.getTickets({
        status: ticketStatusFilter,
        priority: ticketPriorityFilter,
        category: ticketCategoryFilter,
        search: ticketSearch,
      });
      setTickets(res.tickets);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch support tickets');
    } finally {
      setLoadingTickets(false);
    }
  }, [ticketStatusFilter, ticketPriorityFilter, ticketCategoryFilter, ticketSearch, toast]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await maintenanceService.getHuremasoOverview();
      setOverviewData(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch infrastructure telemetry');
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  const fetchSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const res = await maintenanceService.getSchedules({
        status: scheduleStatusFilter,
        search: scheduleSearch,
      });
      setSchedules(res.logs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch scheduled maintenance logs');
    } finally {
      setLoadingSchedules(false);
    }
  }, [scheduleStatusFilter, scheduleSearch, toast]);

  useEffect(() => {
    if (isHuremasoMaintenance) {
      fetchOverview();
      fetchSchedules();
    } else {
      fetchTickets();
    }
  }, [isHuremasoMaintenance, fetchTickets, fetchOverview, fetchSchedules]);

  // ================= TICKET ACTIONS =================
  const handleCreateTicket = async () => {
    if (!newTitle.trim()) {
      toast.error('Ticket title is required');
      return;
    }
    if (!newDesc.trim() || newDesc.trim().length < 5) {
      toast.error('Ticket description must be at least 5 characters');
      return;
    }

    setCreatingTicket(true);
    try {
      await maintenanceService.createTicket({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        category: newCategory,
        department: newDepartment,
        requesterName: newRequesterName,
      });
      toast.success('Support ticket created successfully!');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create support ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleOpenDetails = async (t: SupportTicket) => {
    setSelectedTicket(t);
    setShowDetailsModal(true);
    try {
      const fresh = await maintenanceService.getTicketById(t.id);
      setSelectedTicket(fresh);
    } catch (err) {
      // fallback to initial
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    setAddingComment(true);
    try {
      const updated = await maintenanceService.addComment(selectedTicket.id, commentText.trim(), 'Requester');
      setSelectedTicket(updated);
      setCommentText('');
      toast.success('Comment posted successfully');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string, notes?: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await maintenanceService.updateTicketStatus(selectedTicket.id, newStatus, notes);
      setSelectedTicket(updated);
      toast.success(`Ticket status transitioned to ${newStatus}`);
      setShowResolvePrompt(false);
      setResolveNotes('');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket status');
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedTicket || !assignAgentName.trim()) return;
    setAssigningAgent(true);
    try {
      const updated = await maintenanceService.assignTicket(selectedTicket.id, assignAgentName.trim());
      setSelectedTicket(updated);
      setAssignAgentName('');
      toast.success(`Ticket assigned to ${assignAgentName}`);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign ticket');
    } finally {
      setAssigningAgent(false);
    }
  };

  // ================= HUREMASO INFRASTRUCTURE ACTIONS =================
  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const report = await maintenanceService.runSystemDiagnostics();
      setDiagnosticReport(report);
      setShowDiagnosticModal(true);
      toast.success('System diagnostics executed successfully!');
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute system diagnostics');
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!schedTitle.trim()) {
      toast.error('Maintenance title is required');
      return;
    }
    if (!schedDate.trim()) {
      toast.error('Scheduled date is required');
      return;
    }

    setSchedulingMaintenance(true);
    try {
      await maintenanceService.createSchedule({
        title: schedTitle.trim(),
        description: schedDesc.trim(),
        category: schedCategory,
        scheduledDate: schedDate.trim(),
        scheduledTime: schedTime.trim(),
        duration: schedDuration.trim(),
        priority: schedPriority,
        responsibleAdmin: schedAdmin.trim(),
        notes: schedNotes.trim(),
      });
      toast.success('Maintenance window scheduled successfully!');
      setShowScheduleModal(false);
      setSchedTitle('');
      setSchedDesc('');
      setSchedNotes('');
      fetchSchedules();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule maintenance window');
    } finally {
      setSchedulingMaintenance(false);
    }
  };

  const handleScheduleStatusChange = async (schedId: string, status: string, notes?: string) => {
    try {
      await maintenanceService.updateScheduleStatus(schedId, status, notes);
      toast.success(`Maintenance window transitioned to ${status}`);
      if (selectedSchedule && selectedSchedule.id === schedId) {
        setShowScheduleDetailsModal(false);
      }
      fetchSchedules();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update maintenance status');
    }
  };

  const handleCancelSchedule = async () => {
    if (!selectedSchedule || !cancelReason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }
    try {
      await maintenanceService.cancelSchedule(selectedSchedule.id, cancelReason.trim());
      toast.success('Maintenance schedule cancelled successfully');
      setShowCancelPrompt(false);
      setShowScheduleDetailsModal(false);
      setCancelReason('');
      fetchSchedules();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel schedule');
    }
  };

  // ================= VIEW: SUBSECTION B (HUREMASO INFRASTRUCTURE) =================
  if (isHuremasoMaintenance) {
    const serverHealth = overviewData?.serverDetails;
    const dbHealth = overviewData?.databaseDetails;
    const cacheHealth = overviewData?.cacheDetails;

    return (
      <div className="space-y-6 max-w-5xl animate-fade-in">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider">
              <Wrench className="h-3.5 w-3.5 text-teal-300" />
              <span>Huremaso Infrastructure Maintenance</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Huremaso</h1>
            <p className="text-xs text-teal-100/80 m-0">
              System health diagnostics, database maintenance triggers, and scheduled platform upgrades.
            </p>
          </div>
          <button
            onClick={handleRunDiagnostics}
            disabled={runningDiagnostics}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#004848] hover:bg-teal-50 disabled:opacity-75 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${runningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{runningDiagnostics ? 'Running Diagnostics...' : 'Run System Diagnostics'}</span>
          </button>
        </div>

        {/* Real System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Application Servers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                <Server className="h-4 w-4 text-[#004848]" />
                <span>Application Servers</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {serverHealth?.status || 'Healthy'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {serverHealth?.uptimeFormatted || 'Operational'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              {serverHealth?.activeNodes || 1} instance active • RSS: {serverHealth?.memoryUsageMb || 0} MB
            </div>
          </div>

          {/* Card 2: Database Integrity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                <Database className="h-4 w-4 text-[#004848]" />
                <span>Database Integrity</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                dbHealth?.status === 'Connected'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {dbHealth?.status || 'Connected'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {dbHealth?.pingLatencyMs !== undefined ? `${dbHealth.pingLatencyMs} ms Ping` : 'Optimized'}
            </div>
            <div className="text-[11px] font-semibold text-teal-600">
              {dbHealth?.collectionsCount !== undefined ? `${dbHealth.collectionsCount} Collections accessible` : '0 Index Fragmentations'}
            </div>
          </div>

          {/* Card 3: Cache Latency */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                <Activity className="h-4 w-4 text-[#004848]" />
                <span>Cache Latency</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {cacheHealth?.status || 'Not Configured'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {cacheHealth?.redisConfigured ? `${cacheHealth.latencyMs} ms` : 'Not Configured'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500">
              {cacheHealth?.details || 'Direct database caching enabled'}
            </div>
          </div>
        </div>

        {/* Scheduled Maintenance Log Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-150 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Scheduled Maintenance Log</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Track and plan upcoming infrastructure maintenance windows
              </p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white hover:bg-[#003838] text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Maintenance</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search maintenance logs..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={scheduleStatusFilter}
                onChange={(e) => setScheduleStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Schedules List or Empty State */}
          {loadingSchedules ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">Loading maintenance logs...</div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 m-0">No Scheduled Maintenance</h4>
              <p className="text-[11px] text-slate-400 font-medium m-0">
                There are currently no maintenance windows scheduled matching your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 m-0">{item.title}</h4>
                      {item.category && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold m-0">
                      {item.scheduledDate} {item.scheduledTime ? `• ${item.scheduledTime}` : ''} • Duration: {item.duration}
                      {item.responsibleAdmin && ` • Lead: ${item.responsibleAdmin}`}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-600 font-normal m-0 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSchedule(item);
                        setShowScheduleDetailsModal(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Results Modal */}
        {diagnosticReport && (
          <Modal
            isOpen={showDiagnosticModal}
            onClose={() => setShowDiagnosticModal(false)}
            title="System Diagnostics Report"
          >
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    Diagnostic ID: {diagnosticReport.diagnosticId}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Executed at: {new Date(diagnosticReport.startedAt).toLocaleString()} ({diagnosticReport.durationMs}ms duration)
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  {diagnosticReport.overallStatus}
                </span>
              </div>

              {/* Component Health Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[#004848] font-bold text-[11px]">
                    <Server className="w-3.5 h-3.5" />
                    <span>Application Server</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{diagnosticReport.serverHealth.status}</div>
                  <div className="text-[10px] text-slate-500">
                    Uptime: {diagnosticReport.serverHealth.uptimeFormatted}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    RSS Memory: {diagnosticReport.serverHealth.memoryUsageMb} MB
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[#004848] font-bold text-[11px]">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database Cluster</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{diagnosticReport.databaseHealth.status}</div>
                  <div className="text-[10px] text-slate-500">
                    Latency: {diagnosticReport.databaseHealth.pingLatencyMs} ms
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Collections: {diagnosticReport.databaseHealth.collectionsCount} accessible
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[#004848] font-bold text-[11px]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Cache Layer</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{diagnosticReport.cacheHealth.status}</div>
                  <div className="text-[10px] text-slate-500">{diagnosticReport.cacheHealth.details}</div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Diagnostic Findings & Recommendations</h4>
                <ul className="space-y-1.5 pl-4 list-disc text-[11px] text-slate-600">
                  {diagnosticReport.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="md" onClick={() => setShowDiagnosticModal(false)}>
                  Close Report
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Schedule Maintenance Modal */}
        <Modal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          title="Schedule Infrastructure Maintenance"
        >
          <div className="space-y-4 text-xs font-bold text-slate-700">
            <Input
              label="Maintenance Title"
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
              placeholder="e.g. Database Index Rebuild & Vacuuming"
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={schedCategory}
                onChange={(e) => setSchedCategory(e.target.value)}
                options={[
                  { value: 'Infrastructure', label: 'Infrastructure' },
                  { value: 'Database', label: 'Database' },
                  { value: 'Security', label: 'Security' },
                  { value: 'Network', label: 'Network' },
                  { value: 'Software Upgrade', label: 'Software Upgrade' },
                ]}
              />
              <Select
                label="Priority"
                value={schedPriority}
                onChange={(e) => setSchedPriority(e.target.value as any)}
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Scheduled Date"
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
              />
              <Input
                label="Scheduled Time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                placeholder="e.g. 02:00 AM"
              />
              <Input
                label="Expected Duration"
                value={schedDuration}
                onChange={(e) => setSchedDuration(e.target.value)}
                placeholder="e.g. 15 mins"
              />
            </div>

            <Input
              label="Responsible Administrator"
              value={schedAdmin}
              onChange={(e) => setSchedAdmin(e.target.value)}
              placeholder="Infrastructure Lead"
            />

            <div>
              <label className="block mb-1 text-xs">Description & Scope</label>
              <textarea
                rows={3}
                value={schedDesc}
                onChange={(e) => setSchedDesc(e.target.value)}
                placeholder="Describe planned actions, affected services, and expected impact..."
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none resize-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="md" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={schedulingMaintenance}
                onClick={handleCreateSchedule}
              >
                {schedulingMaintenance ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Schedule Details & Management Modal */}
        {selectedSchedule && (
          <Modal
            isOpen={showScheduleDetailsModal}
            onClose={() => {
              setShowScheduleDetailsModal(false);
              setShowCancelPrompt(false);
            }}
            title="Maintenance Window Details"
          >
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">{selectedSchedule.title}</h3>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                    Category: {selectedSchedule.category} • Lead: {selectedSchedule.responsibleAdmin}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedSchedule.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedSchedule.status === 'In Progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : selectedSchedule.status === 'Cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {selectedSchedule.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500">Scheduled Date:</span>{' '}
                  <span className="text-slate-900">{selectedSchedule.scheduledDate} {selectedSchedule.scheduledTime}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Duration:</span>{' '}
                  <span className="text-slate-900">{selectedSchedule.duration}</span>
                </div>
              </div>

              {selectedSchedule.description && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                  <div className="font-bold text-slate-600 mb-1">Description:</div>
                  {selectedSchedule.description}
                </div>
              )}

              {/* Execution History */}
              {selectedSchedule.executionHistory && selectedSchedule.executionHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Execution Log & Audit Trail</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedSchedule.executionHistory.map((entry, idx) => (
                      <div key={idx} className="p-2 border border-slate-200 rounded-lg text-[11px] bg-white">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{entry.action}</span>
                          <span className="text-slate-400 font-normal">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-500 font-medium">By: {entry.performedBy}</div>
                        {entry.notes && <div className="text-slate-600 mt-0.5">{entry.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Dialog inside modal */}
              {showCancelPrompt ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-rose-800">Cancel this Maintenance Window</div>
                  <Input
                    label="Cancellation Reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancelling schedule..."
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setShowCancelPrompt(false)}>
                      Back
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleCancelSchedule} className="bg-rose-600 hover:bg-rose-700 text-white">
                      Confirm Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Action buttons */
                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-150">
                  <div className="flex gap-2">
                    {selectedSchedule.status !== 'In Progress' && selectedSchedule.status !== 'Completed' && selectedSchedule.status !== 'Cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleStatusChange(selectedSchedule.id, 'In Progress', 'Maintenance work started')}
                      >
                        Start Execution
                      </Button>
                    )}
                    {selectedSchedule.status === 'In Progress' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleScheduleStatusChange(selectedSchedule.id, 'Completed', 'Maintenance window closed successfully')}
                      >
                        Mark Completed
                      </Button>
                    )}
                    {selectedSchedule.status !== 'Cancelled' && selectedSchedule.status !== 'Completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        Cancel Schedule
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowScheduleDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ================= VIEW: SUBSECTION A (ACTIVE SUPPORT TICKETS) =================
  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Active Support Tickets</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage system incident tickets, track resolution progress, and assign support personnel.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2.5 bg-[#85bfe2]/70 hover:bg-[#85bfe2] text-slate-800 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          Create Support Ticket
        </button>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by title, number, requester, description..."
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={ticketStatusFilter}
            onChange={(e) => setTicketStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>

          {/* Priority Filter */}
          <select
            value={ticketPriorityFilter}
            onChange={(e) => setTicketPriorityFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
            <option value="Critical">Critical Priority</option>
          </select>

          {/* Category Filter */}
          <select
            value={ticketCategoryFilter}
            onChange={(e) => setTicketCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Categories</option>
            <option value="System Error">System Error</option>
            <option value="Access Issue">Access Issue</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Database">Database</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Tickets Cards List or Empty State */}
      {loadingTickets ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400">Loading support tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-700 m-0">No Support Tickets Found</h4>
          <p className="text-[11px] text-slate-400 font-medium m-0">
            There are currently no active support tickets in the system matching your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5 hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Status & Priority Badges */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {t.status === 'Open' ? (
                    <span className="flex items-center gap-1.5 px-3 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold border border-rose-100">
                      <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
                      <span>Open</span>
                    </span>
                  ) : t.status === 'Resolved' ? (
                    <span className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Resolved</span>
                    </span>
                  ) : t.status === 'In Progress' ? (
                    <span className="flex items-center gap-1.5 px-3 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span>In Progress</span>
                    </span>
                  ) : t.status === 'Closed' ? (
                    <span className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200">
                      <span>Closed</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold border border-purple-100">
                      <span>{t.status}</span>
                    </span>
                  )}

                  {t.ticketNumber && (
                    <span className="text-[11px] font-bold text-slate-400">
                      {t.ticketNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {t.priority && (
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                      t.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : t.priority === 'High'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.priority} Priority
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenDetails(t)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 m-0">{t.title}</h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Metadata Footer line */}
              <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100">
                <span>Created : {t.createdDate}</span>
                {t.requesterName && <span>Requester: {t.requesterName}</span>}
                {t.department && <span>Dept: {t.department}</span>}
                {t.category && <span>Category: {t.category}</span>}
                {t.assignedAgent && t.assignedAgent !== 'Unassigned' && (
                  <span className="text-teal-700">Assigned: {t.assignedAgent}</span>
                )}
                {t.resolvedDate && <span className="text-emerald-600">Resolved : {t.resolvedDate}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Support Ticket Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Support Ticket">
        <div className="space-y-4 text-xs font-bold text-slate-700">
          <Input
            label="Ticket Title"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter issue headline..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              options={[
                { value: 'Critical', label: 'Critical' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
            />

            <Select
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              options={[
                { value: 'System Error', label: 'System Error' },
                { value: 'Access Issue', label: 'Access Issue' },
                { value: 'Hardware', label: 'Hardware' },
                { value: 'Software', label: 'Software' },
                { value: 'Network', label: 'Network' },
                { value: 'Database', label: 'Database' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Requester Name"
              value={newRequesterName}
              onChange={(e) => setNewRequesterName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Department"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="e.g. Engineering, HR"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold">Ticket Description</label>
            <textarea
              rows={4}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe your issue details here (steps to reproduce, impact)..."
              className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 outline-none resize-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" size="md" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="px-6"
              disabled={creatingTicket}
              onClick={handleCreateTicket}
            >
              {creatingTicket ? 'Submitting...' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Details & Inspection Modal */}
      {selectedTicket && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setShowResolvePrompt(false);
          }}
          title={`Ticket Details — ${selectedTicket.ticketNumber || selectedTicket.title}`}
        >
          <div className="space-y-5 text-xs font-semibold text-slate-700">
            {/* Header info */}
            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">{selectedTicket.title}</h3>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                  Category: {selectedTicket.category} • Requester: {selectedTicket.requesterName} ({selectedTicket.department})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {selectedTicket.priority} Priority
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {selectedTicket.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-600">Issue Description:</div>
              <p className="text-xs text-slate-800 m-0 leading-relaxed">{selectedTicket.description}</p>
            </div>

            {/* Agent Assignment & Quick Status bar */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600">Assigned Agent:</span>
                <span className="text-xs font-bold text-slate-900">{selectedTicket.assignedAgent || 'Unassigned'}</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Assign to agent..."
                  value={assignAgentName}
                  onChange={(e) => setAssignAgentName(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded text-xs outline-none font-medium w-40"
                />
                <Button variant="outline" size="sm" onClick={handleAssignAgent} disabled={assigningAgent}>
                  Assign
                </Button>
              </div>
            </div>

            {/* Resolution Details if resolved */}
            {selectedTicket.resolutionDetails && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="text-[11px] font-bold text-emerald-800">Resolution Details:</div>
                <p className="text-xs text-emerald-900 m-0">{selectedTicket.resolutionDetails}</p>
                {selectedTicket.resolvedDate && (
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                    Resolved Date: {selectedTicket.resolvedDate}
                  </div>
                )}
              </div>
            )}

            {/* Comments Thread */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MessageSquare className="w-3.5 h-3.5 text-[#004848]" />
                <span>Comments & Communication ({selectedTicket.comments?.length || 0})</span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedTicket.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 border border-slate-200 rounded-lg text-xs bg-white space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        {c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 m-0">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type a response or internal comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none"
                />
                <Button variant="primary" size="sm" onClick={handleAddComment} disabled={addingComment}>
                  Post
                </Button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">Activity Timeline</h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedTicket.history?.map((h) => (
                  <div key={h.id} className="p-2 border border-slate-100 rounded text-[11px] bg-slate-50/50 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{h.action}</span>
                      {h.details && <span className="text-slate-500 font-normal"> — {h.details}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Transition Dialog */}
            {showResolvePrompt ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-800">Resolve Ticket</div>
                <Input
                  label="Resolution Notes"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Explain the root cause and resolution applied..."
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowResolvePrompt(false)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleStatusChange('Resolved', resolveNotes)}
                  >
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            ) : (
              /* Footer Controls */
              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-150">
                <div className="flex gap-2">
                  {selectedTicket.status === 'Open' && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange('In Progress')}>
                      Mark In Progress
                    </Button>
                  )}
                  {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowResolvePrompt(true)}
                    >
                      Resolve Ticket
                    </Button>
                  )}
                  {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => handleStatusChange('Reopened', 'Ticket reopened for further investigation')}
                    >
                      Reopen Ticket
                    </Button>
                  )}
                  {selectedTicket.status === 'Resolved' && (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange('Closed', 'Ticket closed')}>
                      Close Ticket
                    </Button>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenancePage;