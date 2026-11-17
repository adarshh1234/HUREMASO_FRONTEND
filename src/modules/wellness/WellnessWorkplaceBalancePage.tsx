import React, { useState, useEffect } from 'react';
import {
  Home, Calendar, Baby, Users, DollarSign, Receipt,
  Plus, RefreshCw, Loader2, X, Check, Clock, AlertCircle,
  Building, HeartHandshake, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import {
  FringeClaim,
  FringeCategory,
  FringeClaimStatus,
  ScheduleType,
  ScheduleChangeRequest,
  PaidLeaveRequest,
  AccommodationRequest,
  ChildCareRequest,
  FamilyEvent,
  FamilySupportRequest
} from '../../types/wellness.types';

type WorkplaceTab = 'flexi' | 'leave' | 'care' | 'family' | 'fringe';

const fringeStatusColor: Record<FringeClaimStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const FRINGE_CATEGORIES: FringeCategory[] = [
  'Connectivity', 'Commute', 'Equipment', 'Childcare', 'Housing', 'Meal', 'Other'
];

export const WellnessWorkplaceBalancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkplaceTab>('flexi');
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);

  // Modals state
  const [showFringeModal, setShowFringeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAccommodationModal, setShowAccommodationModal] = useState(false);
  const [showChildcareModal, setShowChildcareModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Forms
  const [newFringeClaim, setNewFringeClaim] = useState({
    title: '',
    category: 'Connectivity' as FringeCategory,
    amount: '',
    currency: 'USD',
    description: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    requestedSchedule: 'Hybrid' as ScheduleType,
    officeDays: 3,
    remoteDays: 2,
    coreHours: '10:00 - 16:00',
    reason: 'Optimize commute and sprint deep-work days.',
  });

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Wellness Day' as 'Sabbatical' | 'Wellness Day' | 'Parental Leave' | 'Vacation',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
    daysCount: 1,
    reason: 'Personal mental recharge and wellness day.',
  });

  const [accommodationForm, setAccommodationForm] = useState({
    facilityName: 'Huremaso Executive Residencies - Block B',
    roomType: 'Single Studio' as 'Single Studio' | 'Shared Dormitory' | 'Executive Suite',
    checkInDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    reason: 'Temporary accommodation for corporate quarterly strategy onsite.',
  });

  const [childcareForm, setChildcareForm] = useState({
    childName: 'Emma Johnson',
    childAge: 3,
    facilityName: 'Bright Horizons Early Education Center',
    requestedMonthlyStipend: 400,
  });

  const [eventForm, setEventForm] = useState({
    title: 'Huremaso Annual Family Picnic & Funfest 2026',
    date: '2026-12-12',
    location: 'Central Corporate Greens & Park',
    description: 'Games, sports, buffet, live music, and kid activities for employee families.',
  });

  const [supportForm, setSupportForm] = useState({
    requestType: 'Elderly Care' as 'Elderly Care' | 'Emergency Assistance' | 'Education Support' | 'Counseling',
    details: 'Requesting guidance on subsidized nursing caregiver network for elderly parent.',
  });

  const {
    workplace,
    workplaceLoading,
    fetchWorkplace,
    requestScheduleChange,
    reviewScheduleChange,
    requestPaidLeave,
    reviewPaidLeave,
    requestAccommodation,
    reviewAccommodation,
    requestChildCare,
    reviewChildCare,
    createFamilyEvent,
    registerFamilyEvent,
    requestFamilySupport,
    submitFringeClaim,
    updateFringeClaimStatus,
    applyChildCareStipend,
  } = useWellness();

  useEffect(() => {
    fetchWorkplace();
  }, [fetchWorkplace]);

  const handleSubmitFringeClaim = async () => {
    if (!newFringeClaim.title || !newFringeClaim.amount) return;
    const ok = await submitFringeClaim({
      ...newFringeClaim,
      amount: parseFloat(newFringeClaim.amount),
    });
    if (ok) {
      setShowFringeModal(false);
      setNewFringeClaim({ title: '', category: 'Connectivity', amount: '', currency: 'USD', description: '' });
    }
  };

  const handleUpdateFringeClaim = async (claimId: string, status: FringeClaimStatus, rejectionReason?: string) => {
    setUpdatingClaimId(claimId);
    await updateFringeClaimStatus(claimId, status, rejectionReason);
    setUpdatingClaimId(null);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestScheduleChange(scheduleForm);
    if (ok) setShowScheduleModal(false);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestPaidLeave(leaveForm);
    if (ok) setShowLeaveModal(false);
  };

  const handleAccommodationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestAccommodation(accommodationForm);
    if (ok) setShowAccommodationModal(false);
  };

  const handleChildcareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestChildCare(childcareForm);
    if (ok) setShowChildcareModal(false);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createFamilyEvent(eventForm);
    if (ok) setShowEventModal(false);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestFamilySupport(supportForm);
    if (ok) setShowSupportModal(false);
  };

  const wellnessDaysRemaining = workplace ? workplace.wellnessDaysTotal - workplace.wellnessDaysUsed : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Home className="h-3.5 w-3.5 text-teal-300" />
              <span>Workplace & Life Balance</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Workplace Life Balance</h1>
            <p className="text-xs text-teal-100/80 mt-1">Flexible work scheduling, sabbatical packages, dormitory & daycare assistance, family support, and fringe reimbursements.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchWorkplace}
              disabled={workplaceLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${workplaceLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'flexi' && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Change Schedule</span>
              </button>
            )}
            {activeTab === 'leave' && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Request Leave</span>
              </button>
            )}
            {activeTab === 'care' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAccommodationModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Request Dormitory</span>
                </button>
                <button
                  onClick={() => setShowChildcareModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Baby className="h-3.5 w-3.5" />
                  <span>Childcare Stipend</span>
                </button>
              </div>
            )}
            {activeTab === 'family' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEventModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Event</span>
                </button>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <HeartHandshake className="h-3.5 w-3.5" />
                  <span>Family Support</span>
                </button>
              </div>
            )}
            {activeTab === 'fringe' && (
              <button
                onClick={() => setShowFringeModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Claim</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {workplaceLoading && !workplace && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading workplace data...</span>
        </div>
      )}

      {workplace && (
        <>
          {/* Top Page Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'flexi', label: 'Flexible Work Scheduling' },
              { id: 'leave', label: 'Paid Leave Package', count: workplace.paidLeaveRequests?.filter(r => r.status === 'Pending').length },
              { id: 'care', label: 'Dormitory + Child Care', count: (workplace.accommodationRequests?.length || 0) + (workplace.childCareRequests?.length || 0) },
              { id: 'family', label: 'Family Wellbeing', count: workplace.familyEvents?.length },
              { id: 'fringe', label: 'Fringe Reimbursement', count: workplace.fringeClaims.filter(c => c.status === 'Pending').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkplaceTab)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Flexible Work Tab */}
          {activeTab === 'flexi' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Hybrid Work Schedule Agreement</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Formal workplace scheduling parameters and flexible work hours.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                    {workplace.workScheduleType} ({workplace.officeDaysPerWeek} Days Office)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Core Hours</span>
                    <div className="text-base font-bold text-slate-900">
                      {workplace.coreHoursStart} AM - {workplace.coreHoursEnd} PM
                    </div>
                    <span className="text-[11px] text-teal-600 font-semibold">
                      Flexi-band: {workplace.flexiBandStart} - {workplace.flexiBandEnd}
                    </span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                    <span className="text-xs font-bold text-slate-500">Remote Work Location</span>
                    <div className="text-base font-bold text-slate-900">{workplace.remoteWorkLocation || 'Verified Home Office'}</div>
                    <span className="text-[11px] text-teal-600 font-semibold">Broadband compliance verified</span>
                  </div>
                </div>
              </div>

              {/* Schedule Change Requests List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Schedule Modification Requests</h3>
                  <span className="text-xs text-slate-500 font-semibold">{workplace.scheduleChangeRequests?.length || 0} Requests</span>
                </div>
                {(!workplace.scheduleChangeRequests || workplace.scheduleChangeRequests.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No schedule change requests on record. Click &quot;Change Schedule&quot; to submit one.</div>
                ) : (
                  <div className="space-y-3">
                    {workplace.scheduleChangeRequests.map((req: ScheduleChangeRequest, idx: number) => {
                      const reqId = req.id || req._id;
                      return (
                        <div key={reqId || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 m-0">Requested: {req.requestedSchedule}</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">{req.requestDate}</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Office Days: {req.officeDays} • Remote Days: {req.remoteDays} • Core Hours: {req.coreHours}
                            </p>
                            <p className="text-[11px] text-slate-500 italic">Reason: {req.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                              req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{req.status}</span>
                            {reqId && req.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => reviewScheduleChange(reqId, 'Approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => reviewScheduleChange(reqId, 'Rejected')}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded text-xs font-bold cursor-pointer transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paid Leave Tab */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Special Wellness & Paid Leave Allowances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Sabbatical Leave Balance</span>
                    <div className="text-xl font-extrabold text-slate-900">{workplace.sabbaticalLeaveWeeks} Weeks Paid</div>
                    <span className="text-[11px] text-teal-600 font-semibold">Eligible after 3 years continuous tenure</span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Wellness & Mental Recharge Days</span>
                    <div className="text-xl font-extrabold text-slate-900">{wellnessDaysRemaining} of {workplace.wellnessDaysTotal} Days Remaining</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-500 h-1.5 rounded-full"
                        style={{ width: `${Math.round(wellnessDaysRemaining / workplace.wellnessDaysTotal * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold">Fully paid mental wellness days</span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1 hover:shadow-sm transition-shadow">
                    <span className="text-xs font-bold text-slate-500">Parental Bonding Package</span>
                    <div className="text-xl font-extrabold text-slate-900">{workplace.parentalLeaveWeeks} Weeks Paid</div>
                    <span className="text-[11px] text-teal-600 font-semibold">Primary & secondary caregiver leave</span>
                  </div>
                </div>
              </div>

              {/* Leave Requests Log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Leave Applications & Approval Roster</h3>
                  <span className="text-xs text-slate-500 font-semibold">{workplace.paidLeaveRequests?.length || 0} Records</span>
                </div>
                {(!workplace.paidLeaveRequests || workplace.paidLeaveRequests.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No leave requests logged. Click &quot;Request Leave&quot; above to apply.</div>
                ) : (
                  <div className="space-y-3">
                    {workplace.paidLeaveRequests.map((leave: PaidLeaveRequest, idx: number) => {
                      const leaveId = leave.id || leave._id;
                      return (
                        <div key={leaveId || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 m-0">{leave.leaveType}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                                {leave.daysCount} Day(s)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Dates: {leave.startDate} to {leave.endDate}
                            </p>
                            <p className="text-[11px] text-slate-500 italic">Reason: {leave.reason}</p>
                            {leave.rejectionReason && (
                              <p className="text-[11px] text-rose-600 font-semibold">Rejection note: {leave.rejectionReason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                              leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{leave.status}</span>
                            {leaveId && leave.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => reviewPaidLeave(leaveId, 'Approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = window.prompt('Enter rejection reason:');
                                    if (reason) reviewPaidLeave(leaveId, 'Rejected', reason);
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded text-xs font-bold cursor-pointer transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dormitory + Child Care Tab */}
          {activeTab === 'care' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Company Dormitory & Child Care Assistance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/20 transition-all">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Baby className="h-4 w-4" />
                      <span>On-Site Daycare & Childcare Subsidies</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">
                      Monthly ${workplace.childCareStipendMonthly} {workplace.childCareStipendCurrency} child care stipend for registered partner nurseries.
                    </p>
                    {workplace.childCareStipendActive ? (
                      <div className="w-full py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Monthly Stipend Active
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowChildcareModal(true)}
                        className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all"
                      >
                        Apply for Childcare Stipend
                      </button>
                    )}
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 hover:border-[#004848]/20 transition-all">
                    <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                      <Home className="h-4 w-4" />
                      <span>Executive Company Dormitory Facilities</span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">Short-stay executive apartments available for business travel, relos & on-call rotations.</p>
                    <button
                      onClick={() => setShowAccommodationModal(true)}
                      className="w-full py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#006666] transition-all"
                    >
                      Book Dormitory Stay
                    </button>
                  </div>
                </div>
              </div>

              {/* Dormitory Requests */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Dormitory Accommodation Allocations</h3>
                  <span className="text-xs text-slate-500 font-semibold">{workplace.accommodationRequests?.length || 0} Bookings</span>
                </div>
                {(!workplace.accommodationRequests || workplace.accommodationRequests.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No accommodation bookings recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {workplace.accommodationRequests.map((acc: AccommodationRequest, idx: number) => {
                      const accId = acc.id || acc._id;
                      return (
                        <div key={accId || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-900 m-0">{acc.facilityName} ({acc.roomType})</h4>
                            <p className="text-[11px] text-slate-600">
                              Check-In: {acc.checkInDate} {acc.checkOutDate ? `to ${acc.checkOutDate}` : ''}
                            </p>
                            {acc.allocatedRoomNumber && (
                              <p className="text-[11px] text-emerald-600 font-bold">Allocated Room: {acc.allocatedRoomNumber}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                              acc.status === 'Allocated' || acc.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              acc.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{acc.status}</span>
                            {accId && acc.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  const room = window.prompt('Enter room number (e.g. Studio 402):');
                                  if (room) reviewAccommodation(accId, 'Allocated', room);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                              >
                                Allocate Room
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Wellbeing Tab */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Family Wellbeing Events</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Family picnics, movie nights, and community celebrations.</p>
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Event</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(workplace.familyEvents || []).map((event: FamilyEvent, idx: number) => {
                    const isRegistered = event.registered || workplace.familyEventsRegistered.includes(event.title);
                    return (
                      <div key={event.id || event._id || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-900 m-0">{event.title}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold">{event.date} • {event.location}</p>
                          <p className="text-[11px] text-slate-600">{event.description}</p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => registerFamilyEvent(event.title)}
                            className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isRegistered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#004848] text-white hover:bg-[#006666]'
                            }`}
                          >
                            {isRegistered ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {isRegistered ? 'Registered (Pass Issued)' : 'Register Family Pass'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Family Support Requests */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Family Assistance & Caregiver Requests</h3>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Request Assistance</span>
                  </button>
                </div>
                {(!workplace.familySupportRequests || workplace.familySupportRequests.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400">No active assistance tickets on record.</div>
                ) : (
                  <div className="space-y-2.5">
                    {workplace.familySupportRequests.map((sup: FamilySupportRequest, idx: number) => (
                      <div key={sup.id || sup._id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{sup.requestType}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{sup.details}</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          {sup.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fringe Reimbursement Tab */}
          {activeTab === 'fringe' && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Monthly Internet Allowance Limit</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeMonthlyInternetAllowance} / mo
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Auto-reimbursed with monthly payroll</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Commute & Transit Stipend Limit</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeMonthlyCommuteAllowance} / mo
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold">Public transit & EV charging eligible</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-500">Total YTD Fringe Reimbursed</span>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${workplace.fringeTotalYTDReimbursed.toLocaleString()} {workplace.fringeCurrency}
                  </div>
                  <span className="text-[11px] text-teal-600 font-semibold">Tax-exempt corporate fringe benefits</span>
                </div>
              </div>

              {/* Claims List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Fringe Benefit Reimbursement Claims</h3>
                  <button
                    onClick={() => setShowFringeModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#006666] transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Submit Fringe Claim</span>
                  </button>
                </div>

                {workplace.fringeClaims.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Receipt className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">No fringe claims submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workplace.fringeClaims.map((item: FringeClaim) => (
                      <div key={item._id || item.claimId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 m-0">{item.claimId}: {item.title}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} •
                            Category: {item.category} •
                            Amount: ${item.amount.toFixed(2)} {item.currency}
                          </p>
                          {item.rejectionReason && (
                            <p className="text-[11px] text-rose-600 font-semibold">Reason: {item.rejectionReason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 border rounded-full text-xs font-extrabold ${fringeStatusColor[item.status]}`}>
                            {item.status}
                          </span>
                          {item.status === 'Pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUpdateFringeClaim(item.claimId, 'Approved')}
                                disabled={updatingClaimId === item.claimId}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason:');
                                  if (reason) handleUpdateFringeClaim(item.claimId, 'Rejected', reason);
                                }}
                                disabled={updatingClaimId === item.claimId}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded text-xs font-bold cursor-pointer transition-all"
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
              </div>
            </div>
          )}
        </>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Request Schedule Change</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Work Schedule Arrangement</label>
                <select
                  value={scheduleForm.requestedSchedule}
                  onChange={e => setScheduleForm({ ...scheduleForm, requestedSchedule: e.target.value as ScheduleType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  <option value="Hybrid">Hybrid (e.g. 3 Days Office / 2 Days Remote)</option>
                  <option value="Remote">Fully Remote</option>
                  <option value="Office">Full-Time Office</option>
                  <option value="Flexible Hours">Flexible Core Hours</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Office Days / Wk</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={scheduleForm.officeDays}
                    onChange={e => setScheduleForm({ ...scheduleForm, officeDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Remote Days / Wk</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={scheduleForm.remoteDays}
                    onChange={e => setScheduleForm({ ...scheduleForm, remoteDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Core Working Hours</label>
                <input
                  type="text"
                  value={scheduleForm.coreHours}
                  onChange={e => setScheduleForm({ ...scheduleForm, coreHours: e.target.value })}
                  placeholder="e.g. 10:00 - 16:00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Request</label>
                <textarea
                  rows={2}
                  required
                  value={scheduleForm.reason}
                  onChange={e => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Apply for Paid / Wellness Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  <option value="Wellness Day">Mental Recharge / Wellness Day ({wellnessDaysRemaining} available)</option>
                  <option value="Sabbatical">Sabbatical Leave</option>
                  <option value="Parental Leave">Parental Bonding Leave</option>
                  <option value="Vacation">Annual Vacation Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leaveForm.daysCount}
                  onChange={e => setLeaveForm({ ...leaveForm, daysCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Leave</label>
                <textarea
                  rows={2}
                  required
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Apply Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accommodation Modal */}
      {showAccommodationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Book Company Dormitory Stay</h3>
              <button onClick={() => setShowAccommodationModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAccommodationSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={accommodationForm.facilityName}
                  onChange={e => setAccommodationForm({ ...accommodationForm, facilityName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Room Type</label>
                <select
                  value={accommodationForm.roomType}
                  onChange={e => setAccommodationForm({ ...accommodationForm, roomType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  <option value="Single Studio">Single Studio</option>
                  <option value="Shared Dormitory">Shared Dormitory</option>
                  <option value="Executive Suite">Executive Suite</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={accommodationForm.checkInDate}
                    onChange={e => setAccommodationForm({ ...accommodationForm, checkInDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Check-Out Date</label>
                  <input
                    type="date"
                    value={accommodationForm.checkOutDate}
                    onChange={e => setAccommodationForm({ ...accommodationForm, checkOutDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Purpose / Reason</label>
                <textarea
                  rows={2}
                  required
                  value={accommodationForm.reason}
                  onChange={e => setAccommodationForm({ ...accommodationForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccommodationModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Childcare Modal */}
      {showChildcareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Apply for Childcare Assistance</h3>
              <button onClick={() => setShowChildcareModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleChildcareSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Child Name</label>
                <input
                  type="text"
                  required
                  value={childcareForm.childName}
                  onChange={e => setChildcareForm({ ...childcareForm, childName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Child Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    required
                    value={childcareForm.childAge}
                    onChange={e => setChildcareForm({ ...childcareForm, childAge: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Monthly Stipend ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={childcareForm.requestedMonthlyStipend}
                    onChange={e => setChildcareForm({ ...childcareForm, requestedMonthlyStipend: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nursery / Daycare Facility Name</label>
                <input
                  type="text"
                  required
                  value={childcareForm.facilityName}
                  onChange={e => setChildcareForm({ ...childcareForm, facilityName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChildcareModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Create Family Wellbeing Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Family Support & Assistance Request</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSupportSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Support Category</label>
                <select
                  value={supportForm.requestType}
                  onChange={e => setSupportForm({ ...supportForm, requestType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                >
                  <option value="Elderly Care">Elderly Care & Caregiver Assistance</option>
                  <option value="Emergency Assistance">Emergency Household Assistance</option>
                  <option value="Education Support">Children Education Support</option>
                  <option value="Counseling">Family Relationship Counseling</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Details & Special Requirements</label>
                <textarea
                  rows={3}
                  required
                  value={supportForm.details}
                  onChange={e => setSupportForm({ ...supportForm, details: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Fringe Claim Modal */}
      {showFringeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Submit Fringe Benefit Claim</h3>
              <button onClick={() => setShowFringeModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Claim Title *</label>
                <input
                  value={newFringeClaim.title}
                  onChange={e => setNewFringeClaim(c => ({ ...c, title: e.target.value }))}
                  placeholder="e.g. Home Fiber Internet Bill"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newFringeClaim.category}
                    onChange={e => setNewFringeClaim(c => ({ ...c, category: e.target.value as FringeCategory }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] bg-white"
                  >
                    {FRINGE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={newFringeClaim.amount}
                    onChange={e => setNewFringeClaim(c => ({ ...c, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description (optional)</label>
                <textarea
                  value={newFringeClaim.description}
                  onChange={e => setNewFringeClaim(c => ({ ...c, description: e.target.value }))}
                  rows={2}
                  placeholder="Additional details about this claim..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFringeModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSubmitFringeClaim}
                disabled={!newFringeClaim.title || !newFringeClaim.amount || workplaceLoading}
                className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {workplaceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessWorkplaceBalancePage;
