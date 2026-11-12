import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { associationService, AssociationItem } from '../../services/associationService';

export const ExistingAssociationPage: React.FC = () => {
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<AssociationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadAssociations = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const res = await associationService.getExisting({ page, limit: 10 });
      setItems(res.associations);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load existing associations', err);
      toast.error('Failed to load existing associations from server.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAssociations(currentPage);
  }, [currentPage, loadAssociations]);

  const handleCancel = async (id: string, name: string) => {
    if (confirm("Are you sure you want to cancel this existing association?")) {
      setActionInProgress(id);
      try {
        await associationService.cancelExisting(id);
        toast.info(`Cancelled existing association for ${name}`);
        await loadAssociations(currentPage);
      } catch (err: any) {
        console.error('Failed to cancel existing association', err);
        toast.error(err.message || 'Failed to cancel existing association');
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">Existing</h1>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 bg-white border border-slate-200 rounded-xl">
          <Loader text="Loading existing associations..." />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8">
          <EmptyState
            title="No Existing Associations"
            description="There are currently no active inhouse associations."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              {/* Header info */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-650 shrink-0">
                  <img 
                    src={item.requesterAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                    alt={item.name || item.employeeName} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">{item.name || item.employeeName}</h4>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">{item.date || item.dateRequested}</span>
                </div>
              </div>

              {/* Description Body */}
              <p className="text-xs font-bold text-slate-405 leading-relaxed">
                {item.text || item.requestDetails}
              </p>

              {/* Action button (Only Cancel button on the right side) */}
              <div className="flex justify-end">
                <button 
                  disabled={actionInProgress === item.id}
                  onClick={() => handleCancel(item.id, item.name || item.employeeName)}
                  className="px-6 py-2 border border-[#0473b8] hover:bg-blue-50/50 text-[#0473b8] text-xs font-bold rounded-lg cursor-pointer transition-all bg-white disabled:opacity-50"
                >
                  {actionInProgress === item.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && items.length > 0 && totalPages > 1 && (
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

export default ExistingAssociationPage;
