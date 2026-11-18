import React, { useState, useEffect } from 'react';
import { Languages, Trash2, Download, Key, Plus, X } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import adminService from '../../../services/adminService';

const DEFAULT_PACKAGES = ['English (US)', 'Spanish', 'French', 'German'];

export const LanguagePackagesTab: React.FC = () => {
  const toast = useToast();
  const [langPackages, setLangPackages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const cfg = await adminService.getConfiguration();
      if (cfg?.languagePackages && Array.isArray(cfg.languagePackages) && cfg.languagePackages.length > 0) {
        setLangPackages(cfg.languagePackages);
      } else {
        setLangPackages(DEFAULT_PACKAGES);
      }
    } catch (err: any) {
      console.error("Failed to load language packages:", err);
      setLangPackages(DEFAULT_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPackageName.trim();
    if (!trimmed) {
      toast.error("Please enter a language package name");
      return;
    }
    if (langPackages.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Language package already exists");
      return;
    }

    try {
      setSaving(true);
      const updated = [...langPackages, trimmed];
      await adminService.updateConfiguration({ languagePackages: updated });
      setLangPackages(updated);
      toast.success(`Language package "${trimmed}" added!`);
      setNewPackageName('');
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add language package");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (langName: string) => {
    if (!confirm(`Are you sure you want to delete "${langName}" language package?`)) {
      return;
    }

    try {
      const updated = langPackages.filter(p => p !== langName);
      await adminService.updateConfiguration({ languagePackages: updated });
      setLangPackages(updated);
      toast.success(`Language package "${langName}" deleted`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete language package");
    }
  };

  const handleExport = (langName: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ language: langName, version: "1.0", translations: { dashboard: "Dashboard", admin: "Admin" } }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${langName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${langName} translations`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-sm font-bold text-slate-900 m-0">Language Packages</h2>

      <div className="bg-slate-100 border border-slate-205 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-1">
          <div className="text-[10px] font-bold text-slate-500">
            ({langPackages.length}) Records Found
          </div>
          <button
            type="button"
            onClick={() => { setNewPackageName(''); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add Package</span>
          </button>
        </div>

        {/* Table headers */}
        <div className="grid grid-cols-12 px-4 py-1 text-[10px] font-extrabold text-slate-505 uppercase tracking-wider">
          <span className="col-span-10">Language Packages</span>
          <span className="col-span-2 text-right pr-4">Actions</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-400">
            Loading language packages...
          </div>
        ) : langPackages.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
            No language packages installed.
          </div>
        ) : (
          <div className="space-y-2">
            {langPackages.map((langName) => (
              <div
                key={langName}
                className="grid grid-cols-12 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
              >
                <span className="col-span-10 text-slate-755">{langName}</span>

                <div className="col-span-2 flex justify-end pr-2">
                  <div className="grid grid-cols-2 gap-1 select-none">
                    <button
                      type="button"
                      onClick={() => toast.info(`Translation editor for ${langName}`)}
                      className="p-1.5 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                      title="Translate"
                    >
                      <Languages className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(langName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Package"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport(langName)}
                      className="p-1.5 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                      title="Export Package"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info(`Configure translation keys for ${langName}`)}
                      className="w-6 h-6 rounded-full bg-[#d0d3d7] hover:bg-slate-350 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                      title="Configure Keys"
                    >
                      <Key className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Dialog for Add Language Package */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#0473b8]" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Add Language Package</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Language Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japanese, Portuguese, Italian, Hindi"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LanguagePackagesTab;
