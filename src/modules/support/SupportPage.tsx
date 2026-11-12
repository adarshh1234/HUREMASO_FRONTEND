import React, { useState, useMemo } from 'react';
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
  ChevronDown,
  Check,
  Send,
  User,
  Building2,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Filter,
  CheckCircle,
  FileQuestion,
  Headphones,
  Laptop,
  KeyRound,
  FileText,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// ========================= TYPES =========================

export type SupportSubView = 'general' | 'maintenance' | 'help' | 'tickets' | 'contact';

export interface ISupportTicket {
  id: string;
  ticketNumber: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  subject: string;
  category: 'IT Support' | 'Hardware' | 'Software' | 'Access / Permissions' | 'HR Support' | 'Facilities' | 'Other';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  status: 'Open' | 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  assignedAgent?: string;
  createdAt: string;
  lastUpdated: string;
  description: string;
  responseCount?: number;
  comments?: Array<{
    id: string;
    author: string;
    role: string;
    text: string;
    timestamp: string;
    isStaff?: boolean;
  }>;
}

// ========================= MOCK DATA =========================

const INITIAL_TICKETS: ISupportTicket[] = [
  {
    id: 'TCK-1001',
    ticketNumber: '#TCK-1001',
    requesterName: 'Sarah Joseph',
    requesterEmail: 'sarah.j@company.com',
    department: 'Marketing',
    subject: 'Cannot access Google Workspace Admin Console',
    category: 'Access / Permissions',
    priority: 'High',
    status: 'Open',
    assignedAgent: 'David Vance (IT Ops)',
    createdAt: '2026-07-20T10:30:00Z',
    lastUpdated: '15 mins ago',
    description: 'Received error 403 when trying to access user provision delegation in the admin portal.',
    responseCount: 2,
    comments: [
      { id: '1', author: 'Sarah Joseph', role: 'Requester', text: 'Attached screenshot of the error prompt.', timestamp: '2026-07-20 10:32 AM' },
      { id: '2', author: 'David Vance', role: 'Support Agent', text: 'Reviewing your OAuth scopes and updating security group permissions.', timestamp: '2026-07-20 10:45 AM', isStaff: true },
    ],
  },
  {
    id: 'TCK-1002',
    ticketNumber: '#TCK-1002',
    requesterName: 'Michael Torres',
    requesterEmail: 'michael.t@company.com',
    department: 'Engineering',
    subject: 'Request for Docker Enterprise license key renewal',
    category: 'Software',
    priority: 'Medium',
    status: 'In Progress',
    assignedAgent: 'Alex Morgan (DevOps)',
    createdAt: '2026-07-21T09:15:00Z',
    lastUpdated: '1 hour ago',
    description: 'Development cluster license expires in 5 days. Need procurement approval & key update.',
    responseCount: 3,
    comments: [
      { id: '1', author: 'Michael Torres', role: 'Requester', text: 'Invoice purchase PO-8924 approved by Engineering VP.', timestamp: '2026-07-21 09:20 AM' },
      { id: '2', author: 'Alex Morgan', role: 'Support Agent', text: 'Applied new key to staging cluster. Verifying production pipeline.', timestamp: '2026-07-21 11:30 AM', isStaff: true },
    ],
  },
  {
    id: 'TCK-1003',
    ticketNumber: '#TCK-1003',
    requesterName: 'Priya Nair',
    requesterEmail: 'priya.n@company.com',
    department: 'Finance',
    subject: 'Secondary external 4K monitor flickering intermittently',
    category: 'Hardware',
    priority: 'Low',
    status: 'Pending',
    assignedAgent: 'Carlos Mendez (IT Helpdesk)',
    createdAt: '2026-07-22T14:00:00Z',
    lastUpdated: '3 hours ago',
    description: 'Thunderbolt dock cable connection feels loose; monitor goes blank during video conferences.',
    responseCount: 1,
    comments: [
      { id: '1', author: 'Carlos Mendez', role: 'Support Agent', text: 'Replacement USB-C/Thunderbolt 4 cable dispatched to your desk.', timestamp: '2026-07-22 02:30 PM', isStaff: true },
    ],
  },
  {
    id: 'TCK-1004',
    ticketNumber: '#TCK-1004',
    requesterName: 'Aisha Patel',
    requesterEmail: 'aisha.p@company.com',
    department: 'Operations',
    subject: 'Main board room AV system audio feedback loop',
    category: 'Facilities',
    priority: 'Urgent',
    status: 'Open',
    assignedAgent: 'Facilities Tech Team',
    createdAt: '2026-07-23T08:45:00Z',
    lastUpdated: '25 mins ago',
    description: 'Executive board meeting scheduled for 2:00 PM today. Microphones produce feedback echo.',
    responseCount: 1,
    comments: [
      { id: '1', author: 'Aisha Patel', role: 'Requester', text: 'Urgently needs AV technician on site in Room 4B.', timestamp: '2026-07-23 08:50 AM' },
    ],
  },
  {
    id: 'TCK-1005',
    ticketNumber: '#TCK-1005',
    requesterName: 'Ethan Brooks',
    requesterEmail: 'ethan.b@company.com',
    department: 'Engineering',
    subject: 'VPN certificate expired for remote staging access',
    category: 'IT Support',
    priority: 'High',
    status: 'Resolved',
    assignedAgent: 'David Vance (IT Ops)',
    createdAt: '2026-07-19T11:00:00Z',
    lastUpdated: 'Yesterday',
    description: 'Cannot connect to OpenVPN gateway from remote workstation due to TLS certificate expiration.',
    responseCount: 4,
    comments: [
      { id: '1', author: 'David Vance', role: 'Support Agent', text: 'Generated renewed client certificate bundle and emailed encrypted zip.', timestamp: '2026-07-19 11:45 AM', isStaff: true },
      { id: '2', author: 'Ethan Brooks', role: 'Requester', text: 'Confirmed VPN connection restored. Thank you!', timestamp: '2026-07-19 12:15 PM' },
    ],
  },
  {
    id: 'TCK-1006',
    ticketNumber: '#TCK-1006',
    requesterName: 'Nadia Kim',
    requesterEmail: 'nadia.k@company.com',
    department: 'Design',
    subject: 'Figma Organization seat license allocation',
    category: 'Software',
    priority: 'Medium',
    status: 'Resolved',
    assignedAgent: 'Alex Morgan (DevOps)',
    createdAt: '2026-07-18T16:20:00Z',
    lastUpdated: '2 days ago',
    description: 'New design squad member needs Figma Enterprise editor license invitation.',
    responseCount: 2,
  },
  {
    id: 'TCK-1007',
    ticketNumber: '#TCK-1007',
    requesterName: 'Lucas Rivera',
    requesterEmail: 'lucas.r@company.com',
    department: 'Marketing',
    subject: 'Corporate email alias setup for APAC Campaign',
    category: 'IT Support',
    priority: 'Low',
    status: 'Closed',
    assignedAgent: 'Carlos Mendez (IT Helpdesk)',
    createdAt: '2026-07-16T13:10:00Z',
    lastUpdated: '3 days ago',
    description: 'Setup apac-leads@company.com routing to 4 marketing managers.',
    responseCount: 3,
  },
];

