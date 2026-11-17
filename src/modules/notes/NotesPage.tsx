import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Sparkles, 
  Tag as TagIcon, 
  Clock, 
  Trash2, 
  Edit3,
  Copy, 
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  User,
  Briefcase,
  Shield,
  Loader2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { notesService, NoteItem, ChecklistItem, CategoryCounts } from '../../services/notesService';

export const NotesPage: React.FC = () => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    all: 0,
    hrPolicy: 0,
    interviewNotes: 0,
    checklists: 0,
    memos: 0,
    pinned: 0,
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('HR Policy');
  const [newContent, setNewContent] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newPinned, setNewPinned] = useState(false);

  // Category specific create states
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newVacancyName, setNewVacancyName] = useState('');
  const [newInterviewerName, setNewInterviewerName] = useState('');
  const [newInterviewRound, setNewInterviewRound] = useState('');
  const [newTechnicalRating, setNewTechnicalRating] = useState(8);
  const [newCommunicationRating, setNewCommunicationRating] = useState(8);
  const [newStrengths, setNewStrengths] = useState('');
  const [newImprovements, setNewImprovements] = useState('');

  const [newApplicableScope, setNewApplicableScope] = useState('');
  const [newMemoSubject, setNewMemoSubject] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'internal' | 'restricted'>('internal');

  // Checklist builder state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editChecklistItems, setEditChecklistItems] = useState<ChecklistItem[]>([]);
  const [editCandidateName, setEditCandidateName] = useState('');
  const [editVacancyName, setEditVacancyName] = useState('');
  const [editInterviewerName, setEditInterviewerName] = useState('');
  const [editInterviewRound, setEditInterviewRound] = useState('');
  const [editApplicableScope, setEditApplicableScope] = useState('');
  const [editMemoSubject, setEditMemoSubject] = useState('');

  // Fetch all notes, category counts and tags
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const [fetchedNotes, counts, tags] = await Promise.all([
        notesService.getNotes({
          category: activeCategory,
          search: searchTerm,
          tag: selectedTag || undefined,
        }),
        notesService.getCategoryCounts().catch(() => ({
          all: 0,
          hrPolicy: 0,
          interviewNotes: 0,
          checklists: 0,
          memos: 0,
          pinned: 0,
        })),
        notesService.getAllTags().catch(() => []),
      ]);
      setNotes(fetchedNotes);
      setCategoryCounts(counts);
      setAvailableTags(tags);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      toast.error(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeCategory, selectedTag]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pin Toggle
  const handleTogglePin = async (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    try {
      const updated = await notesService.togglePin(note.id, !note.pinned);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, pinned: updated.pinned } : n)));
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote({ ...selectedNote, pinned: updated.pinned });
      }
      toast.success(updated.pinned ? 'Note pinned to top' : 'Note unpinned');
      // Refresh counts in background
      notesService.getCategoryCounts().then(setCategoryCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle pin');
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!selectedNote) return;
    try {
      await notesService.deleteNote(selectedNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
      toast.info(`Note "${selectedNote.title}" deleted.`);
      setShowDeleteConfirm(false);
      setShowDetailsModal(false);
      setSelectedNote(null);
      // Refresh counts
      notesService.getCategoryCounts().then(setCategoryCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note');
    }
  };

  // Checklist Item Toggle (direct from Card or Modal)
  const handleToggleChecklistItem = async (e: React.MouseEvent, noteId: string, itemId: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      const updated = await notesService.toggleChecklistItem(noteId, itemId, !currentStatus);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, checklistItems: updated.checklistItems } : n))
      );
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote({ ...selectedNote, checklistItems: updated.checklistItems });
      }
    } catch (err: any) {
      toast.error('Failed to update checklist item');
    }
  };

  // Add Item to Create Form
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}-${checklistItems.length + 1}`,
      text: newChecklistText.trim(),
      completed: false,
      order: checklistItems.length + 1,
    };
    setChecklistItems([...checklistItems, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((i) => i.id !== id));
  };

  // Reset Create Form
  const resetCreateForm = () => {
    setNewTitle('');
    setNewCategory('HR Policy');
    setNewContent('');
    setNewDescription('');
    setNewTags('');
    setNewPinned(false);
    setNewCandidateName('');
    setNewVacancyName('');
    setNewInterviewerName('');
    setNewInterviewRound('');
    setNewTechnicalRating(8);
    setNewCommunicationRating(8);
    setNewStrengths('');
    setNewImprovements('');
    setNewApplicableScope('');
    setNewMemoSubject('');
    setNewVisibility('internal');
    setChecklistItems([]);
    setNewChecklistText('');
  };

  // Create Note Submit
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Note title is required.');
      return;
    }
    if (!newContent.trim()) {
      toast.error('Note content is required.');
      return;
    }

    const tagList = newTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload: Partial<NoteItem> = {
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      description: newDescription.trim() || undefined,
      pinned: newPinned,
      tags: tagList,
      checklistItems: newCategory === 'Checklists' ? checklistItems : [],
      candidateName: newCategory === 'Interview Notes' ? newCandidateName : undefined,
      vacancyName: newCategory === 'Interview Notes' ? newVacancyName : undefined,
      interviewerName: newCategory === 'Interview Notes' ? newInterviewerName : undefined,
      interviewRound: newCategory === 'Interview Notes' ? newInterviewRound : undefined,
      technicalRating: newCategory === 'Interview Notes' ? newTechnicalRating : undefined,
      communicationRating: newCategory === 'Interview Notes' ? newCommunicationRating : undefined,
      strengths: newCategory === 'Interview Notes' ? newStrengths : undefined,
      improvements: newCategory === 'Interview Notes' ? newImprovements : undefined,
      applicableScope: newCategory === 'HR Policy' ? newApplicableScope : undefined,
      memoSubject: newCategory === 'Memos' ? newMemoSubject : undefined,
      visibility: newCategory === 'Memos' ? newVisibility : 'internal',
    };

    try {
      const created = await notesService.createNote(payload);
      setNotes([created, ...notes]);
      toast.success(`Note "${created.title}" created successfully!`);
      setShowCreateModal(false);
      resetCreateForm();
      // Refresh counts and tags
      notesService.getCategoryCounts().then(setCategoryCounts).catch(() => {});
      notesService.getAllTags().then(setAvailableTags).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to create note');
    }
  };

  // Open Edit Modal
  const openEditModal = (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditCategory(note.category);
    setEditContent(note.content);
    setEditDescription(note.description || '');
    setEditTags((note.tags || []).join(', '));
    setEditChecklistItems(note.checklistItems || []);
    setEditCandidateName(note.candidateName || '');
    setEditVacancyName(note.vacancyName || '');
    setEditInterviewerName(note.interviewerName || '');
    setEditInterviewRound(note.interviewRound || '');
    setEditApplicableScope(note.applicableScope || '');
    setEditMemoSubject(note.memoSubject || '');
    setShowEditModal(true);
  };

  // Edit Note Submit
  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote) return;
    if (!editTitle.trim()) {
      toast.error('Note title is required.');
      return;
    }
    if (!editContent.trim()) {
      toast.error('Note content is required.');
      return;
    }

    const tagList = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload: Partial<NoteItem> = {
      title: editTitle.trim(),
      category: editCategory,
      content: editContent.trim(),
      description: editDescription.trim() || undefined,
      tags: tagList,
      checklistItems: editChecklistItems,
      candidateName: editCandidateName || undefined,
      vacancyName: editVacancyName || undefined,
      interviewerName: editInterviewerName || undefined,
      interviewRound: editInterviewRound || undefined,
      applicableScope: editApplicableScope || undefined,
      memoSubject: editMemoSubject || undefined,
    };

    try {
      const updated = await notesService.updateNote(selectedNote.id, payload);
      setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? updated : n)));
      setSelectedNote(updated);
      toast.success('Note updated successfully!');
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update note');
    }
  };

  // AI Summarize
  const handleAiSummarize = async (e: React.MouseEvent, note: NoteItem) => {
    e.stopPropagation();
    try {
      setSummarizingId(note.id);
      toast.info('Generating AI summary from note content...');
      const res = await notesService.aiSummarize(note.id);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, aiSummary: res.summary } : n))
      );
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote({ ...selectedNote, aiSummary: res.summary });
      }
      toast.success(`AI Summary generated for "${note.title}"!`);
      // Open details modal to view full summary
      setSelectedNote({ ...note, aiSummary: res.summary });
      setShowDetailsModal(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI summary');
    } finally {
      setSummarizingId(null);
    }
  };

  // Copy Summary
  const copySummaryToClipboard = (summaryText: string) => {
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    toast.success('AI Summary copied to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Category Tabs Configuration
  const categoryTabs = [
    { label: 'All', count: categoryCounts.all },
    { label: 'HR Policy', count: categoryCounts.hrPolicy },
    { label: 'Interview Notes', count: categoryCounts.interviewNotes },
    { label: 'Checklists', count: categoryCounts.checklists },
    { label: 'Memos', count: categoryCounts.memos },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <FileText className="h-3.5 w-3.5 text-teal-300" />
            <span>Enterprise Knowledge Repository</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">HR & Personal Notes Studio</h1>
          <p className="text-xs text-teal-100/80 mt-1 max-w-2xl">
            Author and inspect company policies, interview evaluation debriefs, operational onboarding checklists, and organizational memos with real-time AI summarization.
          </p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 bg-white text-[#004848] font-extrabold text-xs rounded-xl shadow-sm hover:bg-teal-50 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create New Note</span>
        </button>
      </div>

      {/* Search, Category Filter Bar & Tag Chips */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Keyword Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search title, content, candidate, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#004848]"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 select-none w-full md:w-auto">
            {categoryTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveCategory(tab.label);
                  setSelectedTag(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === tab.label
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeCategory === tab.label ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag Discovery Bar */}
        {availableTags.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <div className="flex items-center gap-1 text-slate-400 font-bold shrink-0">
              <TagIcon className="h-3 w-3" />
              <span>Tags:</span>
            </div>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 flex items-center gap-1 hover:bg-teal-200"
              >
                <span>#{selectedTag}</span>
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#004848] text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading notes from database...</p>
        </div>
      ) : notes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-16 space-y-4 bg-white rounded-2xl border border-slate-200 text-center">
          <div className="p-4 bg-teal-50 rounded-full text-[#004848]">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 m-0">No Notes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              {searchTerm || selectedTag
                ? 'No notes match your current search keywords or tag filter. Try clearing filters.'
                : `No notes available in category "${activeCategory}". Click below to create your first note.`}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTag(null);
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-[#004848] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#006666] flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Note</span>
          </button>
        </div>
      ) : (
        /* Notes Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => {
            // Checklist calculation
            const checklist = note.checklistItems || [];
            const completedCount = checklist.filter((i) => i.completed).length;
            const checklistPercentage = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

            // Category styling badge
            let badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';
            if (note.category === 'Interview Notes') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
            if (note.category === 'Checklists') badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (note.category === 'Memos') badgeStyle = 'bg-purple-50 text-purple-800 border-purple-200';

            return (
              <div 
                key={note.id} 
                onClick={() => {
                  setSelectedNote(note);
                  setShowDetailsModal(true);
                }}
                className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3.5 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group ${
                  note.pinned ? 'border-teal-400 ring-1 ring-teal-300/40 bg-gradient-to-b from-teal-50/20 to-white' : 'border-slate-200'
                }`}
              >
                {/* Card Header: Category Badge + Action Icons */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeStyle}`}>
                      {note.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Pin Toggle */}
                      <button 
                        onClick={(e) => handleTogglePin(e, note)}
                        title={note.pinned ? 'Unpin Note' : 'Pin Note'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          note.pinned 
                            ? 'text-[#004848] bg-teal-100/70 hover:bg-teal-200' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>

                      {/* Edit Note */}
                      <button 
                        onClick={(e) => openEditModal(e, note)}
                        title="Edit Note"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Note */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNote(note);
                          setShowDeleteConfirm(true);
                        }}
                        title="Delete Note"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-[#004848] transition-colors leading-snug m-0">
                      {note.title}
                    </h3>
                    {note.description && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {note.description}
                      </p>
                    )}
                  </div>

                  {/* Category-Specific UI Section */}

                  {/* 1. Checklists: Interactive Progress & Top Items */}
                  {note.category === 'Checklists' && checklist.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Progress: {completedCount}/{checklist.length}</span>
                        </span>
                        <span className="text-emerald-700 font-extrabold">{checklistPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${checklistPercentage}%` }}
                        />
                      </div>
                      {/* First 2 items preview with interactive click */}
                      <div className="space-y-1 pt-1">
                        {checklist.slice(0, 2).map((item) => (
                          <div 
                            key={item.id} 
                            onClick={(e) => handleToggleChecklistItem(e, note.id, item.id, item.completed)}
                            className="flex items-center gap-2 text-[11px] text-slate-700 hover:text-slate-900 cursor-pointer"
                          >
                            {item.completed ? (
                              <CheckSquare className="h-3 w-3 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="h-3 w-3 text-slate-400 shrink-0" />
                            )}
                            <span className={`line-clamp-1 ${item.completed ? 'line-through text-slate-400' : ''}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Interview Notes: Candidate Badge & Ratings */}
                  {note.category === 'Interview Notes' && (note.candidateName || note.interviewRound) && (
                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                      {note.candidateName && (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-amber-600" />
                            <span>{note.candidateName}</span>
                          </span>
                          {note.technicalRating && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-200/60 text-amber-900 font-extrabold text-[10px]">
                              Rating: {note.technicalRating}/10
                            </span>
                          )}
                        </div>
                      )}
                      {note.interviewRound && (
                        <p className="text-slate-600 font-medium m-0 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          <span className="line-clamp-1">{note.interviewRound}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* 3. HR Policy: Scope Tag */}
                  {note.category === 'HR Policy' && note.applicableScope && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md text-[10px] font-semibold border border-teal-200">
                      <Shield className="h-2.5 w-2.5" />
                      <span>Scope: {note.applicableScope}</span>
                    </div>
                  )}

                  {/* 4. Memos: Subject Line */}
                  {note.category === 'Memos' && note.memoSubject && (
                    <div className="bg-purple-50/60 border border-purple-200/60 rounded-lg px-2.5 py-1 text-[11px] font-bold text-purple-900 line-clamp-1">
                      Subject: {note.memoSubject}
                    </div>
                  )}

                  {/* Content Preview */}
                  <p className="text-xs text-slate-600 font-normal line-clamp-3 leading-relaxed m-0">
                    {note.content}
                  </p>

                  {/* Tags Pill List */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {note.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                          #{t}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Date + AI Summary Button */}
                <div className="pt-3 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3 w-3" />
                    <span>{note.date}</span>
                  </div>

                  <button
                    onClick={(e) => handleAiSummarize(e, note)}
                    disabled={summarizingId === note.id}
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {summarizingId === note.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-purple-600" />
                    )}
                    <span>{note.aiSummary ? 'View AI Summary' : 'AI Summary'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: CREATE NEW NOTE ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 text-[#004848] rounded-lg">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Create New HR Note</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3.5 text-xs font-semibold text-slate-700">
              {/* Category Selector Tabs */}
              <div>
                <label className="block mb-1.5 font-bold text-slate-800">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {['HR Policy', 'Interview Notes', 'Checklists', 'Memos'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        newCategory === cat
                          ? 'bg-[#004848] text-white border-transparent'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Title */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Note Title *</label>
                <input 
                  type="text"
                  placeholder="e.g. Q4 Executive Onboarding & Security Checklist"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  required
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Brief Overview / Description</label>
                <input 
                  type="text"
                  placeholder="Short description or summary of purpose"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-[#004848]"
                />
              </div>

              {/* Category-Specific Form Fields */}

              {/* Checklists Category Fields */}
              {newCategory === 'Checklists' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <label className="block font-bold text-slate-800">Checklist Items</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add an actionable checklist step..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                    >
                      + Add Item
                    </button>
                  </div>

                  {checklistItems.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                      {checklistItems.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <span className="text-xs text-slate-800 font-medium">
                            {idx + 1}. {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interview Notes Category Fields */}
              {newCategory === 'Interview Notes' && (
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Candidate Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Carlos Gomez"
                        value={newCandidateName}
                        onChange={(e) => setNewCandidateName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Target Vacancy</label>
                      <input 
                        type="text"
                        placeholder="e.g. Staff DevOps Engineer"
                        value={newVacancyName}
                        onChange={(e) => setNewVacancyName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Interviewer</label>
                      <input 
                        type="text"
                        placeholder="e.g. Elena Rostova"
                        value={newInterviewerName}
                        onChange={(e) => setNewInterviewerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Interview Round</label>
                      <input 
                        type="text"
                        placeholder="e.g. System Design Panel"
                        value={newInterviewRound}
                        onChange={(e) => setNewInterviewRound(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Technical Rating (1-10)</label>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        value={newTechnicalRating}
                        onChange={(e) => setNewTechnicalRating(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Communication Rating (1-10)</label>
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        value={newCommunicationRating}
                        onChange={(e) => setNewCommunicationRating(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* HR Policy Category Fields */}
              {newCategory === 'HR Policy' && (
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Applicable Regional / Entity Scope</label>
                  <input 
                    type="text"
                    placeholder="e.g. All Global Offices, UAE Operations, Remote Workforce"
                    value={newApplicableScope}
                    onChange={(e) => setNewApplicableScope(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>
              )}

              {/* Memos Category Fields */}
              {newCategory === 'Memos' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Memo Subject Line</label>
                    <input 
                      type="text"
                      placeholder="e.g. FY26 Mandatory Compliance Training"
                      value={newMemoSubject}
                      onChange={(e) => setNewMemoSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Visibility</label>
                    <select
                      value={newVisibility}
                      onChange={(e: any) => setNewVisibility(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-bold"
                    >
                      <option value="internal">Internal (All Employees)</option>
                      <option value="public">Public</option>
                      <option value="restricted">Restricted (HR & Execs)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Note Content *</label>
                <textarea 
                  rows={4}
                  placeholder="Type complete note details, evaluation debrief, or policy guidelines here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium outline-none focus:border-[#004848]"
                  required
                />
              </div>

              {/* Tags & Pinned Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Tags (comma-separated)</label>
                  <input 
                    type="text"
                    placeholder="e.g. policy, remote-work, compliance"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox"
                    id="newPinnedCheck"
                    checked={newPinned}
                    onChange={(e) => setNewPinned(e.target.checked)}
                    className="h-4 w-4 rounded text-[#004848] focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="newPinnedCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Pin note to top of studio
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl text-xs hover:bg-[#006666] shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT NOTE ================= */}
      {showEditModal && selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <Edit3 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Note: {selectedNote.title}</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditNote} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Title *</label>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Content *</label>
                <textarea 
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium outline-none focus:border-[#004848]"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Tags (comma-separated)</label>
                <input 
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl text-xs hover:bg-[#006666]"
                >
                  Update Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: NOTE DETAILS INSPECTION ================= */}
      {showDetailsModal && selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                  {selectedNote.category}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-1 m-0">{selectedNote.title}</h2>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{selectedNote.date}</span>
                  </span>
                  {selectedNote.pinned && (
                    <span className="text-[#004848] font-bold flex items-center gap-0.5">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* AI Summary Block */}
            {selectedNote.aiSummary ? (
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-purple-900 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    <span>AI Executive Summary</span>
                  </div>
                  <button
                    onClick={() => copySummaryToClipboard(selectedNote.aiSummary!)}
                    className="px-2 py-1 bg-white text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold hover:bg-purple-50 flex items-center gap-1"
                  >
                    {copiedSummary ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>
                <p className="text-xs text-purple-950 font-normal leading-relaxed whitespace-pre-line m-0">
                  {selectedNote.aiSummary}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-600 font-medium">No AI summary generated for this note yet.</span>
                <button
                  onClick={(e) => handleAiSummarize(e, selectedNote)}
                  disabled={summarizingId === selectedNote.id}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {summarizingId === selectedNote.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  <span>Generate Summary</span>
                </button>
              </div>
            )}

            {/* Checklist Section for Details */}
            {selectedNote.category === 'Checklists' && selectedNote.checklistItems && selectedNote.checklistItems.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 m-0 flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Checklist Items ({selectedNote.checklistItems.filter(i => i.completed).length}/{selectedNote.checklistItems.length})</span>
                  </h4>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {Math.round((selectedNote.checklistItems.filter(i => i.completed).length / selectedNote.checklistItems.length) * 100)}%
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedNote.checklistItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={(e) => handleToggleChecklistItem(e, selectedNote.id, item.id, item.completed)}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-teal-300 cursor-pointer transition-all"
                    >
                      {item.completed ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs ${item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Notes Metadata */}
            {selectedNote.category === 'Interview Notes' && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-amber-900 m-0">Candidate & Interview Evaluation</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Candidate:</strong> {selectedNote.candidateName || 'N/A'}</div>
                  <div><strong>Position:</strong> {selectedNote.vacancyName || 'N/A'}</div>
                  <div><strong>Interviewer:</strong> {selectedNote.interviewerName || 'N/A'}</div>
                  <div><strong>Round:</strong> {selectedNote.interviewRound || 'N/A'}</div>
                  <div><strong>Technical Rating:</strong> {selectedNote.technicalRating ? `${selectedNote.technicalRating}/10` : 'N/A'}</div>
                  <div><strong>Communication:</strong> {selectedNote.communicationRating ? `${selectedNote.communicationRating}/10` : 'N/A'}</div>
                </div>
                {selectedNote.strengths && (
                  <div><strong>Strengths:</strong> <span className="text-slate-600">{selectedNote.strengths}</span></div>
                )}
                {selectedNote.improvements && (
                  <div><strong>Areas for Improvement:</strong> <span className="text-slate-600">{selectedNote.improvements}</span></div>
                )}
              </div>
            )}

            {/* Main Content Body */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Content Body</label>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {selectedNote.content}
              </div>
            </div>

            {/* Tags */}
            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedNote.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-150">
              <button
                onClick={(e) => {
                  setShowDetailsModal(false);
                  openEditModal(e, selectedNote);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Note</span>
              </button>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE CONFIRMATION ================= */}
      {showDeleteConfirm && selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Are you sure you want to delete note <strong className="text-slate-900">"{selectedNote.title}"</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
