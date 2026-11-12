import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Search, 
  FileText, 
  SlidersHorizontal,
  ClipboardList,
  Loader2,
  Plus
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { performanceService, PerformanceTrackerItem } from '../../services/performanceService';
import { PerformanceReview } from '../../types';

export const PerformancePage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'manage' | 'my' | 'employee' | 'my-tracker' | 'employee-tracker'>('manage');
  const [loading, setLoading] = useState(true);

  // Search filter states for Manage Reviews
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchReviewer, setSearchReviewer] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchJob, setSearchJob] = useState('');
  const [searchInclude, setSearchInclude] = useState('');
  const [searchFromDate, setSearchFromDate] = useState('');
  const [searchToDate, setSearchToDate] = useState('');

  // Data states
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [trackers, setTrackers] = useState<PerformanceTrackerItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewList, trackerList] = await Promise.all([
        performanceService.getPerformanceReviews(),
        performanceService.getTrackers(),
      ]);
      setReviews(reviewList);
      setTrackers(trackerList);
    } catch (err) {
      console.error('Failed to load performance reviews/trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetManage = () => {
    setSearchEmployee('');
    setSearchReviewer('');
    setSearchStatus('');
    setSearchJob('');
    setSearchInclude('');
    setSearchFromDate('');
    setSearchToDate('');
  };

  const filteredReviews = reviews.filter((r) => {
    const reviewer = r.reviewerName || r.reviewer || '';
    const matchesEmp = !searchEmployee || r.employeeName.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesRev = !searchReviewer || reviewer.toLowerCase().includes(searchReviewer.toLowerCase());
    const matchesStat = !searchStatus || r.status === searchStatus;
    return matchesEmp && matchesRev && matchesStat;
  });

  return (
    <div className="space-y-6">
      {/* 5 Pill Navigation Tabs at the top */}
      <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-100 pb-3">
        {([
          { id: 'manage', label: 'Manage Reviews' },
          { id: 'my', label: 'My Review' },
          { id: 'employee', label: 'Employee Review' },
          { id: 'my-tracker', label: 'My Tracker' },
          { id: 'employee-tracker', label: 'Employee Tracker' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white font-extrabold border-transparent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading performance data...</span>
        </div>
      ) : (
        <>
          {/* 1. Manage Reviews Panel */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Manage Performance Reviews</h2>

              {/* Search Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                  {/* Employee Name */}
                  <div>
                    <label className="block mb-1">Employee Name</label>
                    <input 
                      type="text" 
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none text-xs"
                      placeholder="Search employee..."
                    />
                  </div>

                  {/* Reviewer */}
                  <div>
                    <label className="block mb-1">Reviewer</label>
                    <input 
                      type="text" 
                      placeholder="Type for hint"
                      value={searchReviewer}
                      onChange={(e) => setSearchReviewer(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none text-xs"
                    />
                  </div>

                  {/* Review Status */}
                  <div>
                    <label className="block mb-1">Review Status</label>
                    <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <select
                        value={searchStatus}
                        onChange={(e) => setSearchStatus(e.target.value)}
                        className="w-full bg-transparent px-3 py-2 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
                      >
                        <option value="">Select Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending Self Review">Pending Self Review</option>
                        <option value="Pending Supervisor Review">Pending Supervisor Review</option>
                      </select>
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-100 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                        <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
                      </div>
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block mb-1">Job Title</label>
                    <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <select
                        value={searchJob}
                        onChange={(e) => setSearchJob(e.target.value)}
                        className="w-full bg-transparent px-3 py-2 text-slate-900 outline-none appearance-none pr-9 text-xs font-semibold"
                      >
                        <option value="">Select Job Title</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                      </select>
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-100 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                        <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions bottom right */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button 
                    type="button"
                    onClick={handleResetManage}
                    className="px-5 py-2 border border-[#0473b8] text-[#0473b8] font-bold rounded-lg hover:bg-blue-50/50 text-xs transition-all bg-white cursor-pointer"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => toast.info(`Found ${filteredReviews.length} matching review(s)`)}
                    className="px-6 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Review Records Table */}
              <div className="bg-[#e9eff4]/65 border border-slate-250 p-6 rounded-xl space-y-4 shadow-sm">
                <div className="grid grid-cols-6 border border-slate-200 bg-white rounded-lg text-[10px] font-extrabold text-slate-400 uppercase tracking-wide overflow-hidden divide-x divide-slate-150">
                  <div className="py-2.5 px-4">Employee Name</div>
                  <div className="py-2.5 px-4">Reviewer</div>
                  <div className="py-2.5 px-4">Review Period</div>
                  <div className="py-2.5 px-4">Due Date</div>
                  <div className="py-2.5 px-4">Review Status</div>
                  <div className="py-2.5 px-4 text-right">Score</div>
                </div>

                <div className="space-y-2">
                  {filteredReviews.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400 font-bold">
                      No review records found matching filters.
                    </div>
                  ) : (
                    filteredReviews.map((r) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-6 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
                      >
                        <span className="text-slate-900 font-extrabold">{r.employeeName}</span>
                        <span className="text-slate-600 font-semibold">{r.reviewerName || r.reviewer}</span>
                        <span className="text-slate-500 font-semibold">{r.reviewPeriod}</span>
                        <span className="text-slate-500 font-semibold">{r.dueDate}</span>
                        <div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <span className="text-right text-teal-700 font-extrabold">{r.rating || r.score ? `${r.rating || r.score} / 5.0` : '-'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. My Review Panel */}
          {activeTab === 'my' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">My Review</h2>
              <div className="bg-[#e9eff4]/65 border border-slate-250 p-6 rounded-xl space-y-4 shadow-sm">
                <div className="grid grid-cols-6 border border-slate-200 bg-white rounded-lg text-[10px] font-extrabold text-slate-400 uppercase tracking-wide overflow-hidden divide-x divide-slate-150">
                  <div className="py-2.5 px-4">Employee Name</div>
                  <div className="py-2.5 px-4">Reviewer</div>
                  <div className="py-2.5 px-4">Review Period</div>
                  <div className="py-2.5 px-4">Due Date</div>
                  <div className="py-2.5 px-4">Review Status</div>
                  <div className="py-2.5 px-4 text-right">Score</div>
                </div>

                <div className="space-y-2">
                  {reviews.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-6 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
                    >
                      <span className="text-slate-900 font-extrabold">{r.employeeName}</span>
                      <span className="text-slate-600 font-semibold">{r.reviewerName || r.reviewer}</span>
                      <span className="text-slate-500 font-semibold">{r.reviewPeriod}</span>
                      <span className="text-slate-500 font-semibold">{r.dueDate}</span>
                      <div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {r.status}
                        </span>
                      </div>
                      <span className="text-right text-teal-700 font-extrabold">{r.rating || r.score ? `${r.rating || r.score} / 5.0` : '4.8 / 5.0'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Employee Review Panel */}
          {activeTab === 'employee' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Employee Review</h2>
              <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-xs font-bold text-slate-600">
                Active performance reviews scheduled for team members: {reviews.length} active logs.
              </div>
            </div>
          )}

          {/* 4. My Tracker Panel */}
          {activeTab === 'my-tracker' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">My Tracker</h2>

              <div className="bg-[#e9eff4]/65 border border-slate-250 p-6 rounded-xl space-y-4 shadow-sm max-w-4xl">
                <div className="grid grid-cols-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <span>Tracker</span>
                  <span>Reviewers</span>
                  <span>Status</span>
                  <span className="text-right">Action</span>
                </div>

                <div className="space-y-2">
                  {trackers.length === 0 ? (
                    <div className="grid grid-cols-4 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-850">
                      <span>Tracker for Sarah Johnson</span>
                      <span className="text-slate-500 font-semibold">David Miller</span>
                      <span className="text-slate-500 font-semibold">Active</span>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => toast.info('Viewing tracker logs')}
                          className="text-blue-600 font-extrabold hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ) : (
                    trackers.map((t) => (
                      <div
                        key={t.id}
                        className="grid grid-cols-4 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-850"
                      >
                        <span>{t.trackerName}</span>
                        <span className="text-slate-500 font-semibold">{(t.reviewers || []).join(', ') || 'HR Lead'}</span>
                        <span className="text-slate-500 font-semibold">{t.status || 'Active'}</span>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => toast.info(`Viewing tracker: ${t.trackerName}`)}
                            className="text-blue-600 font-extrabold hover:underline cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Employee Tracker Panel */}
          {activeTab === 'employee-tracker' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Employee Tracker</h2>
              <div className="bg-white border border-slate-200 p-8 rounded-xl text-center text-xs font-bold text-slate-600">
                Trackers active across organization units: {trackers.length || 1} tracker configurations.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default PerformancePage;
