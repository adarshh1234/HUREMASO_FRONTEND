import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  RotateCcw,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Users,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Badge from '../../components/common/Badge';
import notificationService, {
  BackendNotification,
  RecipientDepartment,
  RecipientEmployee,
  RecipientDeliveryItem,
} from '../../services/notificationService';

const ANNOUNCEMENT_CATEGORIES = [
  'General Announcement',
  'HR Announcement',
  'Company News',
  'Policy Update',
  'Emergency Notice',
  'Event Announcement',
] as const;

export const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  // Determine sub-page configuration and active channel
  let pageTitle = 'E-Mail';
  let historyTitle = 'E- Mail History';
  let sendButtonText = 'Send Message';
  let activeChannel = 'EMAIL';

  if (path.includes('/sms')) {
    pageTitle = 'Messages';
    historyTitle = 'Message History';
    sendButtonText = 'Send Message';
    activeChannel = 'SMS';
  } else if (path.includes('/whatsapp')) {
    pageTitle = "What's App Messages";
    historyTitle = 'Message History';
    sendButtonText = 'Send Message';
    activeChannel = 'WHATSAPP';
  } else if (path.includes('/employee-app')) {
    pageTitle = 'Employee App Messages';
    historyTitle = 'Message History';
    sendButtonText = 'Send Message';
    activeChannel = 'EMPLOYEE_APP';
  } else if (path.includes('/huremaso')) {
    pageTitle = 'Huremaso Broadcast Notifications';
    historyTitle = 'Huremaso Notification History';
    sendButtonText = 'Send Huremaso Notification';
    activeChannel = 'HUREMASO';
  }

  // Dynamic Recipients State
  const [departments, setDepartments] = useState<RecipientDepartment[]>([]);
  const [employees, setEmployees] = useState<RecipientEmployee[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Recipient checkboxes state (keyed by employeeId/id)
  const [selectedDepts, setSelectedDepts] = useState<Record<string, boolean>>({});
  const [selectedEmps, setSelectedEmps] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState<string>('General Announcement');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History logs states
  const [historyTab, setHistoryTab] = useState<'All' | 'Send' | 'Drafts'>('All');
  const [historySearch, setHistorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<BackendNotification[]>([]);

  // Modal states for inspecting recipient delivery details
  const [selectedNotification, setSelectedNotification] = useState<BackendNotification | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load dynamic recipients for active channel
  const loadRecipients = useCallback(async () => {
    setIsLoadingRecipients(true);
    try {
      const res = await notificationService.getRecipients(activeChannel);
      setDepartments(res.departments || []);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error('Error fetching dynamic recipients:', err);
      toast.error('Failed to load employee recipients list.');
    } finally {
      setIsLoadingRecipients(false);
    }
  }, [activeChannel, toast]);

  useEffect(() => {
    loadRecipients();
    // Reset selection when switching channels
    setSelectedEmps({});
    setSelectedDepts({});
  }, [loadRecipients]);

  // Load History
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await notificationService.getNotifications({
        channel: activeChannel,
        status: historyTab === 'Send' ? 'SENT' : historyTab === 'Drafts' ? 'DRAFT' : undefined,
        search: historySearch,
        page: currentPage,
        limit: 10,
      });

      setHistoryItems(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching notification history:', err);
      setHistoryItems([]);
      toast.error('Unable to connect to notification server. Failed to load history.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeChannel, historyTab, historySearch, currentPage, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Selected employees computed roster
  const selectedEmployeeList = useMemo(() => {
    return employees.filter((emp) => selectedEmps[emp.employeeId || emp.id]);
  }, [employees, selectedEmps]);

  const selectedCount = selectedEmployeeList.length;
  const validSelectedCount = useMemo(() => {
    return selectedEmployeeList.filter((emp) => emp.isValidForChannel).length;
  }, [selectedEmployeeList]);
  const invalidSelectedCount = selectedCount - validSelectedCount;

  // Department Toggle: selects/deselects all employees in that department
  const handleDeptToggle = (deptName: string) => {
    const isCurrentlySelected = !!selectedDepts[deptName];
    const newDeptState = !isCurrentlySelected;

    setSelectedDepts((prev) => ({ ...prev, [deptName]: newDeptState }));

    // Find all employees belonging to this department
    const deptEmployees = employees.filter(
      (emp) => (emp.department || '').toLowerCase() === deptName.toLowerCase()
    );

    setSelectedEmps((prev) => {
      const next = { ...prev };
      for (const emp of deptEmployees) {
        const key = emp.employeeId || emp.id;
        if (newDeptState) {
          next[key] = true;
        } else {
          delete next[key];
        }
      }
      return next;
    });
  };

  // Individual employee toggle
  const handleEmpToggle = (empKey: string) => {
    setSelectedEmps((prev) => {
      const next = { ...prev };
      if (next[empKey]) {
        delete next[empKey];
      } else {
        next[empKey] = true;
      }
      return next;
    });
  };

  // Compute recipient details for payload
  const getRecipientInfo = () => {
    const selectedEmpKeys = Object.keys(selectedEmps).filter((k) => selectedEmps[k]);
    const selectedDeptKeys = Object.keys(selectedDepts).filter((k) => selectedDepts[k]);

    if (selectedEmpKeys.length > 0) {
      const names = selectedEmployeeList.map((e) => e.name);
      const displayLabel =
        selectedEmpKeys.length <= 3
          ? `${selectedEmpKeys.length} Selected (${names.join(', ')})`
          : `${selectedEmpKeys.length} Selected Employee(s)`;

      return {
        recipientType: 'EMPLOYEES' as const,
        employeeIds: selectedEmpKeys,
        departmentIds: [],
        recipients: displayLabel,
      };
    }

    if (selectedDeptKeys.length > 0) {
      return {
        recipientType: 'DEPARTMENT' as const,
        employeeIds: [],
        departmentIds: selectedDeptKeys,
        recipients: `Department(s): ${selectedDeptKeys.join(', ')}`,
      };
    }

    return {
      recipientType: 'ALL_EMPLOYEES' as const,
      employeeIds: [],
      departmentIds: [],
      recipients: 'All Employees',
    };
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message before sending.');
      return;
    }

    if (selectedCount > 0 && validSelectedCount === 0) {
      toast.error(`None of the selected recipients have valid contact information for ${pageTitle}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const recipientInfo = getRecipientInfo();

      // Step 1: Save as DRAFT
      const draft = await notificationService.createNotification({
        channel: activeChannel,
        subject: subject.trim() || 'No Subject',
        message: message.trim(),
        recipients: recipientInfo.recipients,
        recipientType: recipientInfo.recipientType,
        employeeIds: recipientInfo.employeeIds,
        departmentIds: recipientInfo.departmentIds,
        announcementCategory: activeChannel === 'HUREMASO' ? announcementCategory : undefined,
        status: 'DRAFT',
      });

      // Step 2: Dispatch via /send endpoint
      await notificationService.sendNotification(draft.id);

      setSubject('');
      setMessage('');
      setSelectedEmps({});
      setSelectedDepts({});
      toast.success('Message dispatched successfully with live delivery tracking!');
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Server connection error. Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!message.trim() && !subject.trim()) {
      toast.error('Please enter a subject or message to save as draft.');
      return;
    }
    setIsSubmitting(true);
    try {
      const recipientInfo = getRecipientInfo();
      await notificationService.createNotification({
        channel: activeChannel,
        subject: subject.trim() || 'No Subject',
        message: message.trim() || '(Draft Content)',
        recipients: recipientInfo.recipients,
        recipientType: recipientInfo.recipientType,
        employeeIds: recipientInfo.employeeIds,
        departmentIds: recipientInfo.departmentIds,
        announcementCategory: activeChannel === 'HUREMASO' ? announcementCategory : undefined,
        status: 'DRAFT',
      });

      setSubject('');
      setMessage('');
      setSelectedEmps({});
      setSelectedDepts({});
      toast.info('Draft saved successfully to database!');
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Server connection error. Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification draft?')) return;
    setIsDeleting(id);
    try {
      await notificationService.deleteNotification(id);
      toast.success('Draft deleted successfully');
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete draft');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRetry = async (notification: BackendNotification) => {
    setIsRetrying(true);
    try {
      const updated = await notificationService.retryNotification(notification.id);
      toast.success('Failed deliveries retried successfully!');
      setSelectedNotification(updated);
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to retry deliveries');
    } finally {
      setIsRetrying(false);
    }
  };

  // Filtered employees for recipient search list
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.employeeId.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">{pageTitle}</h1>
      </div>

      {/* Main Composer Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left side: Recipients Checklist */}
        <div className="md:col-span-5 bg-white border-2 border-[#006666] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700">Recipients</h3>
            {isLoadingRecipients && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                <Loader2 className="h-3 w-3 animate-spin text-[#006666]" /> Loading...
              </span>
            )}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipients by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:border-[#006666]"
            />
          </div>

          {/* Departments */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Departments ({departments.length})
            </span>
            <div className="space-y-1.5 pl-1 max-h-36 overflow-y-auto">
              {departments.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">No departments loaded</div>
              ) : (
                departments.map((dept) => (
                  <label
                    key={dept.id || dept.name}
                    className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 py-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={!!selectedDepts[dept.name]}
                        onChange={() => handleDeptToggle(dept.name)}
                        className="rounded border-slate-300 text-[#006666] focus:ring-[#006666] h-3.5 w-3.5"
                      />
                      <span>{dept.name}</span>
                    </div>
                    {dept.employeeCount > 0 && (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded">
                        {dept.employeeCount}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Employees with live Channel Validation Indicator */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Employees ({filteredEmployees.length})
            </span>
            <div className="space-y-1.5 pl-1 max-h-48 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">No employees found</div>
              ) : (
                filteredEmployees.map((emp) => {
                  const key = emp.employeeId || emp.id;
                  const isChecked = !!selectedEmps[key];
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 py-0.5"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleEmpToggle(key)}
                          className="rounded border-slate-300 text-[#006666] focus:ring-[#006666] h-3.5 w-3.5"
                        />
                        <span className="truncate">
                          {emp.name}{' '}
                          <span className="text-slate-400 font-normal">({emp.department})</span>
                        </span>
                      </div>
                      {/* Channel validity indicator */}
                      <div>
                        {emp.isValidForChannel ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                            Valid
                          </span>
                        ) : (
                          <span
                            title={emp.validationError || 'Invalid contact info for channel'}
                            className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium cursor-help"
                          >
                            No Contact
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer selected label with valid vs invalid stats */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>Selected: {selectedCount} employees</span>
              {selectedCount > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  {validSelectedCount} valid
                </span>
              )}
            </div>
            {invalidSelectedCount > 0 && (
              <div className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3" />
                <span>{invalidSelectedCount} selected recipient(s) lack required channel contact info</span>
              </div>
            )}
            {selectedCount === 0 && (
              <div className="text-[10px] text-slate-400">
                (Leaving empty sends to All Active Employees)
              </div>
            )}
          </div>
        </div>

        {/* Right side: Message details block */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          {/* Announcement Category (For Huremaso Broadcast) */}
          {activeChannel === 'HUREMASO' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Announcement Category</label>
              <select
                value={announcementCategory}
                onChange={(e) => setAnnouncementCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#006666] bg-white cursor-pointer"
              >
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Subject</label>
            <input
              type="text"
              placeholder="Enter the message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#006666]"
            />
          </div>

          {/* Message field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Massage</label>
            <textarea
              rows={6}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-4 text-xs font-semibold text-slate-800 outline-none focus:border-[#006666] resize-none"
            />
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>{message.length}/1000 characters</span>
              {activeChannel === 'SMS' && (
                <span>
                  {Math.ceil(message.length / 160) || 1} SMS segment(s)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-6 py-2 border-2 border-[#006666] hover:border-[#004848] text-[#006666] hover:text-[#004848] text-xs font-bold rounded-lg cursor-pointer transition-colors bg-white disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Draft</span>
            </button>
            <button
              onClick={handleSend}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{sendButtonText}</span>
            </button>
          </div>
        </div>
      </div>

      {/* History log panel */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">{historyTitle}</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['All', 'Send', 'Drafts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setHistoryTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded text-xs font-bold border transition-colors ${
                  historyTab === tab
                    ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => {
                setHistorySearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Cards Table */}
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span className="col-span-2">Date/Time</span>
            <span className="col-span-4">Message</span>
            <span className="col-span-2">Recipients</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1 text-center">Read</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>

          {/* Rows */}
          {isLoadingHistory ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#006666]" />
              <span>Loading notification history from server...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400 font-semibold">
              No matching records found.
            </div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((item) => {
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '-';

                const readDisplay =
                  item.status === 'SENT'
                    ? `${item.readCount || 0}/${item.totalRecipientsCount || 0}`
                    : '-';

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm hover:border-[#006666] transition-all text-xs font-bold text-slate-800"
                  >
                    <span className="col-span-2 text-slate-500 font-semibold">{formattedDate}</span>
                    <div className="col-span-4 pr-2 truncate">
                      {item.subject && item.subject !== 'No Subject' ? (
                        <span>
                          <strong className="text-slate-900">{item.subject}</strong> - {item.message}
                        </span>
                      ) : (
                        <span>{item.message}</span>
                      )}
                      {item.announcementCategory && (
                        <span className="ml-2 inline-block px-1.5 py-0.2 bg-teal-50 text-teal-700 text-[10px] rounded font-medium">
                          {item.announcementCategory}
                        </span>
                      )}
                    </div>
                    <span className="col-span-2 text-slate-500 font-semibold truncate">
                      {item.recipients || 'All Employees'}
                    </span>

                    <div className="col-span-2 flex items-center gap-1.5">
                      <Badge
                        variant={
                          item.status === 'SENT'
                            ? (item.failedCount || 0) > 0
                              ? 'warning'
                              : 'success'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {item.status === 'SENT' ? 'Send' : 'Draft'}
                      </Badge>
                      {item.status === 'SENT' && (item.failedCount || 0) > 0 && (
                        <span className="text-[10px] text-amber-600 font-bold">
                          ({item.failedCount} failed)
                        </span>
                      )}
                    </div>

                    <span className="col-span-1 text-center text-slate-500 font-semibold">
                      {readDisplay}
                    </span>

                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                      <button
                        title="View Delivery Details"
                        onClick={() => setSelectedNotification(item)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#006666] transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {item.status === 'DRAFT' && (
                        <button
                          title="Delete Draft"
                          disabled={isDeleting === item.id}
                          onClick={() => handleDeleteDraft(item.id)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                        >
                          {isDeleting === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {item.status === 'SENT' && (item.failedCount || 0) > 0 && (
                        <button
                          title="Retry Failed Deliveries"
                          onClick={() => handleRetry(item)}
                          disabled={isRetrying}
                          className="p-1 hover:bg-amber-50 rounded text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-xs font-bold border rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-500 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Recipient Delivery Details Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <Badge variant={selectedNotification.status === 'SENT' ? 'success' : 'neutral'} size="sm">
                  {selectedNotification.status}
                </Badge>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedNotification.subject || 'Message Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Message Summary Card */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200 text-xs">
                <div className="text-slate-500">
                  <span className="font-bold text-slate-700">Channel:</span> {selectedNotification.channel}
                </div>
                {selectedNotification.announcementCategory && (
                  <div className="text-slate-500">
                    <span className="font-bold text-slate-700">Category:</span>{' '}
                    {selectedNotification.announcementCategory}
                  </div>
                )}
                <div className="text-slate-500">
                  <span className="font-bold text-slate-700">Message Body:</span>
                  <p className="mt-1 text-slate-900 font-semibold bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              {/* Delivery Statistics Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-lg font-extrabold text-slate-800">
                    {selectedNotification.totalRecipientsCount || selectedNotification.recipientDeliveries?.length || 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Recipients</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-lg font-extrabold text-emerald-700">
                    {selectedNotification.sentCount || 0}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Sent / Delivered</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="text-lg font-extrabold text-rose-700">
                    {selectedNotification.failedCount || 0}
                  </div>
                  <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-lg font-extrabold text-blue-700">
                    {selectedNotification.readCount || 0}
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 uppercase">Read</div>
                </div>
              </div>

              {/* Individual Recipient Deliveries Roster */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Individual Recipient Statuses</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Recipient</th>
                          <th className="px-3 py-2">Department</th>
                          <th className="px-3 py-2">Contact</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Details / Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!selectedNotification.recipientDeliveries ||
                        selectedNotification.recipientDeliveries.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-slate-400 italic">
                              No individual delivery records tracked yet.
                            </td>
                          </tr>
                        ) : (
                          selectedNotification.recipientDeliveries.map((delivery, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-bold text-slate-900">{delivery.name}</td>
                              <td className="px-3 py-2 text-slate-600">{delivery.department}</td>
                              <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                                {delivery.contactAddress || '-'}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                                    delivery.status === 'SENT' || delivery.status === 'DELIVERED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : delivery.status === 'READ'
                                      ? 'bg-blue-100 text-blue-800'
                                      : delivery.status === 'FAILED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {delivery.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-500 text-[11px]">
                                {delivery.error ? (
                                  <span className="text-rose-600 font-semibold">{delivery.error}</span>
                                ) : delivery.sentAt ? (
                                  <span>{new Date(delivery.sentAt).toLocaleTimeString()}</span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                {(selectedNotification.failedCount || 0) > 0 && (
                  <button
                    onClick={() => handleRetry(selectedNotification)}
                    disabled={isRetrying}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Retry Failed ({selectedNotification.failedCount})</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
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

export default NotificationsPage;
