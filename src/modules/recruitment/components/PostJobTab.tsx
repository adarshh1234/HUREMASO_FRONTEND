import React, { useState } from 'react';
import { ChevronDown, ExternalLink, Send, FileText, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { recruitmentService } from '../../../services/recruitmentService';

export const PostJobTab: React.FC = () => {
  const toast = useToast();
  const [postJobTitle, setPostJobTitle] = useState('Senior Software Engineer');
  const [currency, setCurrency] = useState('USD');
  const [postMinSalary, setPostMinSalary] = useState('120000');
  const [postMaxSalary, setPostMaxSalary] = useState('180000');
  const [postEmploymentType, setPostEmploymentType] = useState('Full-time');
  const [postDesc, setPostDesc] = useState('Describe the role, responsibilities, and requirements...');
  const [postLocationType, setPostLocationType] = useState('Remote');
  const [postOfficeLocation, setPostOfficeLocation] = useState('HQ - Canadian Regional Office');
  const [postExpLevel, setPostExpLevel] = useState('Entry Level');
  const [postDept, setPostDept] = useState('Engineering');
  const [postSkills, setPostSkills] = useState('React, Node.js, Python');
  const [postQuals, setPostQuals] = useState('Bachelor in Computer Science or equivalent');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState<{ id?: string; liveUrl?: string; status?: string } | null>(null);

  const resetForm = () => {
    setPostJobTitle('');
    setPostMinSalary('');
    setPostMaxSalary('');
    setPostEmploymentType('Full-time');
    setPostDesc('');
    setPostLocationType('Remote');
    setPostOfficeLocation('');
    setPostExpLevel('Entry Level');
    setPostDept('Engineering');
    setPostSkills('');
    setPostQuals('');
    setLastCreatedJob(null);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postJobTitle.trim()) {
      toast.error('Job Title is required!');
      return;
    }
    if (!postDept.trim()) {
      toast.error('Department is required!');
      return;
    }

    try {
      setIsSubmitting(true);
      const skillsArray = postSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const salaryRangeStr = postMinSalary && postMaxSalary
        ? `${currency} ${postMinSalary} - ${postMaxSalary}`
        : postMinSalary
        ? `${currency} ${postMinSalary}+`
        : undefined;

      const payload = {
        title: postJobTitle.trim(),
        department: postDept,
        location: postOfficeLocation.trim() || undefined,
        locationType: postLocationType,
        type: postEmploymentType,
        salaryRange: salaryRangeStr,
        minSalary: postMinSalary ? Number(postMinSalary) : undefined,
        maxSalary: postMaxSalary ? Number(postMaxSalary) : undefined,
        currency,
        skills: skillsArray,
        qualifications: postQuals.trim() || undefined,
        description: postDesc.trim() || undefined,
        status: 'Published' as const,
        platform: 'LetsGetIn' as const
      };

      const result = await recruitmentService.createJobPosting(payload);
      setLastCreatedJob({
        id: result.id || (result as any)._id,
        liveUrl: result.liveUrl || (result.platformPostId ? `https://letgetin.com/jobs/${result.platformPostId}` : undefined),
        status: 'Published'
      });

      toast.success(`Job "${result.title}" published successfully to LetsGetIn! Linked vacancy created.`);
    } catch (err: any) {
      console.error('Failed to publish job:', err);
      toast.error(err.message || 'Failed to publish job to LetsGetIn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!postJobTitle.trim()) {
      toast.error('Job Title is required to save a draft!');
      return;
    }

    try {
      setIsDrafting(true);
      const skillsArray = postSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const salaryRangeStr = postMinSalary && postMaxSalary
        ? `${currency} ${postMinSalary} - ${postMaxSalary}`
        : postMinSalary
        ? `${currency} ${postMinSalary}+`
        : undefined;

      const payload = {
        title: postJobTitle.trim(),
        department: postDept,
        location: postOfficeLocation.trim() || undefined,
        locationType: postLocationType,
        type: postEmploymentType,
        salaryRange: salaryRangeStr,
        minSalary: postMinSalary ? Number(postMinSalary) : undefined,
        maxSalary: postMaxSalary ? Number(postMaxSalary) : undefined,
        currency,
        skills: skillsArray,
        qualifications: postQuals.trim() || undefined,
        description: postDesc.trim() || undefined,
        status: 'Draft' as const,
        platform: 'LetsGetIn' as const
      };

      const result = await recruitmentService.createJobPosting(payload);
      setLastCreatedJob({
        id: result.id || (result as any)._id,
        liveUrl: result.liveUrl,
        status: 'Draft'
      });

      toast.success(`Job "${result.title}" saved as Draft in MongoDB.`);
    } catch (err: any) {
      console.error('Failed to save job draft:', err);
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleViewInLetsGetIn = () => {
    if (lastCreatedJob && lastCreatedJob.status === 'Published' && lastCreatedJob.liveUrl) {
      window.open(lastCreatedJob.liveUrl, '_blank');
      toast.success('Opening job posting preview on LetsGetIn Portal...');
      return;
    }

    if (lastCreatedJob && lastCreatedJob.status === 'Draft') {
      toast.info('This job is currently in Draft state. Please "Post a Job" to make it live on LetsGetIn before opening preview.');
      return;
    }

    // Default or unposted state:
    toast.info('Please publish or create the job first to view its live URL on LetsGetIn.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-2 select-none flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Post a New Job</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">Create and publish your job posting to LetsGetIn with automated Vacancy synchronization</p>
        </div>
        {lastCreatedJob && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs font-semibold text-teal-800">
            <span>Last Saved: <strong>{lastCreatedJob.id}</strong> ({lastCreatedJob.status})</span>
          </div>
        )}
      </div>

      <form onSubmit={handlePostJob} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 pt-1">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Basic Information</span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
            <div className="md:col-span-2">
              <label className="block mb-1.5">Job Title *</label>
              <input
                type="text"
                required
                value={postJobTitle}
                onChange={(e) => setPostJobTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 bg-white font-semibold text-xs outline-none focus:border-[var(--primary-color)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1.5">Minimum Salary</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-800 text-xs font-bold px-2 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
                <input
                  type="number"
                  value={postMinSalary}
                  onChange={(e) => setPostMinSalary(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full border-none outline-none text-slate-900 text-xs font-semibold px-2 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Maximum Salary</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-800 text-xs font-bold px-2 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
                <input
                  type="number"
                  value={postMaxSalary}
                  onChange={(e) => setPostMaxSalary(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full border-none outline-none text-slate-900 text-xs font-semibold px-2 py-2"
                />
              </div>
            </div>
          </div>

          <div className="max-w-md text-xs font-bold text-slate-700">
            <label className="block mb-1.5">Employment Type</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={postEmploymentType}
                onChange={(e) => setPostEmploymentType(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-50 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Job Description &amp; Details</span>

          <div className="text-xs font-bold text-slate-700">
            <label className="block mb-1.5">Description</label>
            <textarea
              rows={5}
              value={postDesc}
              onChange={(e) => setPostDesc(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 font-semibold text-xs outline-none resize-none bg-slate-50/20 focus:border-[var(--primary-color)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
            <div className="md:col-span-2">
              <label className="block mb-1.5">Location</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white col-span-1">
                  <select
                    value={postLocationType}
                    onChange={(e) => setPostLocationType(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-50 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                    <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                  </div>
                </div>

                <input
                  type="text"
                  value={postOfficeLocation}
                  onChange={(e) => setPostOfficeLocation(e.target.value)}
                  placeholder="Office Location / City"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 bg-white font-semibold text-xs outline-none col-span-2 focus:border-[var(--primary-color)]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1.5">Experience Level</label>
              <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <select
                  value={postExpLevel}
                  onChange={(e) => setPostExpLevel(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead / Principal">Lead / Principal</option>
                </select>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-50 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                  <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1.5">Department</label>
              <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <select
                  value={postDept}
                  onChange={(e) => setPostDept(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="People Operations">People Operations</option>
                  <option value="Design">Design</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                </select>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-50 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                  <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-700">
            <label className="block mb-1.5">Required Skills</label>
            <textarea
              rows={3}
              value={postSkills}
              onChange={(e) => setPostSkills(e.target.value)}
              placeholder="e.g. React, Node.js, Python, AWS"
              className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 font-semibold text-xs outline-none resize-none bg-slate-50/20 focus:border-[var(--primary-color)]"
            />
          </div>

          <div className="text-xs font-bold text-slate-700">
            <label className="block mb-1.5">Required Qualifications</label>
            <input
              type="text"
              value={postQuals}
              onChange={(e) => setPostQuals(e.target.value)}
              placeholder="e.g. Bachelor in Computer Science or equivalent"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 bg-white font-semibold text-xs outline-none focus:border-[var(--primary-color)]"
            />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              resetForm();
              toast.info('Job form cleared');
            }}
            disabled={isSubmitting || isDrafting}
            className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isDrafting}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isDrafting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" /> : <FileText className="h-3.5 w-3.5 text-slate-600" />}
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={handleViewInLetsGetIn}
            className="flex items-center gap-2 px-5 py-2.5 border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
            <span>View in LetsGetIn</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isDrafting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#004848] hover:bg-[#003838] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Post a Job</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJobTab;
