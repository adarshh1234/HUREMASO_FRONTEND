import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Users, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  Video,
  AlertCircle,
  Loader2,
  Search,
  CalendarDays,
  Trash2,
  Edit3,
  ExternalLink,
  Check,
  X,
  LayoutGrid,
  List,
  RotateCcw,
  Briefcase,
  AlertTriangle,
  GraduationCap,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { calendarService, CalendarEvent } from '../../services/calendarService';

export const CallenderPage: React.FC = () => {
  const toast = useToast();

  // Navigation and View Mode States
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 1)); // Default Sept 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Event Data States
  const [eventsList, setEventsList] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modals States
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<CalendarEvent | null>(null);

  // New / Edit Event Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Meeting',
    date: '2026-09-15',
    endDate: '',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    location: 'Main Office',
    isOnline: false,
    meetingLink: '',
    agenda: '',
    organizer: 'Sarah Joseph (HR VP)',
    attendees: 5,
    description: '',
    priority: 'Medium',
    department: 'Engineering',
    assigneeName: '',
    // Category: Interview
    candidateName: '',
    interviewerName: '',
    jobPosition: '',
    roundName: 'Technical Architecture Round',
    interviewMode: 'Online',
    // Category: Holiday
    holidayType: 'Public',
    applicableScope: 'Company Wide',
    repeatsAnnually: false,
    // Category: Deadline
    dueTime: '11:59 PM',
    status: 'Scheduled',
  });

  // Reschedule Form State
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    notes: '',
  });

  // Calculate year and month string (e.g. "September 2026", "2026-09")
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentMonthLabel = `${monthName} ${currentYear}`;
  const currentMonthISO = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

  // Fetch Events from Service
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarService.getEvents({
        month: currentMonthISO,
        year: currentYear,
        type: selectedFilter !== 'all' ? selectedFilter : undefined,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      });
      setEventsList(data);
    } catch (err: any) {
      console.error('Failed to fetch calendar events', err);
      toast.error('Failed to load events from calendar API');
    } finally {
      setLoading(false);
    }
  }, [currentMonthISO, currentYear, selectedFilter, searchQuery, statusFilter, priorityFilter, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Calendar Grid Calculations (Handles 28/29/30/31 days and correct weekday placement)
  const calendarGridDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate(); // 28, 29, 30, or 31
    const daysInPrevMonth = new Date(currentYear, currentMonthIndex, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonthIndex - 1, day);
      const dateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: false,
        events: [] as CalendarEvent[],
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Match events whose date is dateKey or starts with dateKey, or formatted e.g. "Sept 04, 2026"
      const matchedEvents = eventsList.filter((evt) => {
        if (!evt.date) return false;
        if (evt.date === dateKey || evt.date.startsWith(dateKey)) return true;
        // Check fuzzy match e.g. "Sept 04" or "Sep 4"
        const d = new Date(evt.date);
        if (!isNaN(d.getTime())) {
          return d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex && d.getDate() === day;
        }
        return false;
      });

      days.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: true,
        events: matchedEvents,
      });
    }

    // 3. Next month leading days to fill grid (total 35 or 42 cells)
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(currentYear, currentMonthIndex + 1, day);
      const dateKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateKey,
        isCurrentMonth: false,
        events: [] as CalendarEvent[],
      });
    }

    return days;
  }, [currentYear, currentMonthIndex, eventsList]);

  // Upcoming / Day's Events List (Right Column)
  const displayedUpcomingEvents = useMemo(() => {
    let list = eventsList;
    if (selectedDate) {
      list = list.filter((e) => {
        if (!e.date) return false;
        if (e.date === selectedDate || e.date.startsWith(selectedDate)) return true;
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return s === selectedDate;
        }
        return false;
      });
    }
    return list;
  }, [eventsList, selectedDate]);

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // Open Create Event Modal
  const openCreateModal = (defaultDate?: string) => {
    setFormData({
      title: '',
      type: selectedFilter !== 'all' ? (selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)) : 'Meeting',
      date: defaultDate || selectedDate || `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-15`,
      endDate: '',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      location: 'Main Office',
      isOnline: false,
      meetingLink: '',
      agenda: '',
      organizer: 'Sarah Joseph (HR VP)',
      attendees: 5,
      description: '',
      priority: 'Medium',
      department: 'Engineering',
      assigneeName: '',
      candidateName: '',
      interviewerName: '',
      jobPosition: '',
      roundName: 'Technical Architecture Round',
      interviewMode: 'Online',
      holidayType: 'Public',
      applicableScope: 'Company Wide',
      repeatsAnnually: false,
      dueTime: '11:59 PM',
      status: 'Scheduled',
    });
    setIsEditing(false);
    setShowEventModal(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    if (!formData.date.trim()) {
      toast.error('Please specify an event date');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<CalendarEvent> = {
        title: formData.title.trim(),
        date: formData.date.trim(),
        endDate: formData.endDate ? formData.endDate.trim() : undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        time: `${formData.startTime} - ${formData.endTime}`,
        type: formData.type,
        location: formData.isOnline ? (formData.meetingLink || 'Online Meeting') : formData.location,
        isOnline: formData.isOnline,
        meetingLink: formData.meetingLink,
        agenda: formData.agenda,
        attendees: Number(formData.attendees) || 1,
        organizer: formData.organizer,
        description: formData.description,
        priority: formData.priority as any,
        department: formData.department,
        assigneeName: formData.assigneeName,
        candidateName: formData.candidateName,
        interviewerName: formData.interviewerName,
        jobPosition: formData.jobPosition,
        roundName: formData.roundName,
        interviewMode: formData.interviewMode as any,
        holidayType: formData.holidayType as any,
        applicableScope: formData.applicableScope,
        repeatsAnnually: formData.repeatsAnnually,
        dueTime: formData.dueTime,
        status: formData.status as any,
      };

      if (isEditing && selectedEvent) {
        const updated = await calendarService.updateEvent(selectedEvent.id, payload);
        toast.success(`Event "${updated.title}" updated successfully!`);
        setSelectedEvent(updated);
      } else {
        const created = await calendarService.createEvent(payload);
        toast.success(`Event "${created.title}" scheduled successfully!`);
      }

      setShowEventModal(false);
      await fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  // Reschedule Event
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!rescheduleData.date) {
      toast.error('Please pick a new date');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await calendarService.rescheduleEvent(selectedEvent.id, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        time: `${rescheduleData.startTime} - ${rescheduleData.endTime}`,
        notes: rescheduleData.notes,
      });
      toast.success(`Event rescheduled to ${updated.date}!`);
      setShowRescheduleModal(false);
      setSelectedEvent(updated);
      await fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule event');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Completed / Status Change
  const handleQuickStatusChange = async (event: CalendarEvent, newStatus: string) => {
    try {
      await calendarService.updateEventStatus(event.id, newStatus);
      toast.success(`Event marked as ${newStatus}!`);
      await fetchEvents();
      if (selectedEvent && selectedEvent.id === event.id) {
        setSelectedEvent({ ...selectedEvent, status: newStatus as any });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update event status');
    }
  };

  // Delete Event with Confirmation
  const handleDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    try {
      await calendarService.deleteEvent(deleteConfirmEvent.id);
      toast.success(`Event "${deleteConfirmEvent.title}" removed from calendar.`);
      setDeleteConfirmEvent(null);
      if (selectedEvent?.id === deleteConfirmEvent.id) {
        setSelectedEvent(null);
      }
      await fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  // Open Event Details Modal
  const openEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Populate Edit Modal
  const openEditModal = (event: CalendarEvent) => {
    setFormData({
      title: event.title || '',
      type: event.type || 'Meeting',
      date: event.date || '',
      endDate: event.endDate || '',
      startTime: event.startTime || '10:00 AM',
      endTime: event.endTime || '11:00 AM',
      location: event.location || 'Main Office',
      isOnline: !!event.isOnline,
      meetingLink: event.meetingLink || '',
      agenda: event.agenda || '',
      organizer: event.organizer || 'Sarah Joseph (HR VP)',
      attendees: event.attendees || 1,
      description: event.description || '',
      priority: event.priority || 'Medium',
      department: event.department || 'Engineering',
      assigneeName: event.assigneeName || '',
      candidateName: event.candidateName || '',
      interviewerName: event.interviewerName || '',
      jobPosition: event.jobPosition || '',
      roundName: event.roundName || 'Technical Architecture Round',
      interviewMode: event.interviewMode || 'Online',
      holidayType: event.holidayType || 'Public',
      applicableScope: event.applicableScope || 'Company Wide',
      repeatsAnnually: !!event.repeatsAnnually,
      dueTime: event.dueTime || '11:59 PM',
      status: event.status || 'Scheduled',
    });
    setSelectedEvent(event);
    setIsEditing(true);
    setShowEventModal(true);
  };

  // Color helper for badges
  const getTypeColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'meeting') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (t === 'interview') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (t === 'holiday') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (t === 'deadline') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-teal-50 text-teal-800 border-teal-200';
  };

  const getDotColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'meeting') return 'bg-blue-500';
    if (t === 'interview') return 'bg-purple-500';
    if (t === 'holiday') return 'bg-emerald-500';
    if (t === 'deadline') return 'bg-rose-500';
    return 'bg-teal-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarIcon className="h-3.5 w-3.5 text-teal-300" />
            <span>Corporate Schedule & Operations</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Callender & Events Hub</h1>
          <p className="text-xs text-teal-100/80 mt-1 max-w-2xl leading-relaxed">
            Manage company-wide schedules, meetings, candidate recruitment interviews, statutory holidays, and departmental project deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openCreateModal()}
            className="px-5 py-2.5 bg-white text-[#004848] font-extrabold text-xs rounded-xl shadow-sm hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 text-[#004848]" />
            <span>Schedule New Event</span>
          </button>
        </div>
      </div>

      {/* 2. Filter, Search & Month Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm md:text-base font-extrabold text-slate-900 min-w-40 text-center select-none">
              {currentMonthLabel}
            </span>
            <button 
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="ml-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by title, location, candidate, or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#004848] text-slate-800 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-[#004848] shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-[#004848] shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 mr-1" />
            {[
              { id: 'all', label: 'All Events', count: eventsList.length },
              { id: 'meeting', label: 'Meetings', count: eventsList.filter(e => (e.type || '').toLowerCase() === 'meeting').length },
              { id: 'interview', label: 'Interviews', count: eventsList.filter(e => (e.type || '').toLowerCase() === 'interview').length },
              { id: 'holiday', label: 'Holidays', count: eventsList.filter(e => (e.type || '').toLowerCase() === 'holiday').length },
              { id: 'deadline', label: 'Deadlines', count: eventsList.filter(e => (e.type || '').toLowerCase() === 'deadline').length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  selectedFilter === f.id
                    ? 'bg-[#004848] text-white font-extrabold border-transparent shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#004848] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Grid View or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Monthly Calendar Grid */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#004848]" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Monthly Schedule Overview</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Click any date cell to filter agenda or schedule an event
              </span>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
              <span className="text-rose-600">Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-teal-700">Sat</span>
            </div>

            {/* Days grid */}
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5 text-xs">
                {calendarGridDays.map((cell, idx) => {
                  const isSelected = selectedDate === cell.dateKey;
                  const hasEvents = cell.events.length > 0;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = cell.dateKey === todayStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(isSelected ? null : cell.dateKey)}
                      className={`min-h-24 p-2 border rounded-xl flex flex-col justify-between transition-all cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60'
                          : isSelected
                            ? 'bg-teal-50 border-[#004848] shadow-sm ring-2 ring-[#004848]/20'
                            : isToday
                              ? 'bg-amber-50/50 border-amber-300'
                              : hasEvents
                                ? 'bg-slate-50/70 border-slate-200 hover:border-[#004848]'
                                : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-extrabold text-xs ${
                          isSelected
                            ? 'text-[#004848]'
                            : isToday
                              ? 'text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full text-[10px]'
                              : cell.isCurrentMonth
                                ? 'text-slate-700'
                                : 'text-slate-300'
                        }`}>
                          {cell.dayNumber}
                        </span>
                        {hasEvents && (
                          <span className="text-[9px] font-extrabold bg-[#004848] text-white px-1.5 py-0.2 rounded-full">
                            {cell.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {cell.events.slice(0, 2).map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEventDetails(evt);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate flex items-center gap-1 border hover:opacity-90 ${getTypeColor(evt.type)}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(evt.type)}`}></span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <span className="text-[8px] font-extrabold text-slate-500 block truncate">
                            +{cell.events.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Col: Agenda & Upcoming Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">
                    {selectedDate ? `Events for ${selectedDate}` : `Upcoming Events (${displayedUpcomingEvents.length})`}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {selectedDate ? 'Filtered by selected calendar day' : currentMonthLabel}
                  </span>
                </div>
                {selectedDate ? (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 cursor-pointer"
                  >
                    View All
                  </button>
                ) : (
                  <span className="text-xs font-bold text-[#004848] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {displayedUpcomingEvents.length} Active
                  </span>
                )}
              </div>

              {selectedDate && (
                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="w-full py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#004848] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Schedule Event on {selectedDate}</span>
                </button>
              )}

              {/* Events scrollable list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {displayedUpcomingEvents.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                    <CalendarCheck className="h-6 w-6 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">No events scheduled</div>
                    <p className="text-[11px] text-slate-500 m-0">
                      {selectedDate 
                        ? `No scheduled items for ${selectedDate}. Click above to add one.` 
                        : 'No events matching current month and category filters.'}
                    </p>
                  </div>
                ) : (
                  displayedUpcomingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => openEventDetails(evt)}
                      className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 hover:bg-slate-50 space-y-2.5 transition-all cursor-pointer group hover:border-[#004848]/60 shadow-2xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-slate-900 m-0 leading-tight group-hover:text-[#004848] transition-colors">
                          {evt.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${getTypeColor(evt.type)}`}>
                          {evt.type}
                        </span>
                      </div>

                      {evt.agenda && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 m-0 italic font-medium">
                          "{evt.agenda}"
                        </p>
                      )}

                      <div className="space-y-1 text-[11px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{evt.date} • {evt.time || 'All Day'}</span>
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1.5">
                            {evt.isOnline ? <Video className="h-3 w-3 text-blue-500 shrink-0" /> : <MapPin className="h-3 w-3 text-slate-400 shrink-0" />}
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}
                        {evt.candidateName && (
                          <div className="text-[10px] text-purple-700 font-bold">
                            Candidate: {evt.candidateName} ({evt.jobPosition || 'Role'})
                          </div>
                        )}
                        {evt.assigneeName && (
                          <div className="text-[10px] text-slate-600 font-bold">
                            Assignee: {evt.assigneeName} {evt.priority ? `• Priority: ${evt.priority}` : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 text-[10px]">
                        <span className={`font-bold ${
                          evt.status === 'Completed' ? 'text-emerald-700' :
                          evt.status === 'Cancelled' ? 'text-rose-700' :
                          evt.status === 'Rescheduled' ? 'text-amber-700' :
                          'text-slate-600'
                        }`}>
                          ● {evt.status || 'Scheduled'}
                        </span>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openEditModal(evt)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEvent(evt)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. Table / List View Mode */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-150 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 m-0">
              Corporate Schedule List ({eventsList.length} Total Events)
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Chronologically sorted for {currentMonthLabel}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Event Title & Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Location / Link</th>
                  <th className="px-4 py-3">Organizer / Staff</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {eventsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-semibold">
                      No events matching filters found.
                    </td>
                  </tr>
                ) : (
                  eventsList.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{evt.title}</div>
                        {evt.description && (
                          <div className="text-[10px] text-slate-500 line-clamp-1">{evt.description}</div>
                        )}
                        {evt.candidateName && (
                          <div className="text-[10px] text-purple-700 font-bold">Candidate: {evt.candidateName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getTypeColor(evt.type)}`}>
                          {evt.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{evt.date}</div>
                        <div className="text-[10px] text-slate-500">{evt.time || 'All Day'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {evt.isOnline ? <Video className="h-3 w-3 text-blue-500 shrink-0" /> : <MapPin className="h-3 w-3 text-slate-400 shrink-0" />}
                          <span className="truncate max-w-[140px]">{evt.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>{evt.organizer || evt.interviewerName || evt.assigneeName || '—'}</div>
                        <div className="text-[10px] text-slate-400">{evt.attendees || 1} Attendees</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          evt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          evt.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          evt.status === 'Rescheduled' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {evt.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEventDetails(evt)}
                            className="px-2.5 py-1 text-xs font-bold text-[#004848] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(evt)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEvent(evt)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal: Schedule New Event / Edit Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {isEditing ? `Edit Event: ${selectedEvent?.title}` : 'Schedule New Corporate Event'}
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Fill in event particulars to synchronize with team agendas and notifications.
                </p>
              </div>
              <button 
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs font-semibold text-slate-700">
              {/* Event Type / Category Selector */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Event Category</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['Meeting', 'Interview', 'Holiday', 'Deadline', 'General'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: cat }))}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                        formData.type === cat
                          ? 'bg-[#004848] text-white border-[#004848] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Title */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">
                  {formData.type === 'Holiday' ? 'Holiday Name' : formData.type === 'Deadline' ? 'Deadline Title' : 'Event Title'} *
                </label>
                <input 
                  type="text" 
                  placeholder={
                    formData.type === 'Meeting' ? 'e.g. Q4 Townhall & Product Strategy Review' :
                    formData.type === 'Interview' ? 'e.g. Technical System Design Round' :
                    formData.type === 'Holiday' ? 'e.g. Independence Day National Holiday' :
                    formData.type === 'Deadline' ? 'e.g. Q3 Performance Review Submissions' :
                    'e.g. Corporate Annual Celebration'
                  }
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-[#004848]"
                  required
                />
              </div>

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Date *</label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Start Time</label>
                  <input 
                    type="text"
                    placeholder="10:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">End Time</label>
                  <input 
                    type="text"
                    placeholder="11:30 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              {/* Category-Specific Form Fields */}
              {formData.type === 'Meeting' && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200/60">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-950">
                      <input 
                        type="checkbox"
                        checked={formData.isOnline}
                        onChange={(e) => setFormData(prev => ({ ...prev, isOnline: e.target.checked }))}
                        className="rounded text-[#004848]"
                      />
                      <span>Online / Virtual Meeting</span>
                    </label>
                  </div>
                  {formData.isOnline ? (
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Meeting Link (Zoom / Meet)</label>
                      <input 
                        type="url"
                        placeholder="https://zoom.us/j/123456789"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Physical Location / Room</label>
                      <input 
                        type="text"
                        placeholder="e.g. Conference Room Alpha (HQ Floor 2)"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Meeting Agenda</label>
                    <textarea 
                      rows={2}
                      placeholder="Outline meeting talking points and desired outcomes..."
                      value={formData.agenda}
                      onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                    />
                  </div>
                </div>
              )}

              {formData.type === 'Interview' && (
                <div className="space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Candidate Name *</label>
                      <input 
                        type="text"
                        placeholder="Candidate Full Name"
                        value={formData.candidateName}
                        onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Job Position</label>
                      <input 
                        type="text"
                        placeholder="e.g. Senior Backend Engineer"
                        value={formData.jobPosition}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobPosition: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Interviewer / Panel</label>
                      <input 
                        type="text"
                        placeholder="e.g. Sarah Joseph, David Chen"
                        value={formData.interviewerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, interviewerName: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#004848]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Interview Mode</label>
                      <select 
                        value={formData.interviewMode}
                        onChange={(e) => setFormData(prev => ({ ...prev, interviewMode: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option>Online</option>
                        <option>In-Person</option>
                        <option>Telephonic</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'Holiday' && (
                <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Holiday Type</label>
                      <select 
                        value={formData.holidayType}
                        onChange={(e) => setFormData(prev => ({ ...prev, holidayType: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option>Public</option>
                        <option>Company</option>
                        <option>Regional</option>
                        <option>Optional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Applicable Scope</label>
                      <input 
                        type="text"
                        placeholder="e.g. Company Wide, APAC"
                        value={formData.applicableScope}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicableScope: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-950">
                    <input 
                      type="checkbox"
                      checked={formData.repeatsAnnually}
                      onChange={(e) => setFormData(prev => ({ ...prev, repeatsAnnually: e.target.checked }))}
                      className="rounded text-[#004848]"
                    />
                    <span>Repeats Annually on this Calendar Date</span>
                  </label>
                </div>
              )}

              {formData.type === 'Deadline' && (
                <div className="space-y-3 p-3 bg-rose-50/50 rounded-xl border border-rose-200/60">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Priority Level</label>
                      <select 
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option>Urgent</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-800">Assigned Department</label>
                      <input 
                        type="text"
                        placeholder="e.g. Engineering, HR"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-800">Assigned Staff / Owner</label>
                    <input 
                      type="text"
                      placeholder="e.g. Sarah Joseph, Team Leads"
                      value={formData.assigneeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, assigneeName: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Attendees & Organizer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Attendees Count</label>
                  <input 
                    type="number" 
                    min={1}
                    value={formData.attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendees: Number(e.target.value) || 1 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Organizer Name</label>
                  <input 
                    type="text" 
                    value={formData.organizer}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 font-bold text-slate-800">Description & Additional Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Additional context, reference documents, or special instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl text-xs hover:bg-[#003333] transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Schedule Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Event Details Inspection */}
      {selectedEvent && !showEventModal && !showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getTypeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Status: <strong className="text-slate-800">{selectedEvent.status || 'Scheduled'}</strong>
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 m-0 leading-tight">
                  {selectedEvent.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Scheduled Date</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.date}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Time Slot</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">{selectedEvent.time || 'All Day'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Location: </span>
                    <span>{selectedEvent.location || 'Main Office'}</span>
                  </div>
                </div>

                {selectedEvent.meetingLink && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-500 shrink-0" />
                    <a 
                      href={selectedEvent.meetingLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Join Virtual Meeting</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Attendees: </span>
                    <span>{selectedEvent.attendees || 1} Registered</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800">Organizer: </span>
                    <span>{selectedEvent.organizer || 'HR Department'}</span>
                  </div>
                </div>
              </div>

              {selectedEvent.agenda && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase">Agenda Outline</span>
                  <p className="text-xs text-blue-950 m-0 leading-relaxed font-medium">{selectedEvent.agenda}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                  <p className="text-xs text-slate-600 m-0 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.notes && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
                  <span className="font-bold">Log Notes: </span>{selectedEvent.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-150">
              <div className="flex items-center gap-2">
                {selectedEvent.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange(selectedEvent, 'Completed')}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Complete</span>
                  </button>
                )}
                {selectedEvent.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange(selectedEvent, 'Cancelled')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleData({
                      date: selectedEvent.date,
                      startTime: selectedEvent.startTime || '10:00 AM',
                      endTime: selectedEvent.endTime || '11:00 AM',
                      notes: '',
                    });
                    setShowRescheduleModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reschedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(selectedEvent)}
                  className="px-3 py-1.5 bg-[#004848] text-white hover:bg-[#003333] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Reschedule Event */}
      {showRescheduleModal && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Reschedule Event</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">{selectedEvent.title}</p>
              </div>
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">New Scheduled Date *</label>
                <input 
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Start Time</label>
                  <input 
                    type="text"
                    value={rescheduleData.startTime}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">End Time</label>
                  <input 
                    type="text"
                    value={rescheduleData.endTime}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Reason for Rescheduling / Notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Moved due to client availability conflict..."
                  value={rescheduleData.notes}
                  onChange={(e) => setRescheduleData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-[#004848]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl text-xs hover:bg-[#003333] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: Delete Confirmation Dialog */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up text-center">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Confirm Delete Event</h3>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Are you sure you want to remove <strong className="text-slate-800">"{deleteConfirmEvent.title}"</strong> from the corporate schedule?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEvent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallenderPage;