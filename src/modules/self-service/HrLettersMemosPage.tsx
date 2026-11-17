import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Loader2,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  User,
  Shield,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/common/Modal';
import {
  hrLetterService,
  CommunicationItem,
  IssuedLetterItem,
  EmployeePickerItem,
  HRLetterStats,
} from '../../services/hrLetterService';

type TabType = 'memo' | 'notice' | 'circular' | 'letter';

export const HrLettersMemosPage: React.FC = () => {
  const toast = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('memo');

  // Data States
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [letters, setLetters] = useState<IssuedLetterItem[]>([]);
  const [employees, setEmployees] = useState<EmployeePickerItem[]>([]);
  const [stats, setStats] = useState<HRLetterStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCategory, setAiCategory] = useState<TabType>('memo');
  const [aiSubject, setAiSubject] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiDepartment, setAiDepartment] = useState('Engineering');
  const [aiEmployeeId, setAiEmployeeId] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [generatedRef, setGeneratedRef] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Create Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: '',
    referenceNumber: '',
    content: '',
    department: 'Engineering',
    targetAudience: 'All Staff',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    employeeId: '',
    letterType: 'Experience Certificate',
    status: 'Published' as 'Draft' | 'Published',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<{
    id: string;
    isLetter: boolean;
    title: string;
    subject: string;
    referenceNumber: string;
    content: string;
    department: string;
    targetAudience: string;
    priority: string;
    status: string;
    employeeId?: string;
  } | null>(null);

  // Preview Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    type: string;
    referenceNumber: string;
    date: string;
    department: string;
    author: string;
    status: string;
    content: string;
    recipientName?: string;
    recipientId?: string;
    id?: string;
    isLetter?: boolean;
  } | null>(null);

  // Delete Confirmation Modal
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    isLetter: boolean;
  }>({ isOpen: false, id: '', title: '', isLetter: false });

  // Load Main Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, empList] = await Promise.all([
        hrLetterService.getStats().catch(() => null),
        hrLetterService.getEmployees().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (empList.length > 0) setEmployees(empList);

      if (activeTab === 'letter') {
        const list = await hrLetterService.getRecords();
        setLetters(list || []);
      } else {
        const list = await hrLetterService.getCommunications({ type: activeTab });
        setCommunications(list || []);
      }
    } catch (err: any) {
      console.error('Failed to load communication data:', err);
      toast.error('Failed to load document records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Derived filtered items
  const filteredCommunications = useMemo(() => {
    return communications.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept =
        departmentFilter === 'all' ||
        item.department?.toLowerCase().includes(departmentFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'all' ||
        item.priority?.toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus && matchesPriority;
    });
  }, [communications, searchTerm, departmentFilter, statusFilter, priorityFilter]);

  const filteredLetters = useMemo(() => {
    return letters.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.letterType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        item.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [letters, searchTerm, statusFilter]);

  // Handle AI Generation
  const handleGenerateAi = async () => {
    if (!aiSubject.trim()) {
      toast.error('Please enter a subject or topic for the draft!');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await hrLetterService.generateAIDraft({
        category: aiCategory,
        subject: aiSubject.trim(),
        instructions: aiInstructions.trim(),
        department: aiDepartment,
        employeeId: aiEmployeeId || undefined,
        priority: 'Medium',
      });

      setGeneratedDraft(res.content);
      setGeneratedRef(res.suggestedReferenceNumber);
      toast.success(`Draft generated using ${res.model}!`);
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed. Please try again or draft manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save AI Draft
  const handleSaveAiDraft = async (asPublished: boolean) => {
    if (!generatedDraft.trim()) {
      toast.error('Draft content cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      const docStatus = asPublished ? 'Published' : 'Draft';

      if (aiCategory === 'letter') {
        const empId = aiEmployeeId || (employees[0] ? employees[0].employeeId : 'EMP2024001');
        const emp = employees.find((e) => e.employeeId === empId);

        await hrLetterService.createRecord({
          referenceNumber: generatedRef || undefined,
          employeeId: empId,
          employeeName: emp?.name,
          designation: emp?.jobTitle,
          department: emp?.department || aiDepartment,
          letterType: 'HR Official Letter',
          subject: aiSubject || 'HR Official Letter',
          content: generatedDraft,
          status: asPublished ? 'Issued' : 'Draft',
        });
      } else {
        await hrLetterService.createCommunication({
          referenceNumber: generatedRef || undefined,
          title: aiSubject || `Official ${aiCategory.toUpperCase()}`,
          subject: aiSubject,
          type: aiCategory,
          content: generatedDraft,
          department: aiDepartment,
          targetAudience: 'All Staff',
          author: 'HR Operations Team',
          priority: 'Medium',
          status: docStatus,
        });
      }

      toast.success(asPublished ? 'Document successfully published!' : 'Draft saved to records!');
      setShowAiModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Manual Document Creation
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Document title is required');
      return;
    }
    if (!createForm.content.trim()) {
      toast.error('Document content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (activeTab === 'letter') {
        const empId = createForm.employeeId || (employees[0] ? employees[0].employeeId : 'EMP2024001');
        const emp = employees.find((e) => e.employeeId === empId);

        await hrLetterService.createRecord({
          referenceNumber: createForm.referenceNumber.trim() || undefined,
          employeeId: empId,
          employeeName: emp?.name,
          designation: emp?.jobTitle,
          department: emp?.department || createForm.department,
          letterType: createForm.letterType,
          subject: createForm.title.trim(),
          content: createForm.content.trim(),
          effectiveDate: createForm.effectiveDate,
          status: createForm.status === 'Published' ? 'Issued' : 'Draft',
        });
      } else {
        await hrLetterService.createCommunication({
          referenceNumber: createForm.referenceNumber.trim() || undefined,
          type: activeTab,
          title: createForm.title.trim(),
          subject: createForm.subject.trim() || createForm.title.trim(),
          content: createForm.content.trim(),
          department: createForm.department,
          targetAudience: createForm.targetAudience,
          priority: createForm.priority,
          effectiveDate: createForm.effectiveDate,
          expiryDate: createForm.expiryDate || undefined,
          status: createForm.status,
          author: 'HR Operations Team',
        });
      }

      toast.success('Document created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        subject: '',
        referenceNumber: '',
        content: '',
        department: 'Engineering',
        targetAudience: 'All Staff',
        priority: 'Medium',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        employeeId: '',
        letterType: 'Experience Certificate',
        status: 'Published',
      });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Submission
  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      setIsSubmitting(true);
      if (editItem.isLetter) {
        await hrLetterService.updateRecord(editItem.id, {
          subject: editItem.title,
          content: editItem.content,
          status: editItem.status as any,
        });
      } else {
        await hrLetterService.updateCommunication(editItem.id, {
          title: editItem.title,
          subject: editItem.subject || editItem.title,
          content: editItem.content,
          department: editItem.department,
          targetAudience: editItem.targetAudience,
          priority: editItem.priority as any,
          status: editItem.status as any,
        });
      }

      toast.success('Document updated successfully!');
      setShowEditModal(false);
      setEditItem(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Publish Action
  const handlePublishNow = async (id: string, isLetter: boolean) => {
    try {
      if (isLetter) {
        await hrLetterService.updateRecord(id, { status: 'Issued' });
      } else {
        await hrLetterService.updateCommunicationStatus(id, 'Published');
      }
      toast.success('Document published to records!');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish document');
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    try {
      if (deleteDialog.isLetter) {
        await hrLetterService.deleteRecord(deleteDialog.id);
      } else {
        await hrLetterService.deleteCommunication(deleteDialog.id);
      }
      toast.success('Document removed successfully');
      setDeleteDialog({ isOpen: false, id: '', title: '', isLetter: false });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    }
  };

  // Functional Real PDF Downloads
  const handleDownloadPDF = async (item: CommunicationItem | IssuedLetterItem, isLetter: boolean) => {
    try {
      toast.success('Generating official PDF document...');
      if (isLetter) {
        const rec = item as IssuedLetterItem;
        const filename = `HUREMASO_LETTER_${rec.referenceNumber || rec.id}.pdf`;
        await hrLetterService.downloadIssuedLetterPDF(rec.id, filename);
      } else {
        const comm = item as CommunicationItem;
        const filename = `HUREMASO_${comm.type.toUpperCase()}_${comm.referenceNumber || comm.id}.pdf`;
        await hrLetterService.downloadCommunicationPDF(comm.id, filename);
      }
      toast.success('PDF downloaded successfully!');
    } catch (err: any) {
      console.error('Download PDF error:', err);
      toast.error(err.message || 'Failed to download PDF. Please try again.');
    }
  };

  // Department list for dropdowns
  const departmentOptions = [
    'All Departments',
    'Engineering',
    'Operations',
    'Finance & Accounts',
    'Human Resources',
    'Marketing',
    'Legal & Compliance',
    'Facilities & IT',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* 1. Dark Teal Gradient Header Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5 text-teal-300" />
            <span>Corporate Communications & Governance</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">HR Letters & Memos</h1>
          <p className="text-xs text-teal-100/80 m-0">
            Publish corporate memos, notices, circulars, and AI-powered official employee letters with genuine PDF generation.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setAiCategory(activeTab);
              setShowAiModal(true);
              setGeneratedDraft('');
              setAiSubject('');
              setAiInstructions('');
            }}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 font-mono"
          >
            <Sparkles className="h-4 w-4 text-slate-900" />
            <span>Draft with AI / API</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Create Document</span>
          </button>
        </div>
      </div>

      {/* 2. Document Metrics Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Docs</span>
            <p className="text-lg font-black text-slate-800 m-0 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Memos</span>
            <p className="text-lg font-black text-teal-700 m-0 mt-0.5">{stats.memos}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Notices</span>
            <p className="text-lg font-black text-blue-700 m-0 mt-0.5">{stats.notices}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Circulars</span>
            <p className="text-lg font-black text-purple-700 m-0 mt-0.5">{stats.circulars}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">HR Letters</span>
            <p className="text-lg font-black text-emerald-700 m-0 mt-0.5">{stats.letters}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Drafts</span>
            <p className="text-lg font-black text-amber-600 m-0 mt-0.5">{stats.drafts}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Published</span>
            <p className="text-lg font-black text-emerald-600 m-0 mt-0.5">{stats.published}</p>
          </div>
        </div>
      )}

      {/* 3. Four Core Tabs */}
      <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
        {[
          { id: 'memo' as const, label: 'Memo List', count: stats?.memos },
          { id: 'notice' as const, label: 'Notice List', count: stats?.notices },
          { id: 'circular' as const, label: 'Circulars List', count: stats?.circulars },
          { id: 'letter' as const, label: 'HR Letters / Notes List', count: stats?.letters },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Search & Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}s by title, ref, employee...`}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#004848] bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {activeTab !== 'letter' && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white text-slate-700 font-semibold"
            >
              <option value="all">All Departments</option>
              {departmentOptions.slice(1).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white text-slate-700 font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="Published">Published / Issued</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Archived">Archived</option>
          </select>

          {activeTab !== 'letter' && (
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white text-slate-700 font-semibold"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          )}

          {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="px-3 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Document Records List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-[#004848] mb-3" />
          <span className="text-xs font-bold text-slate-600">Loading {activeTab} records from database...</span>
        </div>
      ) : activeTab === 'letter' ? (
        // HR LETTERS / NOTES LIST
        <div className="space-y-3">
          {filteredLetters.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 m-0">No HR letters found</h4>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new letter.</p>
            </div>
          ) : (
            filteredLetters.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-[#004848] border border-teal-200 font-mono">
                      {item.referenceNumber || 'LTR-2026'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        item.status === 'Issued' || item.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">• {item.letterType}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 m-0">{item.subject}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <strong>Recipient:</strong> {item.employeeName || 'Sarah Johnson'} ({item.employeeId})
                    </span>
                    <span>
                      <strong>Designation:</strong> {item.designation || 'Staff'}
                    </span>
                    <span>
                      <strong>Date:</strong> {item.issuedDate ? new Date(item.issuedDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setPreviewItem({
                        title: item.subject,
                        type: 'letter',
                        referenceNumber: item.referenceNumber || 'LTR-2026',
                        date: item.issuedDate,
                        department: item.department || 'General',
                        author: item.issuedBy || 'HR Operations',
                        status: item.status,
                        content: item.content,
                        recipientName: item.employeeName,
                        recipientId: item.employeeId,
                        id: item.id,
                        isLetter: true,
                      });
                      setShowPreviewModal(true);
                    }}
                    className="p-2 text-slate-600 hover:text-[#004848] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditItem({
                        id: item.id,
                        isLetter: true,
                        title: item.subject,
                        subject: item.subject,
                        referenceNumber: item.referenceNumber || '',
                        content: item.content,
                        department: item.department || '',
                        targetAudience: item.employeeId,
                        priority: 'Medium',
                        status: item.status,
                        employeeId: item.employeeId,
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Edit Document"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {item.status === 'Draft' && (
                    <button
                      onClick={() => handlePublishNow(item.id, true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Issue</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadPDF(item, true)}
                    className="px-3.5 py-2 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Download Official PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        id: item.id,
                        title: item.subject,
                        isLetter: true,
                      })
                    }
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // MEMO, NOTICE, CIRCULAR LIST
        <div className="space-y-3">
          {filteredCommunications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 m-0">No {activeTab}s found</h4>
              <p className="text-xs text-slate-400 mt-1">
                No official communications match your current filters.
              </p>
            </div>
          ) : (
            filteredCommunications.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-[#004848] border border-teal-200 font-mono">
                      {item.referenceNumber || 'DOC-2026'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        item.status === 'Published' || item.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.priority && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.priority === 'Urgent' || item.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 m-0">{item.title}</h3>

                  <p className="text-xs text-slate-600 line-clamp-2 m-0">{item.content}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <strong>Dept:</strong> {item.department || item.targetAudience || 'All Departments'}
                    </span>
                    <span>
                      <strong>Issued By:</strong> {item.author || 'HR Operations Team'}
                    </span>
                    <span>
                      <strong>Date:</strong> {item.issuedDate ? new Date(item.issuedDate).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setPreviewItem({
                        title: item.title,
                        type: item.type,
                        referenceNumber: item.referenceNumber || 'DOC-2026',
                        date: item.issuedDate || item.date || new Date().toISOString().split('T')[0],
                        department: item.department || item.targetAudience || 'All Organization',
                        author: item.author || 'HR Operations',
                        status: item.status,
                        content: item.content,
                        recipientName: item.recipient,
                        id: item.id,
                        isLetter: false,
                      });
                      setShowPreviewModal(true);
                    }}
                    className="p-2 text-slate-600 hover:text-[#004848] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditItem({
                        id: item.id,
                        isLetter: false,
                        title: item.title,
                        subject: item.subject || item.title,
                        referenceNumber: item.referenceNumber || '',
                        content: item.content,
                        department: item.department || 'Engineering',
                        targetAudience: item.targetAudience || 'All Staff',
                        priority: item.priority || 'Medium',
                        status: item.status,
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Edit Document"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {item.status === 'Draft' && (
                    <button
                      onClick={() => handlePublishNow(item.id, false)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Publish</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadPDF(item, false)}
                    className="px-3.5 py-2 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Download Official PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        id: item.id,
                        title: item.title,
                        isLetter: false,
                      })
                    }
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 6. AI Drafting Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title={`Draft ${aiCategory.toUpperCase()} with AI / API`}
      >
        <div className="space-y-4 text-xs font-semibold text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
          {/* Category Selector */}
          <div>
            <label className="block mb-1 font-bold text-slate-900">Document Category:</label>
            <div className="grid grid-cols-4 gap-2">
              {(['memo', 'notice', 'circular', 'letter'] as TabType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAiCategory(cat)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase cursor-pointer border transition-all ${
                    aiCategory === cat
                      ? 'bg-[#004848] text-white border-transparent'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subject / Topic */}
          <div>
            <label className="block mb-1 font-bold text-slate-900">Subject / Core Topic: *</label>
            <input
              type="text"
              value={aiSubject}
              onChange={(e) => setAiSubject(e.target.value)}
              placeholder="e.g. Annual Office Relocation & Facilities Guidelines..."
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
            />
          </div>

          {/* Department / Employee Context */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-900">Target Department:</label>
              <select
                value={aiDepartment}
                onChange={(e) => setAiDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
              >
                {departmentOptions.slice(1).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {aiCategory === 'letter' && (
              <div>
                <label className="block mb-1 font-bold text-slate-900">Select Employee Recipient:</label>
                <select
                  value={aiEmployeeId}
                  onChange={(e) => setAiEmployeeId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block mb-1 font-bold text-slate-900">Specific Directives & Guidance (Optional):</label>
            <textarea
              rows={2}
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="e.g. Ensure strict compliance deadline of October 15th with emphasis on remote personnel..."
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] resize-none"
            />
          </div>

          {/* Trigger AI Button */}
          <button
            onClick={handleGenerateAi}
            disabled={isGenerating}
            className="w-full py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl hover:bg-[#006666] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-teal-300" />
                <span>Invoking AI Provider & Compiling Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-teal-300" />
                <span>Generate Official Draft</span>
              </>
            )}
          </button>

          {/* Draft Preview & Editor */}
          {generatedDraft && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-900">
                  Review & Edit Generated Content:
                </label>
                <span className="text-[11px] font-mono text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {generatedRef}
                </span>
              </div>

              <textarea
                rows={8}
                value={generatedDraft}
                onChange={(e) => setGeneratedDraft(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-[#004848] resize-y font-mono"
              />

              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAiDraft(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveAiDraft(true)}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Publish Document
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 7. Manual Document Creation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Create New ${activeTab.toUpperCase()}`}
      >
        <form onSubmit={handleCreateDocument} className="space-y-4 text-xs font-semibold text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="block mb-1 font-bold text-slate-900">Title / Subject: *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Q4 Performance Review Schedule"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 font-bold text-slate-900">Reference Number (Optional):</label>
              <input
                type="text"
                value={createForm.referenceNumber}
                onChange={(e) => setCreateForm({ ...createForm, referenceNumber: e.target.value })}
                placeholder="Auto-generated if blank"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] font-mono"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-900">Department / Scope:</label>
              <select
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
              >
                {departmentOptions.slice(1).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === 'letter' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-slate-900">Letter Type:</label>
                <select
                  value={createForm.letterType}
                  onChange={(e) => setCreateForm({ ...createForm, letterType: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                >
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Employment Confirmation Letter">Confirmation Letter</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Relieving Letter">Relieving Letter</option>
                  <option value="Promotion Letter">Promotion Letter</option>
                  <option value="Formal Warning Notice">Warning Notice</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-900">Select Employee: *</label>
                <select
                  required
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId}) — {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-slate-900">Priority Tier:</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-900">Effective Date:</label>
                <input
                  type="date"
                  value={createForm.effectiveDate}
                  onChange={(e) => setCreateForm({ ...createForm, effectiveDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 font-bold text-slate-900">Document Body Content: *</label>
            <textarea
              required
              rows={6}
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              placeholder="Write the full document text here..."
              className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-[#004848] resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-900">Status:</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold bg-white"
              >
                <option value="Published">Publish Immediately</option>
                <option value="Draft">Save as Draft</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Creating...' : 'Create & Save'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Document Modal */}
      {editItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditItem(null);
          }}
          title={`Edit ${editItem.isLetter ? 'HR Letter' : 'Document'}`}
        >
          <form onSubmit={handleUpdateDocument} className="space-y-4 text-xs font-semibold text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="block mb-1 font-bold text-slate-900">Document Title / Subject:</label>
              <input
                type="text"
                required
                value={editItem.title}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-bold text-slate-900">Reference Number:</label>
                <input
                  type="text"
                  disabled
                  value={editItem.referenceNumber}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-slate-100 font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-900">Status:</label>
                <select
                  value={editItem.status}
                  onChange={(e) => setEditItem({ ...editItem, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848] bg-white"
                >
                  <option value="Published">Published / Issued</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-bold text-slate-900">Body Content:</label>
              <textarea
                required
                rows={7}
                value={editItem.content}
                onChange={(e) => setEditItem({ ...editItem, content: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-[#004848] resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 9. Official Document Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewItem(null);
          }}
          title="Official Document Preview"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* Visual Letterhead Container */}
            <div className="border border-slate-300 rounded-xl p-6 bg-white shadow-xs space-y-4">
              {/* Header Bar */}
              <div className="bg-[#004848] text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold tracking-wide m-0">HUREMASO GLOBAL TECHNOLOGIES</h2>
                  <p className="text-[11px] text-teal-100 m-0">Human Resources & Corporate Governance</p>
                </div>
                <span className="px-2.5 py-1 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {previewItem.type.toUpperCase()}
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reference No</span>
                  <strong className="text-slate-800 font-mono">{previewItem.referenceNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                  <strong className="text-slate-800">
                    {previewItem.date ? new Date(previewItem.date).toLocaleDateString() : 'Recent'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Scope / Recipient</span>
                  <strong className="text-slate-800">
                    {previewItem.recipientName
                      ? `${previewItem.recipientName} (${previewItem.recipientId || 'EMP'})`
                      : previewItem.department}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issuing Authority</span>
                  <strong className="text-slate-800">{previewItem.author} • {previewItem.status}</strong>
                </div>
              </div>

              {/* Document Title */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-teal-700 pb-1.5 inline-block">
                  {previewItem.title}
                </h3>
              </div>

              {/* Document Content */}
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[140px] pt-1 font-serif">
                {previewItem.content}
              </div>

              {/* Signatory Footer */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-800 m-0">HUREMASO Global Technologies</p>
                  <p className="text-[10px] text-slate-400 m-0">Official HR Document • Confidential</p>
                </div>
                <div className="text-center w-48 border-t border-slate-400 pt-1">
                  <span className="font-bold text-slate-700 block">Authorized Signatory</span>
                  <span className="text-[10px] text-slate-400 block">HR Operations Team</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewItem(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
              >
                Close
              </button>
              {previewItem.id && (
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPDF(
                      { id: previewItem.id!, referenceNumber: previewItem.referenceNumber } as any,
                      previewItem.isLetter || false
                    );
                  }}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#006666] text-white font-bold rounded-xl cursor-pointer text-xs flex items-center gap-2 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF Document</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 10. Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <Modal
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: '', title: '', isLetter: false })}
          title="Confirm Deletion"
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Are you sure you want to permanently delete <strong>"{deleteDialog.title}"</strong>? This action cannot be undone.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteDialog({ isOpen: false, id: '', title: '', isLetter: false })}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HrLettersMemosPage;
