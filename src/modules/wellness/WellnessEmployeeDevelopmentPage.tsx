import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Compass, BookOpen, Award, CheckCircle2,
  Plus, Trash2, RefreshCw, Loader2, X, ExternalLink,
  Target, Clock, Star
} from 'lucide-react';
import { useWellness } from '../../hooks/useWellness';
import { LearningProgram, Certification, ProgramStatus } from '../../types/wellness.types';

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
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
  Pending_Renewal: 'bg-amber-50 text-amber-700 border-amber-200',
  In_Progress: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const WellnessEmployeeDevelopmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DevTab>('programs');
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newProgram, setNewProgram] = useState({
    title: '',
    provider: '',
    totalModules: 8,
    completedModules: 0,
    progressPercent: 0,
    status: 'Not_Started' as ProgramStatus,
    externalUrl: '',
  });

  const [newCert, setNewCert] = useState({
    name: '',
    issuingOrganization: '',
    issuedDate: '',
    expiryDate: '',
    certificationId: '',
    status: 'Active' as 'Active' | 'Expired' | 'Pending_Renewal' | 'In_Progress',
  });

  const {
    development,
    developmentLoading,
    fetchDevelopment,
    addLearningProgram,
    deleteLearningProgram,
    addCertification,
    deleteCertification,
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
      setNewProgram({ title: '', provider: '', totalModules: 8, completedModules: 0, progressPercent: 0, status: 'Not_Started', externalUrl: '' });
    }
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
      setNewCert({ name: '', issuingOrganization: '', issuedDate: '', expiryDate: '', certificationId: '', status: 'Active' });
    }
  };

  const handleDeleteCert = async (certId: string) => {
    setDeletingId(certId);
    await deleteCertification(certId);
    setDeletingId(null);
  };

  const trainingProgress = development
    ? Math.min(Math.round((development.completedTrainingHours / development.annualTargetHours) * 100), 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-teal-300" />
              <span>Professional Growth</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Employee Development</h1>
            <p className="text-xs text-teal-100/80 mt-1">Skill matrices, leadership mentorship tracks, certification allowances, and career pathing.</p>
          </div>
          <button
            onClick={fetchDevelopment}
            disabled={developmentLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${developmentLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
                {development.certifications.filter(c => c.status === 'Active').slice(0, 2).map(c => c.name).join(' & ') || 'No active certs'}
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
              <span className="text-[11px] text-teal-600 font-semibold">Reimbursable for courses</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2.5 items-center border-b border-slate-200 pb-3 select-none">
            {[
              { id: 'programs', label: 'Learning Programs', count: development.learningPrograms.length },
              { id: 'certifications', label: 'Certifications', count: development.certifications.length },
              { id: 'mentor', label: 'Mentorship' },
              { id: 'goals', label: 'Career Goals' },
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
                <h3 className="text-sm font-bold text-slate-900 m-0">Enrolled Learning Programs</h3>
                <button
                  onClick={() => setShowAddProgram(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Enroll Program</span>
                </button>
              </div>

              {development.learningPrograms.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No learning programs enrolled yet.</p>
                  <button onClick={() => setShowAddProgram(true)} className="text-xs text-[#004848] font-bold hover:underline">
                    + Enroll your first program
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {development.learningPrograms.map((course: LearningProgram) => (
                    <div key={course._id || course.title} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-[#004848]/20 hover:bg-teal-50/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 m-0">{course.title}</h4>
                            <span className={`px-2 py-0.5 border rounded-full text-[10px] font-extrabold ${programStatusColor[course.status]}`}>
                              {course.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {course.provider} • {course.completedModules} of {course.totalModules} Modules Completed
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Progress</span>
                              <span className="text-[#004848]">{course.progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-[#004848] to-teal-400 h-1.5 rounded-full transition-all"
                                style={{ width: `${course.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
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
                            onClick={() => course._id && handleDeleteProgram(course._id)}
                            disabled={deletingId === course._id}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50"
                          >
                            {deletingId === course._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
                <h3 className="text-sm font-bold text-slate-900 m-0">Professional Certifications</h3>
                <button
                  onClick={() => setShowAddCert(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Certification</span>
                </button>
              </div>

              {development.certifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Award className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No certifications added yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {development.certifications.map((cert: Certification) => (
                    <div key={cert._id || cert.name} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:border-[#004848]/20 hover:bg-teal-50/20 transition-all space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`inline-block px-2 py-0.5 border rounded-full text-[10px] font-extrabold mb-1 ${certStatusColor[cert.status]}`}>
                            {cert.status.replace('_', ' ')}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 m-0">{cert.name}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{cert.issuingOrganization}</p>
                        </div>
                        <button
                          onClick={() => cert._id && handleDeleteCert(cert._id)}
                          disabled={deletingId === cert._id}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                          {deletingId === cert._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        <p>Issued: {new Date(cert.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        {cert.expiryDate && <p>Expires: {new Date(cert.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                        {cert.certificationId && <p>ID: {cert.certificationId}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mentorship Tab */}
          {activeTab === 'mentor' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Mentorship & Career Track</h3>
              {development.mentorName ? (
                <div className="p-5 border border-teal-200 rounded-xl bg-teal-50/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004848] to-teal-400 flex items-center justify-center text-white font-bold text-sm">
                      {development.mentorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 m-0">{development.mentorName}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold">Assigned Mentor • Executive Leadership Track</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Compass className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No mentor assigned yet. Contact HR to request a mentor.</p>
                </div>
              )}
            </div>
          )}

          {/* Career Goals Tab */}
          {activeTab === 'goals' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 m-0 border-b border-slate-100 pb-3">Career Goals & Development Path</h3>
              {development.careerGoal ? (
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-[#004848] font-bold text-xs">
                    <Target className="h-4 w-4" />
                    <span>Career Objective</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{development.careerGoal}</p>
                  {development.nextReviewDate && (
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Next Development Review: {new Date(development.nextReviewDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Target className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">No career goal set. Work with your manager to set development goals.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-5 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Enroll in Learning Program</h3>
              <button onClick={() => setShowAddProgram(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Program Title *</label>
                <input
                  value={newProgram.title}
                  onChange={e => setNewProgram(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Advanced Machine Learning Specialization"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] focus:ring-1 focus:ring-[#004848]/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Provider *</label>
                <input
                  value={newProgram.provider}
                  onChange={e => setNewProgram(p => ({ ...p, provider: e.target.value }))}
                  placeholder="e.g. Coursera, LinkedIn Learning"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] focus:ring-1 focus:ring-[#004848]/20"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={newProgram.status}
                    onChange={e => setNewProgram(p => ({ ...p, status: e.target.value as ProgramStatus }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                  >
                    <option value="Not_Started">Not Started</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On_Hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">External URL (optional)</label>
                <input
                  value={newProgram.externalUrl}
                  onChange={e => setNewProgram(p => ({ ...p, externalUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddProgram(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProgram}
                disabled={!newProgram.title || !newProgram.provider || developmentLoading}
                className="flex-1 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 space-y-5 p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Certification</h3>
              <button onClick={() => setShowAddCert(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Certification Name *</label>
                <input
                  value={newCert.name}
                  onChange={e => setNewCert(c => ({ ...c, name: e.target.value }))}
                  placeholder="e.g. AWS Solutions Architect"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issuing Organization *</label>
                <input
                  value={newCert.issuingOrganization}
                  onChange={e => setNewCert(c => ({ ...c, issuingOrganization: e.target.value }))}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={newCert.issuedDate}
                    onChange={e => setNewCert(c => ({ ...c, issuedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCert.expiryDate}
                    onChange={e => setNewCert(c => ({ ...c, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cert ID (optional)</label>
                  <input
                    value={newCert.certificationId}
                    onChange={e => setNewCert(c => ({ ...c, certificationId: e.target.value }))}
                    placeholder="e.g. AWC-12345"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={newCert.status}
                    onChange={e => setNewCert(c => ({ ...c, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#004848] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Pending_Renewal">Pending Renewal</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddCert(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCert}
                disabled={!newCert.name || !newCert.issuingOrganization || !newCert.issuedDate || developmentLoading}
                className="flex-1 py-2 bg-[#004848] text-white rounded-xl text-xs font-bold hover:bg-[#006666] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {developmentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Certification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessEmployeeDevelopmentPage;
