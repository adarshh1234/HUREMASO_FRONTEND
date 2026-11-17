import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Compass, BookOpen, Award, CheckCircle2,
  Plus, Trash2, RefreshCw, Loader2, X, ExternalLink,
  Target, Clock, Star, CheckSquare, Square, MessageSquare, ShieldCheck, UserCheck
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import {
  LearningProgram,
  Certification,
  ProgramStatus,
  CertificationStatus,
  MentorshipStatus,
  CareerGoal,
  CareerGoalStatus,
  MentorshipSession,
} from '../../types/wellness.types';

type DevTab = 'programs' | 'certifications' | 'mentor' | 'goals';

const programStatusColor: Record<ProgramStatus, string> = {
  In_Progress: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Not_Started: 'bg-slate-100 text-slate-600 border-slate-200',
  On_Hold: 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

const certStatusColor: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Expiring Soon': 'bg-amber-50 text-amber-700 border-amber-200',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
  'Pending Verification': 'bg-blue-50 text-blue-700 border-blue-200',
};

export const WellnessEmployeeDevelopmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DevTab>('programs');
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [showRequestMentor, setShowRequestMentor] = useState(false);
  const [showLogSession, setShowLogSession] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Forms
  const [newProgram, setNewProgram] = useState({
    title: '',
    provider: '',
    totalModules: 8,
    completedModules: 0,
    progressPercent: 0,
    status: 'In_Progress' as ProgramStatus,
    trainingHours: 20,
    allowanceCost: 350,
    externalUrl: '',
  });

  const [newCert, setNewCert] = useState({
    name: '',
    issuingOrganization: '',
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    certificationId: '',
    status: 'Pending Verification' as CertificationStatus,
  });

  const [mentorForm, setMentorForm] = useState({
    mentorName: 'Dr. Evelyn Reed (Director of Architecture)',
    mentorId: 'EMP-012',
    durationMonths: 6,
    objectives: 'Deepen system design capabilities and high-throughput architectural patterns.',
  });

  const [sessionForm, setSessionForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    time: '15:00',
    topic: 'Architecture Review & Microservices Decoupling',
    notes: 'Reviewed event brokers and resilience patterns.',
    feedback: 'Clear mastery of scalability trade-offs.',
    completed: true,
  });

  const [goalForm, setGoalForm] = useState({
    title: 'Lead Enterprise Microservices Transformation',
    targetDate: '2027-04-30',
    status: 'In Progress' as CareerGoalStatus,
    milestones: [
      { title: 'Complete Cloud Architecture Assessment', completed: true },
      { title: 'Build Event Streaming Prototype', completed: false },
      { title: 'Facilitate Cross-Team Technical Workshop', completed: false },
    ],
  });

  const {
    development,
    developmentLoading,
    fetchDevelopment,
    addLearningProgram,
    updateLearningProgram,
    deleteLearningProgram,
    addCertification,
    updateCertification,
    deleteCertification,
    requestMentorship,
    addMentorshipSession,
    updateMentorshipStatus,
    addCareerGoal,
    updateCareerGoal,
    deleteCareerGoal,
  } = useWellness();

  useEffect(() => {
    fetchDevelopment();
  }, [fetchDevelopment]);

  const handleAddProgram = async () => {
    if (!newProgram.title || !newProgram.provider) return;
    const ok = await addLearningProgram({
      ...newProgram,
      startDate: new Date().toISOString(),
    });
    if (ok) {
      setShowAddProgram(false);
      setNewProgram({
        title: '',
        provider: '',
        totalModules: 8,
        completedModules: 0,
        progressPercent: 0,
        status: 'In_Progress',
        trainingHours: 20,
        allowanceCost: 350,
        externalUrl: '',
      });
    }
  };

  const handleAdvanceModule = async (prog: LearningProgram) => {
    if (!prog._id && !prog.id) return;
    const progId = prog._id || prog.id!;
    const newCompleted = Math.min((prog.completedModules || 0) + 1, prog.totalModules);
    const newProgress = Math.round((newCompleted / prog.totalModules) * 100);
    const newStatus: ProgramStatus = newCompleted === prog.totalModules ? 'Completed' : 'In_Progress';
    await updateLearningProgram(progId, {
      completedModules: newCompleted,
      progressPercent: newProgress,
      status: newStatus,
    });
  };

  const handleDeleteProgram = async (programId: string) => {
    setDeletingId(programId);
    await deleteLearningProgram(programId);
    setDeletingId(null);
  };

  const handleAddCert = async () => {
    if (!newCert.name || !newCert.issuingOrganization || !newCert.issuedDate) return;
    const ok = await addCertification(newCert);
    if (ok) {
      setShowAddCert(false);
      setNewCert({
        name: '',
        issuingOrganization: '',
        issuedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        certificationId: '',
        status: 'Pending Verification',
      });
    }
  };

  const handleVerifyCert = async (certId: string) => {
    await updateCertification(certId, {
      status: 'Active',
      verifiedBy: 'HR Verifier',
    });
  };

  const handleDeleteCert = async (certId: string) => {
    setDeletingId(certId);
    await deleteCertification(certId);
    setDeletingId(null);
  };

  const handleRequestMentorship = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await requestMentorship(mentorForm);
    if (ok) setShowRequestMentor(false);
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addMentorshipSession(sessionForm);
    if (ok) setShowLogSession(false);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addCareerGoal(goalForm);
    if (ok) setShowAddGoal(false);
  };

  const handleToggleMilestone = async (goal: CareerGoal, milestoneIndex: number) => {
    if (!goal.id && !goal._id) return;
    const goalId = goal.id || goal._id!;
    const updatedMilestones = goal.milestones.map((m, idx) =>
      idx === milestoneIndex ? { ...m, completed: !m.completed } : m
    );
    const allDone = updatedMilestones.every(m => m.completed);
    await updateCareerGoal(goalId, {
      milestones: updatedMilestones,
      status: allDone ? 'Completed' : 'In Progress',
    });
  };

  const trainingProgress = development
    ? Math.min(Math.round((development.completedTrainingHours / development.annualTargetHours) * 100), 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-teal-300" />
              <span>Professional Growth</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Employee Development</h1>
            <p className="text-xs text-teal-100/80 mt-1">Skill matrices, leadership mentorship tracks, certification verification, and career roadmaps.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDevelopment}
              disabled={developmentLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${developmentLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'programs' && (
              <button
                onClick={() => setShowAddProgram(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Enroll Program</span>
              </button>
            )}
            {activeTab === 'certifications' && (
              <button
                onClick={() => setShowAddCert(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Certification</span>
              </button>
            )}
            {activeTab === 'mentor' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRequestMentor(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Request Mentor</span>
                </button>
                <button
                  onClick={() => setShowLogSession(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Session</span>
                </button>
              </div>
            )}
            {activeTab === 'goals' && (
              <button
                onClick={() => setShowAddGoal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Set Goal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {developmentLoading && !development && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#004848] animate-spin" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading development data...</span>
        </div>
      )}

      {development && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Training Hours Progress</span>
                <Clock className="h-4 w-4 text-[#004848]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{development.completedTrainingHours} hrs</div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#004848] to-teal-400 h-2 rounded-full transition-all"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <span className="text-[11px] text-teal-600 font-semibold">Annual Target: {development.annualTargetHours} Hours ({trainingProgress}% complete)</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Active Certifications</span>
                <Star className="h-4 w-4 text-[#004848]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {development.certifications.filter(c => c.status === 'Active').length} Badges
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Verified & Recognized in Organization
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Learning Allowance Balance</span>
                <Target className="h-4 w-4 text-[#004848]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                ${development.learningAllowanceBalance.toLocaleString()} {development.learningAllowanceCurrency}
              </div>
              <span className="text-[11px] text-teal-600 font-semibold">Reimbursable for technical courses & exams</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'programs', label: 'Learning Programs', count: development.learningPrograms.length },
              { id: 'certifications', label: 'Certifications', count: development.certifications.length },
              { id: 'mentor', label: 'Mentorship', count: development.mentorship?.sessions?.length },
              { id: 'goals', label: 'Career Goals', count: development.careerGoals?.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DevTab)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Learning Programs Tab */}
          {activeTab === 'programs' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Enrolled Learning Programs & Training Tracks</h3>
                <span className="text-xs font-semibold text-slate-500">{development.learningPrograms.length} Enrolled</span>
              </div>

              {development.learningPrograms.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No learning programs enrolled yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {development.learningPrograms.map((course: LearningProgram) => (
                    <div key={course._id || course.id || course.title} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-[#004848]/20 hover:bg-teal-50/20 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 m-0">{course.title}</h4>
                            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold ${programStatusColor[course.status] || 'bg-slate-100 text-slate-600'}`}>
                              {course.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {course.provider} • {course.completedModules} of {course.totalModules} Modules Completed
                            {course.trainingHours ? ` • ${course.trainingHours} hrs credit` : ''}
                            {course.allowanceCost ? ` • $${course.allowanceCost} covered` : ''}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Progress</span>
                              <span className="text-[#004848]">{course.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#004848] to-teal-400 h-2 rounded-full transition-all"
                                style={{ width: `${course.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {course.completedModules < course.totalModules && (
                            <button
                              onClick={() => handleAdvanceModule(course)}
                              className="px-2.5 py-1.5 bg-[#004848] hover:bg-[#006666] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm"
                            >
                              + Mark Module Done
                            </button>
                          )}
                          {course.externalUrl && (
                            <a
                              href={course.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100 transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => (course._id || course.id) && handleDeleteProgram((course._id || course.id)!)}
                            disabled={deletingId === (course._id || course.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === (course._id || course.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 m-0">Professional Certifications & Badges</h3>
                <span className="text-xs text-slate-500 font-semibold">{development.certifications.length} Credentials</span>
              </div>

              {development.certifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Award className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No certifications added yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {development.certifications.map((cert: Certification) => {
                    const certId = cert._id || cert.id;
                    return (
                      <div key={certId || cert.name} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-[#004848]/20 hover:bg-teal-50/20 transition-all space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold mb-1 ${certStatusColor[cert.status] || 'bg-slate-100 text-slate-600'}`}>
                                {cert.status}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 m-0">{cert.name}</h4>
                              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{cert.issuingOrganization}</p>
                            </div>
                            <button
                              onClick={() => certId && handleDeleteCert(certId)}
                              disabled={deletingId === certId}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === certId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <p>Issued: {new Date(cert.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            {cert.expiryDate && <p>Expires: {new Date(cert.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                            {cert.certificationId && <p>Credential ID: <span className="font-mono text-slate-700">{cert.certificationId}</span></p>}
                            {cert.verifiedBy && (
                              <p className="text-emerald-600 font-bold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Verified by {cert.verifiedBy}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {certId && cert.status !== 'Active' && (
                          <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                            <button
                              onClick={() => handleVerifyCert(certId)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Verify Credential
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mentorship Tab */}
          {activeTab === 'mentor' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 m-0">Leadership Mentorship Program</h3>
                  {development.mentorship && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                      development.mentorship.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      development.mentorship.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {development.mentorship.status}
                    </span>
                  )}
                </div>

                {development.mentorship ? (
                  <div className="space-y-4">
                    <div className="p-5 border border-teal-200 rounded-xl bg-teal-50/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#004848] to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
                            {development.mentorship.mentorName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 m-0">{development.mentorship.mentorName}</h4>
                            <p className="text-[11px] text-slate-600 font-semibold">Duration: {development.mentorship.durationMonths} Months Program</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {development.mentorship.status === 'Active' && (
                            <button
                              onClick={() => updateMentorshipStatus('Completed', 'Successfully concluded mentorship curriculum.')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
                            >
                              Conclude Program
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-slate-700 bg-white/70 p-3 rounded-lg border border-teal-100">
                        <span className="font-bold text-slate-900">Program Objectives:</span> {development.mentorship.objectives}
                      </div>
                    </div>

                    {/* Mentorship Sessions List */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 m-0">1-on-1 Mentorship Sessions Log</h4>
                        <button
                          onClick={() => setShowLogSession(true)}
                          className="text-xs text-[#004848] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Log New Session
                        </button>
                      </div>

                      {(!development.mentorship.sessions || development.mentorship.sessions.length === 0) ? (
                        <div className="py-6 text-center text-xs text-slate-400">No sessions logged yet. Click &quot;Log New Session&quot; to add your notes.</div>
                      ) : (
                        <div className="space-y-2.5">
                          {development.mentorship.sessions.map((sess: MentorshipSession, idx: number) => (
                            <div key={sess.id || sess._id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-slate-900 m-0">{sess.topic}</h5>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {sess.sessionDate} {sess.time ? `at ${sess.time}` : ''}
                                </span>
                              </div>
                              {sess.notes && (
                                <p className="text-[11px] text-slate-600"><span className="font-semibold text-slate-800">Key Takeaways:</span> {sess.notes}</p>
                              )}
                              {sess.feedback && (
                                <p className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded border border-teal-100">
                                  <span className="font-semibold">Mentor Feedback:</span> {sess.feedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Compass className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">No mentorship program requested yet.</p>
                    <button
                      onClick={() => setShowRequestMentor(true)}
                      className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer transition-all"
                    >
                      Request Mentor Match
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Career Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Career Goals & Milestone Roadmaps</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Track key career milestones, manager reviews, and promotion targets.</p>
                  </div>
                  <button
                    onClick={() => setShowAddGoal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Set Career Goal</span>
                  </button>
                </div>

                {(!development.careerGoals || development.careerGoals.length === 0) ? (
                  <div className="py-12 text-center space-y-2">
                    <Target className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 font-medium">No career goals set. Work with your manager to establish growth milestones.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {development.careerGoals.map((goal: CareerGoal, idx: number) => {
                      const goalId = goal.id || goal._id;
                      const completedCount = goal.milestones.filter(m => m.completed).length;
                      const totalCount = goal.milestones.length;
                      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <div key={goalId || idx} className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 m-0">{goal.title}</h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  goal.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  goal.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {goal.status}
                                </span>
                              </div>
                              {goal.targetDate && (
                                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                  Target Completion: {new Date(goal.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {goalId && (
                                <button
                                  onClick={() => deleteCareerGoal(goalId)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span>Milestones Progress ({completedCount}/{totalCount})</span>
                              <span className="text-[#004848]">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#004848] to-teal-400 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Milestones list */}
                          <div className="space-y-2">
                            {goal.milestones.map((m, mIdx) => (
                              <button
                                key={m.id || m._id || mIdx}
                                onClick={() => handleToggleMilestone(goal, mIdx)}
                                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/30 flex items-center gap-2.5 text-left transition-all cursor-pointer"
                              >
                                {m.completed ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className={`text-xs font-semibold ${m.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {m.title}
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Manager Feedback */}
                          {goal.managerFeedback && (
                            <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-xs space-y-1">
                              <span className="font-bold text-[#004848] flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> Manager Review & Guidance
                              </span>
                              <p className="text-slate-700 m-0">{goal.managerFeedback}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Enroll in Learning Program</h3>
              <button onClick={() => setShowAddProgram(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Program Title *</label>
                <input
                  value={newProgram.title}
                  onChange={e => setNewProgram(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Distributed Systems Architecture & Microservices"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Provider *</label>
                <input
                  value={newProgram.provider}
                  onChange={e => setNewProgram(p => ({ ...p, provider: e.target.value }))}
                  placeholder="e.g. Coursera, O'Reilly, Internal Academy"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Modules</label>
                  <input
                    type="number"
                    min={1}
                    value={newProgram.totalModules}
                    onChange={e => setNewProgram(p => ({ ...p, totalModules: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Training Hours</label>
                  <input
                    type="number"
                    min={1}
                    value={newProgram.trainingHours}
                    onChange={e => setNewProgram(p => ({ ...p, trainingHours: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Allowance Cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={newProgram.allowanceCost}
                    onChange={e => setNewProgram(p => ({ ...p, allowanceCost: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">External Course URL</label>
                  <input
                    value={newProgram.externalUrl}
                    onChange={e => setNewProgram(p => ({ ...p, externalUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddProgram(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProgram}
                disabled={!newProgram.title || !newProgram.provider || developmentLoading}
                className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {developmentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Enroll Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Certification Modal */}
      {showAddCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Add Certification</h3>
              <button onClick={() => setShowAddCert(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Certification Name *</label>
                <input
                  value={newCert.name}
                  onChange={e => setNewCert(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. AWS Certified Solutions Architect - Professional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issuing Organization *</label>
                <input
                  value={newCert.issuingOrganization}
                  onChange={e => setNewCert(c => ({ ...c, issuingOrganization: e.target.value }))}
                  placeholder="e.g. Amazon Web Services, Scrum Alliance"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={newCert.issuedDate}
                    onChange={e => setNewCert(c => ({ ...c, issuedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCert.expiryDate}
                    onChange={e => setNewCert(c => ({ ...c, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Credential ID (optional)</label>
                <input
                  value={newCert.certificationId}
                  onChange={e => setNewCert(c => ({ ...c, certificationId: e.target.value }))}
                  placeholder="e.g. AWS-PSA-982341"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCert(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCert}
                disabled={!newCert.name || !newCert.issuingOrganization || !newCert.issuedDate || developmentLoading}
                className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {developmentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Certification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Mentorship Modal */}
      {showRequestMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Request Mentorship Track</h3>
              <button onClick={() => setShowRequestMentor(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleRequestMentorship} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Preferred Mentor / Executive</label>
                <input
                  type="text"
                  required
                  value={mentorForm.mentorName}
                  onChange={e => setMentorForm({ ...mentorForm, mentorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={mentorForm.durationMonths}
                  onChange={e => setMentorForm({ ...mentorForm, durationMonths: parseInt(e.target.value) || 6 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Objectives & Growth Focus</label>
                <textarea
                  rows={3}
                  required
                  value={mentorForm.objectives}
                  onChange={e => setMentorForm({ ...mentorForm, objectives: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestMentor(false)}
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

      {/* Log Session Modal */}
      {showLogSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Log Mentorship Session</h3>
              <button onClick={() => setShowLogSession(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLogSession} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Session Topic</label>
                <input
                  type="text"
                  required
                  value={sessionForm.topic}
                  onChange={e => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Session Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.sessionDate}
                    onChange={e => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    value={sessionForm.time}
                    onChange={e => setSessionForm({ ...sessionForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Discussion Notes</label>
                <textarea
                  rows={2}
                  value={sessionForm.notes}
                  onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mentor Feedback / Next Steps</label>
                <textarea
                  rows={2}
                  value={sessionForm.feedback}
                  onChange={e => setSessionForm({ ...sessionForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogSession(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-4 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 m-0">Set New Career Goal</h3>
              <button onClick={() => setShowAddGoal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g. Senior Software Architect Promotion"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={goalForm.targetDate}
                  onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Milestones (comma separated)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Pass Cloud Exam, Complete Security Audit, Deliver Q3 Spec"
                  defaultValue={goalForm.milestones.map(m => m.title).join('\n')}
                  onChange={e => {
                    const lines = e.target.value.split('\n').filter(Boolean);
                    setGoalForm({
                      ...goalForm,
                      milestones: lines.map(t => ({ title: t.trim(), completed: false })),
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004848]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessEmployeeDevelopmentPage;
