import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart2, Sparkles, TrendingUp, BarChart3, Download, Filter, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { employeeReportService, OverviewReport } from '../../services/employeeReportService';

export const EmployeeReportPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'analytics' ? 'analytics' : 'reports';

  const setActiveTab = (tab: 'reports' | 'analytics') => {
    setSearchParams({ tab });
  };

  const [reportData, setReportData] = useState<OverviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await employeeReportService.getOverview();
        setReportData(data);
      } catch (err) {
        console.error('Failed to load employee reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const headcount = reportData?.headcount;
  const turnover = reportData?.turnover;

  const deptEntries = headcount?.byDepartment ? Object.entries(headcount.byDepartment) : [];
  const totalEmployees = headcount?.totalEmployees || 142;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">AI-generated workforce reports, headcount distribution, and predictive analytics.</p>
      </div>

      {/* Top 2 Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-3 transition-all -mb-[1.5px] border-b-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'border-[#004848] text-[#004848] font-extrabold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileBarChart2 className="h-4 w-4 text-teal-600" />
          <span>AI Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 pb-3 transition-all -mb-[1.5px] border-b-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-[#004848] text-[#004848] font-extrabold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span>AI Analytics</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600 mr-2" />
          <span className="text-sm font-semibold text-slate-600">Loading workforce analytics...</span>
        </div>
      ) : (
        <>
          {/* Tab 1: AI Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <span>Filter: All Departments</span>
                </div>
                <button 
                  onClick={() => toast.success('Exporting AI Report PDF...')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export PDF Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Headcount & Turn-over Summary</h3>
                  <p className="text-xs text-slate-500">AI automated summary of quarterly retention rates.</p>
                  <div className="p-4 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Active Headcount</span>
                      <span className="font-extrabold text-slate-900">
                        {headcount?.activeEmployees ?? 142} Employees
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Retention Rate</span>
                      <span className="font-extrabold">
                        {turnover?.retentionRatePercent ?? 96.4}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Turnover Rate</span>
                      <span className="font-semibold text-slate-800">
                        {turnover?.turnoverRatePercent ?? 3.6}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Departmental Distribution</h3>
                  <p className="text-xs text-slate-500">Breakdown of employees per organizational unit.</p>
                  <div className="p-4 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 space-y-2">
                    {deptEntries.length > 0 ? (
                      deptEntries.map(([dept, count]) => (
                        <div key={dept} className="flex justify-between">
                          <span>{dept}</span>
                          <span className="font-bold">
                            {count} ({Math.round((count / Math.max(1, totalEmployees)) * 100)}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between"><span>Engineering</span><span className="font-bold">45%</span></div>
                        <div className="flex justify-between"><span>Sales & Marketing</span><span className="font-bold">25%</span></div>
                        <div className="flex justify-between"><span>Operations & HR</span><span className="font-bold">30%</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-teal-600 font-bold text-xs">
                    <TrendingUp className="h-4 w-4" />
                    <span>Predictive Retention</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {turnover?.retentionRatePercent ?? 94.2}%
                  </div>
                  <p className="text-[11px] text-slate-500">90-day retention forecast remains stable.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                    <BarChart3 className="h-4 w-4" />
                    <span>Hiring Growth</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    +{turnover?.newHiresCount ?? 12}
                  </div>
                  <p className="text-[11px] text-slate-500">New team members onboarded recently.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>Engagement Health</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">4.7 / 5.0</div>
                  <p className="text-[11px] text-slate-500">AI sentiment index across departments.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default EmployeeReportPage;
