import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Share2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  X,
  CheckCircle2,
  Circle,
  Search,
  Eye,
  Building,
  User,
  Users,
  DollarSign,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ICompanyEvent, IEventTask } from '../../types/events';

export const AllEventsPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<(ICompanyEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Active Task Tab
  const [activeTaskTab, setActiveTaskTab] = useState<'All' | 'Today' | 'Upcoming' | 'Completed'>('Upcoming');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Sarah Jo');

  // Details Modal
  const [detailsEvent, setDetailsEvent] = useState<(ICompanyEvent & { id: string }) | null>(null);

  // Edit Event Modal
  const [editEvent, setEditEvent] = useState<(ICompanyEvent & { id: string }) | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ICompanyEvent>>({});

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getEvents({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        eventType: typeFilter !== 'All' ? typeFilter : undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setEvents(res.items);
      if (res.items.length > 0 && !selectedEventId) {
        setSelectedEventId(res.items[0].id);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, departmentFilter, searchQuery, toast, selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete event "${title}"?`)) {
      try {
        await eventService.deleteEvent(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
        if (detailsEvent?.id === id) setDetailsEvent(null);
        toast.success(`Event "${title}" deleted successfully`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete event');
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ICompanyEvent['status']) => {
    try {
      const updated = await eventService.updateEvent(id, { status: newStatus });
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (detailsEvent?.id === id) {
        setDetailsEvent(updated);
      }
      toast.success(`Event status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event status');
    }
  };

  const handleOpenEdit = (event: ICompanyEvent & { id: string }) => {
    setEditEvent(event);
    setEditFormData({
      title: event.title,
      eventType: event.eventType,
      department: event.department,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      locationType: event.locationType,
      venue: event.venue,
      budget: event.budget,
      attendeeCount: event.attendeeCount,
      status: event.status,
      description: event.description,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent) return;

    try {
      const updated = await eventService.updateEvent(editEvent.id, editFormData);
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      if (detailsEvent?.id === updated.id) {
        setDetailsEvent(updated);
      }
      setEditEvent(null);
      toast.success('Event updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !taskDue.trim()) {
      toast.error('Please enter task name and due date');
      return;
    }
    const targetEvent = events.find((ev) => ev.id === selectedEventId) || events[0];
    if (!targetEvent) return;

    const newTask: Partial<IEventTask> = {
      id: `TSK-${Date.now()}`,
      name: taskName.trim(),
      due: taskDue.trim(),
      assignee: taskAssignee,
      status: 'In Progress',
      progress: 0,
    };

    try {
      const updated = await eventService.addTask(targetEvent.id, newTask);
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      if (detailsEvent?.id === updated.id) {
        setDetailsEvent(updated);
      }
      setShowTaskModal(false);
      setTaskName('');
      setTaskDue('');
      toast.success(`Task added to ${targetEvent.title}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add task');
    }
  };

  const handleToggleTaskStatus = async (eventId: string, taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      const updated = await eventService.updateTask(eventId, taskId, {
        status: nextStatus as any,
        progress: nextStatus === 'Completed' ? 100 : 50,
      });
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      if (detailsEvent?.id === updated.id) {
        setDetailsEvent(updated);
      }
      toast.success(`Task marked as ${nextStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (eventId: string, taskId: string, taskTitle: string) => {
    if (confirm(`Delete task "${taskTitle}"?`)) {
      try {
        const updated = await eventService.deleteTask(eventId, taskId);
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
        if (detailsEvent?.id === updated.id) {
          setDetailsEvent(updated);
        }
        toast.success(`Task "${taskTitle}" deleted`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete task');
      }
    }
  };

  // Flattened tasks across events for overview
  const allTasks: (IEventTask & { eventTitle: string; eventId: string })[] = useMemo(() => {
    const list: (IEventTask & { eventTitle: string; eventId: string })[] = [];
    events.forEach((ev) => {
      (ev.tasks || []).forEach((t) => {
        list.push({ ...t, eventTitle: ev.title, eventId: ev.id });
      });
    });
    return list;
  }, [events]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (activeTaskTab === 'Completed') return t.status === 'Completed';
      if (activeTaskTab === 'Today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        return t.due.toLowerCase().includes('today') || t.due.includes(todayStr);
      }
      if (activeTaskTab === 'Upcoming') return t.status === 'In Progress' || t.status === 'Pending';
      return true;
    });
  }, [allTasks, activeTaskTab]);

  return (
    <div className="space-y-8 max-w-6xl animate-fade-in pb-12">
      {/* 1. All Events Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 select-none">
          <div>
            <h1 className="text-xl font-bold text-slate-900 m-0">All Events</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage corporate events, scheduling, attendees, and operational checklists.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEvents}
              title="Refresh Events"
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/events/add')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Event</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0473b8] font-medium text-slate-700"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
              >
                <option value="All">All Statuses</option>
                <option value="Planing">Planning</option>
                <option value="Up coming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
              >
                <option value="All">All Types</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Meeting">Meeting</option>
                <option value="Social">Social</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Training">Training</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0473b8]"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="All Company">All Company</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500 pl-2 border-l border-slate-200">
              {events.length} Event{events.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 3 Columns Cards Grid */}
        {events.length === 0 && !isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium">
            No events found matching current criteria. Click "Add Event" to create one or adjust filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => {
              const totalTasks = e.tasks?.length || 0;
              const completedTasks = e.tasks?.filter((t) => t.status === 'Completed').length || 0;
              const progressPercent = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : e.status === 'Completed' ? 100 : e.status === 'In Progress' ? 50 : 20;

              return (
                <div
                  key={e.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:shadow-md transition-all relative flex flex-col justify-between"
                >
                  <div>
                    {/* Header Status & Action Buttons */}
                    <div className="flex justify-between items-start mb-2">
                      <select
                        value={e.status}
                        onChange={(ev) => handleUpdateStatus(e.id, ev.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                          e.status === 'In Progress'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : e.status === 'Up coming' || e.status === 'Upcoming'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : e.status === 'Completed'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : e.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="Planing">Planning</option>
                        <option value="Up coming">Upcoming</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailsEvent(e)}
                          className="text-slate-400 hover:text-[#0473b8] transition p-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="text-slate-400 hover:text-emerald-600 transition p-1 cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id, e.title)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-3 cursor-pointer" onClick={() => setDetailsEvent(e)}>
                      <h3 className="text-xs font-bold text-slate-900 m-0 leading-normal hover:text-[#0473b8] transition-colors">
                        {e.title}
                      </h3>

                      <div className="space-y-1.5 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span>{e.startDate} {e.endDate && e.endDate !== e.startDate ? `to ${e.endDate}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          <span>{e.startTime} {e.endTime ? `- ${e.endTime}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{e.venue || (e.locationType === 'online' ? 'Virtual Meeting' : 'Main Office')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Attendees & Department */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                          <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                          {e.attendeeCount || 10}+
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">{e.department}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Progress</span>
                        <span>{totalTasks > 0 ? `${completedTasks}/${totalTasks} Tasks (${progressPercent}%)` : (e.progress || `${progressPercent}%`)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer action icons */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 text-slate-400">
                      <button
                        onClick={() => {
                          setSelectedEventId(e.id);
                          setShowTaskModal(true);
                        }}
                        className="hover:text-blue-600 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Task</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText?.(window.location.href);
                          toast.info(`Sharing event link: ${e.title}`);
                        }}
                        className="hover:text-blue-600 transition cursor-pointer"
                        title="Share Event"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Tasks Overview Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900 m-0">Events Task Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Operational tasks and action items across scheduled events</p>
          </div>

          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Tasks</span>
          </button>
        </div>

        {/* Tab filters row */}
        <div className="flex items-center gap-2">
          {(['All', 'Today', 'Upcoming', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTaskTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                activeTaskTab === tab
                  ? 'bg-blue-50 text-[#0473b8] border-blue-200 font-extrabold shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Card Row list Table */}
        <div className="space-y-3">
          {/* Table Headers */}
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span className="col-span-4">Task Name</span>
            <span className="col-span-3">Event / Due Date</span>
            <span className="col-span-2">Assignee</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-center text-xs text-slate-500 font-medium">
                No tasks found for {activeTaskTab} filter.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isDone = t.status === 'Completed';
                return (
                  <div
                    key={(t.id || t.name) + t.due}
                    className="grid grid-cols-12 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-xs text-xs font-bold text-slate-800 hover:border-blue-300 transition-all"
                  >
                    <div className="col-span-4 flex items-center gap-2.5 pr-2">
                      <button
                        onClick={() => handleToggleTaskStatus(t.eventId, t.id || t.name, t.status)}
                        className="text-slate-400 hover:text-blue-600 transition cursor-pointer flex-shrink-0"
                        title={isDone ? 'Mark In Progress' : 'Mark Completed'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                        )}
                      </button>
                      <span className={`truncate ${isDone ? 'line-through text-slate-400 font-normal' : ''}`}>
                        {t.name}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <span className="text-slate-700 font-semibold block">{t.due}</span>
                      <span className="text-[10px] text-slate-400 truncate block font-normal">{t.eventTitle}</span>
                    </div>

                    <span className="col-span-2 text-slate-500 font-semibold truncate">{t.assignee}</span>

                    <div className="col-span-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block ${
                          t.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : t.status === 'In Progress'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => handleDeleteTask(t.eventId, t.id || t.name, t.name)}
                        className="text-slate-300 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Event Details */}
      {detailsEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0473b8] bg-blue-50 px-2 py-0.5 rounded">
                  {detailsEvent.eventType}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 m-0">{detailsEvent.title}</h3>
              </div>
              <button
                onClick={() => setDetailsEvent(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Date & Time</span>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span>{detailsEvent.startDate} {detailsEvent.endDate && detailsEvent.endDate !== detailsEvent.startDate ? `- ${detailsEvent.endDate}` : ''}</span>
                </div>
                <div className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>{detailsEvent.startTime} {detailsEvent.endTime ? `- ${detailsEvent.endTime}` : ''}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Venue & Mode</span>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="truncate">{detailsEvent.venue || 'TBD'}</span>
                </div>
                <div className="text-slate-500 capitalize">
                  Mode: <span className="font-semibold text-slate-700">{detailsEvent.locationType}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Department & Capacity</span>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{detailsEvent.department}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{detailsEvent.attendeeCount || 0} Registered</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">Budget & Status</span>
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>${Number(detailsEvent.budget || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                    Status: {detailsEvent.status}
                  </span>
                </div>
              </div>
            </div>

            {detailsEvent.description && (
              <div className="space-y-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 block">Description</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-150 leading-relaxed m-0 font-medium">
                  {detailsEvent.description}
                </p>
              </div>
            )}

            {/* Tasks checklist inside modal */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Event Operational Tasks</span>
                <button
                  onClick={() => {
                    setSelectedEventId(detailsEvent.id);
                    setShowTaskModal(true);
                  }}
                  className="text-xs font-bold text-[#0473b8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Task
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(detailsEvent.tasks || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No tasks created for this event yet.</p>
                ) : (
                  detailsEvent.tasks!.map((tsk) => (
                    <div
                      key={tsk.id || tsk.name}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(detailsEvent.id, tsk.id || tsk.name, tsk.status)}
                          className="cursor-pointer"
                        >
                          {tsk.status === 'Completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <span className={`font-semibold ${tsk.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {tsk.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{tsk.due} ({tsk.assignee})</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setDetailsEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const ev = detailsEvent;
                  setDetailsEvent(null);
                  handleOpenEdit(ev);
                }}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Event */}
      {editEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Event</h3>
              <button
                onClick={() => setEditEvent(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Event Type</label>
                  <select
                    value={editFormData.eventType || 'Conference'}
                    onChange={(e) => setEditFormData({ ...editFormData, eventType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Social">Social</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Department</label>
                  <input
                    type="text"
                    value={editFormData.department || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.startDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">End Date</label>
                  <input
                    type="date"
                    value={editFormData.endDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM"
                    value={editFormData.startTime || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:00 PM"
                    value={editFormData.endTime || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Venue / Location</label>
                  <input
                    type="text"
                    value={editFormData.venue || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.budget?.allocated ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditFormData({
                        ...editFormData,
                        budget: {
                          allocated: val,
                          spent: editFormData.budget?.spent ?? 0,
                          status: editFormData.budget?.status ?? 'Approved',
                        },
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Status</label>
                <select
                  value={editFormData.status || 'Planing'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                >
                  <option value="Planing">Planning</option>
                  <option value="Up coming">Upcoming</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setEditEvent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Add Task to Event</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Target Event *</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.startDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Task Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm catering & dietary requirements"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Due Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. July 24, 2026"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Assignee</label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#0473b8]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEventsPage;
