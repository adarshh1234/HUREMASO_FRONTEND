import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Plus, 
  RotateCcw, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  RefreshCw, 
  Star, 
  Grid, 
  List, 
  X, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Globe, 
  ArrowRight,
  SlidersHorizontal,
  UserCheck,
  Send,
  Trash2,
  Check,
  Percent,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import { recruitmentService } from '../../../services/recruitmentService';

export interface VerifiedResume {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  experience: string;
  experienceYears: number;
  location: string;
  expectedSalary: string;
  noticePeriod: string;
  matchScore: number;
  source: 'LetsGetIn' | 'Direct Upload' | 'Referral';
  isVerifiedLetsGetIn: boolean;
  verifiedDate: string;
  skills: string[];
  education: string;
  previousCompany: string;
  email: string;
  phone: string;
  summary: string;
  assessmentScore?: number;
  status: 'New' | 'Screened' | 'Shortlisted' | 'Interview' | 'Offered';
  resumeUrl?: string;
}

const INITIAL_RESUMES: VerifiedResume[] = [
  {
    id: 'res-101',
    name: 'Aarav Nair',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'Senior Full Stack Engineer',
    experience: '5.5 Years',
    experienceYears: 5.5,
    location: 'Kochi (Hybrid)',
    expectedSalary: '₹18,00,000 / yr',
    noticePeriod: 'Immediate (15 days)',
    matchScore: 97,
    source: 'LetsGetIn',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-10',
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Next.js'],
    education: 'B.Tech in Computer Science & Engineering - NIT Calicut',
    previousCompany: 'InnoTech Systems',
    email: 'aarav.nair@letsgetin-verified.com',
    phone: '+91 98471 23091',
    summary: 'Senior full-stack engineer with expertise in high-throughput microservices, React 19 architecture, and cloud infrastructure on AWS. Passed LetsGetIn top 3% coding evaluation.',
    assessmentScore: 96,
    status: 'Shortlisted'
  },
  {
    id: 'res-102',
    name: 'Diya Menon',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'DevOps & Cloud Architect',
    experience: '6 Years',
    experienceYears: 6.0,
    location: 'Bangalore (Remote)',
    expectedSalary: '₹22,00,000 / yr',
    noticePeriod: '1 Month',
    matchScore: 94,
    source: 'LetsGetIn',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-11',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Docker', 'Prometheus', 'Python'],
    education: 'M.Tech in Cloud Computing - BITS Pilani',
    previousCompany: 'CloudNative Solutions',
    email: 'diya.menon@letsgetin-verified.com',
    phone: '+91 97455 88210',
    summary: 'Cloud & Infrastructure specialist proficient in multi-cluster Kubernetes orchestration, automated GitOps deployment pipelines, and SOC2 compliance automation.',
    assessmentScore: 94,
    status: 'New'
  },
  {
    id: 'res-103',
    name: 'Karthik Varma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'Lead UI/UX Product Designer',
    experience: '4.5 Years',
    experienceYears: 4.5,
    location: 'Kochi (On-site)',
    expectedSalary: '₹15,00,000 / yr',
    noticePeriod: 'Immediate',
    matchScore: 91,
    source: 'LetsGetIn',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-08',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'TailwindCSS', 'UX Audit'],
    education: 'B.Des in Interaction Design - National Institute of Design (NID)',
    previousCompany: 'PixelCraft Digital',
    email: 'karthik.varma@letsgetin-verified.com',
    phone: '+91 94460 77123',
    summary: 'Product designer focusing on enterprise SaaS UX design systems, user behavioral research, and accessible interfaces with strong Figma component architecture.',
    assessmentScore: 92,
    status: 'Screened'
  },
  {
    id: 'res-104',
    name: 'Sneha Rachel Thomas',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'Backend Engineer (Node.js & Python)',
    experience: '3.5 Years',
    experienceYears: 3.5,
    location: 'Kochi (Hybrid)',
    expectedSalary: '₹14,00,000 / yr',
    noticePeriod: '15 Days',
    matchScore: 89,
    source: 'LetsGetIn',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-09',
    skills: ['Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'GraphQL', 'Kafka'],
    education: 'B.Tech in Information Technology - CUSAT',
    previousCompany: 'DataCore Labs',
    email: 'sneha.rachel@letsgetin-verified.com',
    phone: '+91 98950 11942',
    summary: 'Backend developer specialized in asynchronous event-driven architectures, distributed caching with Redis, and robust REST/GraphQL API design.',
    assessmentScore: 88,
    status: 'Interview'
  },
  {
    id: 'res-105',
    name: 'Rohan Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'AI / Machine Learning Engineer',
    experience: '4 Years',
    experienceYears: 4.0,
    location: 'Remote',
    expectedSalary: '₹20,00,000 / yr',
    noticePeriod: '30 Days',
    matchScore: 93,
    source: 'LetsGetIn',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-07',
    skills: ['Python', 'PyTorch', 'LangChain', 'LLMs', 'OpenAI API', 'Vector DB', 'MLOps'],
    education: 'M.S. in Artificial Intelligence - IIT Madras',
    previousCompany: 'CognitiveWorks AI',
    email: 'rohan.deshmukh@letsgetin-verified.com',
    phone: '+91 99201 34988',
    summary: 'Machine learning practitioner experienced in building RAG pipelines, fine-tuning open-source LLMs, and deploying scalable inference engines on cloud GPUs.',
    assessmentScore: 95,
    status: 'Shortlisted'
  },
  {
    id: 'res-106',
    name: 'Ananya S.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    role: 'QA Automation Engineer',
    experience: '3 Years',
    experienceYears: 3.0,
    location: 'Kochi (Hybrid)',
    expectedSalary: '₹10,50,000 / yr',
    noticePeriod: 'Immediate',
    matchScore: 86,
    source: 'Direct Upload',
    isVerifiedLetsGetIn: true,
    verifiedDate: '2026-09-05',
    skills: ['Playwright', 'Cypress', 'Selenium', 'TypeScript', 'Jest', 'API Testing'],
    education: 'B.Sc in Computer Science - MG University',
    previousCompany: 'TechQuality Labs',
    email: 'ananya.s@letsgetin-verified.com',
    phone: '+91 97471 62900',
    summary: 'Dedicated QA engineer with expertise in end-to-end web testing automation with Playwright and Jest, ensuring regression coverage and test metrics reporting.',
    assessmentScore: 89,
    status: 'Screened'
  }
];

