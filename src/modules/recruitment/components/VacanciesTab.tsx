import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, Eye, Edit2, ChevronLeft, ChevronRight, X, Briefcase, Users, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import recruitmentService from '../../../services/recruitmentService';
import adminService, { JobTitleRecord, DepartmentRecord } from '../../../services/adminService';
import { employeeService } from '../../../services/employeeService';
import { Employee, Vacancy } from '../../../types';
import Loader from '../../../components/common/Loader';
import EmptyState from '../../../components/common/EmptyState';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';

interface VacancyDisplayItem {
  id: string;
  vacancy: string;
  title: string;
  manager: string;
  date: string;
  status: string;
  count: number;
  description?: string;
  requirements?: string;
}

export const VacanciesTab: React.FC = () => {
  const toast = useToast();

  // Filter States
  const [vacFilterJobTitle, setVacFilterJobTitle] = useState('');
  const [vacFilterVacancy, setVacFilterVacancy] = useState('');
  const [vacFilterManager, setVacFilterManager] = useState('');
  const [vacFilterStatus, setVacFilterStatus] = useState('');

  // Data States
  const [vacanciesList, setVacanciesList] = useState<VacancyDisplayItem[]>([
    { id: 'v1', vacancy: 'Node Js', title: 'Node js developer', manager: 'Amal Benny', date: '2026-03-29', status: 'Available', count: 2, description: 'Responsible for server-side logic and database management.', requirements: 'Node.js, Express, MongoDB, 3+ years experience' },
    { id: 'v2', vacancy: 'React Dev', title: 'Senior Frontend Engineer', manager: 'Sarah Joseph', date: '2026-03-29', status: 'Available', count: 1, description: 'Lead frontend UI/UX architecture and web performance.', requirements: 'React, TypeScript, Tailwind CSS, 5+ years experience' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // External Reference Data
  const [jobTitles, setJobTitles] = useState<JobTitleRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyDisplayItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    vacancyName: '',
    jobTitle: '',
    hiringManager: '',
    noOfOpenings: 1,
    datePosted: new Date().toISOString().split('T')[0],
    status: 'Available',
    description: '',
    requirements: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch Vacancies
  const fetchVacancies = async () => {
    setIsLoading(true);
    try {
      const data = await recruitmentService.getVacancies();
      if (data && data.length > 0) {
        setVacanciesList(data.map(v => ({
          id: v.id,
          vacancy: v.department || v.jobTitle || 'General',
          title: v.jobTitle || 'Position',
          manager: v.hiringManager || 'HR Manager',
          date: v.datePosted || new Date().toISOString().split('T')[0],
          status: v.status || 'Available',
          count: v.noOfOpenings || 1,
          description: v.description || '',
          requirements: v.requirements || ''
        })));
      }
    } catch {
      // Keep existing list fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Load Reference Data (Job titles, Employees, Departments)
  useEffect(() => {
    fetchVacancies();

    const fetchReferences = async () => {
      try {
        const [jobsData, empsData, deptsData] = await Promise.allSettled([
          adminService.getJobTitles(),
          employeeService.getAll(),
          adminService.getDepartments(),
        ]);

        if (jobsData.status === 'fulfilled' && jobsData.value) {
          setJobTitles(jobsData.value);
        }
        if (empsData.status === 'fulfilled' && empsData.value) {
          setEmployees(empsData.value);
        }
        if (deptsData.status === 'fulfilled' && deptsData.value) {
          setDepartments(deptsData.value);
        }
      } catch {
        // Silently fall back to existing data
      }
    };

    fetchReferences();
  }, []);

  // Filter options derived from data & references
  const filterJobTitleOptions = useMemo(() => {
    const listTitles = vacanciesList.map(v => v.title).filter(Boolean);
    const refTitles = jobTitles.map((j: any) => j.jobTitle || j.title).filter(Boolean) as string[];
    return Array.from(new Set([...listTitles, ...refTitles]));
  }, [vacanciesList, jobTitles]);

  const filterVacancyOptions = useMemo(() => {
    const listVacancies = vacanciesList.map(v => v.vacancy).filter(Boolean);
    const refDepts = departments.map(d => d.name).filter(Boolean);
    return Array.from(new Set([...listVacancies, ...refDepts]));
  }, [vacanciesList, departments]);

  const filterManagerOptions = useMemo(() => {
    const listManagers = vacanciesList.map(v => v.manager).filter(Boolean);
    const refEmps = employees.map(e => e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()).filter(Boolean);
    return Array.from(new Set([...listManagers, ...refEmps]));
  }, [vacanciesList, employees]);

  // Filtered List
  const filteredVacancies = useMemo(() => {
    return vacanciesList.filter(v => {
      const matchJobTitle = !vacFilterJobTitle || v.title.toLowerCase().includes(vacFilterJobTitle.toLowerCase());
      const matchVacancy = !vacFilterVacancy || v.vacancy.toLowerCase().includes(vacFilterVacancy.toLowerCase());
      const matchManager = !vacFilterManager || v.manager.toLowerCase().includes(vacFilterManager.toLowerCase());
      const matchStatus = !vacFilterStatus || v.status.toLowerCase() === vacFilterStatus.toLowerCase();
      return matchJobTitle && matchVacancy && matchManager && matchStatus;
    });
  }, [vacanciesList, vacFilterJobTitle, vacFilterVacancy, vacFilterManager, vacFilterStatus]);

  const handleReset = () => {
    setVacFilterJobTitle('');
    setVacFilterVacancy('');
    setVacFilterManager('');
    setVacFilterStatus('');
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openViewModal = (vac: VacancyDisplayItem) => {
    setSelectedVacancy(vac);
    setIsViewModalOpen(true);
  };

  const openEditModal = (vac: VacancyDisplayItem) => {
    setSelectedVacancy(vac);
    setFormData({
      vacancyName: vac.vacancy,
      jobTitle: vac.title,
      hiringManager: vac.manager,
      noOfOpenings: vac.count,
      datePosted: vac.date,
      status: vac.status,
      description: vac.description || '',
      requirements: vac.requirements || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.vacancyName.trim()) {
      errors.vacancyName = 'Vacancy name is required';
    }
    if (!formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    if (!formData.hiringManager.trim()) {
      errors.hiringManager = 'Hiring manager is required';
    }
    if (!formData.noOfOpenings || formData.noOfOpenings < 1) {
      errors.noOfOpenings = 'Number of vacancies must be at least 1';
    }
    if (!formData.datePosted) {
      errors.datePosted = 'Date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create Vacancy
  const handleSaveVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Vacancy, 'id' | 'datePosted'> & { datePosted?: string } = {
        department: formData.vacancyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        hiringManager: formData.hiringManager.trim(),
        noOfOpenings: Number(formData.noOfOpenings),
        datePosted: formData.datePosted,
        status: formData.status as any,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
      };

      const created = await recruitmentService.createVacancy(payload);

      toast.success('Vacancy created successfully!');
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      
      // Update local state and refresh
      setVacanciesList(prev => [
        {
          id: created.id || `vac-${Date.now()}`,
          vacancy: created.department,
          title: created.jobTitle,
          manager: created.hiringManager,
          date: created.datePosted || formData.datePosted,
          status: created.status,
          count: created.noOfOpenings,
          description: created.description,
          requirements: created.requirements
        },
        ...prev
      ]);
      fetchVacancies();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create vacancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Vacancy
  const handleUpdateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Vacancy> = {
        department: formData.vacancyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        hiringManager: formData.hiringManager.trim(),
        noOfOpenings: Number(formData.noOfOpenings),
        datePosted: formData.datePosted,
        status: formData.status as any,
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
      };

      await recruitmentService.updateVacancy(selectedVacancy.id, updates);

      toast.success('Vacancy updated successfully!');
      setIsEditModalOpen(false);
      setSelectedVacancy(null);

      // Refresh list
      setVacanciesList(prev =>
        prev.map(v =>
          v.id === selectedVacancy.id
            ? {
                ...v,
                vacancy: formData.vacancyName.trim(),
                title: formData.jobTitle.trim(),
                manager: formData.hiringManager.trim(),
                count: Number(formData.noOfOpenings),
                date: formData.datePosted,
                status: formData.status,
                description: formData.description.trim(),
                requirements: formData.requirements.trim(),
              }
            : v
        )
      );
      fetchVacancies();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vacancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 select-none">
        <h1 className="text-xl font-bold text-slate-900 m-0">Vacancies</h1>
      </div>

      {/* Card Filter Form */}
      <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold text-slate-705">
          <div>
            <label className="block mb-1.5">Job Title</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={vacFilterJobTitle}
                onChange={(e) => setVacFilterJobTitle(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold"
              >
                <option value="">Select Job Title</option>
                {filterJobTitleOptions.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Vacancy</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={vacFilterVacancy}
                onChange={(e) => setVacFilterVacancy(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold"
              >
                <option value="">Select Vacancy</option>
                {filterVacancyOptions.map(vac => (
                  <option key={vac} value={vac}>{vac}</option>
                ))}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Hiring Manager</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={vacFilterManager}
                onChange={(e) => setVacFilterManager(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold"
              >
                <option value="">Select Manager</option>
                {filterManagerOptions.map(mgr => (
                  <option key={mgr} value={mgr}>{mgr}</option>
                ))}
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Status</label>
            <div className="relative flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <select
                value={vacFilterStatus}
                onChange={(e) => setVacFilterStatus(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-slate-905 outline-none appearance-none pr-9 text-xs font-semibold"
              >
                <option value="">Select Status</option>
                <option value="Available">Available</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-105 border-l border-slate-200 flex items-center justify-center pointer-events-none">
                <ChevronDown className="h-3.5 w-3.5 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-[#0473b8] text-[#0473b8] text-xs font-bold rounded-lg hover:bg-blue-50/50 transition-all bg-white cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => toast.info(`Filtered: ${filteredVacancies.length} vacancies`)}
            className="px-6 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-100 border border-slate-205 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center pb-1">
          <span className="text-[10px] font-bold text-slate-500">({filteredVacancies.length}) Records Found</span>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-7 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <span>Vacancy</span>
          <span>Job Title</span>
          <span>Hiring Manager</span>
          <span>Date of Application</span>
          <span>Status</span>
          <span>No of Vacancy</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows list */}
        {isLoading ? (
          <div className="py-12 flex justify-center items-center bg-white rounded-lg border border-slate-200">
            <Loader text="Loading vacancies..." />
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <EmptyState
              icon={<Briefcase className="w-10 h-10 text-slate-300" />}
              title="No vacancies found"
              description="No vacancies match your criteria. Click '+ Add' to create a new vacancy."
              actionLabel="Add Vacancy"
              onAction={openAddModal}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredVacancies.map((vac) => (
              <div
                key={vac.id}
                className="grid grid-cols-7 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800 hover:border-slate-300 transition-colors"
              >
                <span className="truncate pr-2">{vac.vacancy}</span>
                <span className="text-slate-500 font-semibold truncate pr-2">{vac.title}</span>
                <span className="text-slate-500 font-semibold truncate pr-2">{vac.manager}</span>
                <span className="text-slate-500 font-semibold">{vac.date}</span>

                <div>
                  {vac.status && (
                    <Badge 
                      variant={
                        vac.status.toLowerCase() === 'available' || vac.status.toLowerCase() === 'active' 
                          ? 'success' 
                          : vac.status.toLowerCase() === 'draft' 
                          ? 'warning' 
                          : 'default'
                      } 
                      size="sm"
                    >
                      {vac.status}
                    </Badge>
                  )}
                </div>

                <span className="text-slate-500 font-semibold">{vac.count}</span>

                <div className="flex justify-end gap-2.5">
                  <button
                    onClick={() => openViewModal(vac)}
                    title="View details"
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(vac)}
                    title="Edit vacancy"
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center items-center gap-2 pt-2">
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button className="px-2.5 py-0.5 text-xs font-bold border rounded bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold">1</button>
          <button className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 text-slate-500">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ===================== ADD VACANCY MODAL ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0473b8] flex items-center justify-center border border-blue-100">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">Add New Vacancy</h3>
                  <p className="text-[11px] text-slate-500">Create and publish a vacancy in the recruitment pipeline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveVacancy} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vacancy Name / Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Vacancy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Node Js, Engineering, Frontend Team"
                      value={formData.vacancyName}
                      onChange={(e) => {
                        setFormData({ ...formData, vacancyName: e.target.value });
                        if (formErrors.vacancyName) setFormErrors({ ...formErrors, vacancyName: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] ${
                        formErrors.vacancyName ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.vacancyName && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.vacancyName}</span>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        list="job-titles-list"
                        type="text"
                        placeholder="Select or enter Job Title"
                        value={formData.jobTitle}
                        onChange={(e) => {
                          setFormData({ ...formData, jobTitle: e.target.value });
                          if (formErrors.jobTitle) setFormErrors({ ...formErrors, jobTitle: '' });
                        }}
                        className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] ${
                          formErrors.jobTitle ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                        }`}
                      />
                      <datalist id="job-titles-list">
                        {filterJobTitleOptions.map((title) => (
                          <option key={title} value={title} />
                        ))}
                      </datalist>
                    </div>
                    {formErrors.jobTitle && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.jobTitle}</span>
                    )}
                  </div>

                  {/* Hiring Manager */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hiring Manager <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        list="hiring-managers-list"
                        type="text"
                        placeholder="Select or enter Hiring Manager"
                        value={formData.hiringManager}
                        onChange={(e) => {
                          setFormData({ ...formData, hiringManager: e.target.value });
                          if (formErrors.hiringManager) setFormErrors({ ...formErrors, hiringManager: '' });
                        }}
                        className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] ${
                          formErrors.hiringManager ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                        }`}
                      />
                      <datalist id="hiring-managers-list">
                        {filterManagerOptions.map((mgr) => (
                          <option key={mgr} value={mgr} />
                        ))}
                      </datalist>
                    </div>
                    {formErrors.hiringManager && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.hiringManager}</span>
                    )}
                  </div>

                  {/* Number of Vacancies */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Number of Vacancies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.noOfOpenings}
                      onChange={(e) => {
                        setFormData({ ...formData, noOfOpenings: Math.max(1, parseInt(e.target.value) || 1) });
                        if (formErrors.noOfOpenings) setFormErrors({ ...formErrors, noOfOpenings: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] ${
                        formErrors.noOfOpenings ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.noOfOpenings && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.noOfOpenings}</span>
                    )}
                  </div>

                  {/* Date of Application / Opening */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Application / Opening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.datePosted}
                      onChange={(e) => {
                        setFormData({ ...formData, datePosted: e.target.value });
                        if (formErrors.datePosted) setFormErrors({ ...formErrors, datePosted: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] ${
                        formErrors.datePosted ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.datePosted && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.datePosted}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                    <div className="relative flex items-center">
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors appearance-none pr-8 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8]"
                      >
                        <option value="Available">Available</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter overview of key duties and responsibilities..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] resize-none"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Enter skills, qualifications, certifications, or experience requirements..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Vacancy</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== EDIT VACANCY MODAL ===================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0473b8] flex items-center justify-center border border-blue-100">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">Edit Vacancy</h3>
                  <p className="text-[11px] text-slate-500">Update vacancy details and requirements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateVacancy} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vacancy Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Vacancy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.vacancyName}
                      onChange={(e) => {
                        setFormData({ ...formData, vacancyName: e.target.value });
                        if (formErrors.vacancyName) setFormErrors({ ...formErrors, vacancyName: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors ${
                        formErrors.vacancyName ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.vacancyName && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.vacancyName}</span>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      list="job-titles-list-edit"
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => {
                        setFormData({ ...formData, jobTitle: e.target.value });
                        if (formErrors.jobTitle) setFormErrors({ ...formErrors, jobTitle: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors ${
                        formErrors.jobTitle ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    <datalist id="job-titles-list-edit">
                      {filterJobTitleOptions.map((title) => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                    {formErrors.jobTitle && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.jobTitle}</span>
                    )}
                  </div>

                  {/* Hiring Manager */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hiring Manager <span className="text-red-500">*</span>
                    </label>
                    <input
                      list="hiring-managers-list-edit"
                      type="text"
                      value={formData.hiringManager}
                      onChange={(e) => {
                        setFormData({ ...formData, hiringManager: e.target.value });
                        if (formErrors.hiringManager) setFormErrors({ ...formErrors, hiringManager: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors ${
                        formErrors.hiringManager ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    <datalist id="hiring-managers-list-edit">
                      {filterManagerOptions.map((mgr) => (
                        <option key={mgr} value={mgr} />
                      ))}
                    </datalist>
                    {formErrors.hiringManager && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.hiringManager}</span>
                    )}
                  </div>

                  {/* Number of Vacancies */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Number of Vacancies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.noOfOpenings}
                      onChange={(e) => {
                        setFormData({ ...formData, noOfOpenings: Math.max(1, parseInt(e.target.value) || 1) });
                        if (formErrors.noOfOpenings) setFormErrors({ ...formErrors, noOfOpenings: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors ${
                        formErrors.noOfOpenings ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.noOfOpenings && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.noOfOpenings}</span>
                    )}
                  </div>

                  {/* Date of Application */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Date of Application / Opening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.datePosted}
                      onChange={(e) => {
                        setFormData({ ...formData, datePosted: e.target.value });
                        if (formErrors.datePosted) setFormErrors({ ...formErrors, datePosted: '' });
                      }}
                      className={`w-full text-xs font-semibold rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors ${
                        formErrors.datePosted ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.datePosted && (
                      <span className="text-[11px] font-medium text-red-500 mt-1 block">{formErrors.datePosted}</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                    <div className="relative flex items-center">
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors appearance-none pr-8 focus:border-[#0473b8] focus:ring-1 focus:ring-[#0473b8]"
                      >
                        <option value="Available">Available</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Job Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Requirements</label>
                  <textarea
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Vacancy</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW VACANCY DETAILS MODAL ===================== */}
      {isViewModalOpen && selectedVacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0473b8] flex items-center justify-center border border-blue-100">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-tight">Vacancy Details</h3>
                  <p className="text-[11px] text-slate-500">{selectedVacancy.vacancy}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Job Title</span>
                  <span className="font-bold text-slate-900">{selectedVacancy.title}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vacancy / Department</span>
                  <span className="font-bold text-slate-900">{selectedVacancy.vacancy}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hiring Manager</span>
                  <span className="font-bold text-slate-900">{selectedVacancy.manager}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Openings</span>
                  <span className="font-bold text-slate-900">{selectedVacancy.count} Position(s)</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Date Posted</span>
                  <span className="font-bold text-slate-900">{selectedVacancy.date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <div className="mt-1">
                    <Badge variant={selectedVacancy.status.toLowerCase() === 'available' || selectedVacancy.status.toLowerCase() === 'active' ? 'success' : 'default'} size="sm">
                      {selectedVacancy.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedVacancy.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedVacancy.description}
                  </p>
                </div>
              )}

              {selectedVacancy.requirements && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Requirements</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedVacancy.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedVacancy);
                }}
                className="px-4 py-2 border border-[#0473b8] text-[#0473b8] hover:bg-blue-50 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Vacancy</span>
              </button>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacanciesTab;