const FAQS = [
  {
    category: 'IT & Access',
    icon: KeyRound,
    question: 'How do I reset my multi-factor authentication (MFA) device?',
    answer: 'Navigate to your Employee Profile > Security Settings, or submit an Access/Permissions ticket with your employee verification token.',
  },
  {
    category: 'Hardware & Workstation',
    icon: Laptop,
    question: 'What is the standard policy for remote workstation hardware refresh?',
    answer: 'Standard laptop hardware refresh is supported every 24 months. Ergonomic peripherals (monitors, keyboards, chairs) are eligible under the annual wellness allowance.',
  },
  {
    category: 'Software Licenses',
    icon: FileText,
    question: 'How to request specialized engineering or design software licenses?',
    answer: 'Submit a Software Ticket with manager PO sign-off. Approved requests are provisioned through Okta Single Sign-On within 2-4 business hours.',
  },
  {
    category: 'System Downtime & SLA',
    icon: Activity,
    question: 'What are the response time SLAs for High and Urgent tickets?',
    answer: 'Urgent priority tickets are triaged within 15 minutes 24/7. High priority tickets have a maximum initial response window of 1 hour during business hours.',
  },
];

const MAINTENANCE_LOGS = [
  {
    system: 'Primary Cloud Infrastructure (US-East)',
    status: 'Operational',
    uptime: '99.98%',
    lastMaintenance: 'July 14, 2026',
    nextWindow: 'August 05, 2026 (02:00 UTC - 04:00 UTC)',
    type: 'Scheduled Database Index Rebuild',
  },
  {
    system: 'SSO & Identity Provider (Okta / SAML)',
    status: 'Operational',
    uptime: '100%',
    lastMaintenance: 'July 01, 2026',
    nextWindow: 'July 30, 2026 (01:00 UTC)',
    type: 'Root Certificate Authority Rotation',
  },
  {
    system: 'Employee Mobile App Gateway API',
    status: 'Operational',
    uptime: '99.95%',
    lastMaintenance: 'July 18, 2026',
    nextWindow: 'August 12, 2026 (03:00 UTC)',
    type: 'Version 2.5 API Gateway Upgrade',
  },
  {
    system: 'Payroll & Compensation Settlement Service',
    status: 'Maintenance Scheduled',
    uptime: '99.90%',
    lastMaintenance: 'June 28, 2026',
    nextWindow: 'July 25, 2026 (22:00 UTC - 23:30 UTC)',
    type: 'Tax Withholding Engine Quarterly Patch',
  },
];

