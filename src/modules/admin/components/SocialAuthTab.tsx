import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, X, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import adminService from '../../../services/adminService';

interface ISocialProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  enabled: boolean;
}

const DEFAULT_PROVIDERS: ISocialProvider[] = [
  { id: 'google', name: 'Google Workspace', clientId: '', clientSecret: '', redirectUrl: 'https://huremaso.org/auth/google/callback', enabled: false },
  { id: 'github', name: 'GitHub Enterprise', clientId: '', clientSecret: '', redirectUrl: 'https://huremaso.org/auth/github/callback', enabled: false },
  { id: 'microsoft', name: 'Microsoft Azure AD', clientId: '', clientSecret: '', redirectUrl: 'https://huremaso.org/auth/microsoft/callback', enabled: false },
];

export const SocialAuthTab: React.FC = () => {
  const toast = useToast();
  const [providers, setProviders] = useState<ISocialProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ISocialProvider | null>(null);
  const [formName, setFormName] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formClientSecret, setFormClientSecret] = useState('');
  const [formRedirectUrl, setFormRedirectUrl] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const cfg = await adminService.getConfiguration();
      if (cfg?.socialAuth && Array.isArray(cfg.socialAuth) && cfg.socialAuth.length > 0) {
        setProviders(cfg.socialAuth);
      } else {
        setProviders(DEFAULT_PROVIDERS);
      }
    } catch (err: any) {
      console.error("Failed to load social providers:", err);
      setProviders(DEFAULT_PROVIDERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const openAddModal = () => {
    setEditingProvider(null);
    setFormName('');
    setFormClientId('');
    setFormClientSecret('');
    setFormRedirectUrl('https://huremaso.org/auth/callback');
    setFormEnabled(true);
    setModalOpen(true);
  };

  const openEditModal = (provider: ISocialProvider) => {
    setEditingProvider(provider);
    setFormName(provider.name);
    setFormClientId(provider.clientId);
    setFormClientSecret(provider.clientSecret);
    setFormRedirectUrl(provider.redirectUrl);
    setFormEnabled(provider.enabled);
    setModalOpen(true);
  };

  const handleToggleEnabled = async (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    try {
      await adminService.updateConfiguration({ socialAuth: updated });
      setProviders(updated);
      toast.success("Social provider status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update provider status");
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Provider Name is required");
      return;
    }

    try {
      setSaving(true);
      let updatedList: ISocialProvider[];

      if (editingProvider) {
        updatedList = providers.map(p =>
          p.id === editingProvider.id
            ? {
                ...p,
                name: formName.trim(),
                clientId: formClientId.trim(),
                clientSecret: formClientSecret.trim(),
                redirectUrl: formRedirectUrl.trim(),
                enabled: formEnabled,
              }
            : p
        );
      } else {
        const newProvider: ISocialProvider = {
          id: `provider_${Date.now()}`,
          name: formName.trim(),
          clientId: formClientId.trim(),
          clientSecret: formClientSecret.trim(),
          redirectUrl: formRedirectUrl.trim(),
          enabled: formEnabled,
        };
        updatedList = [...providers, newProvider];
      }

      await adminService.updateConfiguration({ socialAuth: updatedList });
      setProviders(updatedList);
      toast.success(editingProvider ? "Social provider updated!" : "Social provider added!");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save social provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to remove this social authentication provider?")) {
      return;
    }

    try {
      const updatedList = providers.filter(p => p.id !== id);
      await adminService.updateConfiguration({ socialAuth: updatedList });
      setProviders(updatedList);
      toast.success("Social provider removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove provider");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-900 m-0">Provider List</h2>

      <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[10px] font-bold text-slate-500">({providers.length}) Records Found</span>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Headers */}
        <div className="grid grid-cols-12 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <span className="col-span-5">Provider Name</span>
          <span className="col-span-4">Client ID / App ID</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-400">
            Loading social providers...
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
            No Social authentication providers configured. Click "+ Add" to configure one.
          </div>
        ) : (
          <div className="space-y-2">
            {providers.map(p => (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
              >
                <div className="col-span-5 flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#0473b8]" />
                  <div>
                    <div className="text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">{p.redirectUrl}</div>
                  </div>
                </div>

                <div className="col-span-4 font-mono text-[11px] text-slate-600 truncate pr-3">
                  {p.clientId ? p.clientId : <span className="text-slate-400 font-sans italic">Not configured</span>}
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleEnabled(p.id)}
                    className="inline-flex items-center gap-1 cursor-pointer"
                    title={p.enabled ? "Disable provider" : "Enable provider"}
                  >
                    {p.enabled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Disabled
                      </span>
                    )}
                  </button>
                </div>

                <div className="col-span-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Configure Provider"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProvider(p.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Provider"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Dialog for Add / Edit Provider */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0473b8]" />
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {editingProvider ? "Configure Social Provider" : "Add Social Provider"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Provider Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, GitHub, Microsoft, Okta"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Client ID / App ID</label>
                <input
                  type="text"
                  placeholder="Client ID from provider console"
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs font-mono"
                />
              </div>

              <div>
                <label className="block mb-1">Client Secret / App Secret</label>
                <input
                  type="password"
                  placeholder="Client secret from provider console"
                  value={formClientSecret}
                  onChange={(e) => setFormClientSecret(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs font-mono"
                />
              </div>

              <div>
                <label className="block mb-1">Redirect / Callback URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://huremaso.org/auth/callback"
                  value={formRedirectUrl}
                  onChange={(e) => setFormRedirectUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span>Enable Provider</span>
                <button
                  type="button"
                  onClick={() => setFormEnabled(!formEnabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 duration-300 ease-in-out cursor-pointer ${
                    formEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ease-in-out ${
                    formEnabled ? 'translate-x-4' : ''
                  }`} />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  {saving ? "Saving..." : editingProvider ? "Save Settings" : "Add Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SocialAuthTab;
