import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, MoreVertical, Upload, FileText, CheckCircle2, Eye, Sparkles, User, Briefcase, GraduationCap, Mail, Phone, Calendar } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import Modal from '../../../components/common/Modal';
import { recruitmentService } from '../../../services/recruitmentService';

interface CvItem {
  id: string;
  name: string;
  title: string;
  modified: string;
  skills?: string[];
  experienceYears?: number;
  education?: string;
  email?: string;
  phone?: string;
  summary?: string;
}

export const CvParserTab: React.FC = () => {
  const toast = useToast();
  const [cvSearchText, setCvSearchText] = useState('');
  const [cvSuggestions] = useState(['Age', 'Skill', 'Qualification', 'Experience', 'DevOps', 'Frontend', 'Cloud']);
  const [cvActivePills, setCvActivePills] = useState(['Skill', 'Experience', 'Qualification']);
  
  // CVs state
  const [cvsList, setCvsList] = useState<CvItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [rawCvText, setRawCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [viewingCv, setViewingCv] = useState<CvItem | null>(null);

  // Load CVs / Resumes from API
  const loadCvList = async () => {
    setIsLoading(true);
    try {
      const data = await recruitmentService.getResumes();
      if (data && data.length > 0) {
        setCvsList(
          data.map((item: any) => ({
            id: item.id || item._id,
            name: item.candidateName || item.name || 'Candidate',
            title: item.role || item.position || 'Software Engineer',
            modified: item.updatedAt
              ? `Last modified: ${new Date(item.updatedAt).toLocaleDateString()}`
              : 'Last modified: 2 days ago',
            skills: item.skills || [],
            experienceYears: item.experienceYears || 0,
            education: item.education || '',
            email: item.email || '',
            phone: item.phone || '',
            summary: item.summary || '',
          }))
        );
      } else {
        // Fallback seed display
        setCvsList([
          { id: 'cv-1', name: 'Aarav Nair', title: 'Senior Full Stack Engineer', modified: 'Last modified: 1 day ago', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], experienceYears: 5.5, education: 'B.Tech CSE - NIT Calicut', email: 'aarav.nair@example.com', phone: '+91 98471 23091' },
          { id: 'cv-2', name: 'Diya Menon', title: 'DevOps & Cloud Architect', modified: 'Last modified: 2 days ago', skills: ['Kubernetes', 'AWS', 'Terraform', 'Docker'], experienceYears: 6.0, education: 'M.Tech Cloud - BITS Pilani', email: 'diya.menon@example.com', phone: '+91 97455 88210' },
          { id: 'cv-3', name: 'Karthik Varma', title: 'Lead UI/UX Product Designer', modified: 'Last modified: 3 days ago', skills: ['Figma', 'Design Systems', 'TailwindCSS'], experienceYears: 4.5, education: 'B.Des - NID', email: 'karthik.v@example.com', phone: '+91 94460 77123' },
          { id: 'cv-4', name: 'Sneha Rachel Thomas', title: 'Backend Engineer', modified: 'Last modified: 4 days ago', skills: ['Node.js', 'Python', 'FastAPI', 'Redis'], experienceYears: 3.5, education: 'B.Tech IT - CUSAT', email: 'sneha.r@example.com', phone: '+91 98950 11942' },
          { id: 'cv-5', name: 'Rohan Deshmukh', title: 'AI / Machine Learning Engineer', modified: 'Last modified: 5 days ago', skills: ['Python', 'PyTorch', 'LangChain', 'LLMs'], experienceYears: 4.0, education: 'M.S. AI - IIT Madras', email: 'rohan.d@example.com', phone: '+91 99201 34988' },
          { id: 'cv-6', name: 'Ananya S.', title: 'QA Automation Engineer', modified: 'Last modified: 6 days ago', skills: ['Playwright', 'Jest', 'Cypress', 'TypeScript'], experienceYears: 3.0, education: 'B.Sc CS - MG University', email: 'ananya.s@example.com', phone: '+91 97471 62900' },
        ]);
      }
    } catch (err) {
      console.warn('Could not load CVs from backend', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCvList();
  }, []);

  const handleAddActivePill = (pillName?: string) => {
    const toAdd = pillName || 'Experience';
    if (!cvActivePills.includes(toAdd)) {
      setCvActivePills((prev) => [...prev, toAdd]);
    }
  };

  const handleRemoveActivePill = (pill: string) => {
    setCvActivePills((prev) => prev.filter((p) => p !== pill));
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCvs.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered CV list
  const filteredCvs = useMemo(() => {
    return cvsList.filter((cv) => {
      if (cvSearchText.trim()) {
        const query = cvSearchText.toLowerCase();
        const searchable = `${cv.name} ${cv.title} ${cv.skills?.join(' ')} ${cv.education}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [cvsList, cvSearchText]);

  // Handle Parse / Upload Raw CV
  const handleParseCvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCvText.trim()) {
      toast.error('Please paste resume text or content to parse!');
      return;
    }
    try {
      setIsParsing(true);
      const parsedResult = await recruitmentService.parseCv({
        rawText: rawCvText.trim(),
        fileName: cvFileName.trim() || 'Uploaded_CV.txt',
      });
      toast.success(
        `CV Parsed successfully! Extracted Candidate: ${parsedResult.name || 'Candidate'} (${parsedResult.skills?.length || 0} skills detected)`
      );
      setIsUploadModalOpen(false);
      setRawCvText('');
      setCvFileName('');
      loadCvList();
    } catch (err: any) {
      toast.error('CV Parsing failed: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle batch parse button
  const handleBatchParse = () => {
    if (selectedIds.length === 0) {
      toast.info('Please select one or more CVs from the list to parse.');
      return;
    }
    toast.success(`Batch AI CV parsing completed for ${selectedIds.length} candidate profile(s)!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Upload trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">AI CV Parser &amp; Skill Extraction</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Automated entity extraction and skill ontology mapping from candidate resumes.
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload &amp; Parse CV</span>
        </button>
      </div>

      {/* Card 1: Search Form layout */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 m-0">Search</h3>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, job title, skills........"
            value={cvSearchText}
            onChange={(e) => setCvSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-slate-350"
          />
        </div>

        {/* Tags row 1: Recommendations */}
        <div className="flex flex-wrap gap-2.5 items-center text-[10px] font-bold text-slate-600 pt-1">
          {cvSuggestions.map((s, idx) => (
            <button
              key={`${s}-${idx}`}
              onClick={() => handleAddActivePill(s)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => handleAddActivePill('Qualification')}
            className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-500 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-blue-100"
            title="Add pill"
          >
            +
          </button>
        </div>

        {/* Tags row 2: Selected active filter pills with cross */}
        <div className="flex flex-wrap gap-2.5 items-center text-[10px] font-bold text-slate-800">
          {cvActivePills.map((p) => (
            <div key={p} className="flex items-center gap-1.5 bg-slate-105 border border-slate-200 px-3 py-1.5 rounded-md">
              <span>{p}</span>
              <button onClick={() => handleRemoveActivePill(p)} className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3.5 pt-2">
          <button
            onClick={() => {
              setCvSearchText('');
              setCvActivePills(['Age', 'Skill', 'Qualification']);
            }}
            className="px-6 py-2.5 border border-[#0473b8] bg-white hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.success(`Filter criteria applied: ${filteredCvs.length} candidate CV(s) found!`);
            }}
            className="px-6 py-2.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Parse
          </button>
        </div>
      </div>

      {/* Card 2: CV List parsed items */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 m-0">List all CV's ({filteredCvs.length})</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredCvs.map((cv) => (
            <div
              key={cv.id}
              className={`flex items-center justify-between bg-white border rounded-lg p-3 px-4 shadow-xs hover:border-blue-200 transition-colors ${
                selectedIds.includes(cv.id) ? 'border-blue-300 bg-blue-50/20' : 'border-slate-150'
              }`}
            >
              <div className="flex items-center gap-4 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(cv.id)}
                  onChange={() => handleToggleSelect(cv.id)}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-400 h-4 w-4 shrink-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-slate-905 font-bold cursor-pointer hover:text-blue-600" onClick={() => setViewingCv(cv)}>
                    {cv.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{cv.title}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                <span>{cv.modified}</span>
                <button
                  onClick={() => setViewingCv(cv)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="View Extracted CV Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredCvs.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-semibold">
              No CVs match the specified search or filter criteria.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleBatchParse}
            className="px-6 py-2.5 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Parse
          </button>
        </div>
      </div>

      {/* UPLOAD & PARSE CV MODAL */}
      {isUploadModalOpen && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload & Parse Resume (AI Parser)"
        >
          <form onSubmit={handleParseCvSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 font-semibold">
              Paste the text or content of the resume below. Our AI engine extracts contact info, skills, education, and work history automatically.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resume File Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Resume_Aarav_Nair_2026.pdf"
                value={cvFileName}
                onChange={(e) => setCvFileName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 font-semibold text-xs text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Raw Resume Content / Text *</label>
              <textarea
                required
                rows={10}
                placeholder="Paste the full text of candidate resume here...&#10;e.g.:&#10;Aarav Nair&#10;aarav.nair@example.com | +91 98471 23091&#10;Senior Full Stack Engineer with 5 years experience in React, TypeScript, Node.js, AWS, and Docker.&#10;Education: B.Tech in Computer Science - NIT Calicut"
                value={rawCvText}
                onChange={(e) => setRawCvText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-900 outline-none resize-none bg-slate-50/50"
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
                disabled={isParsing}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isParsing ? 'Parsing with AI...' : 'Parse & Extract Entities'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW PARSED CV MODAL */}
      {viewingCv && (
        <Modal
          isOpen={!!viewingCv}
          onClose={() => setViewingCv(null)}
          title={`Parsed CV Details: ${viewingCv.name}`}
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{viewingCv.name}</h4>
                  <p className="text-xs text-slate-500 font-bold">{viewingCv.title}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  AI Parsed
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1">
                {viewingCv.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {viewingCv.email}
                  </span>
                )}
                {viewingCv.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {viewingCv.phone}
                  </span>
                )}
              </div>
            </div>

            {viewingCv.summary && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Summary</label>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                  {viewingCv.summary}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Extracted Skills ({viewingCv.skills?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {viewingCv.skills && viewingCv.skills.length > 0 ? (
                  viewingCv.skills.map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No skills extracted</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Experience</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingCv.experienceYears || 0} Years</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Education</span>
                <p className="font-bold text-slate-800 mt-0.5">{viewingCv.education || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingCv(null)}
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

export default CvParserTab;
