import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { LocationPage } from '../employees/LocationPage';
import { DepartmentPage } from '../employees/DepartmentPage';
import OrganizationTab from './components/OrganizationTab';
import JobTitlesTab from './components/JobTitlesTab';
import adminService, {
  PayGradeRecord,
  EmpStatusRecord,
  JobCategoryRecord,
  WorkShiftRecord,
} from '../../services/adminService';

type JobTabType = 
  | 'job' 
  | 'grades' 
  | 'status' 
  | 'categories' 
  | 'shifts' 
  | 'locations' 
  | 'departments' 
  | 'organizations';

export const JobConfigPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as JobTabType | null;
  const validTabs: JobTabType[] = ['job', 'grades', 'status', 'categories', 'shifts', 'locations', 'departments', 'organizations'];
  const activeTab: JobTabType = tabParam && validTabs.includes(tabParam) ? tabParam : 'job';

  const setActiveTab = (tab: JobTabType) => {
    setSearchParams({ tab });
  };

  // Subtab 2: Pay Grades
  const [payGrades, setPayGrades] = useState<PayGradeRecord[]>([]);
  // Subtab 3: Employment Status
  const [empStatus, setEmpStatus] = useState<EmpStatusRecord[]>([]);
  // Subtab 4: Job Categories
  const [categories, setCategories] = useState<JobCategoryRecord[]>([]);
  // Subtab 5: Work Shifts
  const [shifts, setShifts] = useState<WorkShiftRecord[]>([]);

  // Modal State for in-page creation & editing
  const [modalType, setModalType] = useState<'grade' | 'status' | 'category' | 'shift' | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeEditingId, setActiveEditingId] = useState<string>('');

  const [gradeForm, setGradeForm] = useState({ name: '', currency: 'United States Dollar', minSalary: 0, maxSalary: 0 });
  const [statusForm, setStatusForm] = useState({ status: '' });
  const [categoryForm, setCategoryForm] = useState({ category: '' });
  const [shiftForm, setShiftForm] = useState({ name: '', from: '08:00 AM', to: '05:00 PM', hours: '9.00' });

  useEffect(() => {
    if (activeTab === 'grades') {
      adminService.getPayGrades().then(setPayGrades).catch(() => toast.error('Failed to load pay grades'));
    } else if (activeTab === 'status') {
      adminService.getEmpStatuses().then(setEmpStatus).catch(() => toast.error('Failed to load employment statuses'));
    } else if (activeTab === 'categories') {
      adminService.getJobCategories().then(setCategories).catch(() => toast.error('Failed to load job categories'));
    } else if (activeTab === 'shifts') {
      adminService.getWorkShifts().then(setShifts).catch(() => toast.error('Failed to load work shifts'));
    }
  }, [activeTab]);

  // Handlers for Pay Grades
  const handleOpenAddGrade = () => {
    setModalType('grade');
    setModalMode('add');
    setActiveEditingId('');
    setGradeForm({ name: '', currency: 'United States Dollar', minSalary: 0, maxSalary: 0 });
  };

  const handleOpenEditGrade = (item: PayGradeRecord) => {
    setModalType('grade');
    setModalMode('edit');
    setActiveEditingId(item.id || item._id || '');
    setGradeForm({
      name: item.name,
      currency: item.currency || 'United States Dollar',
      minSalary: item.minSalary || 0,
      maxSalary: item.maxSalary || 0,
    });
  };

  const handleSaveGrade = async () => {
    if (!gradeForm.name.trim()) {
      toast.error('Pay Grade name is required.');
      return;
    }
    try {
      if (modalMode === 'add') {
        const created = await adminService.createPayGrade({
          name: gradeForm.name.trim(),
          currency: gradeForm.currency.trim(),
          minSalary: Number(gradeForm.minSalary) || undefined,
          maxSalary: Number(gradeForm.maxSalary) || undefined,
        });
        setPayGrades([created, ...payGrades]);
        toast.success('Pay Grade added successfully');
      } else {
        const updated = await adminService.updatePayGrade(activeEditingId, {
          name: gradeForm.name.trim(),
          currency: gradeForm.currency.trim(),
          minSalary: Number(gradeForm.minSalary) || undefined,
          maxSalary: Number(gradeForm.maxSalary) || undefined,
        });
        setPayGrades(payGrades.map(x => (x.id === activeEditingId || x._id === activeEditingId) ? updated : x));
        toast.success('Pay Grade updated successfully');
      }
      setModalType(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save pay grade');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (confirm("Delete pay grade?")) {
      try {
        await adminService.deletePayGrade(id);
        setPayGrades(payGrades.filter(x => x.id !== id && x._id !== id));
        toast.success('Pay Grade deleted');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete pay grade');
      }
    }
  };

  // Handlers for Employment Status
  const handleOpenAddStatus = () => {
    setModalType('status');
    setModalMode('add');
    setActiveEditingId('');
    setStatusForm({ status: '' });
  };

  const handleOpenEditStatus = (item: EmpStatusRecord) => {
    setModalType('status');
    setModalMode('edit');
    setActiveEditingId(item.id || item._id || '');
    setStatusForm({ status: item.status });
  };

  const handleSaveStatus = async () => {
    if (!statusForm.status.trim()) {
      toast.error('Employment Status name is required.');
      return;
    }
    try {
      if (modalMode === 'add') {
        const created = await adminService.createEmpStatus({ status: statusForm.status.trim() });
        setEmpStatus([created, ...empStatus]);
        toast.success('Employment Status added successfully');
      } else {
        const updated = await adminService.updateEmpStatus(activeEditingId, { status: statusForm.status.trim() });
        setEmpStatus(empStatus.map(x => (x.id === activeEditingId || x._id === activeEditingId) ? updated : x));
        toast.success('Employment Status updated');
      }
      setModalType(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save employment status');
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (confirm("Delete employment status?")) {
      try {
        await adminService.deleteEmpStatus(id);
        setEmpStatus(empStatus.filter(x => x.id !== id && x._id !== id));
        toast.success('Employment Status deleted');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete employment status');
      }
    }
  };

  // Handlers for Job Categories
  const handleOpenAddCategory = () => {
    setModalType('category');
    setModalMode('add');
    setActiveEditingId('');
    setCategoryForm({ category: '' });
  };

  const handleOpenEditCategory = (item: JobCategoryRecord) => {
    setModalType('category');
    setModalMode('edit');
    setActiveEditingId(item.id || item._id || '');
    setCategoryForm({ category: item.category });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.category.trim()) {
      toast.error('Job Category name is required.');
      return;
    }
    try {
      if (modalMode === 'add') {
        const created = await adminService.createJobCategory({ category: categoryForm.category.trim() });
        setCategories([created, ...categories]);
        toast.success('Job Category added successfully');
      } else {
        const updated = await adminService.updateJobCategory(activeEditingId, { category: categoryForm.category.trim() });
        setCategories(categories.map(x => (x.id === activeEditingId || x._id === activeEditingId) ? updated : x));
        toast.success('Job Category updated');
      }
      setModalType(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save job category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Delete job category?")) {
      try {
        await adminService.deleteJobCategory(id);
        setCategories(categories.filter(x => x.id !== id && x._id !== id));
        toast.success('Job Category deleted');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete job category');
      }
    }
  };

  // Handlers for Work Shifts
  const handleOpenAddShift = () => {
    setModalType('shift');
    setModalMode('add');
    setActiveEditingId('');
    setShiftForm({ name: '', from: '08:00 AM', to: '05:00 PM', hours: '9.00' });
  };

  const handleOpenEditShift = (item: WorkShiftRecord) => {
    setModalType('shift');
    setModalMode('edit');
    setActiveEditingId(item.id || item._id || '');
    setShiftForm({
      name: item.name,
      from: item.from || '08:00 AM',
      to: item.to || '05:00 PM',
      hours: item.hours || '9.00',
    });
  };

  const handleSaveShift = async () => {
    if (!shiftForm.name.trim()) {
      toast.error('Work Shift name is required.');
      return;
    }
    try {
      if (modalMode === 'add') {
        const created = await adminService.createWorkShift({
          name: shiftForm.name.trim(),
          from: shiftForm.from.trim(),
          to: shiftForm.to.trim(),
          hours: shiftForm.hours.trim(),
        });
        setShifts([created, ...shifts]);
        toast.success('Work Shift added successfully');
      } else {
        const updated = await adminService.updateWorkShift(activeEditingId, {
          name: shiftForm.name.trim(),
          from: shiftForm.from.trim(),
          to: shiftForm.to.trim(),
          hours: shiftForm.hours.trim(),
        });
        setShifts(shifts.map(x => (x.id === activeEditingId || x._id === activeEditingId) ? updated : x));
        toast.success('Work Shift updated');
      }
      setModalType(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save work shift');
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (confirm("Delete work shift?")) {
      try {
        await adminService.deleteWorkShift(id);
        setShifts(shifts.filter(x => x.id !== id && x._id !== id));
        toast.success('Work Shift deleted');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete work shift');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 8 Tab pills at the top */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-4">
        {[
          { id: 'job', label: 'Jobs' },
          { id: 'grades', label: 'Pay Grades' },
          { id: 'status', label: 'Employment Status' },
          { id: 'categories', label: 'Job Categories' },
          { id: 'shifts', label: 'Work Shifts' },
          { id: 'locations', label: 'Locations' },
          { id: 'departments', label: 'Departments' },
          { id: 'organizations', label: 'Organizations' }
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setActiveTab(pill.id as JobTabType)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === pill.id 
                ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white font-extrabold shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Tab Panel 1: Jobs */}
      {activeTab === 'job' && <JobTitlesTab />}

      {/* Tab Panel 2: Pay Grades */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 m-0">Pay Grades</h2>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({payGrades.length}) Records Found</span>
              <button 
                onClick={handleOpenAddGrade}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table headers */}
            <div className="grid grid-cols-3 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Name</span>
              <span>Currency</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {payGrades.map(g => {
                const gId = g.id || g._id || '';
                return (
                  <div 
                    key={gId}
                    className="grid grid-cols-3 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span>{g.name}</span>
                    <span className="text-slate-500 font-semibold">{g.currency}</span>
                    
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => handleOpenEditGrade(g)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteGrade(gId)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel 3: Employment Status */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 m-0">Employment Status</h2>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({empStatus.length}) Records Found</span>
              <button 
                onClick={handleOpenAddStatus}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table headers */}
            <div className="grid grid-cols-2 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Employment Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {empStatus.map(s => {
                const sId = s.id || s._id || '';
                return (
                  <div 
                    key={sId}
                    className="grid grid-cols-2 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span>{s.status}</span>
                    
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => handleOpenEditStatus(s)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteStatus(sId)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel 4: Job Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 m-0">Job Categories</h2>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({categories.length}) Records Found</span>
              <button 
                onClick={handleOpenAddCategory}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table headers */}
            <div className="grid grid-cols-2 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Job Category</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {categories.map(c => {
                const cId = c.id || c._id || '';
                return (
                  <div 
                    key={cId}
                    className="grid grid-cols-2 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span>{c.category}</span>
                    
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => handleOpenEditCategory(c)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteCategory(cId)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel 5: Work Shifts */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 m-0">Work Shifts</h2>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-bold text-slate-500">({shifts.length}) Records Found</span>
              <button 
                onClick={handleOpenAddShift}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-[10px] font-bold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Table headers */}
            <div className="grid grid-cols-5 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Name</span>
              <span>From</span>
              <span>To</span>
              <span>Hours Per Day</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {shifts.map(s => {
                const sId = s.id || s._id || '';
                return (
                  <div 
                    key={sId}
                    className="grid grid-cols-5 items-center bg-white border border-slate-200 rounded-lg py-2.5 px-4 shadow-sm text-xs font-bold text-slate-800"
                  >
                    <span>{s.name}</span>
                    <span className="text-slate-500 font-semibold">{s.from}</span>
                    <span className="text-slate-500 font-semibold">{s.to}</span>
                    <span>{s.hours}</span>
                    
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => handleOpenEditShift(s)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteShift(sId)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* Tab Panel 6: Locations */}
      {activeTab === 'locations' && <LocationPage />}

      {/* Tab Panel 7: Departments */}
      {activeTab === 'departments' && <DepartmentPage />}

      {/* Tab Panel 8: Organizations */}
      {activeTab === 'organizations' && <OrganizationTab />}

      {/* Interactive Modal for Pay Grades, Employment Status, Job Categories, Work Shifts */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {modalMode === 'add' ? 'Add' : 'Edit'}{' '}
              {modalType === 'grade' && 'Pay Grade'}
              {modalType === 'status' && 'Employment Status'}
              {modalType === 'category' && 'Job Category'}
              {modalType === 'shift' && 'Work Shift'}
            </h3>

            {/* Pay Grade Form */}
            {modalType === 'grade' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Name *</label>
                  <input
                    type="text"
                    value={gradeForm.name}
                    onChange={e => setGradeForm({ ...gradeForm, name: e.target.value })}
                    placeholder="e.g. Grade A"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Currency</label>
                  <input
                    type="text"
                    value={gradeForm.currency}
                    onChange={e => setGradeForm({ ...gradeForm, currency: e.target.value })}
                    placeholder="e.g. United States Dollar"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Min Salary</label>
                    <input
                      type="number"
                      value={gradeForm.minSalary || ''}
                      onChange={e => setGradeForm({ ...gradeForm, minSalary: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Max Salary</label>
                    <input
                      type="number"
                      value={gradeForm.maxSalary || ''}
                      onChange={e => setGradeForm({ ...gradeForm, maxSalary: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Employment Status Form */}
            {modalType === 'status' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Status Name *</label>
                  <input
                    type="text"
                    value={statusForm.status}
                    onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                    placeholder="e.g. Full-Time Permanent"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
              </div>
            )}

            {/* Job Category Form */}
            {modalType === 'category' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Category Name *</label>
                  <input
                    type="text"
                    value={categoryForm.category}
                    onChange={e => setCategoryForm({ ...categoryForm, category: e.target.value })}
                    placeholder="e.g. Technology Professionals"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
              </div>
            )}

            {/* Work Shift Form */}
            {modalType === 'shift' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Shift Name *</label>
                  <input
                    type="text"
                    value={shiftForm.name}
                    onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
                    placeholder="e.g. General Shift"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">From</label>
                    <input
                      type="text"
                      value={shiftForm.from}
                      onChange={e => setShiftForm({ ...shiftForm, from: e.target.value })}
                      placeholder="08:00 AM"
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">To</label>
                    <input
                      type="text"
                      value={shiftForm.to}
                      onChange={e => setShiftForm({ ...shiftForm, to: e.target.value })}
                      placeholder="05:00 PM"
                      className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-700">Hours Per Day</label>
                  <input
                    type="text"
                    value={shiftForm.hours}
                    onChange={e => setShiftForm({ ...shiftForm, hours: e.target.value })}
                    placeholder="9.00"
                    className="w-full rounded-lg border border-slate-200 p-2.5 outline-none font-semibold text-slate-800 focus:border-[#0473b8]"
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalType === 'grade') handleSaveGrade();
                  else if (modalType === 'status') handleSaveStatus();
                  else if (modalType === 'category') handleSaveCategory();
                  else if (modalType === 'shift') handleSaveShift();
                }}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default JobConfigPage;
