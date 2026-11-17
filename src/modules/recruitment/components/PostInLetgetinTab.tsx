import React, { useState, useEffect, useCallback } from 'react';
import { Send, Globe, CheckCircle, Clock, ExternalLink, RefreshCw, Layers, Loader2, Ban } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { recruitmentService, JobPostingItem } from '../../../services/recruitmentService';

export const PostInLetgetinTab: React.FC = () => {
  const toast = useToast();
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [locationType, setLocationType] = useState('Remote / Hybrid');
  const [salaryRange, setSalaryRange] = useState('$90,000 - $125,000');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [postedJobs, setPostedJobs] = useState<JobPostingItem[]>([]);

  const fetchActivePostings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await recruitmentService.getActiveLetGetIn();
      setPostedJobs(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error('Failed to load active LetGetIn postings:', err);
      toast.error('Failed to load active LetGetIn postings');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchActivePostings();
  }, [fetchActivePostings]);

  const handleSyncNetwork = async () => {
    try {
      setIsSyncing(true);
      const syncResult = await recruitmentService.syncLetGetIn();
      setLastSyncTime(new Date().toLocaleTimeString());
      await fetchActivePostings();
      toast.success(
        `LetGetIn Network Synced! ${syncResult.jobsSynchronized ?? syncResult.activePostingsCount ?? 0} active job(s) synchronized, ${syncResult.totalApplicants ?? 0} candidate applicants updated.`
      );
    } catch (err: any) {
      console.error('Failed to sync LetGetIn network:', err);
      toast.error(err.message || 'Failed to sync with LetGetIn network');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title!');
      return;
    }

    try {
      setIsPublishing(true);
      const payload = {
        title: jobTitle.trim(),
        department,
        locationType,
        salaryRange: salaryRange.trim() || undefined,
        status: 'Published' as const,
        platform: 'LetsGetIn' as const
      };

      const newPost = await recruitmentService.postToLetGetIn(payload);
      toast.success(`Job "${newPost.title}" successfully published to LetGetIn network!`);
      setJobTitle('');
      await fetchActivePostings();
    } catch (err: any) {
      console.error('Failed to publish to LetGetIn:', err);
      toast.error(err.message || 'Failed to publish to LetGetIn network');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async (job: JobPostingItem) => {
    const id = job.id || (job as any)._id;
    if (!id) return;
    try {
      await recruitmentService.unpublishJobPosting(id);
      toast.success(`Job "${job.title}" unpublished from LetGetIn.`);
      await fetchActivePostings();
    } catch (err: any) {
      console.error('Failed to unpublish job:', err);
      toast.error(err.message || 'Failed to unpublish job');
    }
  };

  const handleOpenLiveUrl = (job: JobPostingItem) => {
    const url = job.liveUrl || (job.platformPostId ? `https://letgetin.com/jobs/${job.platformPostId}` : `https://letgetin.com/jobs/${job.id || (job as any)._id}`);
    window.open(url, '_blank');
    toast.success(`Opening live posting for "${job.title}" on LetGetIn...`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5 text-teal-300" />
            <span>Letgetin Platform Integration Active</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white m-0">Post in Letgetin</h2>
          <p className="text-xs text-teal-100/80 m-0">
            Publish open requisitions directly to the Letgetin talent network and receive real-time applicant feeds.
          </p>
          {lastSyncTime && (
            <p className="text-[11px] text-teal-200/90 font-medium">Last synced at {lastSyncTime}</p>
          )}
        </div>
        <button
          onClick={handleSyncNetwork}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md transition-all text-white cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-emerald-300 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Letgetin Network'}</span>
        </button>
      </div>

      {/* Main Grid: Publish Form + Live Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publish Form (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
            <Layers className="h-4 w-4 text-[#004848]" />
            <h3 className="text-sm font-bold text-slate-900 m-0">Create Letgetin Post</h3>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Lead QA Engineer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#004848] font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#004848] font-semibold cursor-pointer"
              >
                <option value="Engineering">Engineering</option>
                <option value="People Operations">People Operations</option>
                <option value="Design">Design</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Finance & Legal">Finance & Legal</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location Type</label>
              <input
                type="text"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                placeholder="e.g. Remote / Hybrid"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#004848] font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Salary Range</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $90,000 - $125,000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#004848] font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-2.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Publishing to Letgetin...</span>
                </>
              ) : (
                <>
                  <span>Publish to Letgetin</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Posted Jobs List (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Active Letgetin Postings</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time candidate feed synchronized with MongoDB and Letgetin API.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
              {postedJobs.length} Live Requisitions
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#004848]" />
              <p className="text-xs font-medium">Loading active LetGetIn requisitions...</p>
            </div>
          ) : postedJobs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs font-medium">No active job postings found on LetGetIn.</p>
              <p className="text-[11px] text-slate-400 mt-1">Publish an opening using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postedJobs.map((job) => {
                const jobId = job.id || (job as any)._id;
                const postedDateStr = job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';

                return (
                  <div
                    key={jobId}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 m-0">{job.title}</h4>
                        <span className="px-2 py-0.5 bg-teal-100 text-[#004848] text-[10px] font-extrabold rounded-md">
                          {job.department}
                        </span>
                        {job.platformPostId && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-mono rounded">
                            {job.platformPostId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{postedDateStr}</span>
                        </span>
                        <span>•</span>
                        <span className="text-[#004848] font-bold">
                          {job.applicantsCount ?? 0} Applicants Received
                        </span>
                        {job.locationType && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{job.locationType}</span>
                          </>
                        )}
                        {job.salaryRange && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{job.salaryRange}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Live on Letgetin</span>
                      </span>
                      
                      <button
                        title="Unpublish Job"
                        onClick={() => handleUnpublish(job)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Ban className="h-4 w-4" />
                      </button>

                      <button
                        title="View Live on LetGetIn"
                        onClick={() => handleOpenLiveUrl(job)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostInLetgetinTab;
