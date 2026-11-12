import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Plus, Users, X, Briefcase, Mail, Phone, Award, FileText, CheckCircle2, ChevronRight, Search, Eye } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import recruitmentService from '../../../services/recruitmentService';
import { Candidate } from '../../../types';
import Badge from '../../../components/common/Badge';
import Loader from '../../../components/common/Loader';
import EmptyState from '../../../components/common/EmptyState';

interface TalentPoolDef {
  id: string;
  title: string;
  skills: string[];
  baseProgress?: number;
}

const DEFAULT_POOLS: TalentPoolDef[] = [
  { id: '1', title: 'Technical Skills', skills: ['Programming', 'Data Analysis', 'Cloud Computing'], baseProgress: 35 },
  { id: '2', title: 'React Developer', skills: ['Communication', 'Js', 'Teamwork', 'React'], baseProgress: 65 },
  { id: '3', title: 'Design Skills', skills: ['UI/UX', 'Graphic Design', 'Prototyping'], baseProgress: 48 },
  { id: '4', title: 'Data & Analytics', skills: ['Python', 'SQL', 'Machine Learning', 'Data Analysis'], baseProgress: 40 },
  { id: '5', title: 'Soft Skills', skills: ['Communication', 'Leadership', 'Teamwork'], baseProgress: 75 },
  { id: '6', title: 'Mobile Engineering', skills: ['React Native', 'Flutter', 'Swift', 'Android'], baseProgress: 52 },
];

