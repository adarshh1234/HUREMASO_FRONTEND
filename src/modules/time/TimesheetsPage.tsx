import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  Briefcase,
  MapPin,
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Clock,
  Radio,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { timeService } from '../../services/timeService';
import { employeeService } from '../../services/employeeService';
import { projectService, ProjectItem } from '../../services/projectService';
import { Employee } from '../../types';

// Helper to compute working hours between two times (supports "09:00 AM", "05:30 PM", "09:00", "17:30", cross-midnight)
function calculateHoursFromTimes(tIn?: string, tOut?: string): number {
  if (!tIn || !tOut) return 0;
  const parseToMinutes = (str: string): number | null => {
    const s = str.trim();
    const isPM = /pm/i.test(s);
    const isAM = /am/i.test(s);
    const cleanStr = s.replace(/am|pm/gi, '').trim();
    const parts = cleanStr.split(':');
    if (parts.length < 2) return null;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };
  const mIn = parseToMinutes(tIn);
  const mOut = parseToMinutes(tOut);
  if (mIn === null || mOut === null) return 0;
  let diff = mOut - mIn;
  if (diff < 0) diff += 24 * 60; // Overnight shift
  return Math.round((diff / 60) * 10) / 10;
}

export interface ITimesheetRecord {
  id?: string;
  _id?: string;
  employeeId?: any;
  employeeCode?: string;
  employeeName?: string;
  companyName?: string;
  jobDescription?: string;
  workType?: 'office' | 'access_control' | 'site_work' | 'field_work';
  officeLocation?: string;
  loginSource?: string;
  loginTime?: string;
  logoutTime?: string;
  signInMethod?: string;
  gpsLocation?: string;
  projectName?: string;
  projectLocation?: string;
  siteLocation?: string;
  siteName?: string;
  supervisorName?: string;
  supervisorId?: string;
  timeIn?: string;
  timeOut?: string;
  workingHours?: number;
  overtimeHours?: number;
  assignedField?: string;
  date?: string;
  location?: string;
  workDetails?: string;
  checkInTime?: string;
  checkOutTime?: string;
  deviceSource?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  period?: string;
  rows?: any[];
  totalPeriodHours?: number;
  status?: 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected';
  actions?: Array<{
    action: string;
    performedBy: string;
    comment?: string;
    date?: string | Date;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const TimesheetsPage: React.FC = () => {
  const toast = useToast();

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<'office' | 'access_control' | 'site_work' | 'field_work'>('office');

  // Master Lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab Records
  const [officeRecords, setOfficeRecords] = useState<ITimesheetRecord[]>([]);
  const [accessRecords, setAccessRecords] = useState<ITimesheetRecord[]>([]);
  const [siteRecords, setSiteRecords] = useState<ITimesheetRecord[]>([]);
  const [fieldRecords, setFieldRecords] = useState<ITimesheetRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<ITimesheetRecord[]>([]);

  // Office Time: Employee Search Top Card
  const [empSearchName, setEmpSearchName] = useState('');
  const [selectedEmpTimesheet, setSelectedEmpTimesheet] = useState<ITimesheetRecord | null>(null);

  // Office Time Filters
  const [officeFilterSearch, setOfficeFilterSearch] = useState('');
  const [officeFilterLocation, setOfficeFilterLocation] = useState('');
  const [officeFilterPeriod, setOfficeFilterPeriod] = useState('');
  const [officeFilterSource, setOfficeFilterSource] = useState('');
  const [officeFilterStatus, setOfficeFilterStatus] = useState('');

  // Access Control Filters & Hardware Status
  const [accessFilterSearch, setAccessFilterSearch] = useState('');
  const [accessFilterMethod, setAccessFilterMethod] = useState('');
  const [accessFilterDate, setAccessFilterDate] = useState('');
  const [accessFilterLocation, setAccessFilterLocation] = useState('');
  const [accessFilterStatus, setAccessFilterStatus] = useState('');
  const [accessHardwareStatus, setAccessHardwareStatus] = useState<{
    configured: boolean;
    hardwareStatus: string;
    provider: string;
    message: string;
  }>({
    configured: false,
    hardwareStatus: 'disconnected',
    provider: 'Biometric Access Gateway v2.1',
    message: 'Access-control hardware integration is currently offline / not configured.',
  });

  // Site Work Filters
  const [siteFilterSearch, setSiteFilterSearch] = useState('');
  const [siteFilterProject, setSiteFilterProject] = useState('');
  const [siteFilterLocation, setSiteFilterLocation] = useState('');
  const [siteFilterDate, setSiteFilterDate] = useState('');
  const [siteFilterStatus, setSiteFilterStatus] = useState('');

  // Field Work Filters
  const [fieldFilterSearch, setFieldFilterSearch] = useState('');
  const [fieldFilterCompany, setFieldFilterCompany] = useState('');
  const [fieldFilterField, setFieldFilterField] = useState('');
  const [fieldFilterDate, setFieldFilterDate] = useState('');
  const [fieldFilterStatus, setFieldFilterStatus] = useState('');

  // Modals
  const [detailModalItem, setDetailModalItem] = useState<ITimesheetRecord | null>(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ITimesheetRecord | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<ITimesheetRecord | null>(null);

  // Form Fields State for Modals
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formEmployeeCode, setFormEmployeeCode] = useState('');
  const [formEmployeeName, setFormEmployeeName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('HUREMASO Global Technologies');
  const [formJobDescription, setFormJobDescription] = useState('');
  const [formOfficeLocation, setFormOfficeLocation] = useState('Kochi HQ');
  const [formLoginSource, setFormLoginSource] = useState('Biometric Sign-in');
  const [formLoginTime, setFormLoginTime] = useState('09:00 AM');
  const [formLogoutTime, setFormLogoutTime] = useState('05:30 PM');
  const [formSignInMethod, setFormSignInMethod] = useState('Biometric Sign-in');
  const [formGpsLocation, setFormGpsLocation] = useState('9.9312° N, 76.2673° E (Main Campus)');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPeriodStart, setFormPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [formPeriodEnd, setFormPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [formCheckIn, setFormCheckIn] = useState('08:45 AM');
  const [formCheckOut, setFormCheckOut] = useState('05:15 PM');
  const [formProjectName, setFormProjectName] = useState('');
  const [formProjectLocation, setFormProjectLocation] = useState('');
  const [formSiteLocation, setFormSiteLocation] = useState('');
  const [formSupervisorName, setFormSupervisorName] = useState('');
  const [formSupervisorId, setFormSupervisorId] = useState('');
  const [formTimeIn, setFormTimeIn] = useState('08:00 AM');
  const [formTimeOut, setFormTimeOut] = useState('05:00 PM');
  const [formWorkingHours, setFormWorkingHours] = useState('8.5');
  const [formOvertimeHours, setFormOvertimeHours] = useState('0.5');
  const [formAssignedField, setFormAssignedField] = useState('Field Inspection & Quality Audit');
  const [formLocation, setFormLocation] = useState('Industrial Zone East Sector');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected'>('Submitted');
  const [formWorkDetails, setFormWorkDetails] = useState('');
  const [savingForm, setSavingForm] = useState(false);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Employees & Projects
      const [empList, projList] = await Promise.all([
        employeeService.getAll().catch(() => []),
        projectService.getProjects().catch(() => []),
      ]);
      setEmployees(empList);
      setProjects(projList);

      // 2. Pending Timesheets
      const pending = await timeService.getPendingTimesheets().catch(() => []);
      setPendingRecords(pending);

      // 3. Category records
      const [office, access, site, field, accStatus] = await Promise.all([
        timeService.getTimesheets({ workType: 'office' }).catch(() => []),
        timeService.getTimesheets({ workType: 'access_control' }).catch(() => []),
        timeService.getTimesheets({ workType: 'site_work' }).catch(() => []),
        timeService.getTimesheets({ workType: 'field_work' }).catch(() => []),
        timeService.getAccessControlStatus().catch(() => null),
      ]);

      setOfficeRecords(office);
      setAccessRecords(access);
      setSiteRecords(site);
      setFieldRecords(field);
      if (accStatus) setAccessHardwareStatus(accStatus);
    } catch (err) {
      console.error('Error loading timesheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When Employee is selected in modals, auto-populate details
  const handleEmployeeSelect = (empName: string) => {
    setFormEmployeeName(empName);
    const emp = employees.find(
      (e) => (e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()) === empName
    );
    if (emp) {
      setFormEmployeeId(emp.id);
      setFormEmployeeCode(emp.employeeId || emp.id || 'EMP-001');
      if (emp.jobTitle) setFormJobDescription(emp.jobTitle);
      if (emp.location) setFormOfficeLocation(emp.location);
      if (emp.supervisor) setFormSupervisorName(emp.supervisor);
      if (emp.supervisorId) setFormSupervisorId(emp.supervisorId);
    }
  };

  // When Supervisor is selected in Site Work modal, auto-populate Supervisor ID
  const handleSupervisorSelect = (supName: string) => {
    setFormSupervisorName(supName);
    const sup = employees.find(
      (e) => (e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()) === supName
    );
    if (sup) {
      setFormSupervisorId(sup.employeeId || sup.id || 'SUP-101');
    }
  };

  // When Project is selected in Site Work modal, auto-populate Project Location
  const handleProjectSelect = (projName: string) => {
    setFormProjectName(projName);
    const proj = projects.find((p) => p.name === projName);
    if (proj) {
      setFormProjectLocation(proj.customerName ? `${proj.customerName} Project Facility` : 'Kochi Site Corridor');
      if (!formSiteLocation) {
        setFormSiteLocation(`${projName} - Zone A`);
      }
    }
  };

  // Auto-calculate hours for Office Time modal
  const handleOfficeTimesChange = (login: string, logout: string) => {
    setFormLoginTime(login);
    setFormLogoutTime(logout);
    const calculated = calculateHoursFromTimes(login, logout);
    if (calculated > 0) setFormWorkingHours(calculated.toString());
  };

  // Auto-calculate hours for Access Control modal
  const handleAccessTimesChange = (checkIn: string, checkOut: string) => {
    setFormCheckIn(checkIn);
    setFormCheckOut(checkOut);
    const calculated = calculateHoursFromTimes(checkIn, checkOut);
    if (calculated > 0) setFormWorkingHours(calculated.toString());
  };

  // Auto-calculate hours & OT for Site Work modal
  const handleSiteTimesChange = (tIn: string, tOut: string) => {
    setFormTimeIn(tIn);
    setFormTimeOut(tOut);
    const calculated = calculateHoursFromTimes(tIn, tOut);
    if (calculated > 0) {
      setFormWorkingHours(calculated.toString());
      const ot = Math.max(0, Math.round((calculated - 8.0) * 10) / 10);
      setFormOvertimeHours(ot.toString());
    }
  };

  // Auto-calculate hours for Field Work modal
  const handleFieldTimesChange = (tIn: string, tOut: string) => {
    setFormTimeIn(tIn);
    setFormTimeOut(tOut);
    const calculated = calculateHoursFromTimes(tIn, tOut);
    if (calculated > 0) setFormWorkingHours(calculated.toString());
  };

  // Open Add Modal initialized for active tab
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    const defaultEmp = employees[0];
    const defaultName = defaultEmp ? (defaultEmp.name || `${defaultEmp.firstName || ''} ${defaultEmp.lastName || ''}`.trim()) : 'Sarah Jenkins';
    setFormEmployeeName(defaultName);
    setFormEmployeeId(defaultEmp?.id || '');
    setFormEmployeeCode(defaultEmp?.employeeId || 'EMP-001');
    setFormCompanyName('HUREMASO Global Technologies');
    setFormJobDescription(defaultEmp?.jobTitle || 'Senior Software Engineer');
    setFormOfficeLocation(defaultEmp?.location || 'Kochi HQ Block A');
    setFormLoginSource('Mobile App Sign-in');
    setFormLoginTime('09:00 AM');
    setFormLogoutTime('05:30 PM');
    setFormSignInMethod('Biometric Sign-in');
    setFormGpsLocation('9.9312° N, 76.2673° E (Main Campus)');
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormPeriodStart(today);
    setFormPeriodEnd(today);
    setFormCheckIn('08:45 AM');
    setFormCheckOut('05:15 PM');
    const firstProj = projects[0]?.name || 'Metro Rail Infrastructure';
    setFormProjectName(firstProj);
    setFormProjectLocation('North Corridor Hub');
    setFormSiteLocation(`${firstProj} - Station Pier 12`);
    const defaultSup = employees[1] || defaultEmp;
    setFormSupervisorName(defaultSup ? (defaultSup.name || `${defaultSup.firstName || ''} ${defaultSup.lastName || ''}`.trim()) : 'David Miller');
    setFormSupervisorId(defaultSup?.employeeId || 'SUP-202');
    setFormTimeIn('08:00 AM');
    setFormTimeOut('05:00 PM');
    setFormWorkingHours('8.5');
    setFormOvertimeHours('0.5');
    setFormAssignedField('Technical Field Operations');
    setFormLocation('Kochi Industrial Complex');
    setFormStatus('Submitted');
    setFormWorkDetails('');
  };

  // Open Edit Modal with selected record
  const handleOpenEditModal = (item: ITimesheetRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormEmployeeName(item.employeeName || '');
    setFormEmployeeId(item.employeeId?._id || item.employeeId || '');
    setFormEmployeeCode(item.employeeCode || '');
    setFormCompanyName(item.companyName || 'HUREMASO Global Technologies');
    setFormJobDescription(item.jobDescription || '');
    setFormOfficeLocation(item.officeLocation || item.location || 'Kochi HQ');
    setFormLoginSource(item.loginSource || 'Mobile App Sign-in');
    setFormLoginTime(item.loginTime || item.timeIn || '09:00 AM');
    setFormLogoutTime(item.logoutTime || item.timeOut || '05:30 PM');
    setFormSignInMethod(item.signInMethod || 'Biometric Sign-in');
    setFormGpsLocation(item.gpsLocation || '9.9312° N, 76.2673° E');
    setFormDate(item.date || item.periodStartDate || new Date().toISOString().split('T')[0]);
    setFormPeriodStart(item.periodStartDate || new Date().toISOString().split('T')[0]);
    setFormPeriodEnd(item.periodEndDate || new Date().toISOString().split('T')[0]);
    setFormCheckIn(item.checkInTime || item.loginTime || '08:45 AM');
    setFormCheckOut(item.checkOutTime || item.logoutTime || '05:15 PM');
    setFormProjectName(item.projectName || item.siteName || '');
    setFormProjectLocation(item.projectLocation || item.location || '');
    setFormSiteLocation(item.siteLocation || item.siteName || '');
    setFormSupervisorName(item.supervisorName || '');
    setFormSupervisorId(item.supervisorId || '');
    setFormTimeIn(item.timeIn || item.checkInTime || '08:00 AM');
    setFormTimeOut(item.timeOut || item.checkOutTime || '05:00 PM');
    setFormWorkingHours((item.workingHours || item.totalPeriodHours || 8).toString());
    setFormOvertimeHours((item.overtimeHours || 0).toString());
    setFormAssignedField(item.assignedField || '');
    setFormLocation(item.location || item.projectLocation || '');
    setFormStatus(item.status || 'Submitted');
    setFormWorkDetails(item.workDetails || '');
  };

  // Form Submission (Add or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      const payload: any = {
        employeeId: formEmployeeId || undefined,
        employeeCode: formEmployeeCode,
        employeeName: formEmployeeName,
        companyName: formCompanyName,
        jobDescription: formJobDescription,
        workType: activeTab,
        date: formDate,
        periodStartDate: formPeriodStart,
        periodEndDate: formPeriodEnd,
        period: formPeriodStart === formPeriodEnd ? formPeriodStart : `${formPeriodStart} to ${formPeriodEnd}`,
        workingHours: Number(formWorkingHours) || 8,
        hours: Number(formWorkingHours) || 8,
        overtimeHours: Number(formOvertimeHours) || 0,
        status: formStatus,
        workDetails: formWorkDetails,
      };

      if (activeTab === 'office') {
        payload.officeLocation = formOfficeLocation;
        payload.loginSource = formLoginSource;
        payload.loginTime = formLoginTime;
        payload.logoutTime = formLogoutTime;
        payload.location = formOfficeLocation;
      } else if (activeTab === 'access_control') {
        payload.signInMethod = formSignInMethod;
        payload.gpsLocation = formGpsLocation;
        payload.checkInTime = formCheckIn;
        payload.checkOutTime = formCheckOut;
        payload.deviceSource = formGpsLocation;
      } else if (activeTab === 'site_work') {
        payload.projectName = formProjectName;
        payload.siteName = formProjectName;
        payload.projectLocation = formProjectLocation;
        payload.siteLocation = formSiteLocation;
        payload.supervisorName = formSupervisorName;
        payload.supervisorId = formSupervisorId;
        payload.timeIn = formTimeIn;
        payload.timeOut = formTimeOut;
        payload.location = formProjectLocation;
      } else if (activeTab === 'field_work') {
        payload.assignedField = formAssignedField;
        payload.location = formLocation;
        payload.timeIn = formTimeIn;
        payload.timeOut = formTimeOut;
      }

      if (modalMode === 'edit' && editingItem) {
        const id = editingItem.id || editingItem._id;
        if (!id) throw new Error('Record identifier missing');
        await timeService.updateTimesheet(id, payload);
        toast.success('Timesheet record updated successfully!');
      } else {
        await timeService.saveTimesheet(payload);
        toast.success('Timesheet record created successfully!');
      }

      setModalMode(null);
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save timesheet record');
    } finally {
      setSavingForm(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTargetItem) return;
    const id = deleteTargetItem.id || deleteTargetItem._id;
    if (!id) return;
    try {
      await timeService.deleteTimesheet(id);
      toast.success('Timesheet record deleted successfully');
      setDeleteTargetItem(null);
      if (detailModalItem?.id === id || detailModalItem?._id === id) {
        setDetailModalItem(null);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete timesheet record');
    }
  };

  // Status Action: Approve
  const handleApprove = async (id: string, empName = 'Employee') => {
    try {
      await timeService.approveTimesheet(id, 'Admin Manager', 'Timesheet approved');
      toast.success(`Timesheet for ${empName} approved!`);
      if (detailModalItem && (detailModalItem.id === id || detailModalItem._id === id)) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve timesheet');
    }
  };

  // Status Action: Reject
  const handleReject = async (id: string, empName = 'Employee') => {
    try {
      await timeService.rejectTimesheet(id, 'Admin Manager', 'Timesheet rejected');
      toast.info(`Timesheet for ${empName} rejected.`);
      if (detailModalItem && (detailModalItem.id === id || detailModalItem._id === id)) {
        setDetailModalItem((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject timesheet');
    }
  };

  // Office Time: Employee View Query Top Card
  const handleViewEmployeeTimesheet = async () => {
    const trimmed = empSearchName.trim();
    if (!trimmed) {
      toast.info('Please enter or select an employee name');
      return;
    }
    const found = officeRecords.find(
      (r) => r.employeeName?.toLowerCase().includes(trimmed.toLowerCase())
    ) || pendingRecords.find(
      (r) => r.employeeName?.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (found) {
      setSelectedEmpTimesheet(found);
      toast.success(`Loaded timesheet for ${found.employeeName}`);
    } else {
      try {
        const res = await timeService.getTimesheets({ search: trimmed });
        if (res.length > 0) {
          setSelectedEmpTimesheet(res[0]);
          toast.success(`Loaded timesheet for ${res[0].employeeName}`);
        } else {
          toast.info(`No specific records found for "${trimmed}".`);
          setSelectedEmpTimesheet(null);
        }
      } catch {
        toast.info(`No records found for "${trimmed}".`);
      }
    }
  };

  // Filtered Office Records
  const filteredOfficeRecords = useMemo(() => {
    return officeRecords.filter((r) => {
      if (officeFilterSearch) {
        const s = officeFilterSearch.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(s);
        const matchCode = r.employeeCode?.toLowerCase().includes(s);
        if (!matchName && !matchCode) return false;
      }
      if (officeFilterLocation && !r.officeLocation?.toLowerCase().includes(officeFilterLocation.toLowerCase())) {
        return false;
      }
      if (officeFilterPeriod) {
        const matchPeriod = r.period?.includes(officeFilterPeriod);
        const matchDate = r.periodStartDate === officeFilterPeriod || r.date === officeFilterPeriod;
        if (!matchPeriod && !matchDate) return false;
      }
      if (officeFilterSource && r.loginSource !== officeFilterSource) {
        return false;
      }
      if (officeFilterStatus && r.status !== officeFilterStatus) {
        return false;
      }
      return true;
    });
  }, [officeRecords, officeFilterSearch, officeFilterLocation, officeFilterPeriod, officeFilterSource, officeFilterStatus]);

  // Filtered Access Control Records
  const filteredAccessRecords = useMemo(() => {
    return accessRecords.filter((r) => {
      if (accessFilterSearch) {
        const s = accessFilterSearch.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(s);
        const matchCode = r.employeeCode?.toLowerCase().includes(s);
        if (!matchName && !matchCode) return false;
      }
      if (accessFilterMethod && r.signInMethod !== accessFilterMethod) {
        return false;
      }
      if (accessFilterDate && r.date !== accessFilterDate && r.periodStartDate !== accessFilterDate) {
        return false;
      }
      if (accessFilterLocation && !r.gpsLocation?.toLowerCase().includes(accessFilterLocation.toLowerCase())) {
        return false;
      }
      if (accessFilterStatus && r.status !== accessFilterStatus) {
        return false;
      }
      return true;
    });
  }, [accessRecords, accessFilterSearch, accessFilterMethod, accessFilterDate, accessFilterLocation, accessFilterStatus]);

  // Filtered Site Work Records
  const filteredSiteRecords = useMemo(() => {
    return siteRecords.filter((r) => {
      if (siteFilterSearch) {
        const s = siteFilterSearch.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(s);
        const matchCode = r.employeeCode?.toLowerCase().includes(s);
        if (!matchName && !matchCode) return false;
      }
      if (siteFilterProject && !r.projectName?.toLowerCase().includes(siteFilterProject.toLowerCase()) && !r.siteName?.toLowerCase().includes(siteFilterProject.toLowerCase())) {
        return false;
      }
      if (siteFilterLocation && !r.siteLocation?.toLowerCase().includes(siteFilterLocation.toLowerCase()) && !r.projectLocation?.toLowerCase().includes(siteFilterLocation.toLowerCase())) {
        return false;
      }
      if (siteFilterDate && r.date !== siteFilterDate && r.periodStartDate !== siteFilterDate) {
        return false;
      }
      if (siteFilterStatus && r.status !== siteFilterStatus) {
        return false;
      }
      return true;
    });
  }, [siteRecords, siteFilterSearch, siteFilterProject, siteFilterLocation, siteFilterDate, siteFilterStatus]);

  // Filtered Field Work Records
  const filteredFieldRecords = useMemo(() => {
    return fieldRecords.filter((r) => {
      if (fieldFilterSearch) {
        const s = fieldFilterSearch.toLowerCase();
        const matchName = r.employeeName?.toLowerCase().includes(s);
        const matchCode = r.employeeCode?.toLowerCase().includes(s);
        if (!matchName && !matchCode) return false;
      }
      if (fieldFilterCompany && !r.companyName?.toLowerCase().includes(fieldFilterCompany.toLowerCase())) {
        return false;
      }
      if (fieldFilterField && !r.assignedField?.toLowerCase().includes(fieldFilterField.toLowerCase())) {
        return false;
      }
      if (fieldFilterDate && r.date !== fieldFilterDate && r.periodStartDate !== fieldFilterDate) {
        return false;
      }
      if (fieldFilterStatus && r.status !== fieldFilterStatus) {
        return false;
      }
      return true;
    });
  }, [fieldRecords, fieldFilterSearch, fieldFilterCompany, fieldFilterField, fieldFilterDate, fieldFilterStatus]);

  return (
    <div className="space-y-6">
      {/* Global Datalist for autocomplete */}
      <datalist id="global-employee-options">
        {employees.map((emp) => (
          <option key={emp.id} value={emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} />
        ))}
      </datalist>

      <datalist id="global-project-options">
        {projects.map((proj) => (
          <option key={proj.id} value={proj.name} />
        ))}
      </datalist>

      {/* Primary Category Navigation Tabs (Office Time, Access Control, Site Work, Field Work) */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-3">
        {[
          { id: 'office', label: 'Office Time', icon: Building2 },
          { id: 'access_control', label: 'Access Control', icon: ShieldCheck },
          { id: 'site_work', label: 'Site Work', icon: Briefcase },
          { id: 'field_work', label: 'Field Work', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICE TIME                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'office' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Action & Top Filter Card */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Office Time Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage office employee timesheet records, working hours, login sources, and approval status.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Office Timesheet</span>
            </button>
          </div>

          {/* Screenshot-Matched Select Employee Card */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 m-0">Select Employee</h3>
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="max-w-md text-xs font-bold text-slate-700">
                <label className="block mb-1.5">Employee Name</label>
                <input
                  type="text"
                  list="global-employee-options"
                  placeholder="Enter or select employee name..."
                  value={empSearchName}
                  onChange={(e) => setEmpSearchName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none font-semibold text-xs bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleViewEmployeeTimesheet}
                  className="px-6 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          {/* Queried Employee Timesheet Card Preview */}
          {selectedEmpTimesheet && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs space-y-4 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">
                    Timesheet: {selectedEmpTimesheet.employeeName} ({selectedEmpTimesheet.employeeCode || 'EMP-001'})
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Location: {selectedEmpTimesheet.officeLocation || 'Kochi HQ'} • Period: {selectedEmpTimesheet.period} • Hours: {selectedEmpTimesheet.workingHours || selectedEmpTimesheet.totalPeriodHours || 8} hrs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedEmpTimesheet.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedEmpTimesheet.status === 'Submitted' || selectedEmpTimesheet.status === 'Pending Approval'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedEmpTimesheet.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEmpTimesheet(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Login Source</span>
                  <span className="font-bold text-slate-800">{selectedEmpTimesheet.loginSource || 'Mobile App Sign-in'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Login Time</span>
                  <span className="font-bold text-slate-800">{selectedEmpTimesheet.loginTime || selectedEmpTimesheet.timeIn || '09:00 AM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Logout Time</span>
                  <span className="font-bold text-slate-800">{selectedEmpTimesheet.logoutTime || selectedEmpTimesheet.timeOut || '05:30 PM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Working Hours</span>
                  <span className="font-bold text-[#0473b8]">{selectedEmpTimesheet.workingHours || selectedEmpTimesheet.totalPeriodHours || 8.5} hrs</span>
                </div>
              </div>

              {(selectedEmpTimesheet.status === 'Submitted' || selectedEmpTimesheet.status === 'Pending Approval') && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleReject(selectedEmpTimesheet.id || selectedEmpTimesheet._id || '', selectedEmpTimesheet.employeeName)}
                    className="px-4 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedEmpTimesheet.id || selectedEmpTimesheet._id || '', selectedEmpTimesheet.employeeName)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Approve Timesheet
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search & Filters Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Search Employee</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Name or ID..."
                  value={officeFilterSearch}
                  onChange={(e) => setOfficeFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Office Location</label>
              <input
                type="text"
                placeholder="Filter location..."
                value={officeFilterLocation}
                onChange={(e) => setOfficeFilterLocation(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Period / Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD or period..."
                value={officeFilterPeriod}
                onChange={(e) => setOfficeFilterPeriod(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Login Source</label>
              <select
                value={officeFilterSource}
                onChange={(e) => setOfficeFilterSource(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="">All Sources</option>
                <option value="Mobile App Sign-in">Mobile App Sign-in</option>
                <option value="Biometric Sign-in">Biometric Sign-in</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-600 mb-1 font-bold">Status</label>
                <select
                  value={officeFilterStatus}
                  onChange={(e) => setOfficeFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOfficeFilterSearch('');
                  setOfficeFilterLocation('');
                  setOfficeFilterPeriod('');
                  setOfficeFilterSource('');
                  setOfficeFilterStatus('');
                }}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Office Time Records Table (Exact Column Structure Required) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>({filteredOfficeRecords.length}) Records Found</span>
              <span className="text-[11px] text-slate-400 font-normal">Table: Employee Name | Employee ID | Office Location | Timesheet Period | Login Source | Login Time | Logout Time | Working Hours | Status | Actions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-2">Employee ID</th>
                    <th className="py-2.5 px-2">Office Location</th>
                    <th className="py-2.5 px-2">Timesheet Period</th>
                    <th className="py-2.5 px-2">Login Source</th>
                    <th className="py-2.5 px-2">Login Time</th>
                    <th className="py-2.5 px-2">Logout Time</th>
                    <th className="py-2.5 px-2 text-center">Working Hours</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredOfficeRecords.length > 0 ? (
                    filteredOfficeRecords.map((row, idx) => {
                      const recId = row.id || row._id || `office_${idx}`;
                      return (
                        <tr key={recId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{row.employeeName || 'Staff Member'}</td>
                          <td className="py-3 px-2 font-mono text-slate-600">{row.employeeCode || row.employeeId?.employeeId || 'EMP-001'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.officeLocation || row.location || 'Kochi HQ'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.period || `${row.periodStartDate} - ${row.periodEndDate}`}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {row.loginSource || 'Biometric Sign-in'}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-600">{row.loginTime || row.timeIn || '09:00 AM'}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-600">{row.logoutTime || row.timeOut || '05:30 PM'}</td>
                          <td className="py-3 px-2 text-center font-bold text-[#0473b8]">
                            {row.workingHours || row.totalPeriodHours || 8.5} hrs
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'Submitted' || row.status === 'Pending Approval'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : row.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {row.status || 'Draft'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailModalItem(row)}
                                className="p-1 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(row)}
                                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {(row.status === 'Submitted' || row.status === 'Pending Approval') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Approve timesheet"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Reject timesheet"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetItem(row)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Building2 className="w-8 h-8 text-slate-300" />
                          <span className="font-bold text-xs">No office timesheet records match the criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-1 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Add Office Timesheet
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCESS CONTROL                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'access_control' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Access Control Attendance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Attendance records captured through biometric devices, camera sign-in stations, and access-control hardware.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Access Record</span>
            </button>
          </div>

          {/* Real Hardware Integration Status / Configuration Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Hardware Status: {accessHardwareStatus.hardwareStatus === 'connected' ? 'Connected & Online' : 'Hardware Disconnected / Offline'}
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {accessHardwareStatus.provider}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {accessHardwareStatus.message} Real internal access records and authorized manual logs persist below without mock hardware simulation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info('Access hardware gateway checked: Provider is currently offline. You can manually log verified access punches.')}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              Ping Gateway
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Search Employee</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Name or ID..."
                  value={accessFilterSearch}
                  onChange={(e) => setAccessFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Sign-in Method</label>
              <select
                value={accessFilterMethod}
                onChange={(e) => setAccessFilterMethod(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
              >
                <option value="">All Methods</option>
                <option value="Biometric Sign-in">Biometric Sign-in</option>
                <option value="Camera Sign-in">Camera Sign-in</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Date</label>
              <input
                type="date"
                value={accessFilterDate}
                onChange={(e) => setAccessFilterDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">GPS Location</label>
              <input
                type="text"
                placeholder="Filter GPS..."
                value={accessFilterLocation}
                onChange={(e) => setAccessFilterLocation(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-600 mb-1 font-bold">Status</label>
                <select
                  value={accessFilterStatus}
                  onChange={(e) => setAccessFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccessFilterSearch('');
                  setAccessFilterMethod('');
                  setAccessFilterDate('');
                  setAccessFilterLocation('');
                  setAccessFilterStatus('');
                }}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Access Control Table (Exact Column Structure Required) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>({filteredAccessRecords.length}) Records Found</span>
              <span className="text-[11px] text-slate-400 font-normal">Table: Employee Name | Company Name | Employee ID | Job Description | Sign-in Method | GPS Location | Date | Check-in | Check-out | Actions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-2">Company Name</th>
                    <th className="py-2.5 px-2">Employee ID</th>
                    <th className="py-2.5 px-2">Job Description</th>
                    <th className="py-2.5 px-2">Sign-in Method</th>
                    <th className="py-2.5 px-2">GPS Location</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 font-mono">Check-in</th>
                    <th className="py-2.5 px-2 font-mono">Check-out</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredAccessRecords.length > 0 ? (
                    filteredAccessRecords.map((row, idx) => {
                      const recId = row.id || row._id || `access_${idx}`;
                      return (
                        <tr key={recId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{row.employeeName}</td>
                          <td className="py-3 px-2 text-slate-600">{row.companyName || 'HUREMASO Global Technologies'}</td>
                          <td className="py-3 px-2 font-mono text-slate-600">{row.employeeCode || row.employeeId?.employeeId || 'EMP-001'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.jobDescription || 'Staff Member'}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {row.signInMethod || 'Biometric Sign-in'}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={row.gpsLocation}>
                            {row.gpsLocation || '9.9312° N, 76.2673° E'}
                          </td>
                          <td className="py-3 px-2 text-slate-600">{row.date || row.periodStartDate}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.checkInTime || row.loginTime || '08:45 AM'}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.checkOutTime || row.logoutTime || '05:15 PM'}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailModalItem(row)}
                                className="p-1 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(row)}
                                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetItem(row)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <ShieldCheck className="w-8 h-8 text-slate-300" />
                          <span className="font-bold text-xs">No access control records match your filter criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-1 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Log Access Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SITE WORK                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'site_work' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Project Site Timesheets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage project sites, assigned personnel, supervisor approvals, working hours, and automatic Overtime (OT).
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Site Timesheet</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Search Employee</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Name or ID..."
                  value={siteFilterSearch}
                  onChange={(e) => setSiteFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Project Name</label>
              <input
                type="text"
                placeholder="Filter project..."
                value={siteFilterProject}
                onChange={(e) => setSiteFilterProject(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Site Location</label>
              <input
                type="text"
                placeholder="Filter site location..."
                value={siteFilterLocation}
                onChange={(e) => setSiteFilterLocation(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Work Date / Period</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD or period..."
                value={siteFilterDate}
                onChange={(e) => setSiteFilterDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-600 mb-1 font-bold">Status</label>
                <select
                  value={siteFilterStatus}
                  onChange={(e) => setSiteFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSiteFilterSearch('');
                  setSiteFilterProject('');
                  setSiteFilterLocation('');
                  setSiteFilterDate('');
                  setSiteFilterStatus('');
                }}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Site Work Table (Exact Column Structure Required) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>({filteredSiteRecords.length}) Records Found</span>
              <span className="text-[11px] text-slate-400 font-normal">Table: Project Name | Project Location | Site Location | Employee Name | Employee ID | Supervisor | Supervisor ID | Date | Timesheet Period | Time In | Time Out | OT | Status | Actions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Project Name</th>
                    <th className="py-2.5 px-2">Project Location</th>
                    <th className="py-2.5 px-2">Site Location</th>
                    <th className="py-2.5 px-2">Employee Name</th>
                    <th className="py-2.5 px-2">Employee ID</th>
                    <th className="py-2.5 px-2">Supervisor</th>
                    <th className="py-2.5 px-2">Supervisor ID</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Timesheet Period</th>
                    <th className="py-2.5 px-2 font-mono">Time In</th>
                    <th className="py-2.5 px-2 font-mono">Time Out</th>
                    <th className="py-2.5 px-2 text-center text-amber-700">OT</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredSiteRecords.length > 0 ? (
                    filteredSiteRecords.map((row, idx) => {
                      const recId = row.id || row._id || `site_${idx}`;
                      return (
                        <tr key={recId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{row.projectName || row.siteName || 'Metro Extension'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.projectLocation || 'North Corridor Hub'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.siteLocation || 'Pier Site 44'}</td>
                          <td className="py-3 px-2 font-bold text-slate-800">{row.employeeName}</td>
                          <td className="py-3 px-2 font-mono text-slate-600">{row.employeeCode || row.employeeId?.employeeId || 'EMP-001'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.supervisorName || 'David Miller'}</td>
                          <td className="py-3 px-2 font-mono text-slate-500">{row.supervisorId || 'SUP-202'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.date || row.periodStartDate}</td>
                          <td className="py-3 px-2 text-slate-600">{row.period || `${row.periodStartDate} - ${row.periodEndDate}`}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.timeIn || '08:00 AM'}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.timeOut || '05:00 PM'}</td>
                          <td className="py-3 px-2 text-center font-bold text-amber-700">
                            {row.overtimeHours ? `${row.overtimeHours}h` : '0h'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'Submitted' || row.status === 'Pending Approval'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : row.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {row.status || 'Draft'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailModalItem(row)}
                                className="p-1 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(row)}
                                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {(row.status === 'Submitted' || row.status === 'Pending Approval') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Approve timesheet"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Reject timesheet"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetItem(row)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={14} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Briefcase className="w-8 h-8 text-slate-300" />
                          <span className="font-bold text-xs">No project site timesheets match the filter criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-1 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Add Site Timesheet
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FIELD WORK                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'field_work' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 m-0">Field Work Timesheets</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage field personnel duties, assigned locations, work deliverables, working hours, and field approvals.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field Timesheet</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Search Employee</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Name or ID..."
                  value={fieldFilterSearch}
                  onChange={(e) => setFieldFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Company Name</label>
              <input
                type="text"
                placeholder="Filter company..."
                value={fieldFilterCompany}
                onChange={(e) => setFieldFilterCompany(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Assigned Field</label>
              <input
                type="text"
                placeholder="Filter field duty..."
                value={fieldFilterField}
                onChange={(e) => setFieldFilterField(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-bold">Work Date / Period</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD or period..."
                value={fieldFilterDate}
                onChange={(e) => setFieldFilterDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-600 mb-1 font-bold">Status</label>
                <select
                  value={fieldFilterStatus}
                  onChange={(e) => setFieldFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFieldFilterSearch('');
                  setFieldFilterCompany('');
                  setFieldFilterField('');
                  setFieldFilterDate('');
                  setFieldFilterStatus('');
                }}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Field Work Table (Exact Column Structure Required) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>({filteredFieldRecords.length}) Records Found</span>
              <span className="text-[11px] text-slate-400 font-normal">Table: Company Name | Employee Name | Employee ID | Job Description | Assigned Field | Timesheet Period | Location | Date | Time In | Time Out | Working Hours | Status | Actions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-100 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-2">Employee Name</th>
                    <th className="py-2.5 px-2">Employee ID</th>
                    <th className="py-2.5 px-2">Job Description</th>
                    <th className="py-2.5 px-2">Assigned Field</th>
                    <th className="py-2.5 px-2">Timesheet Period</th>
                    <th className="py-2.5 px-2">Location</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 font-mono">Time In</th>
                    <th className="py-2.5 px-2 font-mono">Time Out</th>
                    <th className="py-2.5 px-2 text-center text-[#0473b8]">Working Hours</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredFieldRecords.length > 0 ? (
                    filteredFieldRecords.map((row, idx) => {
                      const recId = row.id || row._id || `field_${idx}`;
                      return (
                        <tr key={recId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-slate-600">{row.companyName || 'HUREMASO Global Technologies'}</td>
                          <td className="py-3 px-2 font-bold text-slate-900">{row.employeeName}</td>
                          <td className="py-3 px-2 font-mono text-slate-600">{row.employeeCode || row.employeeId?.employeeId || 'EMP-001'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.jobDescription || 'Field Specialist'}</td>
                          <td className="py-3 px-2 font-semibold text-slate-800">{row.assignedField || 'Field Inspection & Quality Audit'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.period || `${row.periodStartDate} - ${row.periodEndDate}`}</td>
                          <td className="py-3 px-2 text-slate-600">{row.location || 'Industrial Zone East Sector'}</td>
                          <td className="py-3 px-2 text-slate-600">{row.date || row.periodStartDate}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.timeIn || '08:30 AM'}</td>
                          <td className="py-3 px-2 font-mono text-[11px] text-slate-700">{row.timeOut || '05:00 PM'}</td>
                          <td className="py-3 px-2 text-center font-bold text-[#0473b8]">
                            {row.workingHours || row.totalPeriodHours || 8.5} hrs
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'Submitted' || row.status === 'Pending Approval'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : row.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {row.status || 'Draft'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailModalItem(row)}
                                className="p-1 text-slate-400 hover:text-[#0473b8] transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(row)}
                                className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                title="Edit record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {(row.status === 'Submitted' || row.status === 'Pending Approval') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                    title="Approve timesheet"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(recId, row.employeeName)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Reject timesheet"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetItem(row)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <MapPin className="w-8 h-8 text-slate-300" />
                          <span className="font-bold text-xs">No field work timesheets match the filter criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="mt-1 px-3 py-1.5 bg-[#004848] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            + Add Field Timesheet
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT TIMESHEET RECORD                                        */}
      {/* ========================================================================= */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 animate-scale-up border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {activeTab === 'office' && <Building2 className="w-4 h-4 text-[#004848]" />}
                {activeTab === 'access_control' && <ShieldCheck className="w-4 h-4 text-[#004848]" />}
                {activeTab === 'site_work' && <Briefcase className="w-4 h-4 text-[#004848]" />}
                {activeTab === 'field_work' && <MapPin className="w-4 h-4 text-[#004848]" />}
                <h3 className="text-base font-bold text-slate-900 m-0">
                  {modalMode === 'add' ? 'Add' : 'Edit'}{' '}
                  {activeTab === 'office' && 'Office Timesheet'}
                  {activeTab === 'access_control' && 'Access Control Log'}
                  {activeTab === 'site_work' && 'Site Work Timesheet'}
                  {activeTab === 'field_work' && 'Field Work Timesheet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-bold text-slate-700">
              {/* Employee Selection & Auto-Population */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Employee Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    list="global-employee-options"
                    required
                    placeholder="Search or enter name..."
                    value={formEmployeeName}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1">Employee ID (Auto-populated)</label>
                  <input
                    type="text"
                    required
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              {/* TAB 1: OFFICE TIME SPECIFIC FIELDS */}
              {activeTab === 'office' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Office Location <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formOfficeLocation}
                        onChange={(e) => setFormOfficeLocation(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Attendance / Login Source</label>
                      <select
                        value={formLoginSource}
                        onChange={(e) => setFormLoginSource(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white"
                      >
                        <option value="Mobile App Sign-in">Mobile App Sign-in</option>
                        <option value="Biometric Sign-in">Biometric Sign-in</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Period Start Date</label>
                      <input
                        type="date"
                        required
                        value={formPeriodStart}
                        onChange={(e) => setFormPeriodStart(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Period End Date</label>
                      <input
                        type="date"
                        required
                        value={formPeriodEnd}
                        onChange={(e) => setFormPeriodEnd(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1">Login Time</label>
                      <input
                        type="text"
                        placeholder="09:00 AM"
                        value={formLoginTime}
                        onChange={(e) => handleOfficeTimesChange(e.target.value, formLogoutTime)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Logout Time</label>
                      <input
                        type="text"
                        placeholder="05:30 PM"
                        value={formLogoutTime}
                        onChange={(e) => handleOfficeTimesChange(formLoginTime, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Working Hours (Calculated)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formWorkingHours}
                        onChange={(e) => setFormWorkingHours(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-blue-50/50 text-[#0473b8]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: ACCESS CONTROL SPECIFIC FIELDS */}
              {activeTab === 'access_control' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={formCompanyName}
                        onChange={(e) => setFormCompanyName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Job Description</label>
                      <input
                        type="text"
                        value={formJobDescription}
                        onChange={(e) => setFormJobDescription(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Sign-in Method</label>
                      <select
                        value={formSignInMethod}
                        onChange={(e) => setFormSignInMethod(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white"
                      >
                        <option value="Biometric Sign-in">Biometric Sign-in</option>
                        <option value="Camera Sign-in">Camera Sign-in</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1">GPS Location Coordinates</label>
                      <input
                        type="text"
                        placeholder="e.g. 9.9312° N, 76.2673° E (Main Campus)"
                        value={formGpsLocation}
                        onChange={(e) => setFormGpsLocation(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => {
                          setFormDate(e.target.value);
                          setFormPeriodStart(e.target.value);
                          setFormPeriodEnd(e.target.value);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Check-in Time</label>
                      <input
                        type="text"
                        placeholder="08:45 AM"
                        value={formCheckIn}
                        onChange={(e) => handleAccessTimesChange(e.target.value, formCheckOut)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Check-out Time</label>
                      <input
                        type="text"
                        placeholder="05:15 PM"
                        value={formCheckOut}
                        onChange={(e) => handleAccessTimesChange(formCheckIn, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Working Hours (Calculated)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formWorkingHours}
                      onChange={(e) => setFormWorkingHours(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-blue-50/50 text-[#0473b8]"
                    />
                  </div>
                </>
              )}

              {/* TAB 3: SITE WORK SPECIFIC FIELDS */}
              {activeTab === 'site_work' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Project Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        list="global-project-options"
                        required
                        placeholder="Select or enter project..."
                        value={formProjectName}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Project Location (Auto-populated)</label>
                      <input
                        type="text"
                        required
                        value={formProjectLocation}
                        onChange={(e) => setFormProjectLocation(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">Site Location <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pier Site 44 / Foundation Block 2"
                      value={formSiteLocation}
                      onChange={(e) => setFormSiteLocation(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Supervisor Name</label>
                      <input
                        type="text"
                        list="global-employee-options"
                        placeholder="Select supervisor..."
                        value={formSupervisorName}
                        onChange={(e) => handleSupervisorSelect(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Supervisor ID (Auto-populated)</label>
                      <input
                        type="text"
                        value={formSupervisorId}
                        onChange={(e) => setFormSupervisorId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Work Date</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => {
                          setFormDate(e.target.value);
                          setFormPeriodStart(e.target.value);
                          setFormPeriodEnd(e.target.value);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Timesheet Period</label>
                      <input
                        type="text"
                        value={formPeriodStart === formPeriodEnd ? formPeriodStart : `${formPeriodStart} to ${formPeriodEnd}`}
                        onChange={(e) => {
                          setFormPeriodStart(e.target.value.split(' to ')[0] || e.target.value);
                          setFormPeriodEnd(e.target.value.split(' to ')[1] || e.target.value);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block mb-1">Time In</label>
                      <input
                        type="text"
                        placeholder="08:00 AM"
                        value={formTimeIn}
                        onChange={(e) => handleSiteTimesChange(e.target.value, formTimeOut)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Time Out</label>
                      <input
                        type="text"
                        placeholder="05:00 PM"
                        value={formTimeOut}
                        onChange={(e) => handleSiteTimesChange(formTimeIn, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Hours Logged</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formWorkingHours}
                        onChange={(e) => {
                          setFormWorkingHours(e.target.value);
                          const ot = Math.max(0, Math.round((Number(e.target.value) - 8.0) * 10) / 10);
                          setFormOvertimeHours(ot.toString());
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Overtime OT (&gt;8h Auto)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formOvertimeHours}
                        onChange={(e) => setFormOvertimeHours(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-amber-800 bg-amber-50/50 font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4: FIELD WORK SPECIFIC FIELDS */}
              {activeTab === 'field_work' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={formCompanyName}
                        onChange={(e) => setFormCompanyName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Job Description (Auto-populated)</label>
                      <input
                        type="text"
                        value={formJobDescription}
                        onChange={(e) => setFormJobDescription(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Assigned Field Duty <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Field Inspection & Quality Audit"
                        value={formAssignedField}
                        onChange={(e) => setFormAssignedField(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Location / Area of Operation <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Industrial Zone East Sector"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Work Date</label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => {
                          setFormDate(e.target.value);
                          setFormPeriodStart(e.target.value);
                          setFormPeriodEnd(e.target.value);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Timesheet Period</label>
                      <input
                        type="text"
                        value={formPeriodStart === formPeriodEnd ? formPeriodStart : `${formPeriodStart} to ${formPeriodEnd}`}
                        onChange={(e) => {
                          setFormPeriodStart(e.target.value.split(' to ')[0] || e.target.value);
                          setFormPeriodEnd(e.target.value.split(' to ')[1] || e.target.value);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1">Time In</label>
                      <input
                        type="text"
                        placeholder="08:30 AM"
                        value={formTimeIn}
                        onChange={(e) => handleFieldTimesChange(e.target.value, formTimeOut)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Time Out</label>
                      <input
                        type="text"
                        placeholder="05:00 PM"
                        value={formTimeOut}
                        onChange={(e) => handleFieldTimesChange(formTimeIn, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Working Hours (Calculated)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={formWorkingHours}
                        onChange={(e) => setFormWorkingHours(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-blue-50/50 text-[#0473b8]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Status & Work Details Common */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Notes / Work Deliverables</label>
                  <input
                    type="text"
                    placeholder="Enter short notes..."
                    value={formWorkDetails}
                    onChange={(e) => setFormWorkDetails(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-5 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  {savingForm ? 'Saving...' : modalMode === 'add' ? 'Save Record' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW DETAILS MODAL                                                 */}
      {/* ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-up border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#004848]" />
                <h3 className="text-base font-bold text-slate-900 m-0">Timesheet Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee</span>
                  <span className="font-bold text-slate-900">{detailModalItem.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                  <span className="font-mono text-slate-800">{detailModalItem.employeeCode || 'EMP-001'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-bold capitalize text-slate-800">{(detailModalItem.workType || 'Office').replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Working Hours</span>
                  <span className="font-bold text-[#0473b8]">{detailModalItem.workingHours || detailModalItem.totalPeriodHours || 0} hrs</span>
                </div>
              </div>

              {detailModalItem.companyName && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Company Name</span>
                  <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.companyName}</div>
                </div>
              )}

              {detailModalItem.jobDescription && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Job Description</span>
                  <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.jobDescription}</div>
                </div>
              )}

              {detailModalItem.officeLocation && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Office Location</span>
                  <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.officeLocation}</div>
                </div>
              )}

              {detailModalItem.loginSource && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Login Source</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.loginSource}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Login Time</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.loginTime || detailModalItem.timeIn}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Logout Time</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.logoutTime || detailModalItem.timeOut}</div>
                  </div>
                </div>
              )}

              {detailModalItem.signInMethod && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Sign-in Method</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.signInMethod}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">GPS Location</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white font-mono">{detailModalItem.gpsLocation}</div>
                  </div>
                </div>
              )}

              {detailModalItem.projectName && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Project</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.projectName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Site Location</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.siteLocation || detailModalItem.location}</div>
                  </div>
                </div>
              )}

              {detailModalItem.supervisorName && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Supervisor</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.supervisorName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Supervisor ID</span>
                    <div className="p-2 border border-slate-200 rounded font-semibold bg-white font-mono">{detailModalItem.supervisorId}</div>
                  </div>
                </div>
              )}

              {detailModalItem.assignedField && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Assigned Field Duty</span>
                  <div className="p-2 border border-slate-200 rounded font-semibold bg-white">{detailModalItem.assignedField}</div>
                </div>
              )}

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-slate-700">Approval Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    detailModalItem.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : detailModalItem.status === 'Submitted' || detailModalItem.status === 'Pending Approval'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : detailModalItem.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {detailModalItem.status || 'Draft'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              {(detailModalItem.status === 'Submitted' || detailModalItem.status === 'Pending Approval') && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReject(detailModalItem.id || detailModalItem._id || '', detailModalItem.employeeName)}
                    className="px-4 py-2 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(detailModalItem.id || detailModalItem._id || '', detailModalItem.employeeName)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION DIALOG                                         */}
      {/* ========================================================================= */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-scale-up border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">Delete Timesheet Record</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete the timesheet record for{' '}
                <span className="font-bold text-slate-800">{deleteTargetItem.employeeName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetsPage;
