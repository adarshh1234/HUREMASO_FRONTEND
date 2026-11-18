import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Settings, CheckCircle2, AlertCircle, Clock, XCircle, Trash2, Edit3, Zap, Activity, Check } from 'lucide-react';
import { paymentApplicationService } from '../../services/payrollService';
import { PaymentApplication } from '../../types/payroll';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import PayrollAIFloat from './PayrollAIFloat';

const PROVIDERS = ['Stripe', 'Razorpay', 'PayPal', 'Braintree', 'Square', 'Adyen', 'Other'];
const STATUSES = ['All', 'Active', 'Pending', 'Inactive', 'Error'];
const ENVIRONMENTS = ['Sandbox', 'Production'];

interface AppForm {
  name: string;
  provider: string;
  environment: 'Sandbox' | 'Production';
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  autoDisburse: boolean;
  disbursementDay: string;
  notes: string;
}

const initialForm: AppForm = {
  name: '',
  provider: 'Stripe',
  environment: 'Sandbox',
  apiKey: '',
  secretKey: '',
  webhookUrl: '',
  autoDisburse: false,
  disbursementDay: '25',
  notes: '',
};

const statusIcon = (status: string) => {
  if (status === 'Active') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === 'Error') return <AlertCircle className="h-4 w-4 text-red-500" />;
  if (status === 'Inactive') return <XCircle className="h-4 w-4 text-slate-400" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
};

const statusBadge = (status: string) => {
  if (status === 'Active') return 'success';
  if (status === 'Error') return 'error';
  if (status === 'Inactive') return 'neutral';
  return 'warning';
};

export const PaymentApplicationPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<PaymentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AppForm>(initialForm);
  const [formErrors, setFormErrors] = useState<Partial<AppForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Testing connection state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await paymentApplicationService.getAll({
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setItems(result.items);
    } catch {
      toast.error('Failed to load payment applications.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (app: PaymentApplication) => {
    setEditId(app.id);
    setForm({
      name: app.name,
      provider: app.provider,
      environment: app.environment || 'Sandbox',
      apiKey: '',
      secretKey: '',
      webhookUrl: app.webhookUrl || '',
      autoDisburse: app.autoDisburse,
      disbursementDay: String(app.disbursementDay || 25),
      notes: app.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const errors: Partial<AppForm> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.provider.trim()) errors.provider = 'Provider is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const data = {
        name: form.name,
        provider: form.provider,
        environment: form.environment,
        apiKey: form.apiKey || undefined,
        secretKey: form.secretKey || undefined,
        webhookUrl: form.webhookUrl || undefined,
        autoDisburse: form.autoDisburse,
        disbursementDay: form.autoDisburse ? Number(form.disbursementDay) : undefined,
        notes: form.notes || undefined,
      };
      if (editId) {
        await paymentApplicationService.update(editId, data);
        toast.success('Payment application updated!');
      } else {
        await paymentApplicationService.create(data);
        toast.success('Payment application configured!');
      }
      setShowModal(false);
      await load();
    } catch {
      toast.error('Failed to save payment application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await paymentApplicationService.testConnection(id);
      if (result.success) {
        toast.success(`Connection established: ${result.message}`);
      } else {
        toast.error(`Connection check failed: ${result.message}`);
      }
      await load();
    } catch {
      toast.error('Failed to test connection.');
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await paymentApplicationService.sync(id);
      toast.success('Payment provider synchronized!');
      await load();
    } catch {
      toast.error('Failed to synchronize payments.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await paymentApplicationService.delete(id);
      toast.success('Payment application removed.');
      setDeleteConfirm(null);
      await load();
    } catch {
      toast.error('Failed to delete payment application.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Payment Application</h1>
          <p className="text-xs text-slate-500 mt-1">Configure payment gateway integrations for automated salary disbursements.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-[#004848] bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg text-xs font-semibold px-3 py-2 bg-white outline-none focus:border-[#004848] cursor-pointer"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No payment integrations"
          description="Configure a payment gateway to enable automated salary disbursements."
          action={
            <button onClick={openCreate} className="mt-2 px-4 py-2 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#003333]">
              Add Integration
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {items.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center shrink-0">
                      <Settings className="h-5 w-5 text-[#004848]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{app.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-500">{app.provider}</span>
                        {app.environment && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${app.environment === 'Production' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {app.environment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(app.status)}
                    <Badge variant={statusBadge(app.status) as any} size="sm">{app.status}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  {app.apiKeyMasked && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">API Key</span>
                      <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded text-[10px]">{app.apiKeyMasked}</span>
                    </div>
                  )}
                  {app.webhookUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Webhook</span>
                      <span className="text-[10px] text-slate-600 truncate max-w-[150px]">{app.webhookUrl}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Auto-Disburse</span>
                    <span className={`flex items-center gap-1 font-semibold ${app.autoDisburse ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {app.autoDisburse ? <><Zap className="h-3 w-3" /> Day {app.disbursementDay}</> : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Connection Status</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      app.testStatus === 'Connected' ? 'bg-emerald-100 text-emerald-800' : app.testStatus === 'Failed' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {app.testStatus || 'Untested'}
                    </span>
                  </div>
                  {app.lastSync && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Last Synced</span>
                      <span className="text-slate-600">{app.lastSync}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestConnection(app.id)}
                    disabled={testingId === app.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#004848] text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <Activity className="h-3 w-3" />
                    {testingId === app.id ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => handleSync(app.id)}
                    disabled={syncingId === app.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingId === app.id ? 'animate-spin' : ''}`} />
                    {syncingId === app.id ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(app)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(app.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 text-rose-600 hover:text-rose-700 text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Integration' : 'Add Payment Integration'}>
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Integration Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Stripe Payroll Production"
                className={`w-full border rounded-lg p-2.5 outline-none focus:border-[#004848] ${formErrors.name ? 'border-red-400' : 'border-slate-200'}`}
              />
              {formErrors.name && <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Provider *</label>
              <select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Environment</label>
              <select
                value={form.environment}
                onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value as any }))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] bg-white cursor-pointer"
              >
                {ENVIRONMENTS.map((env) => <option key={env}>{env}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Webhook URL</label>
              <input
                type="url"
                value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                placeholder="https://api.example.com/webhooks"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">API Key / Publishable Key {editId ? '(leave blank to keep existing)' : ''}</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="pk_test_xxxxxxxxxxxx"
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Secret Key {editId ? '(leave blank to keep existing)' : ''}</label>
            <input
              type="password"
              value={form.secretKey}
              onChange={(e) => setForm((f) => ({ ...f, secretKey: e.target.value }))}
              placeholder="sk_test_xxxxxxxxxxxx"
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="auto-disburse"
              checked={form.autoDisburse}
              onChange={(e) => setForm((f) => ({ ...f, autoDisburse: e.target.checked }))}
              className="cursor-pointer"
            />
            <label htmlFor="auto-disburse" className="font-semibold text-slate-700 cursor-pointer">
              Enable Auto-Disbursement
            </label>
          </div>

          {form.autoDisburse && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Scheduled Disbursement Day (1-31)</label>
              <input
                type="number"
                value={form.disbursementDay}
                onChange={(e) => setForm((f) => ({ ...f, disbursementDay: e.target.value }))}
                min="1"
                max="31"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] w-28"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Additional configuration notes..."
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#004848] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : editId ? 'Update' : 'Add Integration'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Integration">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Are you sure you want to remove this payment integration? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-xs cursor-pointer">
              Cancel
            </button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer">
              Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Floating AI Assistant */}
      <PayrollAIFloat />
    </div>
  );
};

export default PaymentApplicationPage;