export const TalentPoolTab: React.FC = () => {
  const toast = useToast();

  // Candidates & Pools State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [filterSkill, setFilterSkill] = useState('');
  const [filterExperience, setFilterExperience] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<TalentPoolDef | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Candidate Form
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    skills: '',
    experienceYears: 1,
    education: '',
    resumeUrl: '',
    poolCategory: 'Technical Skills',
    status: 'Applied',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Search inside View List modal
  const [poolSearchTerm, setPoolSearchTerm] = useState('');

  // Fetch candidates from API
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await recruitmentService.getCandidates();
      if (data && data.length > 0) {
        setCandidates(data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Filter candidates based on top filter bar
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Skill filter
      if (filterSkill) {
        const query = filterSkill.toLowerCase();
        const hasSkill = c.skills?.some((s) => s.toLowerCase().includes(query));
        if (!hasSkill) return false;
      }
      // Experience filter
      if (filterExperience) {
        const minExp = parseInt(filterExperience, 10);
        if (!isNaN(minExp) && (c.experienceYears || 0) < minExp) return false;
      }
      // Category filter
      if (filterCategory) {
        const pool = c.poolCategory || c.talentPool || 'Technical Skills';
        if (pool.toLowerCase() !== filterCategory.toLowerCase()) return false;
      }
      // Status filter
      if (filterStatus) {
        if (c.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
      }
      return true;
    });
  }, [candidates, filterSkill, filterExperience, filterCategory, filterStatus]);

  // Helper to get candidates for a specific talent pool
  const getCandidatesForPool = (poolTitle: string, candidateList: Candidate[] = filteredCandidates) => {
    return candidateList.filter((c) => {
      const category = (c.poolCategory || c.talentPool || '').toLowerCase();
      if (category === poolTitle.toLowerCase()) return true;

      // Fallback matching by pool skills
      const poolDef = DEFAULT_POOLS.find((p) => p.title.toLowerCase() === poolTitle.toLowerCase());
      if (poolDef && c.skills) {
        const matchesSkill = c.skills.some((s) =>
          poolDef.skills.some((ps) => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase()))
        );
        if (matchesSkill) return true;
      }
      return false;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterSkill('');
    setFilterExperience('');
    setFilterCategory('');
    setFilterStatus('');
  };

  // Open Add Candidate Modal (optionally pre-fill pool)
  const openAddCandidateModal = (defaultPool?: string) => {
    setFormData({
      ...initialFormState,
      poolCategory: defaultPool || 'Technical Skills',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open View Candidate List Modal
  const openViewListModal = (pool: TalentPoolDef) => {
    setSelectedPool(pool);
    setPoolSearchTerm('');
    setIsViewModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Candidate name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Valid email address is required';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.skills.trim()) errors.skills = 'At least one skill is required';
    if (formData.experienceYears < 0 || isNaN(formData.experienceYears)) {
      errors.experienceYears = 'Valid experience years required';
    }
    if (!formData.poolCategory) errors.poolCategory = 'Talent Pool category is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save Candidate
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        skills: skillsArray,
        experienceYears: Number(formData.experienceYears),
        education: formData.education.trim(),
        resumeUrl: formData.resumeUrl.trim(),
        poolCategory: formData.poolCategory,
        talentPool: formData.poolCategory,
        status: formData.status as any,
        vacancy: formData.poolCategory,
        hiringManager: 'HR Team',
        notes: formData.notes.trim(),
      };

      const created = await recruitmentService.createCandidate(payload);

      toast.success('Candidate added to Talent Pool successfully!');
      setIsAddModalOpen(false);
      setFormData(initialFormState);

      // Add to local state & refetch
      setCandidates((prev) => [created, ...prev]);
      fetchCandidates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center text-xs font-bold">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900 m-0">Talent Pool</h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {filteredCandidates.length} Total Candidates
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg transition-colors cursor-pointer ${
              showFilterBar || filterSkill || filterExperience || filterCategory || filterStatus
                ? 'bg-blue-50 border-[#0473b8] text-[#0473b8]'
                : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {(filterSkill || filterExperience || filterCategory || filterStatus) && (
              <span className="w-2 h-2 rounded-full bg-[#0473b8]" />
            )}
          </button>
          <button
            onClick={() => openAddCandidateModal()}
            className="px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter Panel (Collapsible) */}
      {showFilterBar && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
            {/* Skill Filter */}
            <div>
              <label className="block mb-1 text-[11px]">Skill</label>
              <input
                type="text"
                placeholder="e.g. React, Python, UI/UX"
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none text-xs font-semibold focus:border-[#0473b8]"
              />
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block mb-1 text-[11px]">Min Experience (Years)</label>
              <select
                value={filterExperience}
                onChange={(e) => setFilterExperience(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none text-xs font-semibold focus:border-[#0473b8]"
              >
                <option value="">All Experience</option>
                <option value="1">1+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
                <option value="8">8+ Years</option>
              </select>
            </div>

            {/* Category / Talent Pool Filter */}
            <div>
              <label className="block mb-1 text-[11px]">Talent Pool Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none text-xs font-semibold focus:border-[#0473b8]"
              >
                <option value="">All Categories</option>
                {DEFAULT_POOLS.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block mb-1 text-[11px]">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none text-xs font-semibold focus:border-[#0473b8]"
              >
                <option value="">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold">
              Showing {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => toast.info(`Applied filter: ${filteredCandidates.length} candidate(s) found`)}
                className="px-4 py-1.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <div className="py-16 flex justify-center items-center bg-white rounded-xl border border-slate-200">
          <Loader text="Loading Talent Pool candidates..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEFAULT_POOLS.map((card) => {
            const poolCandidates = getCandidatesForPool(card.title);
            const countDisplay = `${poolCandidates.length} candidate${poolCandidates.length === 1 ? '' : 's'}`;
            const progressVal = Math.min(100, Math.max(15, poolCandidates.length * 20 || (card.baseProgress || 35)));

            return (
              <div
                key={card.id}
                className="bg-white border border-slate-205 rounded-xl p-5 shadow-xs flex flex-col justify-between h-48 select-none hover:border-slate-300 transition-all hover:shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-805">{card.title}</h4>
                    <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {countDisplay}
                    </span>
                  </div>

                  <ul className="text-[10px] font-bold text-slate-450 space-y-1 pl-4 list-disc pt-1">
                    {card.skills.map((s, idx) => (
                      <li key={`${s}-${idx}`}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-600 h-1 rounded-full transition-all duration-300" style={{ width: `${progressVal}%` }} />
                  </div>

                  <button
                    onClick={() => openViewListModal(card)}
                    className="w-full py-1.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View Candidate List</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== VIEW CANDIDATE LIST MODAL ===================== */}
      {isViewModalOpen && selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0473b8] flex items-center justify-center border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                    {selectedPool.title} Roster
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Candidates registered under this talent pool category
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-bar with search & Add button */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidates by name, skill, email..."
                  value={poolSearchTerm}
                  onChange={(e) => setPoolSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#0473b8] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openAddCandidateModal(selectedPool.title);
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate to this Pool</span>
              </button>
            </div>

            {/* Candidates Table / List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
              {(() => {
                const poolCandidates = getCandidatesForPool(selectedPool.title, candidates).filter((c) => {
                  if (!poolSearchTerm) return true;
                  const term = poolSearchTerm.toLowerCase();
                  return (
                    c.name?.toLowerCase().includes(term) ||
                    c.email?.toLowerCase().includes(term) ||
                    c.skills?.some((s) => s.toLowerCase().includes(term)) ||
                    c.education?.toLowerCase().includes(term)
                  );
                });

                if (poolCandidates.length === 0) {
                  return (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">No candidates in this pool yet</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        There are currently no candidates matching {selectedPool.title}. Click below to add a candidate now.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewModalOpen(false);
                          openAddCandidateModal(selectedPool.title);
                        }}
                        className="px-4 py-2 bg-[#0473b8] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#03629e] cursor-pointer"
                      >
                        + Add Candidate
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <span className="col-span-4">Candidate</span>
                      <span className="col-span-2">Experience</span>
                      <span className="col-span-3">Skills</span>
                      <span className="col-span-2">Status</span>
                      <span className="col-span-1 text-right">Action</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {poolCandidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Name & Contact */}
                          <div className="col-span-4 flex items-center gap-2.5 pr-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0473b8] font-bold flex items-center justify-center text-xs shrink-0">
                              {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{cand.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{cand.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Experience & Education */}
                          <div className="col-span-2">
                            <div className="font-bold text-slate-800">
                              {cand.experienceYears || 0} yr{(cand.experienceYears || 0) === 1 ? '' : 's'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate font-medium">
                              {cand.education || 'Graduate'}
                            </div>
                          </div>

                          {/* Skills */}
                          <div className="col-span-3 flex flex-wrap gap-1 pr-2">
                            {cand.skills && cand.skills.length > 0 ? (
                              cand.skills.slice(0, 3).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No skills listed</span>
                            )}
                            {cand.skills && cand.skills.length > 3 && (
                              <span className="text-[9px] font-bold text-slate-400">
                                +{cand.skills.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <Badge
                              variant={
                                cand.status?.toLowerCase() === 'selected' || cand.status?.toLowerCase() === 'shortlisted'
                                  ? 'success'
                                  : cand.status?.toLowerCase() === 'interview'
                                  ? 'info'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {cand.status || 'Applied'}
                            </Badge>
                          </div>

                          {/* Action */}
                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCandidate(cand);
                                setIsCandidateDetailOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD NEW CANDIDATE MODAL ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0473b8] flex items-center justify-center border border-blue-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                    Add New Candidate to Talent Pool
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register a qualified candidate profile into recruitment pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveCandidate} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] ${
                        formErrors.name ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.name && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.name}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. alex.rivera@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] ${
                        formErrors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.email && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.email}</span>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +1 415 555 0199"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] ${
                        formErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.phone && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.phone}</span>
                    )}
                  </div>

                  {/* Talent Pool / Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Talent Pool Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.poolCategory}
                      onChange={(e) => setFormData({ ...formData, poolCategory: e.target.value })}
                      className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                    >
                      {DEFAULT_POOLS.map((p) => (
                        <option key={p.id} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience in Years */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Experience (Years) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.experienceYears}
                      onChange={(e) => {
                        setFormData({ ...formData, experienceYears: Math.max(0, parseInt(e.target.value) || 0) });
                        if (formErrors.experienceYears) setFormErrors({ ...formErrors, experienceYears: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8] ${
                        formErrors.experienceYears ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.experienceYears && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.experienceYears}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interview">Interview</option>
                      <option value="Selected">Selected</option>
                      <option value="Onboarding">Onboarding</option>
                    </select>
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Education</label>
                    <input
                      type="text"
                      placeholder="e.g. B.S. Computer Science, M.S. Design"
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0473b8]"
                    />
                  </div>

                  {/* Resume / Portfolio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Resume Link / Document</label>
                    <input
                      type="text"
                      placeholder="e.g. https://drive.google.com/resume.pdf"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0473b8]"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Key Skills <span className="text-red-500">*</span> <span className="text-[10px] text-slate-400 font-normal">(Separate with commas)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. React, TypeScript, Node.js, GraphQL, UI/UX"
                    value={formData.skills}
                    onChange={(e) => {
                      setFormData({ ...formData, skills: e.target.value });
                      if (formErrors.skills) setFormErrors({ ...formErrors, skills: '' });
                    }}
                    className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0473b8] ${
                      formErrors.skills ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.skills && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.skills}</span>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes / Assessment</label>
                  <textarea
                    rows={2}
                    placeholder="Add any recruitment observations or skill highlights..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none resize-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Candidate...</span>
                    </>
                  ) : (
                    <span>Save Candidate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CANDIDATE DETAIL MODAL ===================== */}
      {isCandidateDetailOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0473b8] font-bold flex items-center justify-center text-xs">
                  {selectedCandidate.name ? selectedCandidate.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedCandidate.poolCategory || selectedCandidate.talentPool || 'Talent Pool'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCandidateDetailOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                  <span className="font-bold text-slate-800 break-all">{selectedCandidate.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Experience</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.experienceYears || 0} Years</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Education</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.education || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <div className="mt-1">
                    <Badge variant="info" size="sm">{selectedCandidate.status || 'Applied'}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Resume</span>
                  <span className="font-bold text-[#0473b8] truncate block">
                    {selectedCandidate.resumeUrl ? (
                      <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>View Document</span>
                      </a>
                    ) : (
                      'None'
                    )}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                    selectedCandidate.skills.map((s, idx) => (
                      <span key={idx} className="text-xs font-bold bg-blue-50 text-[#0473b8] px-2.5 py-1 rounded-md border border-blue-100">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {selectedCandidate.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedCandidate.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCandidateDetailOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentPoolTab;
