import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  User,
  Plus,
  RefreshCw,
  X,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  Send,
  Building,
  Tag,
  Clock
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ISupportEvent } from '../../types/events';

export const SupportEventsPage: React.FC = () => {
  const toast = useToast();
  const [events, setEvents] = useState<(ISupportEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string>('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Reply / Conversation Drawer State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<(ISupportEvent & { id: string }) | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('HR Support Lead');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'General' as ISupportEvent['category'],
    priority: 'Medium' as ISupportEvent['priority'],
    author: '',
    requesterEmail: '',
    department: 'General',
    assignedAgent: 'Unassigned',
    description: '',
  });

  const fetchSupportEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await eventService.getSupportEvents();
      setEvents(items);
      if (items.length > 0 && !activeCard) {
        setActiveCard(items[0].id);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load support events');
    } finally {
      setIsLoading(false);
    }
  }, [activeCard, toast]);

  useEffect(() => {
    fetchSupportEvents();
  }, [fetchSupportEvents]);

  const handleUpdateStatus = async (id: string, newStatus: ISupportEvent['status']) => {
    try {
      const updated = await eventService.updateSupportEvent(id, { status: newStatus });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (selectedTicket?.id === id) {
        setSelectedTicket(updated);
      }
      toast.success(`Support ticket status marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update support status');
    }
  };

  const handleUpdatePriority = async (id: string, newPriority: ISupportEvent['priority']) => {
    try {
      const updated = await eventService.updateSupportEvent(id, { priority: newPriority });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (selectedTicket?.id === id) {
        setSelectedTicket(updated);
      }
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update priority');
    }
  };

  const handleAssignAgent = async (id: string, assignedAgent: string) => {
    try {
      const updated = await eventService.updateSupportEvent(id, { assignedAgent });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (selectedTicket?.id === id) {
        setSelectedTicket(updated);
      }
      toast.success(`Ticket assigned to ${assignedAgent}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign agent');
    }
  };

  const handleDeleteTicket = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete ticket "${title}"?`)) {
      try {
        await eventService.deleteSupportEvent(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        if (selectedTicket?.id === id) {
          setSelectedTicket(null);
          setShowReplyModal(false);
        }
        toast.success('Ticket deleted successfully');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete ticket');
      }
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) {
      toast.error('Please enter reply text');
      return;
    }
    try {
      const updated = await eventService.updateSupportEvent(selectedTicket.id, {
        reply: {
          author: replyAuthor,
          text: replyText.trim(),
        },
      });
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSelectedTicket(updated);
      setReplyText('');
      toast.success('Reply added to ticket history');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post reply');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      toast.error('Please enter subject title and detailed description');
      return;
    }
    if (!ticketForm.author.trim() || !ticketForm.requesterEmail.trim()) {
      toast.error('Please enter requester name and valid email');
      return;
    }

    try {
      const created = await eventService.createSupportEvent({
        title: ticketForm.title.trim(),
        description: ticketForm.description.trim(),
        author: ticketForm.author.trim(),
        requesterEmail: ticketForm.requesterEmail.trim(),
        department: ticketForm.department || 'General',
        category: ticketForm.category || 'General',
        priority: ticketForm.priority || 'Medium',
        assignedAgent: ticketForm.assignedAgent || 'Unassigned',
        status: 'Open',
        timeAgo: 'Just now',
        replaysCount: 0,
        replies: [],
      });
      setEvents((prev) => [created, ...prev]);
      setActiveCard(created.id);
      setShowCreateModal(false);
      setTicketForm({
        title: '',
        category: 'General',
        priority: 'Medium',
        author: '',
        requesterEmail: '',
        department: 'General',
        assignedAgent: 'Unassigned',
        description: '',
      });
      toast.success('Support ticket logged successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create support ticket');
    }
  };

  // Filtered tickets
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter !== 'All' && ev.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && ev.priority !== priorityFilter) return false;
      if (categoryFilter !== 'All' && ev.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = ev.description.toLowerCase().includes(q);
        const matchAuthor = ev.author.toLowerCase().includes(q);
        const matchEmail = ev.requesterEmail?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchEmail) return false;
      }
      return true;
    });
  }, [events, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Support Events</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track, assign, and resolve event-related operational tickets and inquiries.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSupportEvents}
            title="Refresh Tickets"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject, description, requester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0473b8] font-medium text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
            >
              <option value="All">All Categories</option>
              <option value="Venue">Venue</option>
              <option value="AV & Tech">AV & Tech</option>
              <option value="Catering">Catering</option>
              <option value="Logistics">Logistics</option>
              <option value="General">General</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500 pl-2 border-l border-slate-200">
            {filteredEvents.length} Ticket{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 && !isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium">
            No support tickets found matching current criteria.
          </div>
        ) : (
          filteredEvents.map((e) => (
            <div
              key={e.id}
              onClick={() => {
                setActiveCard(e.id);
                setSelectedTicket(e);
                setShowReplyModal(true);
              }}
              className={`bg-white rounded-xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all cursor-pointer border ${
                activeCard === e.id ? 'border-2 border-blue-500' : 'border-slate-200'
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{e.timeAgo || 'Recent'}</span>
                  {e.category && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      {e.category}
                    </span>
                  )}
                  {e.priority && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : e.priority === 'High'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {e.priority} Priority
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      e.status === 'Resolved' || e.status === 'Closed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : e.status === 'Open'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {e.status}
                  </span>

                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDeleteTicket(e.id, e.title);
                    }}
                    className="text-slate-300 hover:text-rose-600 transition p-1"
                    title="Delete Ticket"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 m-0">{e.title}</h3>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed m-0 line-clamp-2">
                  {e.description}
                </p>
              </div>

              {/* Replies preview if any */}
              {e.replies && e.replies.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latest Reply:</div>
                  <p className="text-slate-700 font-medium m-0">"{e.replies[e.replies.length - 1].text}"</p>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    — {e.replies[e.replies.length - 1].author} ({e.replies[e.replies.length - 1].timestamp || e.replies[e.replies.length - 1].date || 'Recently'})
                  </span>
                </div>
              )}

              {/* Actions & Meta footer line */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUpdateStatus(e.id, e.status === 'Resolved' ? 'Open' : 'Resolved');
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      e.status === 'Resolved'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#a3d2ee]/60 hover:bg-[#a3d2ee] text-slate-800'
                    }`}
                  >
                    {e.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTicket(e);
                      setShowReplyModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>View Conversation ({e.replies?.length || e.replaysCount || 0})</span>
                  </button>
                </div>

                {/* Author & Replay Count details */}
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1" title={e.requesterEmail || ''}>
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{e.author}</span>
                  </span>
                  {e.department && (
                    <span className="text-slate-400 font-semibold">{e.department}</span>
                  )}
                  {e.assignedAgent && e.assignedAgent !== 'Unassigned' && (
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                      Agent: {e.assignedAgent}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Full Ticket Conversation & Reply */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#0473b8] rounded">
                    {selectedTicket.category || 'General'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedTicket.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 m-0">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Requester</span>
                <span className="font-semibold text-slate-800">{selectedTicket.author}</span>
                {selectedTicket.requesterEmail && (
                  <span className="block text-[10px] text-slate-500 truncate">{selectedTicket.requesterEmail}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-800">{selectedTicket.department || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Priority</span>
                <select
                  value={selectedTicket.priority || 'Medium'}
                  onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded px-1.5 py-0.5 outline-none cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Assigned Agent</span>
                <input
                  type="text"
                  placeholder="Assign agent..."
                  defaultValue={selectedTicket.assignedAgent || 'Unassigned'}
                  onBlur={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded px-1.5 py-0.5 outline-none w-full"
                />
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px]">
              {/* Original Issue Description */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#0473b8]">
                  <span>Initial Request — {selectedTicket.author}</span>
                  <span>{selectedTicket.timeAgo || 'Opened recently'}</span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed m-0">{selectedTicket.description}</p>
              </div>

              {/* Replies History */}
              {(selectedTicket.replies || []).map((reply, idx) => (
                <div
                  key={reply.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span className="text-slate-800">{reply.author}</span>
                    <span>{reply.timestamp || reply.date || 'Recent'}</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed m-0">{reply.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-150 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-700">Responding Agent</label>
                  <input
                    type="text"
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[11px] font-bold text-slate-700">Ticket Status Action</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#0473b8]"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  placeholder="Type reply or resolution instructions for this event inquiry..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTicket.id, selectedTicket.status === 'Resolved' ? 'Open' : 'Resolved')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  {selectedTicket.status === 'Resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Reply</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Log Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Issue Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boardroom Microphone Battery Replacement"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  >
                    <option value="Venue">Venue</option>
                    <option value="AV & Tech">AV & Tech</option>
                    <option value="Catering">Catering</option>
                    <option value="Logistics">Logistics</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
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
                  <label className="block mb-1 font-bold text-slate-800">Requester Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={ticketForm.author}
                    onChange={(e) => setTicketForm({ ...ticketForm, author: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Requester Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="s.jenkins@company.com"
                    value={ticketForm.requesterEmail}
                    onChange={(e) => setTicketForm({ ...ticketForm, requesterEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing"
                    value={ticketForm.department}
                    onChange={(e) => setTicketForm({ ...ticketForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Assign Agent</label>
                  <input
                    type="text"
                    placeholder="e.g. Mike Chen"
                    value={ticketForm.assignedAgent}
                    onChange={(e) => setTicketForm({ ...ticketForm, assignedAgent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Issue Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the technical or operational issue requiring support..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
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

export default SupportEventsPage;
