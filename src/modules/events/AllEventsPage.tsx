import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Plus, Edit2, Share2, MoreVertical, Trash2, Calendar, Clock, MapPin, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ICompanyEvent, IEventTask } from '../../types/events';

export const AllEventsPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [events, setEvents] = useState<(ICompanyEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTaskTab, setActiveTaskTab] = useState<'All' | 'Today' | 'Upcoming' | 'Completed'>('Upcoming');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Add Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Sarah Jo');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getEvents({
        status: statusFilter !== 'All' ? statusFilter : undefined,
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
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDeleteEvent = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete event "${title}"?`)) {
      try {
        await eventService.deleteEvent(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
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
      toast.success(`Event status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event status');
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

    const newTask: IEventTask = {
      id: `TSK-${Date.now()}`,
      name: taskName.trim(),
      due: taskDue.trim(),
      assignee: taskAssignee,
      status: 'In Progress',
      progress: 0,
    };

    const updatedTasks = [...(targetEvent.tasks || []), newTask];
    try {
      const updated = await eventService.updateEvent(targetEvent.id, {
        tasks: updatedTasks,
        progress: `${updatedTasks.filter((t) => t.status === 'Completed').length}/${updatedTasks.length} Task`,
      });
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setShowTaskModal(false);
      setTaskName('');
      setTaskDue('');
      toast.success(`Task added to ${targetEvent.title}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add task');
    }
  };

  // Extract flat tasks across events for overview
  const allTasks: (IEventTask & { eventTitle: string; eventId: string })[] = [];
  events.forEach((ev) => {
    (ev.tasks || []).forEach((t) => {
      allTasks.push({ ...t, eventTitle: ev.title, eventId: ev.id });
    });
  });

  const filteredTasks = allTasks.filter((t) => {
    if (activeTaskTab === 'Completed') return t.status === 'Completed';
    if (activeTaskTab === 'Today') return t.due.toLowerCase().includes('today') || t.due.toLowerCase().includes('jul 20');
    if (activeTaskTab === 'Upcoming') return t.status === 'In Progress' || t.status === 'Pending';
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in pb-12">
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

        {/* Filter Bar */}
        <div className="flex justify-between items-center relative">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#0473b8] bg-white rounded-lg text-xs font-semibold text-[#0473b8] hover:bg-blue-50/50 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#0473b8]" />
              <span>Filter: {statusFilter}</span>
            </button>
            {showFilterMenu && (
              <div className="absolute left-0 top-11 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-40 animate-scale-in">
                {['All', 'In Progress', 'Up coming', 'Planing', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setShowFilterMenu(false);
                    }}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === st ? 'bg-blue-50 text-[#0473b8]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-slate-500">
            {events.length} Event{events.length !== 1 ? 's' : ''} Found
          </span>
        </div>

        {/* 3 Columns Cards Grid */}
        {events.length === 0 && !isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-medium">
            No events found. Click "Add Event" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((e) => (
              <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative flex flex-col justify-between">
                <div>
                  {/* Header Status */}
                  <div className="flex justify-between items-start mb-2">
                    <select
                      value={e.status}
                      onChange={(ev) => handleUpdateStatus(e.id, ev.target.value as any)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer ${
                        e.status === 'In Progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        e.status === 'Up coming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        e.status === 'Completed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="Planing">Planing</option>
                      <option value="Up coming">Up coming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button 
                      onClick={() => handleDeleteEvent(e.id, e.title)}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 m-0 leading-normal">{e.title}</h3>
                    
                    <div className="space-y-1.5 text-[11px] font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>{e.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>{e.startTime} {e.endTime ? `- ${e.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="truncate">{e.venue || (e.locationType === 'online' ? 'Virtual Meeting' : 'Main Office')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Attendees */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                        <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                        {e.attendeeCount || 12}+
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{e.department}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{e.progress || `${(e.tasks || []).length} Tasks`}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: e.status === 'In Progress' ? '70%' : e.status === 'Completed' ? '100%' : '35%' }}
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
                      onClick={() => toast.info(`Sharing event link: ${e.title}`)}
                      className="hover:text-blue-600 transition cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
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
          <div className="grid grid-cols-5 px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Task Name</span>
            <span>Event / Due Date</span>
            <span>Assignee</span>
            <span>Status</span>
            <span className="text-right">Progress</span>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-center text-xs text-slate-500 font-medium">
                No tasks found for {activeTaskTab} filter.
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div 
                  key={t.name + t.due}
                  className="grid grid-cols-5 items-center bg-white border border-slate-200 rounded-lg py-3 px-4 shadow-xs text-xs font-bold text-slate-800 hover:border-blue-300 transition-all"
                >
                  <span className="truncate pr-2">{t.name}</span>
                  <div>
                    <span className="text-slate-700 font-semibold block">{t.due}</span>
                    <span className="text-[10px] text-slate-400 truncate block font-normal">{t.eventTitle}</span>
                  </div>
                  <span className="text-slate-500 font-semibold">{t.assignee}</span>
                  
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      t.status === 'In Progress' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      t.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      t.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Task progress bar */}
                  <div className="flex justify-end items-center w-full">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${
                          t.status === 'Completed' ? 'bg-blue-600 w-[100%]' :
                          t.status === 'In Progress' ? 'bg-blue-600 w-[60%]' :
                          t.status === 'Pending' ? 'bg-amber-500 w-[35%]' :
                          'bg-slate-300 w-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
