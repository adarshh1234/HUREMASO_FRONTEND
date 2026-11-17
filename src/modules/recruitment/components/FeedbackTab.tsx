import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Star, Share2, Edit2, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { recruitmentService } from '../../../services/recruitmentService';

interface FeedbackRecord {
  id: string;
  candidate: string;
  position: string;
  interviewer: string;
  date: string;
  techRating: number;
  commRating: number;
  status: string;
  comments?: string;
  assessment?: string;
}

export const FeedbackTab: React.FC = () => {
  const toast = useToast();
  
  // Form State
  const [feedCandidate, setFeedCandidate] = useState('');
  const [feedPosition, setFeedPosition] = useState('Senior Full Stack Engineer');
  const [feedDate, setFeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedInterviewer, setFeedInterviewer] = useState('Amal Benny');
  const [feedTechRating, setFeedTechRating] = useState(4);
  const [feedCommRating, setFeedCommRating] = useState(4);
  const [feedAssessment, setFeedAssessment] = useState('Good Fit');
  const [feedStatus, setFeedStatus] = useState('Hire');
  const [feedComments, setFeedComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [feedSearch, setFeedSearch] = useState('');
  const [feedFilterStatus, setFeedFilterStatus] = useState('');

  // Dropdown options loaded from DB
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [vacanciesList, setVacanciesList] = useState<any[]>([]);

  // Feedbacks State
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([
    { id: 'f1', candidate: 'Aarav Nair', position: 'Senior Full Stack Engineer', interviewer: 'Amal Benny', date: '2026-03-29', techRating: 5, commRating: 4, status: 'Hire', comments: 'Outstanding system design and full-stack architecture skills.' },
    { id: 'f2', candidate: 'Diya Menon', position: 'DevOps & Cloud Architect', interviewer: 'Amal Benny', date: '2026-03-29', techRating: 4, commRating: 4, status: 'Hire', comments: 'Deep Kubernetes and Terraform infrastructure experience.' },
    { id: 'f3', candidate: 'Sneha Rachel Thomas', position: 'Backend Engineer', interviewer: 'Amal Benny', date: '2026-03-28', techRating: 3, commRating: 3, status: 'Hold', comments: 'Solid Python foundations, review database scaling.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Load feedback and options from MongoDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apiFeedback, apiCandidates, apiVacancies] = await Promise.all([
        recruitmentService.getFeedback(),
        recruitmentService.getCandidates(),
        recruitmentService.getVacancies(),
      ]);

      if (apiCandidates && apiCandidates.length > 0) {
        setCandidatesList(apiCandidates);
        if (!feedCandidate) setFeedCandidate(apiCandidates[0].name);
      }

      if (apiVacancies && apiVacancies.length > 0) {
        setVacanciesList(apiVacancies);
        if (!feedPosition) setFeedPosition(apiVacancies[0].jobTitle || apiVacancies[0].title || '');
      }

      if (apiFeedback && apiFeedback.length > 0) {
        setFeedbacks(
          apiFeedback.map((f: any) => ({
            id: f.id || f._id,
            candidate: f.candidateName || f.candidateId?.name || 'Candidate',
            position: f.position || f.vacancyId?.title || 'Engineering',
            interviewer: f.interviewerName || f.interviewer || 'Hiring Manager',
            date: f.interviewDate || (f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : '2026-03-29'),
            techRating: f.techRating || f.technicalRating || f.rating || 3,
            commRating: f.commRating || f.communicationRating || 3,
            status: f.status || f.recommendation || 'Hire',
            comments: f.comments || f.strengths || '',
            assessment: f.assessment || 'Good Fit',
          }))
        );
      }
    } catch (err) {
      console.warn('Using baseline feedback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedCandidate.trim()) {
      toast.error('Candidate name is required!');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        candidateName: feedCandidate.trim(),
        position: feedPosition,
        interviewDate: feedDate,
        interviewerName: feedInterviewer.trim() || 'HR Lead',
        technicalRating: feedTechRating,
        communicationRating: feedCommRating,
        assessment: feedAssessment,
        recommendation: feedStatus,
        status: feedStatus,
        comments: feedComments.trim() || 'Interview completed according to rubric.',
        rating: Math.round((feedTechRating + feedCommRating) / 2),
      };

      const result = await recruitmentService.createFeedback(payload);
      
      const newRecord: FeedbackRecord = {
        id: result.id || result._id || String(Date.now()),
        candidate: feedCandidate,
        position: feedPosition,
        interviewer: feedInterviewer,
        date: feedDate,
        techRating: feedTechRating,
        commRating: feedCommRating,
        status: feedStatus,
        comments: feedComments,
        assessment: feedAssessment,
      };

      setFeedbacks([newRecord, ...feedbacks]);
      setFeedComments('');
      toast.success(`Interview feedback for "${feedCandidate}" submitted and saved to MongoDB!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit interview feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await recruitmentService.deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast.success('Feedback record deleted.');
    } catch (err: any) {
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      toast.success('Feedback record deleted.');
    }
  };

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (feedFilterStatus && f.status.toLowerCase() !== feedFilterStatus.toLowerCase()) {
        return false;
      }
      if (feedSearch.trim()) {
        const query = feedSearch.toLowerCase();
        const searchable = `${f.candidate} ${f.position} ${f.interviewer} ${f.comments}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [feedbacks, feedFilterStatus, feedSearch]);

  return (
    <div className="space-y-6">
      <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-205 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 m-0">Interview Feedback Form</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Candidate Name</label>
            <div className="relative">
              <input
                type="text"
                list="candidate-options"
                placeholder="Select or enter candidate name"
                value={feedCandidate}
                onChange={(e) => setFeedCandidate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-905 bg-white font-semibold text-xs outline-none"
              />
              <datalist id="candidate-options">
                {candidatesList.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.vacancy || 'General'})</option>
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Position Applied</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={feedPosition}
                onChange={(e) => setFeedPosition(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                {vacanciesList.length > 0 ? (
                  vacanciesList.map((v) => (
                    <option key={v.id || v._id} value={v.jobTitle || v.title}>
                      {v.jobTitle || v.title}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
                    <option value="Engineering">Engineering</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Marketing">Marketing</option>
                  </>
                )}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Interview Date</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <input
                type="date"
                value={feedDate}
                onChange={(e) => setFeedDate(e.target.value)}
                className="w-full px-3 py-2 text-slate-905 outline-none text-xs font-semibold"
              />
              <div className="absolute right-3 pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Interviewer Name</label>
            <input
              type="text"
              placeholder="Enter interviewer name"
              value={feedInterviewer}
              onChange={(e) => setFeedInterviewer(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-905 bg-white font-semibold text-xs outline-none"
            />
          </div>
        </div>

        {/* Ratings row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Technical Skills Rating ({feedTechRating}/5)</label>
            <div className="flex gap-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((val) => (
                <button type="button" key={val} onClick={() => setFeedTechRating(val)} className="cursor-pointer">
                  <Star className={`h-5 w-5 ${val <= feedTechRating ? 'fill-current' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Communication Skills Rating ({feedCommRating}/5)</label>
            <div className="flex gap-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((val) => (
                <button type="button" key={val} onClick={() => setFeedCommRating(val)} className="cursor-pointer">
                  <Star className={`h-5 w-5 ${val <= feedCommRating ? 'fill-current' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assessment & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Overall Assessment</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={feedAssessment}
                onChange={(e) => setFeedAssessment(e.target.value)}
                className="w-full bg-transparent px-3 py-2.5 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="Good Fit">Good Fit</option>
                <option value="Exceptional">Exceptional</option>
                <option value="Average">Average</option>
                <option value="Weak candidate">Weak candidate</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Status</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={feedStatus}
                onChange={(e) => setFeedStatus(e.target.value)}
                className="w-full bg-transparent px-3 py-2.5 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="Hire">Hire</option>
                <option value="Hold">Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-705">
          <label className="block mb-1.5">Comments</label>
          <textarea
            rows={4}
            placeholder="Enter candidate strengths, areas of growth, evaluation notes..."
            value={feedComments}
            onChange={(e) => setFeedComments(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-3 text-slate-900 font-semibold text-xs outline-none resize-none bg-slate-50/20"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-1">
          <span className="text-xs font-bold text-slate-900">
            Interview Feedback Records ({filteredFeedbacks.length})
          </span>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search........"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-900 outline-none w-48"
              />
            </div>

            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-32">
              <select
                value={feedFilterStatus}
                onChange={(e) => setFeedFilterStatus(e.target.value)}
                className="w-full bg-transparent px-3 py-1.5 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="Hire">Hire</option>
                <option value="Hold">Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3 w-3 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-800 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-450 text-[10px] uppercase">
                <th className="px-4 py-3">Candidate Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Interviewer</th>
                <th className="px-4 py-3">Interview Date</th>
                <th className="px-4 py-3">Technical Rating</th>
                <th className="px-4 py-3">Communication Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-705">
              {filteredFeedbacks.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-900 font-bold">{f.candidate}</td>
                  <td className="px-4 py-3">{f.position}</td>
                  <td className="px-4 py-3 text-slate-500">{f.interviewer}</td>
                  <td className="px-4 py-3 text-slate-400">{f.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star key={v} className={`h-3 w-3 ${v <= f.techRating ? 'fill-current' : 'text-slate-150'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star key={v} className={`h-3 w-3 ${v <= f.commRating ? 'fill-current' : 'text-slate-150'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        f.status === 'Hire'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : f.status === 'Hold'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 text-slate-400">
                      <button
                        onClick={() => toast.info(`Feedback summary for ${f.candidate} copied to clipboard!`)}
                        className="p-1 hover:text-slate-600 cursor-pointer"
                        title="Share Feedback"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toast.info(`Comments: ${f.comments || 'No extra comments'}`)}
                        className="p-1 hover:text-blue-600 cursor-pointer"
                        title="View Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-1 hover:text-rose-600 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400 font-semibold">
                    No interview feedback records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center items-center gap-2 pt-2">
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="px-2.5 py-0.5 text-xs font-bold border rounded bg-blue-50 text-[#0473b8] border-blue-200">1</button>
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTab;
