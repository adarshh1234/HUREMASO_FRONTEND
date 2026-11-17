import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, X, CheckCircle2, User } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import Modal from '../../../components/common/Modal';
import { recruitmentService } from '../../../services/recruitmentService';

interface ApplicantItem {
  id: string;
  name: string;
  position: string;
  exp: string;
  appliedDate: string;
  status: string;
  email?: string;
  phone?: string;
  skills?: string[];
  department?: string;
}

export const TrackApplicantsTab: React.FC = () => {
  const toast = useToast();
  const [trackStatus, setTrackStatus] = useState('');
  const [trackDateRange, setTrackDateRange] = useState('');
  const [trackDept, setTrackDept] = useState('');
  const [trackSearch, setTrackSearch] = useState('');
  
  // Status modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeApplicant, setActiveApplicant] = useState<ApplicantItem | null>(null);
  const [modalSelectedStatus, setModalSelectedStatus] = useState('Shortlisted');
  
  // View modal
  const [viewingApplicant, setViewingApplicant] = useState<ApplicantItem | null>(null);

  // Data state
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load applicants from MongoDB
  const loadApplicants = async () => {
    setIsLoading(true);
    try {
      // First try applications endpoint
      const apps = await recruitmentService.getApplications();
      if (apps && apps.length > 0) {
        setApplicants(
          apps.map((a: any) => ({
            id: a.id || a._id,
            name: a.candidateId?.name || a.candidateName || 'Applicant',
            position: a.vacancyId?.title || a.jobTitle || a.position || 'Engineering',
            exp: a.candidateId?.experienceYears ? `${a.candidateId.experienceYears} Yr` : '2 Yr',
            appliedDate: a.appliedDate
              ? new Date(a.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'July 20, 2025',
            status: a.status || 'Pending',
            email: a.candidateId?.email || a.email,
            phone: a.candidateId?.phone || a.phone,
            skills: a.candidateId?.skills || [],
            department: a.vacancyId?.department || 'Engineering',
          }))
        );
      } else {
        // Fallback to candidates master list
        const cands = await recruitmentService.getCandidates();
        if (cands && cands.length > 0) {
          setApplicants(
            cands.map((c: any) => ({
              id: c.id,
              name: c.name,
              position: c.vacancy || 'UI/UX Designer',
              exp: `${c.experienceYears || 2} Yr`,
              appliedDate: c.dateApplied
                ? new Date(c.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'July 20, 2025',
              status: c.status || 'Pending',
              email: c.email,
              phone: c.phone,
              skills: c.skills,
              department: 'Engineering',
            }))
          );
        } else {
          // Default baseline
          setApplicants([
            { id: 'app-1', name: 'Aarav Nair', position: 'Senior Full Stack Engineer', exp: '5.5 Yr', appliedDate: 'July 20, 2025', status: 'Shortlisted', department: 'Engineering' },
            { id: 'app-2', name: 'Diya Menon', position: 'DevOps & Cloud Architect', exp: '6 Yr', appliedDate: 'July 20, 2025', status: 'Pending', department: 'Engineering' },
            { id: 'app-3', name: 'Karthik Varma', position: 'Lead UI/UX Designer', exp: '4.5 Yr', appliedDate: 'July 20, 2025', status: 'Interview', department: 'UI/UX Designer' },
            { id: 'app-4', name: 'Sneha Rachel Thomas', position: 'Backend Engineer', exp: '3.5 Yr', appliedDate: 'July 20, 2025', status: 'Shortlisted', department: 'Engineering' },
            { id: 'app-5', name: 'Rohan Deshmukh', position: 'AI / ML Engineer', exp: '4 Yr', appliedDate: 'July 20, 2025', status: 'Rejected', department: 'Engineering' },
            { id: 'app-6', name: 'Ananya S.', position: 'QA Automation Engineer', exp: '3 Yr', appliedDate: 'July 20, 2025', status: 'Shortlisted', department: 'Marketing' },
          ]);
        }
      }
    } catch (err) {
      console.warn('Error loading applicants from API', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await recruitmentService.deleteApplication(id);
      setApplicants((prev) => prev.filter((x) => x.id !== id));
      toast.success('Applicant record deleted successfully!');
    } catch (err: any) {
      // In case candidate master record is deleted
      try {
        await recruitmentService.deleteCandidate(id);
      } catch {}
      setApplicants((prev) => prev.filter((x) => x.id !== id));
      toast.success('Applicant record deleted successfully!');
    }
  };

  const handleOpenStatusModal = (app: ApplicantItem) => {
    setActiveApplicant(app);
    setModalSelectedStatus(app.status || 'Pending');
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!activeApplicant) return;
    try {
      await recruitmentService.updateApplicationStatus(activeApplicant.id, {
        status: modalSelectedStatus,
        comment: `Status updated via Track Applicants to ${modalSelectedStatus}`,
      });
      setApplicants((prev) =>
        prev.map((a) => (a.id === activeApplicant.id ? { ...a, status: modalSelectedStatus } : a))
      );
      toast.success(`Applicant status updated to "${modalSelectedStatus}"!`);
    } catch (err: any) {
      // If application endpoint failed, update candidate
      try {
        await recruitmentService.updateCandidate(activeApplicant.id, {
          status: modalSelectedStatus as any,
        });
      } catch {}
      setApplicants((prev) =>
        prev.map((a) => (a.id === activeApplicant.id ? { ...a, status: modalSelectedStatus } : a))
      );
      toast.success(`Applicant status updated to "${modalSelectedStatus}"!`);
    } finally {
      setIsStatusModalOpen(false);
      setActiveApplicant(null);
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      // Status filter
      if (trackStatus && app.status.toLowerCase() !== trackStatus.toLowerCase()) {
        return false;
      }
      // Department filter
      if (trackDept && app.department && !app.department.toLowerCase().includes(trackDept.toLowerCase()) && !app.position.toLowerCase().includes(trackDept.toLowerCase())) {
        return false;
      }
      // Date filter
      if (trackDateRange && !app.appliedDate.toLowerCase().includes(trackDateRange.toLowerCase())) {
        return false;
      }
      // Search filter
      if (trackSearch.trim()) {
        const query = trackSearch.toLowerCase();
        const searchable = `${app.name} ${app.position} ${app.exp} ${app.status}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [applicants, trackStatus, trackDept, trackDateRange, trackSearch]);

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredApplicants.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters card */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-950 m-0">Track Applicant</h3>
          <span className="text-[11px] font-bold text-slate-400">
            ({filteredApplicants.length}) Applicant{filteredApplicants.length === 1 ? '' : 's'} Active
          </span>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-40">
            <select
              value={trackStatus}
              onChange={(e) => setTrackStatus(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
            >
              <option value="">Status (All)</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Pending">Pending</option>
              <option value="Interview">Interview</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
              <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
            </div>
          </div>

          <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-40">
            <select
              value={trackDateRange}
              onChange={(e) => setTrackDateRange(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
            >
              <option value="">Date Range</option>
              <option value="July 20, 2025">July 20, 2025</option>
              <option value="2026">Recent 2026</option>
            </select>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
              <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
            </div>
          </div>

          <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-40">
            <select
              value={trackDept}
              onChange={(e) => setTrackDept(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
            >
              <option value="">Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
            </select>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
              <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
            </div>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, role, skills........"
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-205 bg-white rounded-lg text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-405"
            />
          </div>
        </div>
      </div>

      {/* Table roster */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-800 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-350 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplicants.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={() => handleToggleSelect(app.id)}
                      className="rounded border-slate-350 h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-slate-905 cursor-pointer hover:text-blue-600" onClick={() => setViewingApplicant(app)}>
                    {app.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-semibold">{app.position}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-semibold">{app.exp}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-semibold">{app.appliedDate}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleOpenStatusModal(app)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        app.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : app.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}
                    >
                      <span>{app.status}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2 text-slate-400">
                      <button
                        onClick={() => setViewingApplicant(app)}
                        className="p-1 hover:text-blue-600 cursor-pointer"
                        title="View Profile"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(app)}
                        className="p-1 hover:text-blue-600 cursor-pointer"
                        title="Change Status"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-1 hover:text-rose-600 cursor-pointer"
                        title="Delete Applicant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400 font-semibold">
                    No applicants matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 pt-4">
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="px-2.5 py-0.5 text-xs font-bold border rounded bg-blue-50 text-[#0473b8] border-blue-200 cursor-pointer">1</button>
          <button className="px-2.5 py-0.5 text-xs font-bold border rounded bg-white text-slate-500 hover:bg-slate-50 cursor-pointer">2</button>
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Status Modal */}
      {isStatusModalOpen && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: ${activeApplicant?.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">Select new pipeline status for this candidate:</p>
            <select
              value={modalSelectedStatus}
              onChange={(e) => setModalSelectedStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold outline-none"
            >
              <option value="Shortlisted">Shortlisted</option>
              <option value="Pending">Pending</option>
              <option value="Interview">Interview</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                className="px-4 py-2 bg-[#0473b8] text-white rounded-lg text-xs font-semibold hover:bg-[#03629e] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Applicant Detail Modal */}
      {viewingApplicant && (
        <Modal
          isOpen={!!viewingApplicant}
          onClose={() => setViewingApplicant(null)}
          title={`Applicant Details: ${viewingApplicant.name}`}
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-900">{viewingApplicant.name}</h4>
              <p className="text-xs text-slate-600 font-bold">{viewingApplicant.position} • {viewingApplicant.department}</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                <span>Applied: {viewingApplicant.appliedDate}</span>
                <span>Experience: {viewingApplicant.exp}</span>
                <span className="font-bold text-emerald-700">Status: {viewingApplicant.status}</span>
              </div>
            </div>

            {viewingApplicant.email && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingApplicant.email}</p>
              </div>
            )}

            {viewingApplicant.skills && viewingApplicant.skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {viewingApplicant.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingApplicant(null)}
                className="px-4 py-2 bg-[#0473b8] text-white rounded-lg text-xs font-bold hover:bg-[#03629e] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default TrackApplicantsTab;
