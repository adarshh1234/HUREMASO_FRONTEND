import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  SlidersHorizontal, 
  FileText,
  Briefcase,
  Plus,
  Loader2
} from 'lucide-react';
import { employeeRequestService, EmployeeRequestItem } from '../../services/employeeRequestService';

interface FinanceRequestDisplay {
  id: string;
  name: string;
  empId: string;
  type: string;
  department: string;
  date: string;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const EmployeeFinanceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<FinanceRequestDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReq, setNewReq] = useState({
    employeeId: 'EMP2024001',
    requestType: 'Training Course Payment',
    title: 'Training Course Reimbursement',
    amount: 1800,
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await employeeRequestService.getAll();
      if (data && data.length > 0) {
        const mapped: FinanceRequestDisplay[] = data.map((item: any) => ({
          id: item.id || item._id,
          name: item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || item.employeeId : item.employeeId || 'Sarah Johnson',
          empId: item.employeeId || 'EMP2024001',
          type: item.requestType || item.title || 'Finance Request',
          department: item.employee?.jobInformation?.department || 'Engineering',
          date: item.submittedDate || (item.createdAt ? item.createdAt.split('T')[0] : '2024-02-14'),
          amount: item.amount ? item.amount.toLocaleString() : '1,800',
          status: (item.status === 'Cancelled' ? 'Rejected' : item.status) as any,
        }));
        setRequests(mapped);
      } else {
        // Create initial default data on the server if empty
        const initialItem = await employeeRequestService.create({
          employeeId: 'EMP2024001',
          requestType: 'Training Course Payment',
          title: 'Advanced Web Dev Certification',
          amount: 1800,
        });
        setRequests([{
          id: initialItem.id,
          name: 'Sarah Johnson',
          empId: 'EMP2024001',
          type: 'Training Course Payment',
          department: 'Engineering',
          date: new Date().toISOString().split('T')[0],
          amount: '1,800',
          status: 'Pending',
        }]);
      }
    } catch (err) {
      console.error('Failed to load employee requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      await employeeRequestService.updateStatus(id, newStatus);
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeeRequestService.create({
        employeeId: newReq.employeeId,
        requestType: newReq.requestType,
        title: newReq.title,
        amount: Number(newReq.amount),
      });
      setShowCreateModal(false);
      await loadRequests();
    } catch (err) {
      console.error('Failed to create request:', err);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.name.toLowerCase().includes(searchQuery.toLowerCase()) || req.empId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 m-0">Request Filters</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search......." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
          />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Select date range" 
            className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
          />
          <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Status select */}
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-3 pr-9 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-800 outline-none appearance-none"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <SlidersHorizontal className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Amount range */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Amount range" 
            className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
          />
          <span className="absolute right-3 top-2 text-sm font-bold text-slate-400">₹</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs">
          No requests found matching your filters.
        </div>
      ) : (
        /* Grid List matching 3 columns layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Top header row */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                      alt={req.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-none">{req.name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold mt-1 block">{req.empId}</span>
                  </div>
                </div>

                {/* Status pill tag */}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Content items */}
              <div className="space-y-2 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{req.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{req.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{req.date}</span>
                </div>
              </div>

              {/* Bottom Actions and Price row */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">${req.amount}</span>
                
                {req.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(req.id, 'Approved')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'Rejected')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded cursor-pointer transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">Submit New Request</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  value={newReq.employeeId}
                  onChange={(e) => setNewReq({ ...newReq, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Request Type</label>
                <select
                  value={newReq.requestType}
                  onChange={(e) => setNewReq({ ...newReq, requestType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                >
                  <option value="Training Course Payment">Training Course Payment</option>
                  <option value="Expense Reimbursement">Expense Reimbursement</option>
                  <option value="Travel Advance">Travel Advance</option>
                  <option value="Equipment Purchase">Equipment Purchase</option>
                  <option value="General Request">General Request</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title / Description</label>
                <input
                  type="text"
                  required
                  value={newReq.title}
                  onChange={(e) => setNewReq({ ...newReq, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={newReq.amount}
                  onChange={(e) => setNewReq({ ...newReq, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeeFinanceRequestsPage;
