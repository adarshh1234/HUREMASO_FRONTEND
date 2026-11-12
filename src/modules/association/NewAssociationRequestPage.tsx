import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { associationService, AssociationItem } from '../../services/associationService';

export const NewAssociationRequestPage: React.FC = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<AssociationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadRequests = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const res = await associationService.getNewRequests({ page, limit: 10 });
      setRequests(res.requests);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load new association requests', err);
      toast.error('Failed to load association requests from server.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests(currentPage);
  }, [currentPage, loadRequests]);

  const handleAccept = async (id: string, name: string) => {
    setActionInProgress(id);
    try {
      await associationService.acceptRequest(id);
      toast.success(`Accepted association request from ${name}`);
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('Failed to accept association request', err);
      toast.error(err.message || 'Failed to accept association request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (id: string, name: string) => {
    setActionInProgress(id);
    try {
      await associationService.rejectRequest(id);
      toast.info(`Cancelled/Rejected association request from ${name}`);
      await loadRequests(currentPage);
    } catch (err: any) {
      console.error('Failed to cancel association request', err);
      toast.error(err.message || 'Failed to cancel association request');
    } finally {
      setActionInProgress(null);
    }
  };

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">New Association Request</h1>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 bg-white border border-slate-200 rounded-xl">
          <Loader text="Loading new association requests..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <EmptyState
            title="No Pending Requests"
            description="There are currently no new association requests pending approval."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              {/* Header info */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-650 shrink-0">
                  <img 
                    src={req.requesterAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                    alt={req.name || req.employeeName} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">{req.name || req.employeeName}</h4>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">{req.date || req.dateRequested}</span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs font-bold text-slate-405 leading-relaxed">
                {req.text || req.requestDetails}
              </p>

              {/* Action buttons matching design exactly */}
              <div className="flex gap-3">
                <Button 
                  variant="primary"
                  size="md"
                  className="px-6"
                  disabled={actionInProgress === req.id}
                  onClick={() => handleAccept(req.id, req.name || req.employeeName)}
                >
                  {actionInProgress === req.id ? 'Processing...' : 'Accept'}
                </Button>
                <button 
                  disabled={actionInProgress === req.id}
                  onClick={() => handleCancel(req.id, req.name || req.employeeName)}
                  className="px-6 py-2 border border-[#0473b8] hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg cursor-pointer transition-all bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && requests.length > 0 && totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 pt-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pagesArray.map(page => (
            <button 
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors ${
                currentPage === page 
                  ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-sm'
                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NewAssociationRequestPage;
