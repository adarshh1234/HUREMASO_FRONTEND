import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  HelpCircle,
  Ticket,
  Phone,
  Mail,
  Eye,
  X,
  Check,
  Send,
  User,
  Building2,
  CalendarDays,
  FileQuestion,
  Headphones,
  Laptop,
  KeyRound,
  FileText,
  Activity,
  Server,
  Zap,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  History,
  Lock,
  Loader2,
  MessageSquare,
  MessagesSquare,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import {
  supportService,
  ISupportTicket,
  ISupportDashboardMetrics,
  ISupportMaintenance,
  ISupportHelpArticle,
  ISupportAgent,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  ITicketHistoryEntry,
} from '../../services/supportService';

export type SupportSubView = 'general' | 'maintenance' | 'help' | 'tickets' | 'contact';

// ========================= HELPER BADGES =========================

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const cfg: Record<TicketStatus, { cls: string; icon: React.ReactNode }> = {
    Open: { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <AlertCircle className="h-3 w-3" /> },
    'In Progress': { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Clock className="h-3 w-3" /> },
    Pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
    Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    Closed: { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Check className="h-3 w-3" /> },
    Reopened: { cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <RotateCcw className="h-3 w-3" /> },
  };
  const { cls, icon } = cfg[status] || cfg.Open;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cls}`}>
      {icon}
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const cfg: Record<TicketPriority, string> = {
    Urgent: 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse',
    High: 'bg-rose-50 text-rose-600 border-rose-200',
    Medium: 'bg-amber-50 text-amber-600 border-amber-200',
    Low: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg[priority]}`}>
      {priority}
    </span>
  );
};

