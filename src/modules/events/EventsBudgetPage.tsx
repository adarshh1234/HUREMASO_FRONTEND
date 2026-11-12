import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, PieChart, TrendingDown, CheckCircle2, Clock, Trash2, Edit2, Wallet, RefreshCw, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { IEventsBudgetItem } from '../../types/events';

export const EventsBudgetPage: React.FC = () => {
  const toast = useToast();
  const [budgetList, setBudgetList] = useState<(IEventsBudgetItem & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [newEvtName, setNewEvtName] = useState('');
  const [newCategory, setNewCategory] = useState('Venue & Catering');
  const [newAllocated, setNewAllocated] = useState('');
  const [newOwner, setNewOwner] = useState('Sarah Joseph');

  // Edit Budget Modal State
  const [editingItem, setEditingItem] = useState<(IEventsBudgetItem & { id: string }) | null>(null);
  const [editAllocated, setEditAllocated] = useState('');
  const [editSpent, setEditSpent] = useState('');
  const [editStatus, setEditStatus] = useState<IEventsBudgetItem['status']>('Approved');

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await eventService.getBudgets();
      setBudgetList(items);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load event budgets');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvtName.trim() || !newAllocated) {
      toast.error('Event Name and Allocated Budget are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await eventService.createBudget({
        eventName: newEvtName.trim(),
        category: newCategory,
        allocated: parseFloat(newAllocated) || 0,
        spent: 0,
        status: 'Pending Review',
        owner: newOwner.trim() || 'Sarah Joseph',
      });
      setBudgetList((prev) => [created, ...prev]);
      setNewEvtName('');
      setNewAllocated('');
      toast.success('Event budget request saved and logged to database!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add event budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const updated = await eventService.updateBudget(editingItem.id, {
        allocated: parseFloat(editAllocated) || 0,
        spent: parseFloat(editSpent) || 0,
        status: editStatus,
      });
      setBudgetList((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingItem(null);
      toast.success(`Budget for ${updated.eventName} updated successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update budget');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove budget record for "${name}"?`)) {
      try {
        await eventService.deleteBudget(id);
        setBudgetList((prev) => prev.filter((b) => b.id !== id));
        toast.success('Budget record removed.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete budget item');
      }
    }
  };

  const totalAllocated = budgetList.reduce((acc, b) => acc + (b.allocated || 0), 0);
  const totalSpent = budgetList.reduce((acc, b) => acc + (b.spent || 0), 0);
  const variance = totalAllocated - totalSpent;
  const approvedCount = budgetList.filter((b) => b.status === 'Approved').length;

  const filteredItems = budgetList.filter(
    (b) =>
      b.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 m-0">
            <Wallet className="h-5 w-5 text-[#006666]" />
            <span>Event Budget & Expense Planning</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate event allocations, venue expenses, catering, and budget variances.
          </p>
        </div>

        <button
          onClick={fetchBudgets}
          title="Refresh Budgets"
          className="p-2 self-start sm:self-auto border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Total Event Pool</span>
          <span className="text-2xl font-extrabold text-slate-900">${totalAllocated.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Actual Spent to Date</span>
          <span className="text-2xl font-extrabold text-[#006666]">${totalSpent.toLocaleString()}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Remaining Savings / Variance</span>
          <span className={`text-2xl font-extrabold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${variance.toLocaleString()}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <span className="text-slate-400 font-semibold text-[11px] block">Approval Status</span>
          <span className="text-2xl font-extrabold text-purple-700">{approvedCount} Approved</span>
        </div>
      </div>

      {/* Add Budget Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Request Event Budget Allocation
        </h2>
        <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Regional Sales Summit"
              value={newEvtName}
              onChange={(e) => setNewEvtName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848]"
            />
          </div>
          <div>
            <label className="block mb-1">Expense Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848]"
            >
              <option value="Venue & Catering">Venue & Catering</option>
              <option value="Audio/Visual & Tech">Audio/Visual & Tech</option>
              <option value="Travel & Accommodation">Travel & Accommodation</option>
              <option value="Branding & Merchandise">Branding & Merchandise</option>
              <option value="Logistics & Operations">Logistics & Operations</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Allocated Amount ($) *</label>
            <input
              type="number"
              required
              placeholder="e.g. 5000"
              value={newAllocated}
              onChange={(e) => setNewAllocated(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848] font-mono"
            />
          </div>
          <div>
            <label className="block mb-1">Event Owner</label>
            <input
              type="text"
              placeholder="e.g. Sarah Joseph"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#004848]"
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Event Budget'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-500">({filteredItems.length}) Event Budgets Listed</span>
          <input
            type="text"
            placeholder="Search event budget..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#004848] w-full sm:w-64"
          />
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-750">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Allocated ($)</th>
                  <th className="px-6 py-4">Spent ($)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No budget items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{item.eventName}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-500">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">{item.owner}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        ${(item.allocated || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-[#006666]">
                        ${(item.spent || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          item.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'Over Budget'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditAllocated(String(item.allocated || 0));
                              setEditSpent(String(item.spent || 0));
                              setEditStatus(item.status);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.eventName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Budget: {editingItem.eventName}</h3>
                <span className="text-xs text-slate-400">{editingItem.category}</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Allocated Budget ($)</label>
                <input
                  type="number"
                  required
                  value={editAllocated}
                  onChange={(e) => setEditAllocated(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Actual Spent ($)</label>
                <input
                  type="number"
                  required
                  value={editSpent}
                  onChange={(e) => setEditSpent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Approval Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Over Budget">Over Budget</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsBudgetPage;
