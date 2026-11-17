import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Newspaper,
  Send,
  Plus,
  Eye,
  ThumbsUp,
  Calendar,
  Search,
  Trash2,
  Edit2,
  Share2,
  Users,
  RefreshCw,
  Clock,
  FileText,
  X,
  Heart,
  CheckCircle,
  Tag
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { IEventsNewsletter } from '../../types/events';

export const EventsNewsletterPage: React.FC = () => {
  const toast = useToast();
  const [articles, setArticles] = useState<(IEventsNewsletter & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form State
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Company Events');
  const [summaryInput, setSummaryInput] = useState('');
  const [authorInput, setAuthorInput] = useState('HR Communications Team');
  const [scheduleDate, setScheduleDate] = useState('');
  const [formMode, setFormMode] = useState<'Publish' | 'Draft' | 'Schedule'>('Publish');

  // Read Modal
  const [readModalArticle, setReadModalArticle] = useState<(IEventsNewsletter & { id: string }) | null>(null);

  // Edit Modal
  const [editArticle, setEditArticle] = useState<(IEventsNewsletter & { id: string }) | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<IEventsNewsletter>>({});

  const fetchNewsletters = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await eventService.getNewsletters();
      setArticles(items);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load newsletters');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const handleCreateNewsletter = async (e: React.FormEvent, targetStatus?: 'Published' | 'Draft' | 'Scheduled') => {
    e.preventDefault();
    if (!titleInput.trim() || !summaryInput.trim()) {
      toast.error('Title and summary content are required.');
      return;
    }

    const effectiveStatus = targetStatus || (formMode === 'Schedule' ? 'Scheduled' : formMode === 'Draft' ? 'Draft' : 'Published');
    if (effectiveStatus === 'Scheduled' && !scheduleDate) {
      toast.error('Please specify a schedule date.');
      return;
    }

    setIsPublishing(true);
    try {
      const created = await eventService.createNewsletter({
        title: titleInput.trim(),
        category: categoryInput,
        publishDate: effectiveStatus === 'Published' ? new Date().toISOString().slice(0, 10) : 'TBD',
        scheduleDate: effectiveStatus === 'Scheduled' ? scheduleDate : undefined,
        author: authorInput.trim() || 'HR Communications Team',
        reads: effectiveStatus === 'Published' ? 1 : 0,
        likes: 0,
        status: effectiveStatus,
        summary: summaryInput.trim(),
      });
      setArticles((prev) => [created, ...prev]);
      setTitleInput('');
      setSummaryInput('');
      setScheduleDate('');
      setFormMode('Publish');
      toast.success(
        effectiveStatus === 'Published'
          ? 'Event newsletter issue published and broadcasted!'
          : effectiveStatus === 'Draft'
          ? 'Newsletter saved as draft.'
          : `Newsletter scheduled for ${scheduleDate}.`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process newsletter');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenReadModal = async (art: IEventsNewsletter & { id: string }) => {
    setReadModalArticle(art);
    try {
      const updated = await eventService.incrementNewsletterReads(art.id);
      setArticles((prev) => prev.map((a) => (a.id === art.id ? updated : a)));
      setReadModalArticle(updated);
    } catch {
      // Non-fatal, read modal still displays
    }
  };

  const handleLike = async (id: string) => {
    try {
      const updated = await eventService.likeNewsletter(id);
      setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (readModalArticle?.id === id) {
        setReadModalArticle(updated);
      }
      toast.success('Liked newsletter issue!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update likes');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete newsletter "${title}"?`)) {
      try {
        await eventService.deleteNewsletter(id);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        if (readModalArticle?.id === id) setReadModalArticle(null);
        if (editArticle?.id === id) setEditArticle(null);
        toast.success('Newsletter entry removed.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete newsletter');
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArticle) return;
    try {
      const updated = await eventService.updateNewsletter(editArticle.id, editFormData);
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (readModalArticle?.id === updated.id) {
        setReadModalArticle(updated);
      }
      setEditArticle(null);
      toast.success('Newsletter issue updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update newsletter');
    }
  };

  // Metrics calculation
  const totalReads = useMemo(() => articles.reduce((acc, a) => acc + (a.reads || 0), 0), [articles]);
  const totalLikes = useMemo(() => articles.reduce((acc, a) => acc + (a.likes || 0), 0), [articles]);
  const scheduledCount = useMemo(() => articles.filter((a) => a.status === 'Scheduled' || a.status === 'Draft').length, [articles]);
  const engagementRate = useMemo(() => {
    if (articles.length === 0) return '0%';
    const rate = Math.min(100, Math.round(((totalReads + totalLikes * 2) / Math.max(articles.length * 5, 1)) * 100));
    return `${rate}%`;
  }, [articles, totalReads, totalLikes]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchCat = a.category.toLowerCase().includes(q);
        const matchSum = a.summary.toLowerCase().includes(q);
        const matchAuth = a.author?.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchSum && !matchAuth) return false;
      }
      return true;
    });
  }, [articles, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
            <Newspaper className="h-5 w-5 text-[#006666]" />
            <span>Events Newsletter & Announcements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast company event highlights, monthly newsletters, and employee spotlights.
          </p>
        </div>

        <button
          onClick={fetchNewsletters}
          title="Refresh Newsletters"
          className="p-2 self-start sm:self-auto border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Total Newsletters</span>
          <span className="text-2xl font-extrabold text-slate-900">{articles.length} Issues</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Employee Engagement Rate</span>
          <span className="text-2xl font-extrabold text-[#006666]">{engagementRate}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Total Article Reads</span>
          <span className="text-2xl font-extrabold text-slate-900">{totalReads.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Scheduled / Drafts</span>
          <span className="text-2xl font-extrabold text-amber-600">{scheduledCount} Issues</span>
        </div>
      </div>

      {/* Publish Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
            Create & Broadcast Event Newsletter
          </h2>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFormMode('Publish')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition ${
                formMode === 'Publish' ? 'bg-[#004848] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Publish Now
            </button>
            <button
              type="button"
              onClick={() => setFormMode('Schedule')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition ${
                formMode === 'Schedule' ? 'bg-[#004848] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setFormMode('Draft')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer transition ${
                formMode === 'Draft' ? 'bg-[#004848] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Save Draft
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleCreateNewsletter(e)} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div className="md:col-span-2">
            <label className="block mb-1 font-bold text-slate-800">Newsletter Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. End of Year Gala & Cultural Night Highlights"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-medium"
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-slate-800">Category</label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848]"
            >
              <option value="Company Events">Company Events</option>
              <option value="Employee Experience">Employee Experience</option>
              <option value="Social Events">Social Events</option>
              <option value="HR Announcement">HR Announcement</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-bold text-slate-800">Author / Team</label>
            <input
              type="text"
              placeholder="e.g. HR Communications Team"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-medium"
            />
          </div>

          {formMode === 'Schedule' && (
            <div>
              <label className="block mb-1 font-bold text-slate-800">Target Publish Date *</label>
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-medium"
              />
            </div>
          )}

          <div className="md:col-span-3">
            <label className="block mb-1 font-bold text-slate-800">Newsletter Highlights / Content Summary *</label>
            <textarea
              rows={4}
              required
              placeholder="Write a concise overview of the event, photos link, and major takeaways for the team..."
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-medium"
            />
          </div>

          <div className="md:col-span-3 flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              disabled={isPublishing}
              onClick={(e) => handleCreateNewsletter(e, 'Draft')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isPublishing
                  ? 'Saving...'
                  : formMode === 'Schedule'
                  ? 'Schedule Newsletter'
                  : formMode === 'Draft'
                  ? 'Save Draft'
                  : 'Publish Newsletter'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Published Newsletters Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Search & Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search newsletters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#004848] font-medium text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#004848]"
              >
                <option value="All">All Categories</option>
                <option value="Company Events">Company Events</option>
                <option value="Employee Experience">Employee Experience</option>
                <option value="Social Events">Social Events</option>
                <option value="HR Announcement">HR Announcement</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#004848]"
              >
                <option value="All">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500 pl-2 border-l border-slate-200">
              ({filteredArticles.length}) Issues
            </span>
          </div>
        </div>

        {/* Newsletters List */}
        <div className="space-y-3">
          {filteredArticles.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No newsletters found matching current filters.
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div
                key={art.id}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-[#006666]">
                        {art.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          art.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : art.status === 'Scheduled'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {art.status}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {art.status === 'Scheduled'
                          ? `Scheduled for ${art.scheduleDate || 'TBD'}`
                          : `Published ${art.publishDate} by ${art.author}`}
                      </span>
                    </div>
                    <h3
                      onClick={() => handleOpenReadModal(art)}
                      className="text-sm font-bold text-slate-900 m-0 cursor-pointer hover:text-[#004848] transition-colors"
                    >
                      {art.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditArticle(art);
                        setEditFormData({
                          title: art.title,
                          category: art.category,
                          summary: art.summary,
                          status: art.status,
                          scheduleDate: art.scheduleDate,
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Edit Newsletter"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText?.(window.location.href);
                        toast.info(`Sharing newsletter: ${art.title}`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Share Link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id, art.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Issue"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p
                  onClick={() => handleOpenReadModal(art)}
                  className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2 cursor-pointer m-0"
                >
                  {art.summary}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-500 border-t border-slate-200/60">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleOpenReadModal(art)}
                      className="flex items-center gap-1 hover:text-[#004848] cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>{art.reads} Reads</span>
                    </button>
                    <button
                      onClick={() => handleLike(art.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{art.likes} Likes</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenReadModal(art)}
                    className="text-xs font-bold text-[#006666] hover:underline cursor-pointer"
                  >
                    Read Full Issue &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Read Full Newsletter Issue */}
      {readModalArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-50 text-[#006666]">
                  {readModalArticle.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 m-0">{readModalArticle.title}</h3>
                <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                  By {readModalArticle.author} &bull; {readModalArticle.publishDate}
                </span>
              </div>
              <button
                onClick={() => setReadModalArticle(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
              {readModalArticle.summary}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-150 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-slate-500">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span>{readModalArticle.reads} Reads</span>
                </span>
                <button
                  onClick={() => handleLike(readModalArticle.id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition cursor-pointer"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{readModalArticle.likes} Likes</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReadModalArticle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Newsletter */}
      {editArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Newsletter Issue</h3>
              <button
                onClick={() => setEditArticle(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Category</label>
                  <select
                    value={editFormData.category || 'Company Events'}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Company Events">Company Events</option>
                    <option value="Employee Experience">Employee Experience</option>
                    <option value="Social Events">Social Events</option>
                    <option value="HR Announcement">HR Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Status</label>
                  <select
                    value={editFormData.status || 'Published'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  >
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {editFormData.status === 'Scheduled' && (
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Schedule Date</label>
                  <input
                    type="date"
                    value={editFormData.scheduleDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, scheduleDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              )}

              <div>
                <label className="block mb-1 font-bold text-slate-800">Summary / Highlights *</label>
                <textarea
                  rows={4}
                  required
                  value={editFormData.summary || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setEditArticle(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsNewsletterPage;