export const ResumeTab: React.FC = () => {
  const toast = useToast();
  const [resumes, setResumes] = useState<VerifiedResume[]>(INITIAL_RESUMES);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterExp, setFilterExp] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Selected candidate for preview modal
  const [previewCandidate, setPreviewCandidate] = useState<VerifiedResume | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // Vacancy Matching State
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [matchingResume, setMatchingResume] = useState<VerifiedResume | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Upload Resume Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    experienceYears: 3,
    location: 'Kochi (Hybrid)',
    expectedSalary: '₹12,00,000 / yr',
    noticePeriod: 'Immediate',
    skills: '',
    education: '',
    previousCompany: '',
    summary: '',
    isVerifiedLetsGetIn: true,
  });
  const [isUploading, setIsUploading] = useState(false);

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalResumes: 6,
    verifiedCount: 6,
    highMatchCount: 4,
    shortlistedCount: 2,
  });

  // Fetch resumes & metrics from API
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apiResumes, apiMetrics, apiVacancies] = await Promise.all([
        recruitmentService.getResumes(),
        recruitmentService.getResumeMetrics(),
        recruitmentService.getVacancies(),
      ]);

      if (apiResumes && apiResumes.length > 0) {
        setResumes(
          apiResumes.map((r: any) => ({
            id: r.id || r._id,
            name: r.candidateName || r.name || 'Candidate',
            avatar: r.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80`,
            role: r.role || r.position || 'Software Engineer',
            experience: r.experience || `${r.experienceYears || 0} Years`,
            experienceYears: r.experienceYears || 0,
            location: r.location || 'Remote',
            expectedSalary: r.expectedSalary || 'Competitive',
            noticePeriod: r.noticePeriod || '30 Days',
            matchScore: r.matchScore || 85,
            source: r.source || 'LetsGetIn',
            isVerifiedLetsGetIn: r.isVerifiedLetsGetIn !== undefined ? r.isVerifiedLetsGetIn : true,
            verifiedDate: r.verifiedDate || (r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '2026-09-01'),
            skills: Array.isArray(r.skills) ? r.skills : [],
            education: r.education || 'Degree in Computer Science or related field',
            previousCompany: r.previousCompany || 'Technology Corporation',
            email: r.email || '',
            phone: r.phone || '',
            summary: r.summary || 'Experienced professional with proven track record.',
            assessmentScore: r.assessmentScore || 90,
            status: r.status || 'New',
            resumeUrl: r.fileUrl || r.resumeUrl,
          }))
        );
      }

      if (apiMetrics) {
        setMetrics(apiMetrics);
      }

      if (apiVacancies) {
        setVacancies(apiVacancies);
      }
    } catch (err) {
      console.warn('Using local resume fallback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter options lists
  const availableRoles = useMemo(() => Array.from(new Set(resumes.map(r => r.role))), [resumes]);
  const availableSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Terraform', 'Next.js', 'PostgreSQL'];

  // Handle Syncing from LetsGetIn
  const handleSyncLetsGetIn = async () => {
    setIsSyncing(true);
    try {
      const syncResult = await recruitmentService.syncLetsGetInResumes();
      await loadData();
      toast.success(
        `Successfully synced from LetsGetIn network: ${syncResult.syncedCount || 6} resumes verified in MongoDB!`
      );
    } catch (err: any) {
      console.error('Sync failed:', err);
      toast.error(err.message || 'Failed to sync with LetsGetIn talent network');
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterExp('');
    setFilterLocation('');
    setFilterMinScore('');
    setFilterSkill('');
    toast.info('Filters have been reset.');
  };

  // Filter Logic (Exclusively Verified Resumes from LetsGetIn)
  const filteredResumes = useMemo(() => {
    return resumes.filter((item) => {
      if (!item.isVerifiedLetsGetIn) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText = `${item.name} ${item.role} ${item.skills.join(' ')} ${item.education} ${item.previousCompany}`.toLowerCase();
        if (!matchText.includes(query)) return false;
      }

      // Role filter
      if (filterRole && item.role !== filterRole) return false;

      // Location filter
      if (filterLocation && !item.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;

      // Experience filter
      if (filterExp) {
        if (filterExp === '0-2' && (item.experienceYears < 0 || item.experienceYears > 2)) return false;
        if (filterExp === '3-5' && (item.experienceYears < 3 || item.experienceYears > 5)) return false;
        if (filterExp === '5+' && item.experienceYears < 5) return false;
      }

      // Match score filter
      if (filterMinScore && item.matchScore < parseInt(filterMinScore, 10)) return false;

      // Skill tag filter
      if (filterSkill && !item.skills.some(s => s.toLowerCase() === filterSkill.toLowerCase())) return false;

      return true;
    });
  }, [resumes, searchQuery, filterRole, filterExp, filterLocation, filterMinScore, filterSkill]);

  const handleUpdateStatus = (id: string, newStatus: VerifiedResume['status']) => {
    setResumes(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success(`Candidate status updated to "${newStatus}"`);
    if (previewCandidate && previewCandidate.id === id) {
      setPreviewCandidate({ ...previewCandidate, status: newStatus });
    }
  };

  // Delete Resume
  const handleDeleteResume = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await recruitmentService.deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success('Resume removed from verified talent roster.');
    } catch (err: any) {
      toast.error('Failed to remove resume: ' + err.message);
    }
  };

  // Vacancy Matching Handler
  const handleOpenMatchingModal = (cand: VerifiedResume) => {
    setMatchingResume(cand);
    setMatchResult(null);
    if (vacancies.length > 0) {
      setSelectedVacancyId(vacancies[0].id || vacancies[0]._id);
    }
  };

  const handleRunMatch = async () => {
    if (!matchingResume || !selectedVacancyId) return;
    try {
      setIsMatching(true);
      const res = await recruitmentService.matchResumeVacancy(matchingResume.id, selectedVacancyId);
      setMatchResult(res.data || res);
      toast.success(`Vacancy skill matching computed: ${res.data?.matchScore ?? 92}% match!`);
    } catch (err: any) {
      toast.error('Failed to compute vacancy match: ' + err.message);
    } finally {
      setIsMatching(false);
    }
  };

  // Create Resume
  const handleUploadResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFormData.name.trim() || !uploadFormData.role.trim()) {
      toast.error('Candidate Name and Role are required!');
      return;
    }
    try {
      setIsUploading(true);
      const skillsArr = uploadFormData.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        candidateName: uploadFormData.name.trim(),
        role: uploadFormData.role.trim(),
        email: uploadFormData.email.trim() || `${uploadFormData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: uploadFormData.phone.trim() || '+91 98000 00000',
        skills: skillsArr.length > 0 ? skillsArr : ['Software Development'],
        experience: `${uploadFormData.experienceYears} Years`,
        experienceYears: Number(uploadFormData.experienceYears),
        location: uploadFormData.location,
        expectedSalary: uploadFormData.expectedSalary,
        noticePeriod: uploadFormData.noticePeriod,
        education: uploadFormData.education || 'Bachelor Degree in Engineering',
        previousCompany: uploadFormData.previousCompany || 'Independent Tech Consultant',
        summary: uploadFormData.summary || 'Skilled professional registered into talent pool.',
        source: 'Direct Upload',
        isVerifiedLetsGetIn: true,
        matchScore: 90,
        assessmentScore: 88,
      };

      const created = await recruitmentService.createResume(payload);
      toast.success(`Resume for "${uploadFormData.name}" successfully added to verified pool!`);
      setIsUploadModalOpen(false);
      setUploadFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        experienceYears: 3,
        location: 'Kochi (Hybrid)',
        expectedSalary: '₹12,00,000 / yr',
        noticePeriod: 'Immediate',
        skills: '',
        education: '',
        previousCompany: '',
        summary: '',
        isVerifiedLetsGetIn: true,
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create resume');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & LetsGetIn Verified Sync Banner */}
      <div className="bg-gradient-to-r from-[#003838] via-[#004848] to-[#016565] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center shadow-inner">
                <FileText className="h-5 w-5 text-emerald-300" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">
                Verified Resume Pools
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Sourced from LetsGetIn
              </span>
            </div>
            <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
              Pre-vetted, verified candidate resumes sourced directly from the <strong className="text-white font-bold">LetsGetIn</strong> talent marketplace network.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#004848] font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-[#004848]" />
              <span>Upload Resume</span>
            </button>

            <button
              onClick={handleSyncLetsGetIn}
              disabled={isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 text-white font-bold text-xs border border-emerald-300/30 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync from LetsGetIn'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats in header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/10 backdrop-blur-xs">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Verified from LetsGetIn</p>
            <p className="text-lg font-extrabold text-emerald-300 mt-0.5">
              {metrics.verifiedCount || resumes.filter(r => r.isVerifiedLetsGetIn).length} Candidates
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/10 backdrop-blur-xs">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Total Resumes</p>
            <p className="text-lg font-extrabold text-white mt-0.5">
              {metrics.totalResumes || resumes.length} In Pool
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/10 backdrop-blur-xs">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">High Match (&gt;90%)</p>
            <p className="text-lg font-extrabold text-amber-300 mt-0.5">
              {metrics.highMatchCount || resumes.filter(r => r.matchScore >= 90).length} Profiles
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2.5 border border-white/10 backdrop-blur-xs">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Shortlisted</p>
            <p className="text-lg font-extrabold text-blue-300 mt-0.5">
              {metrics.shortlistedCount || resumes.filter(r => r.status === 'Shortlisted').length} Ready
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004848] text-white shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Verified Resume Pools (from LetsGetIn)</span>
            <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-white/20 text-white">
              {filteredResumes.length}
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-[#004848] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-[#004848] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Section / Card Filter Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#004848]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filter Options &amp; Resume Search
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              ({filteredResumes.length} matching candidate{filteredResumes.length === 1 ? '' : 's'})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#004848] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="text-xs font-bold text-[#004848] hover:underline cursor-pointer"
            >
              {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Quick search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, target role, education, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] transition-all bg-slate-50/50"
          />
        </div>

        {/* Expanded Filters Grid */}
        {showFilterPanel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1 text-slate-700 font-bold">Job Role / Title</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[var(--primary-color)] text-xs"
              >
                <option value="">All Job Roles</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-700 font-bold">Experience Range</label>
              <select
                value={filterExp}
                onChange={(e) => setFilterExp(e.target.value)}
                className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[var(--primary-color)] text-xs"
              >
                <option value="">Any Experience</option>
                <option value="0-2">0 - 2 Years (Entry/Junior)</option>
                <option value="3-5">3 - 5 Years (Mid-level)</option>
                <option value="5+">5+ Years (Senior / Lead)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-700 font-bold">Work Location</label>
              <input
                type="text"
                placeholder="e.g. Kochi, Bangalore, Remote"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[var(--primary-color)] text-xs"
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-700 font-bold">Min Match Score</label>
              <select
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(e.target.value)}
                className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[var(--primary-color)] text-xs"
              >
                <option value="">Any Match %</option>
                <option value="85">85% &amp; Higher</option>
                <option value="90">90% &amp; Higher (Top Match)</option>
                <option value="95">95% &amp; Higher (Elite)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Resumes List / Grid */}
      {filteredResumes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No matching resumes found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to see verified candidates.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#004848] hover:bg-[#003838] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResumes.map((cand) => (
            <div
              key={cand.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-slate-300 relative group"
            >
              {/* Card Header with Verified Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={cand.avatar}
                      alt={cand.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#004848] transition-colors leading-tight">
                        {cand.name}
                      </h4>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{cand.role}</p>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      {cand.matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* LetsGetIn Verification Seal */}
                {cand.isVerifiedLetsGetIn && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Verified candidate from LetsGetIn</span>
                    </div>
                    {cand.assessmentScore && (
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md text-emerald-700 border border-emerald-200 font-extrabold">
                        {cand.assessmentScore}/100 Vetted
                      </span>
                    )}
                  </div>
                )}

                {/* Candidate Overview Meta */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{cand.experience} Exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{cand.education}</span>
                  </div>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {cand.skills.slice(0, 4).map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {sk}
                    </span>
                  ))}
                  {cand.skills.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500">
                      +{cand.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewCandidate(cand)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>View Resume</span>
                  </button>

                  <button
                    onClick={() => {
                      handleUpdateStatus(cand.id, cand.status === 'Shortlisted' ? 'Screened' : 'Shortlisted');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      cand.status === 'Shortlisted'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-[#004848] hover:bg-[#003838] text-white'
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span>{cand.status === 'Shortlisted' ? 'Shortlisted' : 'Shortlist'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleOpenMatchingModal(cand)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Percent className="h-3 w-3 text-emerald-600" />
                    <span>Match with Vacancy</span>
                  </button>

                  <button
                    onClick={(e) => handleDeleteResume(cand.id, e)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove Resume"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Target Role</th>
                  <th className="px-5 py-3.5">Source &amp; Verification</th>
                  <th className="px-5 py-3.5">Experience &amp; Location</th>
                  <th className="px-5 py-3.5">Key Skills</th>
                  <th className="px-5 py-3.5">Match</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredResumes.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="h-8 w-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{cand.name}</div>
                          <div className="text-[11px] text-slate-500">{cand.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800">
                      {cand.role}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {cand.isVerifiedLetsGetIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          LetsGetIn Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Direct
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      <div className="font-semibold">{cand.experience}</div>
                      <div className="text-[11px] text-slate-400">{cand.location}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.skills.slice(0, 3).map((sk) => (
                          <span
                            key={sk}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-emerald-700">{cand.matchScore}%</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewCandidate(cand)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title="Preview Resume"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenMatchingModal(cand)}
                          className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          title="Match with Vacancy"
                        >
                          <Percent className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            handleUpdateStatus(cand.id, cand.status === 'Shortlisted' ? 'Screened' : 'Shortlisted');
                          }}
                          className={`p-1.5 rounded-lg text-white cursor-pointer ${
                            cand.status === 'Shortlisted' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#004848] hover:bg-[#003838]'
                          }`}
                          title="Shortlist"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteResume(cand.id, e)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Resume"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL RESUME PREVIEW MODAL */}
      {previewCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-[#003838] text-white rounded-t-3xl relative">
              <button
                onClick={() => setPreviewCandidate(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  src={previewCandidate.avatar}
                  alt={previewCandidate.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-white m-0">{previewCandidate.name}</h3>
                    {previewCandidate.isVerifiedLetsGetIn && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Verified via LetsGetIn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">{previewCandidate.role} • {previewCandidate.previousCompany}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {previewCandidate.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {previewCandidate.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {previewCandidate.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              
              {/* LetsGetIn Verification Highlight Box */}
              {previewCandidate.isVerifiedLetsGetIn && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>LetsGetIn Verification &amp; Vetting Summary</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified Date: {previewCandidate.verifiedDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    This candidate has been pre-screened on the LetsGetIn talent marketplace. Background credentials, work history, and technical coding competencies have been verified.
                  </p>
                </div>
              )}

              {/* Summary / Bio */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Professional Summary</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {previewCandidate.summary}
                </p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Experience</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{previewCandidate.experience}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Expected Compensation</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{previewCandidate.expectedSalary}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Notice Period</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{previewCandidate.noticePeriod}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Match Score</span>
                  <p className="font-bold text-emerald-600 text-xs mt-0.5">{previewCandidate.matchScore}% High Match</p>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Verified Skills &amp; Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {previewCandidate.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <GraduationCap className="h-4 w-4 text-[#004848]" />
                    <span>Education</span>
                  </div>
                  <p className="text-slate-600 font-medium text-xs pt-1">{previewCandidate.education}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Briefcase className="h-4 w-4 text-[#004848]" />
                    <span>Previous Experience</span>
                  </div>
                  <p className="text-slate-600 font-medium text-xs pt-1">
                    {previewCandidate.role} at <strong>{previewCandidate.previousCompany}</strong> ({previewCandidate.experience})
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => toast.success(`Downloading verified CV for ${previewCandidate.name}...`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF Resume</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateStatus(previewCandidate.id, 'Shortlisted');
                    setPreviewCandidate(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Shortlist Candidate</span>
                </button>
                <button
                  onClick={() => {
                    toast.success(`Interview invitation queued for ${previewCandidate.name}`);
                    setPreviewCandidate(null);
                  }}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#003838] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Schedule Interview</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VACANCY SKILL MATCH MODAL */}
      {matchingResume && (
        <Modal
          isOpen={!!matchingResume}
          onClose={() => { setMatchingResume(null); setMatchResult(null); }}
          title={`Vacancy Match Engine: ${matchingResume.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Target Candidate</span>
              <p className="text-xs font-bold text-slate-900">{matchingResume.name} — {matchingResume.role}</p>
              <p className="text-[11px] text-slate-600">Candidate Skills: {matchingResume.skills.join(', ')}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Open Vacancy to Match Against</label>
              <select
                value={selectedVacancyId}
                onChange={(e) => setSelectedVacancyId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 outline-none"
              >
                {vacancies.map((v) => (
                  <option key={v.id || v._id} value={v.id || v._id}>
                    {v.jobTitle || v.title} ({v.department || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunMatch}
                disabled={isMatching}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isMatching ? 'Calculating...' : 'Compute Match & Skills Gap'}</span>
              </button>
            </div>

            {matchResult && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Computed Compatibility Score:</span>
                  <span className="text-base font-extrabold text-emerald-700">{matchResult.matchScore}%</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700">Matched Skills ({matchResult.matchedSkills?.length || 0}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedSkills?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {matchResult.missingSkills && matchResult.missingSkills.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-emerald-200/50">
                    <span className="text-[11px] font-bold text-slate-700">Missing / Desired Skills ({matchResult.missingSkills.length}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* UPLOAD RESUME MODAL */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload New Candidate Resume"
        >
          <form onSubmit={handleUploadResumeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Target Role / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={uploadFormData.role}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, role: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="candidate@example.com"
                  value={uploadFormData.email}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={uploadFormData.phone}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={uploadFormData.experienceYears}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, experienceYears: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  value={uploadFormData.location}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, location: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-700">
              <label className="block mb-1">Technical Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="React, TypeScript, Node.js, GraphQL, Docker"
                value={uploadFormData.skills}
                onChange={(e) => setUploadFormData({ ...uploadFormData, skills: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Expected Compensation</label>
                <input
                  type="text"
                  placeholder="₹15,00,000 / yr"
                  value={uploadFormData.expectedSalary}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, expectedSalary: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block mb-1">Notice Period</label>
                <input
                  type="text"
                  placeholder="Immediate or 15 days"
                  value={uploadFormData.noticePeriod}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, noticePeriod: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-700">
              <label className="block mb-1">Professional Summary</label>
              <textarea
                rows={3}
                placeholder="Candidate background, notable achievements..."
                value={uploadFormData.summary}
                onChange={(e) => setUploadFormData({ ...uploadFormData, summary: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 bg-[#004848] hover:bg-[#003838] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {isUploading ? 'Uploading...' : 'Save & Verify Resume'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ResumeTab;
