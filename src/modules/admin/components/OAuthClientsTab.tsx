import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Copy, Check, Key } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import adminService from '../../../services/adminService';

interface IOAuthClient {
  id: string;
  name: string;
  redirectUri: string;
  status: 'Active' | 'Inactive';
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
  createdAt?: string;
}

export const OAuthClientsTab: React.FC = () => {
  const toast = useToast();
  const [oauthClients, setOauthClients] = useState<IOAuthClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IOAuthClient | null>(null);
  const [formName, setFormName] = useState('');
  const [formRedirectUri, setFormRedirectUri] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formClientId, setFormClientId] = useState('');
  const [formClientSecret, setFormClientSecret] = useState('');
  const [formScopes, setFormScopes] = useState('read, write');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const cfg = await adminService.getConfiguration();
      if (cfg?.oauthClients && Array.isArray(cfg.oauthClients)) {
        setOauthClients(cfg.oauthClients);
      }
    } catch (err: any) {
      console.error("Failed to load OAuth clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const openAddModal = () => {
    const randomHex = () => Math.random().toString(36).substring(2, 10);
    setEditingClient(null);
    setFormName('');
    setFormRedirectUri('');
    setFormStatus('Active');
    setFormClientId(`hur_${randomHex()}${randomHex()}`);
    setFormClientSecret(`sec_${randomHex()}${randomHex()}${randomHex()}`);
    setFormScopes('read, write');
    setModalOpen(true);
  };

  const openEditModal = (client: IOAuthClient) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormRedirectUri(client.redirectUri);
    setFormStatus(client.status);
    setFormClientId(client.clientId || '');
    setFormClientSecret(client.clientSecret || '');
    setFormScopes(client.scopes || 'read, write');
    setModalOpen(true);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRedirectUri.trim()) {
      toast.error("Client Name and Redirect URI are required");
      return;
    }

    try {
      setSaving(true);
      let updatedList: IOAuthClient[];

      if (editingClient) {
        updatedList = oauthClients.map(c =>
          c.id === editingClient.id
            ? {
                ...c,
                name: formName.trim(),
                redirectUri: formRedirectUri.trim(),
                status: formStatus,
                clientId: formClientId,
                clientSecret: formClientSecret,
                scopes: formScopes,
              }
            : c
        );
      } else {
        const newClient: IOAuthClient = {
          id: `oauth_${Date.now()}`,
          name: formName.trim(),
          redirectUri: formRedirectUri.trim(),
          status: formStatus,
          clientId: formClientId,
          clientSecret: formClientSecret,
          scopes: formScopes,
          createdAt: new Date().toISOString(),
        };
        updatedList = [...oauthClients, newClient];
      }

      await adminService.updateConfiguration({ oauthClients: updatedList });
      setOauthClients(updatedList);
      toast.success(editingClient ? "OAuth client updated!" : "OAuth client registered!");
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save OAuth client");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOauth = async (id: string) => {
    if (!confirm("Are you sure you want to revoke and delete this OAuth client?")) {
      return;
    }

    try {
      const updatedList = oauthClients.filter(x => x.id !== id);
      await adminService.updateConfiguration({ oauthClients: updatedList });
      setOauthClients(updatedList);
      toast.success("OAuth client revoked and deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete OAuth client");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-900 m-0">Register OAuth Client List</h2>

      <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[10px] font-bold text-slate-500">({oauthClients.length}) Records Found</span>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-4 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <span>Name</span>
          <span>Redirect URI</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows list */}
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-400">
            Loading OAuth clients...
          </div>
        ) : oauthClients.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs font-bold text-slate-400">
            No OAuth clients registered yet. Click "+ Add" to create one.
          </div>
        ) : (
          <div className="space-y-1.5">
            {oauthClients.map(c => (
              <div
                key={c.id}
                className="grid grid-cols-4 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800"
              >
                <div>
                  <div className="text-slate-900">{c.name}</div>
                  {c.clientId && (
                    <div className="text-[10px] text-slate-400 font-normal font-mono truncate">
                      ID: {c.clientId}
                    </div>
                  )}
                </div>
                <span className="text-slate-500 font-semibold truncate pr-4">{c.redirectUri}</span>
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Edit client"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOauth(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Revoke / Delete client"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Dialog for Add / Edit OAuth Client */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0473b8]" />
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {editingClient ? "Edit OAuth Client" : "Register New OAuth Client"}
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
                <label className="block mb-1">Client Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Application / Internal Service"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block mb-1">Redirect URI <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://example.com/oauth/callback"
                  value={formRedirectUri}
                  onChange={(e) => setFormRedirectUri(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Scopes</label>
                  <input
                    type="text"
                    value={formScopes}
                    onChange={(e) => setFormScopes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Client Credentials View */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Client ID</span>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800">
                    <span className="truncate pr-2">{formClientId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formClientId, 'Client ID')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'Client ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Client Secret</span>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-800">
                    <span className="truncate pr-2">{formClientSecret}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formClientSecret, 'Client Secret')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'Client Secret' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
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
                  {saving ? "Saving..." : editingClient ? "Update Client" : "Register Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OAuthClientsTab;
