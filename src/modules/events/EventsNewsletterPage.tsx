import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, Send, Plus, Eye, ThumbsUp, Calendar, Search, Trash2, Edit2, Share2, Users, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { IEventsNewsletter } from '../../types/events';

export const EventsNewsletterPage: React.FC = () => {
  const toast = useToast();
  const [articles, setArticles] = useState<(IEventsNewsletter & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Company Events');
  const [summaryInput, setSummaryInput] = useState('');
  const [authorInput, setAuthorInput] = useState('HR Communications Team');

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

  const handleCreateNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !summaryInput.trim()) {
      toast.error('Title and summary content are required.');
      return;
    }
    setIsPublishing(true);
    try {
      const created = await eventService.createNewsletter({
        title: titleInput.trim(),
        category: categoryInput,
        publishDate: 'Today',
        author: authorInput.trim() || 'HR Communications Team',
        reads: 1,
        likes: 0,
        status: 'Published',
        summary: summaryInput.trim(),
      });
      setArticles((prev) => [created, ...prev]);
      setTitleInput('');
      setSummaryInput('');
      toast.success('Event newsletter issue published and saved to database!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish newsletter');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete newsletter "${title}"?`)) {
      try {
        await eventService.deleteNewsletter(id);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        toast.success('Newsletter entry removed.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete newsletter');
      }
    }
  };

  const handleLike = async (id: string, currentLikes: number) => {
    try {
      const updated = await eventService.updateNewsletter(id, { likes: currentLikes + 1 });
      setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success('Liked newsletter issue!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update likes');
    }
  };

  const totalReads = articles.reduce((acc, a) => acc + (a.reads || 0), 0);
  const scheduledCount = articles.filter((a) => a.status === 'Scheduled' || a.status === 'Draft').length;

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <span className="text-2xl font-extrabold text-[#006666]">84.2%</span>
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
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Create & Broadcast Event Newsletter
        </h2>
        <form onSubmit={handleCreateNewsletter} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
          <div className="md:col-span-2">
            <label className="block mb-1">Newsletter Title *</label>
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
            <label className="block mb-1">Category</label>
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
          <div className="md:col-span-3">
            <label className="block mb-1">Newsletter Highlights / Content Summary *</label>
            <textarea
              rows={3}
              required
              placeholder="Write a concise overview of the event, photos link, and major takeaways for the team..."
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-medium"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isPublishing}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Newsletter'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Published Newsletters Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">({filteredArticles.length}) Newsletter Issues</span>
          <input
            type="text"
            placeholder="Search newsletters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#004848] w-full sm:w-64"
          />
        </div>

        <div className="space-y-3">
          {filteredArticles.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No newsletters found.
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div key={art.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-all shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-[#006666]">
                        {art.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">Published {art.publishDate} by {art.author}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">{art.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toast.info(`Sharing newsletter: ${art.title}`)}
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

                <p className="text-xs text-slate-600 leading-relaxed font-medium">{art.summary}</p>

                <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-slate-500 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>{art.reads} Reads</span>
                  </span>
                  <button 
                    onClick={() => handleLike(art.id, art.likes || 0)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{art.likes} Likes</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsNewsletterPage;
