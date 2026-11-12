import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Download, Share2, Plus, FileText, MoreVertical, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { employeeDocumentService, EmployeeDocItem } from '../../services/employeeDocumentService';

export const CompanyDocCenterPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'legal' | 'agree' | 'travel' | 'emp' | 'policy'>('all');
  const [documents, setDocuments] = useState<EmployeeDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Legal Document');

  const tabCategoryMap: Record<string, string | undefined> = {
    all: undefined,
    legal: 'Legal Document',
    agree: 'Agreement',
    travel: 'Travel Document',
    emp: 'Employee Record',
    policy: 'Policy Document',
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const category = tabCategoryMap[activeTab];
      const data = await employeeDocumentService.getAll(category ? { category } : undefined);
      if (data && data.length > 0) {
        setDocuments(data);
      } else {
        // Create initial default docs if empty
        const initial = await employeeDocumentService.create({
          title: 'Employee Agreement Template',
          category: 'Legal Document',
          folder: 'Legal Documents',
          fileUrl: '/docs/agreement-template.pdf',
        });
        setDocuments([initial]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeeDocumentService.create({
        title: docTitle,
        category: docCategory,
        folder: docCategory,
        fileUrl: `/docs/${encodeURIComponent(docTitle)}.pdf`,
      });
      toast.success('Document uploaded');
      setShowUploadModal(false);
      setDocTitle('');
      await loadDocuments();
    } catch (err) {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await employeeDocumentService.delete(id);
      toast.success('Document deleted');
      await loadDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">Company Doc-Center</h1>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-1 text-xs font-bold text-slate-500">
        {[
          { id: 'all' as const, label: 'All Documents' },
          { id: 'legal' as const, label: 'Legal Documents' },
          { id: 'agree' as const, label: 'Agreements' },
          { id: 'travel' as const, label: 'Travel Documents' },
          { id: 'emp' as const, label: 'Employee Records' },
          { id: 'policy' as const, label: 'Policies' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 transition-all -mb-[1.5px] border-b-2 cursor-pointer ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
          <span>Sort by: Last Modified</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0473b8] bg-white rounded-lg text-[#0473b8] hover:bg-blue-50/50 transition-all font-semibold">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0473b8]" />
            <span>Filter</span>
          </button>
        </div>

        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Upload New Document</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs">
          No documents found in this category.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((r) => (
            <div 
              key={r.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all text-xs font-bold text-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <span className="block text-slate-850 font-extrabold">{r.title}</span>
                  <span className="block text-[10px] text-slate-400 font-semibold">
                    {r.category} · {r.folder} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-slate-400 pr-1">
                <button onClick={() => toast.info('Share link copied')} className="hover:text-blue-600 p-1 cursor-pointer">
                  <Share2 className="h-4 w-4" />
                </button>
                <button onClick={() => toast.success('Document download started')} className="hover:text-blue-600 p-1 cursor-pointer">
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="hover:text-rose-600 p-1 cursor-pointer" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remote Work Policy 2024"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="Legal Document">Legal Document</option>
                  <option value="Agreement">Agreement</option>
                  <option value="Travel Document">Travel Document</option>
                  <option value="Employee Record">Employee Record</option>
                  <option value="Policy Document">Policy Document</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0473b8] text-white rounded-lg text-xs font-bold"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDocCenterPage;