export const SupportPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine subview from pathname
  const currentSubView: SupportSubView = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/maintenance')) return 'maintenance';
    if (p.includes('/help')) return 'help';
    if (p.includes('/tickets')) return 'tickets';
    if (p.includes('/contact')) return 'contact';
    return 'general';
  }, [location.pathname]);

  // Data States
  const [metrics, setMetrics] = useState<ISupportDashboardMetrics | null>(null);
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<ISupportMaintenance[]>([]);
  const [helpArticles, setHelpArticles] = useState<ISupportHelpArticle[]>([]);
  const [agents, setAgents] = useState<ISupportAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('All');

  // Modals & Active Selections
  const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<ITicketHistoryEntry[]>([]);
  const [ticketModalTab, setTicketModalTab] = useState<'comments' | 'notes' | 'history'>('comments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportMaintModal, setShowReportMaintModal] = useState(false);
  const [showCreateKbModal, setShowCreateKbModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ISupportHelpArticle | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newInternalNoteText, setNewInternalNoteText] = useState('');
  const [isStaffComment, setIsStaffComment] = useState(false);
  const [resolutionPromptOpen, setResolutionPromptOpen] = useState(false);
  const [resolutionInput, setResolutionInput] = useState('');

  // Create Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('IT Support');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newRequesterName, setNewRequesterName] = useState('Sarah Joseph');
  const [newRequesterEmail, setNewRequesterEmail] = useState('sarah.j@company.com');
  const [newDepartment, setNewDepartment] = useState('Marketing');
  const [newDescription, setNewDescription] = useState('');
  const [selectedAssignedAgent, setSelectedAssignedAgent] = useState('Unassigned');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Maintenance Form State
  const [maintSystem, setMaintSystem] = useState('');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintCategory, setMaintCategory] = useState<ISupportMaintenance['category']>('Infrastructure');
  const [maintPriority, setMaintPriority] = useState<TicketPriority>('Medium');
  const [maintDesc, setMaintDesc] = useState('');

  // KB Article Form State
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState('IT & Access');
  const [kbQuestion, setKbQuestion] = useState('');
  const [kbAnswer, setKbAnswer] = useState('');
  const [kbTags, setKbTags] = useState('');

  // Fetch all live data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, tData, maintData, kbData, agData] = await Promise.all([
        supportService.getDashboardMetrics(),
        supportService.getTickets(),
        supportService.getMaintenance(),
        supportService.getHelpArticles(),
        supportService.getSupportAgents(),
      ]);
      setMetrics(m);
      setTickets(tData.tickets);
      setMaintenanceLogs(maintData.maintenance);
      setHelpArticles(kbData.articles);
      setAgents(agData);
    } catch (err) {
      console.error('Error loading support data:', err);
      toast.error('Failed to load support center data.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load ticket history when a ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      supportService.getTicketHistory(selectedTicket.id).then((history) => {
        setTicketHistory(history);
      });
    }
  }, [selectedTicket]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.requesterName.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.assignedAgent && t.assignedAgent.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, priorityFilter, search]);

  // Knowledge Base Articles Filtered
  const filteredArticles = useMemo(() => {
    return helpArticles.filter((art) => {
      if (kbCategoryFilter !== 'All' && art.category !== kbCategoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          art.title.toLowerCase().includes(q) ||
          art.question.toLowerCase().includes(q) ||
          art.answer.toLowerCase().includes(q) ||
          art.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [helpArticles, kbCategoryFilter, search]);

  // Auto-suggested KB articles during ticket creation
  const suggestedArticles = useMemo(() => {
    if (!newSubject.trim() || newSubject.trim().length < 3) return [];
    const keywords = newSubject.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return helpArticles.filter((art) => {
      const text = `${art.title} ${art.question} ${art.tags.join(' ')}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    }).slice(0, 3);
  }, [newSubject, helpArticles]);

  // Handle Ticket Creation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTicket) return;

    if (!newSubject.trim()) {
      toast.error('Please enter a ticket subject.');
      return;
    }
    if (!newDescription.trim() || newDescription.trim().length < 5) {
      toast.error('Please provide a detailed description (at least 5 characters).');
      return;
    }
    if (!newRequesterEmail.trim()) {
      toast.error('Requester email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRequesterEmail.trim())) {
      toast.error('Please enter a valid requester email address.');
      return;
    }

    try {
      setIsSubmittingTicket(true);
      const created = await supportService.createTicket({
        subject: newSubject.trim(),
        description: newDescription.trim(),
        requesterName: newRequesterName.trim() || 'Employee',
        requesterEmail: newRequesterEmail.trim(),
        department: newDepartment.trim() || 'General',
        category: newCategory,
        priority: newPriority,
        assignedAgent: selectedAssignedAgent !== 'Unassigned' ? selectedAssignedAgent : undefined,
      });

      setTickets((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setShowCreateModal(false);
      setNewSubject('');
      setNewDescription('');
      toast.success(`Ticket ${created.ticketNumber} created successfully! Support team notified.`);
      // Refresh metrics
      supportService.getDashboardMetrics().then(setMetrics);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicket) return;

    try {
      const updated = await supportService.addComment(
        selectedTicket.id,
        newCommentText.trim(),
        isStaffComment ? 'Support Staff' : selectedTicket.requesterName,
        isStaffComment ? 'support@company.com' : selectedTicket.requesterEmail,
        isStaffComment
      );
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
      setNewCommentText('');
      toast.success(isStaffComment ? 'Staff reply recorded' : 'Comment added to ticket');
      supportService.getTicketHistory(updated.id).then(setTicketHistory);
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment.');
    }
  };

  // Handle Add Internal Note
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNoteText.trim() || !selectedTicket) return;

    try {
      const updated = await supportService.addInternalNote(
        selectedTicket.id,
        newInternalNoteText.trim(),
        'Staff Specialist',
        'support-ops@company.com'
      );
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
      setNewInternalNoteText('');
      toast.success('Internal note saved.');
      supportService.getTicketHistory(updated.id).then(setTicketHistory);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save internal note.');
    }
  };

  // Handle Status Update
  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus, notes?: string) => {
    try {
      const updated = await supportService.updateTicketStatus(ticketId, newStatus, notes, notes);
      setTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(updated);
        supportService.getTicketHistory(ticketId).then(setTicketHistory);
      }
      toast.success(`Ticket status updated to ${newStatus}`);
      supportService.getDashboardMetrics().then(setMetrics);
    } catch (err: any) {
      toast.error(err.message || `Failed to update status to ${newStatus}`);
    }
  };

  // Handle Agent Assignment
  const handleAssignAgent = async (ticketId: string, agentName: string) => {
    try {
      const agent = agents.find((a) => a.name === agentName);
      const updated = await supportService.assignTicket(ticketId, agentName, agent?.email);
      setTickets(tickets.map((t) => (t.id === ticketId ? updated : t)));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(updated);
        supportService.getTicketHistory(ticketId).then(setTicketHistory);
      }
      toast.success(`Ticket assigned to ${agentName}`);
      supportService.getSupportAgents().then(setAgents);
      supportService.getDashboardMetrics().then(setMetrics);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign ticket.');
    }
  };

  // Handle Maintenance Issue Reporting
  const handleReportMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintSystem.trim() || !maintTitle.trim() || !maintDesc.trim()) {
      toast.error('Please fill in system name, issue title, and description.');
      return;
    }

    try {
      const created = await supportService.createMaintenance({
        system: maintSystem.trim(),
        title: maintTitle.trim(),
        description: maintDesc.trim(),
        category: maintCategory,
        priority: maintPriority,
        requestedBy: 'System Administrator',
        requestedByEmail: 'admin@company.com',
        status: 'Reported',
      });

      setMaintenanceLogs([created, ...maintenanceLogs]);
      setShowReportMaintModal(false);
      setMaintSystem('');
      setMaintTitle('');
      setMaintDesc('');
      toast.success('Maintenance issue reported and linked support ticket created!');
      // Reload tickets and metrics
      supportService.getTickets().then((res) => setTickets(res.tickets));
      supportService.getDashboardMetrics().then(setMetrics);
    } catch (err: any) {
      toast.error(err.message || 'Failed to report maintenance issue.');
    }
  };

  // Handle Knowledge Base Article Creation
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbQuestion.trim() || !kbAnswer.trim()) {
      toast.error('Title, question, and answer are required.');
      return;
    }

    try {
      const tagsArray = kbTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await supportService.createHelpArticle({
        title: kbTitle.trim(),
        category: kbCategory,
        question: kbQuestion.trim(),
        answer: kbAnswer.trim(),
        tags: tagsArray,
      });

      setHelpArticles([created, ...helpArticles]);
      setShowCreateKbModal(false);
      setKbTitle('');
      setKbQuestion('');
      setKbAnswer('');
      setKbTags('');
      toast.success('Knowledge Base article published!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish article.');
    }
  };

  // Handle KB Article Helpful Voting
  const handleVoteArticle = async (articleId: string, isHelpful: boolean) => {
    try {
      const updated = await supportService.voteHelpArticle(articleId, isHelpful);
      setHelpArticles(helpArticles.map((a) => (a.id === articleId ? updated : a)));
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(updated);
      }
      toast.success(isHelpful ? 'Marked as helpful. Thank you!' : 'Feedback submitted.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit vote.');
    }
  };

  // Computed metrics display values
  const openCount = metrics?.openTickets ?? tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const pendingCount = metrics?.pendingTickets ?? tickets.filter((t) => t.status === 'Pending').length;
  const resolvedCount = metrics?.resolvedTickets ?? tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
  const avgResponseTime = metrics ? `${metrics.averageResponseTimeHours} hrs` : '0 hrs';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER BANNER ================= */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#002f2f] via-[#004848] to-[#005e5e] p-6 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-radial from-white/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold text-teal-100 uppercase tracking-wide">
              <LifeBuoy className="h-3.5 w-3.5" />
              Support Center Dashboard
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Support & Help Center</h1>
            <p className="text-xs text-white/80 max-w-xl">
              Get technical assistance, report maintenance issues, track support tickets, and contact specialized support agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedAssignedAgent('Unassigned');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#004848] text-xs font-extrabold hover:bg-slate-50 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#004848]" />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => navigate('/support/general')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentSubView === 'general'
                ? 'bg-white text-[#004848] font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            Support Overview
          </button>
          <button
            onClick={() => navigate('/support/tickets')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentSubView === 'tickets'
                ? 'bg-white text-[#004848] font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => navigate('/support/maintenance')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentSubView === 'maintenance'
                ? 'bg-white text-[#004848] font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            System Maintenance ({maintenanceLogs.length})
          </button>
          <button
            onClick={() => navigate('/support/help')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentSubView === 'help'
                ? 'bg-white text-[#004848] font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Knowledge Base ({helpArticles.length})
          </button>
          <button
            onClick={() => navigate('/support/contact')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              currentSubView === 'contact'
                ? 'bg-white text-[#004848] font-bold shadow-xs'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            Contact Agents ({agents.length})
          </button>
        </div>
      </div>

      {/* ================= STAT SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Open Tickets */}
        <div
          onClick={() => {
            setStatusFilter('Open');
            if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets');
          }}
          className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              In Queue
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{openCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Open Tickets</p>
            <span className="text-[10px] text-slate-400">Actively being handled</span>
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => {
            setStatusFilter('Pending');
            if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets');
          }}
          className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Waiting
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{pendingCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Pending Tickets</p>
            <span className="text-[10px] text-slate-400">Awaiting user response</span>
          </div>
        </div>

        {/* Resolved */}
        <div
          onClick={() => {
            setStatusFilter('Resolved');
            if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets');
          }}
          className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Completed
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{resolvedCount}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Resolved Tickets</p>
            <span className="text-[10px] text-slate-400">Successfully closed</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              SLA {metrics?.slaAdherenceRate ?? 100}%
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-extrabold text-slate-800">{avgResponseTime}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">Avg Response Time</p>
            <span className="text-[10px] text-slate-400">Target SLA &lt; 2.0 hrs</span>
          </div>
        </div>
      </div>

      {/* ================= QUICK ACTIONS BAR ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/support/help')}
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[#004848] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#004848]">Help & FAQs</h4>
            <p className="text-[10px] text-slate-400">Browse solution guides</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/support/maintenance')}
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Maintenance Status</h4>
            <p className="text-[10px] text-slate-400">System health & schedules</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/support/tickets')}
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Ticket Backlog</h4>
            <p className="text-[10px] text-slate-400">View all support items</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/support/contact')}
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">Contact Agents</h4>
            <p className="text-[10px] text-slate-400">Direct technical helpdesk</p>
          </div>
        </button>
      </div>

      {/* ================= CONDITIONAL VIEWS ================= */}

      {/* 1. GENERAL / TICKETS VIEW */}
      {(currentSubView === 'general' || currentSubView === 'tickets') && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets by ID, subject, category, or requester..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#004848] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004848]"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004848]"
              >
                <option value="All">All Categories</option>
                <option value="IT Support">IT Support</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Access / Permissions">Access / Permissions</option>
                <option value="Facilities">Facilities</option>
                <option value="HR Support">HR Support</option>
                <option value="Other">Other</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-[#004848]"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {(statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All' || search) && (
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setCategoryFilter('All');
                    setPriorityFilter('All');
                    setSearch('');
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {currentSubView === 'tickets' ? 'All Support Tickets' : 'Recent Support Tickets'}
                </h3>
                <p className="text-[10px] text-slate-400">Track and respond to live employee requests</p>
              </div>
              <span className="text-[11px] font-bold text-[#004848] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                {filteredTickets.length} tickets matching
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <LifeBuoy className="h-8 w-8 mx-auto text-slate-300" />
                          <p className="font-bold text-slate-700">No support tickets found</p>
                          <p className="text-[11px] text-slate-400">
                            {tickets.length === 0
                              ? 'The support queue is clean. Create a ticket using the button above.'
                              : 'Try adjusting your active search and filter criteria.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#004848]">{ticket.ticketNumber}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {ticket.requesterName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight group-hover:text-[#004848] transition-colors">
                                {ticket.requesterName}
                              </p>
                              <p className="text-[10px] text-slate-400">{ticket.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate">{ticket.subject}</p>
                          <p className="text-[10px] text-slate-400 truncate">{ticket.description}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{ticket.category}</td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {ticket.assignedAgent || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setSelectedTicket(ticket)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[#004848] text-[11px] font-bold hover:bg-[#004848] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAINTENANCE VIEW */}
      {currentSubView === 'maintenance' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-900">Infrastructure Health Status</h3>
                <p className="text-[11px] text-emerald-700">
                  Real-time telemetry and scheduled maintenance windows across corporate clusters.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowReportMaintModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Report Maintenance Issue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceLogs.length === 0 ? (
              <div className="col-span-2 p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                <Server className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No active maintenance records</p>
                <p className="text-xs text-slate-400">All systems are fully operational with no pending incidents.</p>
              </div>
            ) : (
              maintenanceLogs.map((sys) => (
                <div key={sys.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-[#004848]" />
                      <h4 className="text-xs font-bold text-slate-800">{sys.system}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        sys.status === 'Operational' || sys.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : sys.status === 'In Progress'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {sys.status}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-700">{sys.title}</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{sys.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400">Target Uptime</span>
                      <p className="font-bold text-slate-800">{sys.targetUptime || '99.9%'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Reported By</span>
                      <p className="font-bold text-slate-800">{sys.requestedBy}</p>
                    </div>
                  </div>

                  {sys.scheduledStart && (
                    <div className="text-[11px] text-slate-500">
                      <strong className="text-slate-700">Scheduled Window:</strong> {sys.scheduledStart}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. HELP & KNOWLEDGE BASE VIEW */}
      {currentSubView === 'help' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Frequently Asked Support Solutions</h2>
              <p className="text-xs text-slate-500">
                Browse solutions for MFA reset, hardware refresh, software provisioning, and SLAs.
              </p>
            </div>
            <button
              onClick={() => setShowCreateKbModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#004848] text-white text-xs font-bold hover:bg-[#003636] transition-colors cursor-pointer self-start flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Contribute Article</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {['All', 'IT & Access', 'Hardware & Workstation', 'Software', 'General Support'].map((cat) => (
              <button
                key={cat}
                onClick={() => setKbCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  kbCategoryFilter === cat
                    ? 'bg-[#004848] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.length === 0 ? (
              <div className="col-span-2 p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                <FileQuestion className="h-8 w-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No knowledge base articles found</p>
                <p className="text-xs text-slate-400">Click &apos;Contribute Article&apos; above to publish documentation.</p>
              </div>
            ) : (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      {art.category}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{art.viewCount} views</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <ThumbsUp className="h-2.5 w-2.5" /> {art.helpfulVotes}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#004848] transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{art.answer}</p>
                  {art.tags && art.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {art.tags.map((t, tidx) => (
                        <span key={tidx} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. CONTACT SUPPORT AGENTS VIEW */}
      {currentSubView === 'contact' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {agent.avatar ? (
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-[#004848] font-bold text-sm flex items-center justify-center">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{agent.name}</h4>
                      <p className="text-[11px] text-slate-500">{agent.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        agent.status === 'Online'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : agent.status === 'Busy'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {agent.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {agent.assignedTicketCount} active tickets
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-[11px]">{agent.email}</span>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                  {agent.specialties && (
                    <div className="pt-1 text-[11px] text-slate-500">
                      <strong className="text-slate-700">Specialties:</strong> {agent.specialties}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedAssignedAgent(agent.name);
                    setNewSubject(`Direct ticket for ${agent.name} - `);
                    setShowCreateModal(true);
                  }}
                  className="w-full py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#004848] text-xs font-bold hover:bg-[#004848] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Ticket to {agent.name.split(' ')[0]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: TICKET DETAILS ================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#002f2f] to-[#004848] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedTicket.ticketNumber}: {selectedTicket.subject}
                  </h3>
                  <p className="text-[10px] text-white/70">
                    Submitted by {selectedTicket.requesterName} ({selectedTicket.department}) • {selectedTicket.requesterEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Meta details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Category</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTicket.category}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Priority</span>
                  <div className="mt-0.5">
                    <PriorityBadge priority={selectedTicket.priority} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned Agent</span>
                  <select
                    value={selectedTicket.assignedAgent || 'Unassigned'}
                    onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                    className="mt-0.5 w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-hidden"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs flex-wrap gap-2">
                <span className="font-bold text-slate-700">Update Ticket Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Reopened'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        if (st === 'Resolved') {
                          setResolutionPromptOpen(true);
                        } else {
                          handleStatusChange(selectedTicket.id, st);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? 'bg-[#004848] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution prompt if resolving */}
              {resolutionPromptOpen && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-emerald-900 block">
                    Provide Resolution Details / Closure Notes:
                  </label>
                  <input
                    type="text"
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="e.g. Fixed permissions in Okta console and sent verification link."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolutionPromptOpen(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedTicket.id, 'Resolved', resolutionInput);
                        setResolutionPromptOpen(false);
                        setResolutionInput('');
                      }}
                      className="px-3 py-1 text-xs font-bold bg-emerald-700 text-white rounded hover:bg-emerald-800"
                    >
                      Confirm Resolution
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <span className="text-xs font-bold text-slate-700">Problem Description</span>
                <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Resolution details if exists */}
              {selectedTicket.resolutionDetails && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Resolution Details
                  </span>
                  <p className="text-emerald-800">{selectedTicket.resolutionDetails}</p>
                </div>
              )}

              {/* Modal Tabs: Comments / Internal Notes / History */}
              <div className="pt-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
                  <button
                    onClick={() => setTicketModalTab('comments')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      ticketModalTab === 'comments'
                        ? 'bg-teal-50 text-[#004848] border border-teal-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments ({selectedTicket.comments?.length || 0})
                  </button>
                  <button
                    onClick={() => setTicketModalTab('notes')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      ticketModalTab === 'notes'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Staff Notes ({selectedTicket.internalNotes?.length || 0})
                  </button>
                  <button
                    onClick={() => setTicketModalTab('history')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      ticketModalTab === 'history'
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    Timeline ({ticketHistory.length})
                  </button>
                </div>

                {/* Tab: Comments */}
                {ticketModalTab === 'comments' && (
                  <div className="pt-3 space-y-3">
                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                      {(selectedTicket.comments || []).map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-xs ${
                            c.isStaff ? 'bg-teal-50/50 border-teal-100 ml-4' : 'bg-white border-slate-100 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900">
                              {c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span>
                            </span>
                            <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{c.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isStaffComment}
                            onChange={(e) => setIsStaffComment(e.target.checked)}
                            className="rounded text-[#004848]"
                          />
                          <span>Post as Support Staff Reply</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Type a response to this ticket..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#004848] text-white text-xs font-bold hover:bg-[#003636] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tab: Internal Staff Notes */}
                {ticketModalTab === 'notes' && (
                  <div className="pt-3 space-y-3">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(selectedTicket.internalNotes || []).length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No internal staff notes yet.</p>
                      ) : (
                        (selectedTicket.internalNotes || []).map((n) => (
                          <div key={n.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-amber-900">{n.author}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-700">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddInternalNote} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newInternalNoteText}
                        onChange={(e) => setNewInternalNoteText(e.target.value)}
                        placeholder="Add private staff note (hidden from employee)..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-600"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors cursor-pointer"
                      >
                        Save Note
                      </button>
                    </form>
                  </div>
                )}

                {/* Tab: History / Timeline */}
                {ticketModalTab === 'history' && (
                  <div className="pt-3 max-h-48 overflow-y-auto space-y-2">
                    {ticketHistory.map((h) => (
                      <div key={h.id} className="flex items-start gap-2.5 text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-[#004848] mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{h.action}</span>
                            <span className="text-[10px] text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{h.details}</p>
                          <span className="text-[10px] text-slate-400">By {h.performedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE TICKET ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#002f2f] to-[#004848] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Create New Support Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ticket Subject / Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Cannot access staging VPN or Okta SSO error"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              {/* Instant KB Article Suggestions */}
              {suggestedArticles.length > 0 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#004848]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Instant Solutions Found in Knowledge Base:</span>
                  </div>
                  {suggestedArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="text-xs p-2 bg-white rounded-lg border border-teal-100 hover:border-teal-400 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-800">{art.title}</span>
                      <span className="text-[10px] text-teal-700 font-semibold">View Guide →</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    <option value="IT Support">IT Support</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Access / Permissions">Access / Permissions</option>
                    <option value="Facilities">Facilities</option>
                    <option value="HR Support">HR Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requester Name</label>
                  <input
                    type="text"
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requester Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newRequesterEmail}
                    onChange={(e) => setNewRequesterEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign To Agent</label>
                  <select
                    value={selectedAssignedAgent}
                    onChange={(e) => setSelectedAssignedAgent(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-[#004848]"
                  >
                    <option value="Unassigned">Auto-Triage (Unassigned)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} ({a.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Issue Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide steps to reproduce, error codes, and urgency notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmittingTicket}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-[#004848] hover:bg-[#003636] shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSubmittingTicket && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORT MAINTENANCE ISSUE ================= */}
      {showReportMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white">Report System Maintenance Issue</h3>
              </div>
              <button onClick={() => setShowReportMaintModal(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReportMaintenance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Infrastructure / System <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={maintSystem}
                  onChange={(e) => setMaintSystem(e.target.value)}
                  placeholder="e.g. Primary Cloud Infrastructure, SSO Okta, Gateway API"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={maintCategory}
                    onChange={(e) => setMaintCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Database">Database</option>
                    <option value="Network">Network</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Facilities">Facilities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={maintTitle}
                  onChange={(e) => setMaintTitle(e.target.value)}
                  placeholder="e.g. Latency spike in US-East DB read replica"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Diagnostic Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Describe error patterns, impacted pods/services, and urgency..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportMaintModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-emerald-700 hover:bg-emerald-800"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE KB ARTICLE ================= */}
      {showCreateKbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#004848] text-white">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white">Publish Knowledge Base Guide</h3>
              </div>
              <button onClick={() => setShowCreateKbModal(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  placeholder="e.g. Cisco AnyConnect VPN Setup on macOS"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="IT & Access">IT & Access</option>
                  <option value="Hardware & Workstation">Hardware & Workstation</option>
                  <option value="Software">Software</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  User Question / Problem Statement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kbQuestion}
                  onChange={(e) => setKbQuestion(e.target.value)}
                  placeholder="How do I configure my remote VPN client?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Solution / Answer <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={kbAnswer}
                  onChange={(e) => setKbAnswer(e.target.value)}
                  placeholder="Step-by-step solution instructions..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={kbTags}
                  onChange={(e) => setKbTags(e.target.value)}
                  placeholder="vpn, macos, remote, cisco"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateKbModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-[#004848] hover:bg-[#003636]"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW KB ARTICLE ================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#004848] text-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider">
                  {selectedArticle.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedArticle.title}</h3>
              </div>
              <button onClick={() => setSelectedArticle(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs font-bold text-[#004848]">
                {selectedArticle.question}
              </div>

              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedArticle.answer}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Was this guide helpful?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVoteArticle(selectedArticle.id, true)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsUp className="h-3 w-3" /> Yes ({selectedArticle.helpfulVotes})
                  </button>
                  <button
                    onClick={() => handleVoteArticle(selectedArticle.id, false)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-rose-50 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ThumbsDown className="h-3 w-3" /> No ({selectedArticle.unhelpfulVotes || 0})
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
