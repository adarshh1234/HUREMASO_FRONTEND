import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  MoreVertical, 
  Upload, 
  Plus, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import { employeeDocumentService, EmployeeDocItem, FolderSummary } from '../../services/employeeDocumentService';

export const EmployeeDocumentsPage: React.FC = () => {
  const toast = useToast();
  const [folders, setFolders] = useState<{ id: string; name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderDocs, setFolderDocs] = useState<EmployeeDocItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Personal Information');
  const [newDocFolder, setNewDocFolder] = useState('Personal Information');

  const defaultFolders = [
    'Personal Information',
    'Training Report',
    'Benefits Documents',
    'Policy Document',
    'Tax Forms',
    'Contracts & Offers',
    'Certifications',
    'Performance Records',
  ];

  const loadFolders = async () => {
    try {
      setLoading(true);
      const serverFolders = await employeeDocumentService.getFolders();
      
      const folderMap = new Map<string, number>();
      defaultFolders.forEach((f) => folderMap.set(f, 0));
      serverFolders.forEach((sf) => folderMap.set(sf.folder, sf.count));

      const list = Array.from(folderMap.entries()).map(([name, count], index) => ({
        id: String(index + 1),
        name,
        count,
      }));
      setFolders(list);
    } catch (err) {
      console.error('Failed to load document folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const handleOpenFolder = async (folderName: string) => {
    setSelectedFolder(folderName);
    try {
      const docs = await employeeDocumentService.getAll({ folder: folderName });
      setFolderDocs(docs);
    } catch (err) {
      console.error('Failed to fetch documents for folder:', err);
    }
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter new folder name:');
    if (!name) return;
    setFolders((prev) => [...prev, { id: String(prev.length + 1), name, count: 0 }]);
    toast.success(`Folder "${name}" created`);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeeDocumentService.create({
        title: newDocTitle || 'Untitled Document',
        category: newDocCategory,
        folder: newDocFolder,
        fileUrl: `/docs/${encodeURIComponent(newDocTitle || 'doc')}.pdf`,
        fileType: 'pdf',
      });
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setNewDocTitle('');
      await loadFolders();
      if (selectedFolder === newDocFolder) {
        handleOpenFolder(selectedFolder);
      }
    } catch (err) {
      toast.error('Failed to upload document');
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await employeeDocumentService.delete(id);
      toast.success('Document deleted');
      if (selectedFolder) {
        handleOpenFolder(selectedFolder);
      }
      await loadFolders();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 m-0">Employee documents</h1>
        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
          >
            ← Back to all folders
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left filters */}
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-[#0473b8] bg-white rounded-lg text-xs font-semibold text-[#0473b8] hover:bg-blue-50/50 transition-all">
            <span>Sort By : Name</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#0473b8]" />
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-[#0473b8] bg-white rounded-lg text-xs font-semibold text-[#0473b8] hover:bg-blue-50/50 transition-all">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0473b8]" />
            <span>Filter</span>
          </button>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2.5">
          <Button 
            variant="primary"
            size="md"
            icon={<Upload className="h-3.5 w-3.5 text-white" />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload New
          </Button>
          <button 
            onClick={handleCreateFolder}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#0473b8] hover:bg-blue-50 text-[#0473b8] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading document folders...</span>
        </div>
      ) : selectedFolder ? (
        /* Folder detail view */
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Folder: {selectedFolder}</h2>
          {folderDocs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-semibold">
              No documents in this folder yet. Click "Upload New" to add one.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {folderDocs.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 m-0">{doc.title}</p>
                      <p className="text-[10px] text-slate-400 m-0">{doc.category} · {doc.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Folder grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {folders.map((f) => (
            <div 
              key={f.id} 
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-36 cursor-pointer"
              onClick={() => handleOpenFolder(f.name)}
            >
              <div className="flex justify-between items-start">
                <Folder className="h-6 w-6 text-slate-700" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`Folder options for ${f.name}`);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{f.name}</h4>
                <p className="text-[11px] font-semibold text-slate-400 m-0">{f.count} files</p>
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
                  placeholder="e.g. Employee Agreement 2024"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Folder</label>
                <select
                  value={newDocFolder}
                  onChange={(e) => {
                    setNewDocFolder(e.target.value);
                    setNewDocCategory(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
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

export default EmployeeDocumentsPage;