const SUPPORT_AGENTS = [
  {
    name: 'David Vance',
    role: 'Lead IT Operations & Cloud Security',
    email: 'david.v@company.com',
    phone: '+1 (555) 019-4421',
    status: 'Online',
    specialties: 'Access Control, VPN, Okta SSO, Cloud IAM',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    name: 'Alex Morgan',
    role: 'DevOps & Software Licensing Specialist',
    email: 'alex.m@company.com',
    phone: '+1 (555) 019-4422',
    status: 'Online',
    specialties: 'Docker, JetBrains, Figma, GitHub Enterprise',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    name: 'Carlos Mendez',
    role: 'Workstation Hardware & Desktop Support',
    email: 'carlos.m@company.com',
    phone: '+1 (555) 019-4423',
    status: 'In Meeting',
    specialties: 'Monitors, Laptops, Peripherals, AV Conference',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
  {
    name: 'Emma Watson',
    role: 'HR Support & Benefits Operations',
    email: 'emma.w@company.com',
    phone: '+1 (555) 019-4424',
    status: 'Online',
    specialties: 'Leave Requests, Letter Requests, Policy Guidance',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  },
];

// ========================= HELPER BADGES =========================

const StatusBadge: React.FC<{ status: ISupportTicket['status'] }> = ({ status }) => {
  const cfg: Record<ISupportTicket['status'], { cls: string; icon: React.ReactNode }> = {
    Open: { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <AlertCircle className="h-3 w-3" /> },
    'In Progress': { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Clock className="h-3 w-3" /> },
    Pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
    Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
    Closed: { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: <Check className="h-3 w-3" /> },
  };
  const { cls, icon } = cfg[status] || cfg.Open;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cls}`}>
      {icon}
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: ISupportTicket['priority'] }> = ({ priority }) => {
  const cfg: Record<ISupportTicket['priority'], string> = {
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

// ========================= MAIN COMPONENT =========================

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

  const [tickets, setTickets] = useState<ISupportTicket[]>(INITIAL_TICKETS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  const [selectedTicket, setSelectedTicket] = useState<ISupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  // Create Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<ISupportTicket['category']>('IT Support');
  const [newPriority, setNewPriority] = useState<ISupportTicket['priority']>('Medium');
  const [newRequesterName, setNewRequesterName] = useState('Sarah Joseph');
  const [newDepartment, setNewDepartment] = useState('Marketing');
  const [newDescription, setNewDescription] = useState('');

  // Metrics
  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const pendingCount = tickets.filter((t) => t.status === 'Pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
  const avgResponseTime = '1.4 hrs';

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
          t.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, priorityFilter, search]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error('Please enter a subject and description for your ticket.');
      return;
    }
    const nextNum = `#TCK-${1000 + tickets.length + 1}`;
    const newTicket: ISupportTicket = {
      id: `TCK-${1000 + tickets.length + 1}`,
      ticketNumber: nextNum,
      requesterName: newRequesterName,
      requesterEmail: 'sarah.j@company.com',
      department: newDepartment,
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      assignedAgent: 'David Vance (IT Ops)',
      createdAt: new Date().toISOString(),
      lastUpdated: 'Just now',
      description: newDescription,
      responseCount: 1,
      comments: [
        {
          id: '1',
          author: newRequesterName,
          role: 'Requester',
          text: newDescription,
          timestamp: 'Just now',
        },
      ],
    };
    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setNewSubject('');
    setNewDescription('');
    toast.success(`Ticket ${nextNum} opened successfully! Support team has been notified.`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicket) return;

    const newComment = {
      id: String(Date.now()),
      author: 'Sarah Joseph',
      role: 'Staff Member',
      text: newCommentText,
      timestamp: 'Just now',
    };

    const updated = {
      ...selectedTicket,
      comments: [...(selectedTicket.comments || []), newComment],
      lastUpdated: 'Just now',
    };

    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setNewCommentText('');
    toast.success('Comment added to ticket.');
  };

  const handleStatusChange = (ticketId: string, newStatus: ISupportTicket['status']) => {
    const updatedTickets = tickets.map((t) => {
      if (t.id === ticketId) {
        return { ...t, status: newStatus, lastUpdated: 'Just now' };
      }
      return t;
    });
    setTickets(updatedTickets);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus, lastUpdated: 'Just now' });
    }
    toast.success(`Ticket status updated to ${newStatus}`);
  };

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
              onClick={() => setShowCreateModal(true)}
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
            System Maintenance
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
            Knowledge Base
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
            Contact Agents
          </button>
        </div>
      </div>

      {/* ================= STAT SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Open Tickets */}
        <div
          onClick={() => { setStatusFilter('Open'); if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets'); }}
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
          onClick={() => { setStatusFilter('Pending'); if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets'); }}
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
          onClick={() => { setStatusFilter('Resolved'); if (currentSubView !== 'general' && currentSubView !== 'tickets') navigate('/support/tickets'); }}
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
              SLA Met
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
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
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
                  onClick={() => { setStatusFilter('All'); setCategoryFilter('All'); setPriorityFilter('All'); setSearch(''); }}
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
                    <th className="py-3 px-4">Last Updated</th>
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
                          <p className="text-[11px] text-slate-400">Try adjusting your active search and filter criteria.</p>
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
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{ticket.lastUpdated}</td>
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-900">All Systems Operational</h3>
                <p className="text-[11px] text-emerald-700">No active unplanned outages across HRMS cloud clusters.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Report Maintenance Issue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MAINTENANCE_LOGS.map((sys, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-[#004848]" />
                    <h4 className="text-xs font-bold text-slate-800">{sys.system}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      sys.status === 'Operational'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {sys.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400">Target Uptime</span>
                    <p className="font-bold text-slate-800">{sys.uptime}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Patch</span>
                    <p className="font-bold text-slate-800">{sys.lastMaintenance}</p>
                  </div>
                </div>

                <div className="text-[11px] space-y-1">
                  <p className="text-slate-500">
                    <strong className="text-slate-700">Upcoming Window:</strong> {sys.nextWindow}
                  </p>
                  <p className="text-slate-400 text-[10px]">{sys.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HELP & KNOWLEDGE BASE VIEW */}
      {currentSubView === 'help' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2 py-4">
            <h2 className="text-base md:text-lg font-extrabold text-slate-800">Frequently Asked Support Questions</h2>
            <p className="text-xs text-slate-500">
              Find quick solutions for authentication, equipment allowances, software provisioning, and SLAs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQS.map((faq, idx) => {
              const Icon = faq.icon;
              return (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[#004848]">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">{faq.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{faq.question}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CONTACT SUPPORT AGENTS VIEW */}
      {currentSubView === 'contact' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPORT_AGENTS.map((agent, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{agent.name}</h4>
                      <p className="text-[11px] text-slate-500">{agent.role}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      agent.status === 'Online'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-[11px]">{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{agent.phone}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500">
                    <strong className="text-slate-700">Specialties:</strong> {agent.specialties}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setNewSubject(`Direct ticket for ${agent.name} - `);
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
                  <h3 className="text-sm font-bold text-white">{selectedTicket.ticketNumber}: {selectedTicket.subject}</h3>
                  <p className="text-[10px] text-white/70">Submitted by {selectedTicket.requesterName} ({selectedTicket.department})</p>
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
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTicket.assignedAgent || 'Unassigned'}</p>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              <div className="flex items-center justify-between p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs">
                <span className="font-bold text-slate-700">Update Ticket Status:</span>
                <div className="flex items-center gap-1.5">
                  {(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedTicket.id, st)}
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

              {/* Description */}
              <div>
                <span className="text-xs font-bold text-slate-700">Initial Problem Description</span>
                <p className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Thread & Comments */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#004848]" />
                  Activity & Communication History
                </span>

                <div className="space-y-2.5">
                  {(selectedTicket.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border text-xs ${
                        c.isStaff
                          ? 'bg-teal-50/50 border-teal-100 ml-4'
                          : 'bg-white border-slate-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{c.author} <span className="text-[10px] text-slate-400 font-normal">({c.role})</span></span>
                        <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type a response or internal support note..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#004848] text-white text-xs font-bold hover:bg-[#003636] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </form>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ISupportTicket['category'])}
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
                    onChange={(e) => setNewPriority(e.target.value as ISupportTicket['priority'])}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004848]"
                  />
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-[#004848] hover:bg-[#003636] shadow-sm transition-all cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
