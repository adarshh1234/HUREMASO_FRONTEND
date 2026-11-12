import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone, 
  ShieldAlert, 
  UserCheck, 
  Plus, 
  Eye, 
  X,
  FileText,
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  AppEmployeeRequest, 
  RequestType, 
  RequestStatus, 
  RequestPriority 
} from '../../../types/employeeApp.types';

interface AppRequestsTabProps {
  requests: AppEmployeeRequest[];
  total: number;
  loading: boolean;
  onFetchRequests: (params?: any) => Promise<void>;
  onCreateRequest: (data: Partial<AppEmployeeRequest>) => Promise<any>;
  onUpdateRequestStatus: (
    id: string,
    status: RequestStatus,
    reviewNotes?: string,
    reviewedBy?: string
  ) => Promise<any>;
}

export const AppRequestsTab: React.FC<AppRequestsTabProps> = ({
  requests,
  total,
  loading,
  onFetchRequests,
  onCreateRequest,
  onUpdateRequestStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [reviewingRequest, setReviewingRequest] = useState<AppEmployeeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<RequestStatus>('Approved');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // New Request modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    employeeId: 'EMP-1002',
    employeeName: 'Alexander Wright',
    department: 'Engineering',
    requestType: 'Device_Change' as RequestType,
    title: '',
    details: '',
    priority: 'Medium' as RequestPriority,
    deviceInfo: 'iOS 17.5 / iPhone 15 Pro',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchRequests({
        search: searchTerm,
        status: statusFilter,
        requestType: typeFilter,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, typeFilter, onFetchRequests]);

  const handleOpenReview = (req: AppEmployeeRequest) => {
    setReviewingRequest(req);
    setReviewNotes(req.reviewNotes || '');
    setReviewAction(req.status === 'Pending' ? 'Approved' : req.status);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    try {
      setReviewSubmitting(true);
      await onUpdateRequestStatus(reviewingRequest.id, reviewAction, reviewNotes, 'Admin Reviewer');
      setReviewingRequest(null);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestData.title.trim() || !newRequestData.details.trim()) return;

    try {
      setCreateSubmitting(true);
      await onCreateRequest(newRequestData);
      setIsNewModalOpen(false);
      setNewRequestData({
        employeeId: 'EMP-1002',
        employeeName: 'Alexander Wright',
        department: 'Engineering',
        requestType: 'Device_Change',
        title: '',
        details: '',
        priority: 'Medium',
        deviceInfo: 'iOS 17.5 / iPhone 15 Pro',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'In_Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3" /> In Review</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  const getRequestTypeBadge = (type: RequestType) => {
    const formatted = type.replace(/_/g, ' ');
    switch (type) {
      case 'Device_Change':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">{formatted}</span>;
      case 'Access_Unlock':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{formatted}</span>;
      case 'Offboard_Wipe':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{formatted}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search request title, employee name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Employee Request</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In_Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Request Types</option>
            <option value="Device_Change">Device Change</option>
            <option value="Access_Unlock">Access Unlock</option>
            <option value="Feature_Permission">Feature Permission</option>
            <option value="Profile_Update">Profile Update</option>
            <option value="Data_Sync_Issue">Data Sync Issue</option>
            <option value="Offboard_Wipe">Offboard Wipe</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Request Type & Title</th>
                <th className="py-3.5 px-4">Details & Hardware</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Review / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#004848] border-t-transparent rounded-full mb-2"></div>
                    <p className="font-medium">Loading requests...</p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No requests in queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">App user service requests will appear here for review.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{req.employeeName}</p>
                        <p className="text-[11px] text-slate-500">{req.employeeId} &bull; {req.department}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="mb-1">{getRequestTypeBadge(req.requestType)}</div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{req.title}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-xs">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">{req.details}</p>
                        {req.deviceInfo && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{req.deviceInfo}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(req.status)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <p className="font-medium text-slate-700">{new Date(req.submittedAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(req)}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#004848] text-xs font-bold border border-teal-200/80 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getRequestTypeBadge(reviewingRequest.requestType)}
                <h3 className="text-base font-bold text-slate-900">Request Review</h3>
              </div>
              <button
                onClick={() => setReviewingRequest(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-800">{reviewingRequest.employeeName} ({reviewingRequest.employeeId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{reviewingRequest.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject:</span>
                <span className="font-semibold text-slate-800">{reviewingRequest.title}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-slate-500 font-medium mb-1">Details & Remarks:</p>
                <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {reviewingRequest.details}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Action Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Approved', 'In_Review', 'Rejected'] as RequestStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReviewAction(st)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        reviewAction === st
                          ? st === 'Approved'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'Rejected'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Feedback / Review Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain reason for approval / rejection or instructions for employee..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Request Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Log Employee App Request</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={newRequestData.employeeId}
                    onChange={(e) => setNewRequestData({ ...newRequestData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={newRequestData.employeeName}
                    onChange={(e) => setNewRequestData({ ...newRequestData, employeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newRequestData.department}
                    onChange={(e) => setNewRequestData({ ...newRequestData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Request Type</label>
                  <select
                    value={newRequestData.requestType}
                    onChange={(e) => setNewRequestData({ ...newRequestData, requestType: e.target.value as RequestType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Device_Change">Device Change</option>
                    <option value="Access_Unlock">Access Unlock</option>
                    <option value="Feature_Permission">Feature Permission</option>
                    <option value="Profile_Update">Profile Update</option>
                    <option value="Data_Sync_Issue">Data Sync Issue</option>
                    <option value="Offboard_Wipe">Offboard Wipe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Request Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unbind old Android phone for new iPhone 15"
                  value={newRequestData.title}
                  onChange={(e) => setNewRequestData({ ...newRequestData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide context and reason for request..."
                  value={newRequestData.details}
                  onChange={(e) => setNewRequestData({ ...newRequestData, details: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {createSubmitting ? 'Submitting...' : 'Log Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
