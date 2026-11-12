import React, { useState, useEffect, useCallback } from 'react';
import { Mail, User, Plus, RefreshCw, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ISupportEvent } from '../../types/events';

export const SupportEventsPage: React.FC = () => {
  const toast = useToast();
  const [events, setEvents] = useState<(ISupportEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string>('');

  // Reply Modal / Drawer State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<(ISupportEvent & { id: string }) | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('HR Support Specialist');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketAuthor, setTicketAuthor] = useState('Sarah Jo');

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
      toast.success(`Support ticket status marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update support status');
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
      setShowReplyModal(false);
      setReplyText('');
      toast.success('Reply logged and saved to ticket!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post reply');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) {
      toast.error('Please enter title and description');
      return;
    }
    try {
      const created = await eventService.createSupportEvent({
        title: ticketTitle.trim(),
        description: ticketDesc.trim(),
        author: ticketAuthor,
        status: 'Open',
        timeAgo: 'Just now',
        replaysCount: 0,
      });
      setEvents((prev) => [created, ...prev]);
      setActiveCard(created.id);
      setShowCreateModal(false);
      setTicketTitle('');
      setTicketDesc('');
      toast.success('Support event logged successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create support ticket');
    }
  };

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

      {/* Cards List */}
      <div className="space-y-4">
        {events.length === 0 && !isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium">
            No support events found.
          </div>
        ) : (
          events.map((e) => (
            <div 
              key={e.id}
              onClick={() => setActiveCard(e.id)}
              className={`bg-white rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all cursor-pointer border ${
                activeCard === e.id 
                  ? 'border-2 border-blue-500' 
                  : 'border-slate-200'
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span>{e.timeAgo || 'Recent'}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  e.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  e.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {e.status}
                </span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 m-0">{e.title}</h3>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {e.description}
                </p>
              </div>

              {/* Replies preview if any */}
              {e.replies && e.replies.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Latest Reply:</div>
                  <p className="text-slate-700 font-medium">"{e.replies[e.replies.length - 1].text}"</p>
                  <span className="text-[10px] text-slate-400 block font-semibold">— {e.replies[e.replies.length - 1].author}</span>
                </div>
              )}

              {/* Actions & Meta footer line */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex gap-2.5">
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      handleUpdateStatus(e.id, e.status === 'Resolved' ? 'Open' : 'Resolved');
                    }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      e.status === 'Resolved'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#a3d2ee]/60 hover:bg-[#a3d2ee] text-slate-800'
                    }`}
                  >
                    {e.status === 'Resolved' ? 'Reopen' : 'Mark Resolved'}
                  </button>
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTicket(e);
                      setShowReplyModal(true);
                    }}
                    className="px-4 py-1.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Author & Replay Count details */}
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{e.author}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{e.replaysCount || 0} Replies</span>
                  </span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modal: Reply to ticket */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Reply to Support Ticket</h3>
                <span className="text-xs text-slate-400 font-semibold">{selectedTicket.title}</span>
              </div>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Your Name / Title</label>
                <input
                  type="text"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Reply Resolution Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your reply and resolution details..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Log Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Ticket Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boardroom Microphone Battery Replacement"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Your Name</label>
                <input
                  type="text"
                  value={ticketAuthor}
                  onChange={(e) => setTicketAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Issue Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the issue or operational request..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
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
