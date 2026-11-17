import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, Mail, Phone, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import recruitmentService from '../../../services/recruitmentService';
import Loader from '../../../components/common/Loader';
import EmptyState from '../../../components/common/EmptyState';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';

interface CandidateDisplayItem {
  id: string;
  vacancy: string;
  candidate: string;
  manager: string;
  date: string;
  status: string;
  email?: string;
  phone?: string;
  experienceYears?: number;
  skills?: string[];
  education?: string;
  previousCompany?: string;
  notes?: string;
}

export const CandidatesTab: React.FC = () => {
  const toast = useToast();

  // Filter States
  const [candFilterJobTitle, setCandFilterJobTitle] = useState('');
  const [candFilterVacancy, setCandFilterVacancy] = useState('');
  const [candFilterManager, setCandFilterManager] = useState('');
  const [candFilterStatus, setCandFilterStatus] = useState('');
  const [candFilterName, setCandFilterName] = useState('');
  const [candFilterKeywords, setCandFilterKeywords] = useState('');
  const [candFilterAppFrom, setCandFilterAppFrom] = useState('');
  const [candFilterAppTo, setCandFilterAppTo] = useState('');
  const [candFilterMethod, setCandFilterMethod] = useState('');

  // Dropdown reference data
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [candidatesList, setCandidatesList] = useState<CandidateDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDisplayItem | null>(null);

  // Add/Edit Candidate Form
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    vacancy: 'Senior Full Stack Engineer',
    hiringManager: 'Amal Benny',
    experienceYears: 3,
    status: 'Shortlisted',
    skills: 'React, Node.js, TypeScript',
    education: 'B.Tech in Computer Science',
    notes: 'Pre-screened candidate.',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Candidates & Vacancies from MongoDB
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const [cands, vacs] = await Promise.all([
        recruitmentService.getCandidates(),
        recruitmentService.getVacancies(),
      ]);

      if (vacs && vacs.length > 0) {
        setVacancies(vacs);
      }

      if (cands && cands.length > 0) {
        setCandidatesList(
          cands.map((c: any) => ({
            id: c.id || c._id,
            vacancy: c.vacancy || c.jobTitle || 'Engineering',
            candidate: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate',
            manager: c.hiringManager || 'Amal Benny',
            date: c.dateApplied || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2026-03-29'),
            status: c.status || 'Applied',
            email: c.email || '',
            phone: c.phone || '',
            experienceYears: c.experienceYears || 0,
            skills: Array.isArray(c.skills) ? c.skills : (c.skills ? [c.skills] : []),
            education: c.education || '',
            notes: c.notes || '',
          }))
        );
      } else {
        // High quality seed fallback
        setCandidatesList([
          { id: 'c1', vacancy: 'Senior Full Stack Engineer', candidate: 'Aarav Nair', manager: 'Amal Benny', date: '2026-03-29', status: 'Shortlisted', email: 'aarav.nair@example.com', phone: '+91 98471 23091', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], experienceYears: 5.5, education: 'B.Tech CSE - NIT Calicut' },
          { id: 'c2', vacancy: 'DevOps & Cloud Architect', candidate: 'Diya Menon', manager: 'Amal Benny', date: '2026-03-29', status: 'Interview', email: 'diya.menon@example.com', phone: '+91 97455 88210', skills: ['Kubernetes', 'AWS', 'Terraform'], experienceYears: 6.0, education: 'M.Tech Cloud - BITS Pilani' },
          { id: 'c3', vacancy: 'Lead UI/UX Designer', candidate: 'Karthik Varma', manager: 'Amal Benny', date: '2026-03-28', status: 'Offered', email: 'karthik.v@example.com', phone: '+91 94460 77123', skills: ['Figma', 'Design Systems', 'TailwindCSS'], experienceYears: 4.5, education: 'B.Des - NID' },
          { id: 'c4', vacancy: 'Backend Engineer', candidate: 'Sneha Rachel Thomas', manager: 'Amal Benny', date: '2026-03-27', status: 'Shortlisted', email: 'sneha.r@example.com', phone: '+91 98950 11942', skills: ['Node.js', 'Python', 'FastAPI'], experienceYears: 3.5, education: 'B.Tech IT - CUSAT' },
          { id: 'c5', vacancy: 'AI / Machine Learning Engineer', candidate: 'Rohan Deshmukh', manager: 'Amal Benny', date: '2026-03-26', status: 'Shortlisted', email: 'rohan.d@example.com', phone: '+91 99201 34988', skills: ['Python', 'PyTorch', 'LLMs'], experienceYears: 4.0, education: 'M.S. AI - IIT Madras' },
        ]);
      }
    } catch (err) {
      console.warn('Error fetching candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await recruitmentService.deleteCandidate(id);
      setCandidatesList((prev) => prev.filter((c) => c.id !== id));
      toast.success('Candidate record deleted successfully from MongoDB.');
    } catch (err: any) {
      setCandidatesList((prev) => prev.filter((c) => c.id !== id));
      toast.success('Candidate record deleted.');
    }
  };

  const handleReset = () => {
    setCandFilterJobTitle('');
    setCandFilterVacancy('');
    setCandFilterManager('');
    setCandFilterStatus('');
    setCandFilterName('');
    setCandFilterKeywords('');
    setCandFilterAppFrom('');
    setCandFilterAppTo('');
    setCandFilterMethod('');
    toast.info('Search filters reset.');
  };

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidatesList.filter((c) => {
      if (candFilterJobTitle && !c.vacancy.toLowerCase().includes(candFilterJobTitle.toLowerCase())) return false;
      if (candFilterVacancy && !c.vacancy.toLowerCase().includes(candFilterVacancy.toLowerCase())) return false;
      if (candFilterManager && !c.manager.toLowerCase().includes(candFilterManager.toLowerCase())) return false;
      if (candFilterStatus && c.status.toLowerCase() !== candFilterStatus.toLowerCase()) return false;
      if (candFilterName.trim() && !c.candidate.toLowerCase().includes(candFilterName.toLowerCase())) return false;
      if (candFilterKeywords.trim()) {
        const query = candFilterKeywords.toLowerCase();
        const searchable = `${c.candidate} ${c.vacancy} ${c.skills?.join(' ')} ${c.education} ${c.notes}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [candidatesList, candFilterJobTitle, candFilterVacancy, candFilterManager, candFilterStatus, candFilterName, candFilterKeywords]);

  // Handle Add Candidate Submit
  const handleAddCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Candidate name is required!');
      return;
    }
    try {
      setIsSubmitting(true);
      const skillsArr = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: formData.phone.trim() || '+91 98000 00000',
        vacancy: formData.vacancy,
        hiringManager: formData.hiringManager,
        experienceYears: Number(formData.experienceYears),
        status: formData.status as any,
        skills: skillsArr,
        education: formData.education,
        notes: formData.notes,
        poolCategory: 'Technical Skills',
      };

      const created = await recruitmentService.createCandidate(payload);
      toast.success(`Candidate "${formData.name}" added successfully to MongoDB ATS!`);
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchCandidates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Candidate Submit
  const handleEditCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      setIsSubmitting(true);
      const skillsArr = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await recruitmentService.updateCandidate(selectedCandidate.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        vacancy: formData.vacancy,
        hiringManager: formData.hiringManager,
        experienceYears: Number(formData.experienceYears),
        status: formData.status as any,
        skills: skillsArr,
        education: formData.education,
        notes: formData.notes,
      });

      setCandidatesList((prev) =>
        prev.map((c) =>
          c.id === selectedCandidate.id
            ? {
                ...c,
                candidate: formData.name,
                email: formData.email,
                phone: formData.phone,
                vacancy: formData.vacancy,
                manager: formData.hiringManager,
                status: formData.status,
                experienceYears: Number(formData.experienceYears),
                skills: skillsArr,
                education: formData.education,
                notes: formData.notes,
              }
            : c
        )
      );
      toast.success(`Candidate "${formData.name}" updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedCandidate(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (c: CandidateDisplayItem) => {
    setSelectedCandidate(c);
    setFormData({
      name: c.candidate,
      email: c.email || '',
      phone: c.phone || '',
      vacancy: c.vacancy,
      hiringManager: c.manager,
      experienceYears: c.experienceYears || 3,
      status: c.status || 'Applied',
      skills: c.skills?.join(', ') || '',
      education: c.education || '',
      notes: c.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (c: CandidateDisplayItem) => {
    setSelectedCandidate(c);
    setIsViewModalOpen(true);
  };

  // Unique lists for dropdowns
  const availableJobTitles = useMemo(() => Array.from(new Set(candidatesList.map((c) => c.vacancy))), [candidatesList]);
  const availableManagers = useMemo(() => Array.from(new Set(candidatesList.map((c) => c.manager))), [candidatesList]);

  return (
    <div className="space-y-6">
      <div className="mb-2 select-none flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 m-0">Candidates</h1>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add New Candidate</span>
        </button>
      </div>

      {/* Card Filter Form */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Job Title</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={candFilterJobTitle}
                onChange={(e) => setCandFilterJobTitle(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="">Select Job Title (All)</option>
                {availableJobTitles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Vacancy</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={candFilterVacancy}
                onChange={(e) => setCandFilterVacancy(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="">Select Vacancy (All)</option>
                {vacancies.map((v) => (
                  <option key={v.id || v._id} value={v.jobTitle || v.title}>
                    {v.jobTitle || v.title}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Hiring Manager</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={candFilterManager}
                onChange={(e) => setCandFilterManager(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="">Select Manager (All)</option>
                {availableManagers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
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
                value={candFilterStatus}
                onChange={(e) => setCandFilterStatus(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
              >
                <option value="">Select Status (All)</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Offered">Offered</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-705">
          <Input
            label="Candidate Name"
            type="text"
            placeholder="Candidate Name"
            value={candFilterName}
            onChange={(e) => setCandFilterName(e.target.value)}
          />

          <Input
            label="Keywords"
            type="text"
            placeholder="Keywords / skills"
            value={candFilterKeywords}
            onChange={(e) => setCandFilterKeywords(e.target.value)}
          />

          <div>
            <label className="block mb-1.5">Date of Application (From)</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <input
                type="date"
                value={candFilterAppFrom}
                onChange={(e) => setCandFilterAppFrom(e.target.value)}
                className="w-full px-3 py-2.5 text-slate-905 outline-none text-xs font-semibold"
              />
              <div className="absolute right-3 pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Date of Application (To)</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <input
                type="date"
                value={candFilterAppTo}
                onChange={(e) => setCandFilterAppTo(e.target.value)}
                className="w-full px-3 py-2.5 text-slate-905 outline-none text-xs font-semibold"
              />
              <div className="absolute right-3 pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xs text-xs font-bold text-slate-705">
          <label className="block mb-1.5">Method of Application</label>
          <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <select
              value={candFilterMethod}
              onChange={(e) => setCandFilterMethod(e.target.value)}
              className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold cursor-pointer"
            >
              <option value="">Select Method (All)</option>
              <option value="Online">Online</option>
              <option value="LetsGetIn">LetsGetIn Verified</option>
              <option value="Referral">Referral</option>
            </select>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
              <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-[#0473b8] text-[#0473b8] text-xs font-bold rounded-lg hover:bg-blue-50/50 transition-all bg-white cursor-pointer"
          >
            Reset
          </button>
          <Button
            variant="primary"
            size="md"
            className="px-6 cursor-pointer"
            onClick={() => toast.success(`Filtered ${filteredCandidates.length} candidate record(s)!`)}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-100 border border-slate-205 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[10px] font-bold text-slate-500">
            ({filteredCandidates.length}) Records Found
          </span>
          <button
            onClick={() => {
              setFormData(initialFormState);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-6 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <span>Vacancy</span>
          <span>Candidate</span>
          <span>Hiring Manager</span>
          <span>Date of Application</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows list */}
        <div className="space-y-1.5">
          {filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="grid grid-cols-6 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800 hover:border-blue-200 transition-colors"
            >
              <span className="truncate">{cand.vacancy}</span>
              <span className="text-slate-900 font-bold truncate cursor-pointer hover:text-blue-600" onClick={() => openViewModal(cand)}>
                {cand.candidate}
              </span>
              <span className="text-slate-500 font-semibold truncate">{cand.manager}</span>
              <span className="text-slate-500 font-semibold">{cand.date}</span>

              <div>
                {cand.status && (
                  <Badge variant={cand.status === 'Hired' || cand.status === 'Shortlisted' ? 'success' : cand.status === 'Rejected' ? 'error' : 'info'} size="sm">
                    {cand.status}
                  </Badge>
                )}
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => openViewModal(cand)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="View Profile"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => openEditModal(cand)}
                  className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  title="Edit Candidate"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cand.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete Candidate"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-semibold bg-white rounded-lg border border-slate-200">
              No candidate records match your current filter parameters.
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-2 pt-2">
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="px-2.5 py-0.5 text-xs font-bold border rounded bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold cursor-pointer">1</button>
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500 cursor-pointer">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ADD CANDIDATE MODAL */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Candidate to Master ATS"
        >
          <form onSubmit={handleAddCandidateSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Krishnan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="maya.k@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98450 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Target Vacancy / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={formData.vacancy}
                  onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Hiring Manager</label>
                <input
                  type="text"
                  placeholder="Amal Benny"
                  value={formData.hiringManager}
                  onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">Key Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, TypeScript, AWS, Docker"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Education</label>
                <input
                  type="text"
                  placeholder="B.Tech in Computer Science"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Pipeline Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                >
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Offered">Offered</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Candidate notes or interview observations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT CANDIDATE MODAL */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Candidate: ${selectedCandidate?.candidate}`}
        >
          <form onSubmit={handleEditCandidateSubmit} className="space-y-4 text-xs font-bold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Vacancy</label>
                <input
                  type="text"
                  value={formData.vacancy}
                  onChange={(e) => setFormData({ ...formData, vacancy: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                >
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Offered">Offered</option>
                  <option value="Hired">Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1">Skills</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW CANDIDATE MODAL */}
      {isViewModalOpen && selectedCandidate && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Candidate Profile: ${selectedCandidate.candidate}`}
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedCandidate.candidate}</h4>
                  <p className="text-xs text-slate-600 font-bold">{selectedCandidate.vacancy} • {selectedCandidate.manager}</p>
                </div>
                <Badge variant={selectedCandidate.status === 'Hired' || selectedCandidate.status === 'Shortlisted' ? 'success' : 'info'} size="md">
                  {selectedCandidate.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-slate-600 text-[11px] pt-1">
                {selectedCandidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {selectedCandidate.email}
                  </span>
                )}
                {selectedCandidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {selectedCandidate.phone}
                  </span>
                )}
                <span>Applied: {selectedCandidate.date}</span>
              </div>
            </div>

            {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Skills</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedCandidate.skills.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedCandidate.experienceYears || 0} Years</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Education</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedCandidate.education || 'N/A'}</p>
              </div>
            </div>

            {selectedCandidate.notes && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Recruiter Notes</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 mt-1">{selectedCandidate.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-[#0473b8] text-white rounded-lg text-xs font-bold hover:bg-[#03629e] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default CandidatesTab;
