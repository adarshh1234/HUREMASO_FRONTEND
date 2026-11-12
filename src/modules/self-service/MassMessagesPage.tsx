import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, Edit2, Loader2, Send } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { messagingService, RecipientOption } from '../../services/messagingService';

interface MsgHistoryRow {
  id: string;
  dateTime: string;
  message: string;
  recipients: string;
  status: 'Send' | 'Draft';
  read: string;
}

export const MassMessagesPage: React.FC = () => {
  const toast = useToast();
  const [searchRecipient, setSearchRecipient] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>(['All Departments', 'HR', 'IT', 'Finance', 'Marketing', 'Operations']);
  const [employees, setEmployees] = useState<RecipientOption[]>([
    { employeeId: '1', name: 'Karthika Balan', department: 'IT' },
    { employeeId: '2', name: 'Sarah Jo', department: 'Marketing' },
    { employeeId: '3', name: 'Michael', department: 'Finance' },
    { employeeId: '4', name: 'David', department: 'Operations' },
    { employeeId: '5', name: 'Sarah Joseph', department: 'HR' }
  ]);
  const [loading, setLoading] = useState(true);

  // Composer fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'All' | 'Send' | 'Drafts'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState<MsgHistoryRow[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recipientsData, historyData] = await Promise.all([
        messagingService.getRecipients().catch(() => null),
        messagingService.getMessageLogs().catch(() => []),
      ]);

      if (recipientsData && recipientsData.departments && recipientsData.departments.length > 0) {
        setDepartments(['All Departments', ...recipientsData.departments]);
      }
      if (recipientsData && recipientsData.employees && recipientsData.employees.length > 0) {
        setEmployees(recipientsData.employees);
      }

      if (historyData && historyData.length > 0) {
        setHistory(
          historyData.map((h) => ({
            id: h.id,
            dateTime: h.dateSent || 'Recent',
            message: h.subject || h.message,
            recipients: h.recipients,
            status: h.status === 'Draft' ? 'Draft' : 'Send',
            read: '-',
          }))
        );
      } else {
        setHistory([
          { id: '1', dateTime: 'July 20, 2025 09:30 AM', message: 'Team meeting scheduled for Q3 review', recipients: 'All Employees', status: 'Send', read: '-' },
          { id: '2', dateTime: 'July 20, 2025 09:30 AM', message: 'Security Policy Updates Notice', recipients: 'Engineering Team (8)', status: 'Draft', read: '-' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load mass messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter(d => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const toggleEmp = (empName: string) => {
    if (selectedEmps.includes(empName)) {
      setSelectedEmps(selectedEmps.filter(e => e !== empName));
    } else {
      setSelectedEmps([...selectedEmps, empName]);
    }
  };

  const handleSend = async (isDraft = false) => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message!');
      return;
    }

    try {
      const recipientList = selectedEmps.length > 0 ? selectedEmps : ['ALL_EMPLOYEES'];
      await messagingService.sendMessage({
        subject,
        message,
        channel: 'EMAIL',
        recipientType: selectedDepts.length > 0 ? 'DEPARTMENT' : 'ALL_EMPLOYEES',
        recipients: recipientList,
        department: selectedDepts[0],
        status: isDraft ? 'DRAFT' : 'SENT',
      });

      const newMsg: MsgHistoryRow = {
        id: String(Date.now()),
        dateTime: new Date().toLocaleDateString(),
        message: subject,
        recipients: selectedDepts.length > 0 ? `${selectedDepts.join(', ')} Departments` : 'All Employees',
        status: isDraft ? 'Draft' : 'Send',
        read: '-',
      };
      setHistory([newMsg, ...history]);
      setSubject('');
      setMessage('');
      toast.success(isDraft ? 'Draft saved successfully!' : 'Message broadcasted successfully!');
    } catch (err) {
      toast.error('Failed to send broadcast message');
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(history.filter(h => h.id !== id));
    toast.success('Message log deleted.');
  };

  const filteredHistory = history.filter(row => {
    if (activeTab === 'Send') return row.status === 'Send';
    if (activeTab === 'Drafts') return row.status === 'Draft';
    return true;
  });

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchRecipient.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchRecipient.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">Mass Messages</h1>
      </div>

      {/* Two Column Layout (Composer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Recipients checklists */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <span className="block text-xs font-bold text-slate-700">Recipients</span>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search recipients..."
              value={searchRecipient}
              onChange={(e) => setSearchRecipient(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-slate-350"
            />
          </div>

          {/* Departments Checklist */}
          <div className="space-y-2.5">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Departments</span>
            <div className="space-y-2 text-xs font-bold text-slate-600 pl-1 max-h-36 overflow-y-auto">
              {departments.map(dept => (
                <label key={dept} className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedDepts.includes(dept)}
                    onChange={() => toggleDept(dept)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-400 h-3.5 w-3.5"
                  />
                  <span>{dept}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Employees Checklist */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Employees</span>
            <div className="space-y-2 text-xs font-bold text-slate-600 pl-1 max-h-48 overflow-y-auto">
              {filteredEmployees.map(emp => (
                <label key={emp.employeeId || emp.name} className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedEmps.includes(emp.name)}
                    onChange={() => toggleEmp(emp.name)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-400 h-3.5 w-3.5"
                  />
                  <span>{emp.name} {emp.department ? `(${emp.department})` : ''}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected count footer */}
          <div className="text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
            Selected: {selectedDepts.length + selectedEmps.length} target(s)
          </div>
        </div>

        {/* Right Side: Message Editor Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Subject */}
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-3">
            <span className="block text-xs font-bold text-slate-700">Subject</span>
            <input 
              type="text"
              placeholder="Enter the message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 bg-white"
            />
          </div>

          {/* Card 2: Message textarea */}
          <div className="bg-white border border-slate-205 rounded-xl p-5 shadow-sm space-y-3">
            <span className="block text-xs font-bold text-slate-700">Message</span>
            <textarea 
              rows={8}
              placeholder="Type your broadcast message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-800 outline-none resize-none focus:border-blue-400"
            />
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
              <span>{message.length}/1000 characters</span>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => handleSend(true)}
                  className="px-6 py-2 border border-[#006666] hover:bg-emerald-50/50 text-[#006666] font-bold rounded-lg text-xs transition-all bg-white cursor-pointer"
                >
                  Save Draft
                </button>
                <button 
                  onClick={() => handleSend(false)}
                  className="px-6 py-2 bg-[#004848] hover:bg-[#003333] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Message History Section */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 m-0">Message History</h2>

        {/* Filters and search info */}
        <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
          <div className="flex gap-2">
            {(['All', 'Send', 'Drafts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-blue-50 text-[#0473b8] border border-blue-200 font-extrabold shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Message history log list table */}
        <div className="space-y-3 bg-slate-100 border border-slate-200 rounded-xl p-5">
          {/* Table Headers */}
          <div className="grid grid-cols-6 px-4 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            <span>Date/Time</span>
            <span className="col-span-2">Message</span>
            <span>Recipients</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {filteredHistory.map(row => (
              <div 
                key={row.id}
                className="grid grid-cols-6 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-sm text-xs font-bold text-slate-800"
              >
                <span>{row.dateTime}</span>
                <span className="col-span-2 text-slate-500 font-semibold truncate pr-4">{row.message}</span>
                <span className="text-slate-500 font-semibold truncate">{row.recipients}</span>
                
                <div>
                  <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${
                    row.status === 'Send' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-150'
                  }`}>
                    {row.status}
                  </span>
                </div>

                <div className="flex justify-end items-center gap-2 text-slate-400">
                  <button onClick={() => handleDeleteHistory(row.id)} className="hover:text-rose-600 p-1 cursor-pointer" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default MassMessagesPage;
