import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  RefreshCw,
  X,
  Users,
  Building,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ICompanyEvent } from '../../types/events';

export const EventsCalendarPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [activeSegment, setActiveSegment] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<(ICompanyEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<ICompanyEvent[] | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<(ICompanyEvent & { id: string }) | null>(null);

  // Filter checkbox states
  const [trainingToggled, setTrainingToggled] = useState(true);
  const [meetingsToggled, setMeetingsToggled] = useState(true);
  const [holidaysToggled, setHolidaysToggled] = useState(true);
  const [interviewsToggled, setInterviewsToggled] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getEvents();
      setEvents(res.items);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Month navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (activeSegment === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (activeSegment === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (activeSegment === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (activeSegment === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    toast.info("Centered on Today's date");
  };

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Check if an event passes the category checkbox filters
  const passesCategoryFilter = useCallback(
    (ev: ICompanyEvent) => {
      const type = (ev.eventType || '').toLowerCase();
      if (type.includes('train')) return trainingToggled;
      if (type.includes('meet')) return meetingsToggled;
      if (type.includes('social') || type.includes('holiday')) return holidaysToggled;
      if (type.includes('town') || type.includes('hack') || type.includes('conf') || type.includes('work')) {
        return interviewsToggled;
      }
      return true;
    },
    [trainingToggled, meetingsToggled, holidaysToggled, interviewsToggled]
  );

  // Generate dynamic calendar matrix for current month
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().slice(0, 10);
    const cells: {
      day: number;
      current: boolean;
      dateStr: string;
      isToday: boolean;
    }[] = [];

    // Prev month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const prevDateStr = prevDate.toISOString().slice(0, 10);
      cells.push({
        day: d,
        current: false,
        dateStr: prevDateStr,
        isToday: prevDateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const currDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        current: true,
        dateStr: currDateStr,
        isToday: currDateStr === todayStr,
      });
    }

    // Next month leading days to complete full weeks (up to 35 or 42 cells)
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const nextDateStr = nextDate.toISOString().slice(0, 10);
      cells.push({
        day: d,
        current: false,
        dateStr: nextDateStr,
        isToday: nextDateStr === todayStr,
      });
    }

    return cells;
  }, [currentDate]);

  // Match events to a date string
  const getEventsForDate = useCallback(
    (dateStr: string) => {
      return events.filter((ev) => {
        if (!passesCategoryFilter(ev)) return false;
        // Exact match
        if (ev.startDate === dateStr) return true;
        // Range match
        if (ev.startDate && ev.endDate && dateStr >= ev.startDate && dateStr <= ev.endDate) {
          return true;
        }
        return false;
      });
    },
    [events, passesCategoryFilter]
  );

  const handleCellClick = (cell: (typeof calendarCells)[0]) => {
    const dayEvts = getEventsForDate(cell.dateStr);
    if (dayEvts.length > 0) {
      setSelectedDayEvents(dayEvts);
    } else {
      toast.info(`No events scheduled on ${cell.dateStr}`);
    }
  };

  // Filtered upcoming schedule
  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => passesCategoryFilter(e))
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [events, passesCategoryFilter]);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in pb-12">
      {/* Calendar top controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Left Today & Arrows navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToday}
            className="px-4 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition shadow-2xs"
          >
            Today
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer transition"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold text-slate-800 min-w-[130px] text-center">
              {monthYearLabel}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer transition"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Month/Week/Day tabs and Add button */}
        <div className="flex items-center gap-4 select-none">
          <div className="flex bg-[#e2e4e7] p-1 rounded-lg text-xs font-bold">
            {(['Month', 'Week', 'Day'] as const).map((segment) => (
              <button
                key={segment}
                type="button"
                onClick={() => setActiveSegment(segment.toLowerCase() as 'month' | 'week' | 'day')}
                className={`px-4 py-1 rounded cursor-pointer transition-all ${
                  activeSegment === segment.toLowerCase()
                    ? 'bg-white text-slate-900 font-extrabold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {segment}
              </button>
            ))}
          </div>

          <button
            onClick={fetchEvents}
            title="Refresh Calendar"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/events/add')}
            className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Grid columns: Calendar left, Sidebar details right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Days grid (8/12 grid span) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Days labels */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 py-3 text-center text-xs font-bold text-slate-400">
            <span className="text-rose-500">Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span className="text-blue-500">Sa</span>
          </div>

          {/* Dates Grid (7 columns × 5 or 6 rows) */}
          <div className="grid grid-cols-7 text-xs font-bold text-slate-700 min-h-[480px]">
            {calendarCells.map((cell, idx) => {
              const cellEvents = getEventsForDate(cell.dateStr);
              const hasEvents = cellEvents.length > 0;
              return (
                <div
                  key={`cell-${cell.dateStr}-${idx}`}
                  onClick={() => handleCellClick(cell)}
                  className={`border-b border-r border-slate-100 p-2.5 flex flex-col justify-between h-24 relative hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    !cell.current ? 'text-slate-300 bg-slate-50/30' : 'text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    {cell.isToday ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0473b8] text-white font-extrabold text-[11px] shadow-xs">
                        {cell.day}
                      </span>
                    ) : (
                      <span className="text-xs">{cell.day}</span>
                    )}
                  </div>

                  {/* Event Marker items */}
                  <div className="mt-auto space-y-1 overflow-hidden">
                    {hasEvents &&
                      cellEvents.slice(0, 2).map((ev) => {
                        const isTraining = (ev.eventType || '').toLowerCase().includes('train');
                        const isMeeting = (ev.eventType || '').toLowerCase().includes('meet');
                        const isSocial = (ev.eventType || '').toLowerCase().includes('social') || (ev.eventType || '').toLowerCase().includes('holiday');

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventModal(ev);
                            }}
                            className={`truncate text-[9px] px-1.5 py-0.5 rounded font-bold border transition ${
                              isTraining
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : isMeeting
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : isSocial
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={`${ev.title} (${ev.startTime || ''})`}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                    {cellEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block">
                        +{cellEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Event Types & Upcoming Schedule panels (4/12 span) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panel 1: Event Types Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Event Types Filter</span>
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Event Checkboxes */}
            <div className="space-y-3 text-xs font-bold text-slate-700 pl-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainingToggled}
                  onChange={() => setTrainingToggled(!trainingToggled)}
                  className="rounded text-blue-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
                  <span>Training Sessions</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={meetingsToggled}
                  onChange={() => setMeetingsToggled(!meetingsToggled)}
                  className="rounded text-purple-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span>
                  <span>Team Meetings</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={holidaysToggled}
                  onChange={() => setHolidaysToggled(!holidaysToggled)}
                  className="rounded text-rose-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                  <span>Holidays & Socials</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interviewsToggled}
                  onChange={() => setInterviewsToggled(!interviewsToggled)}
                  className="rounded text-emerald-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                  <span>Town Halls & Hackathons</span>
                </span>
              </label>
            </div>
          </div>

          {/* Panel 2: Upcoming Schedule from MongoDB */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Upcoming Schedule ({upcomingEvents.length})
            </span>

            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No matching events scheduled.</p>
              ) : (
                upcomingEvents.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventModal(ev)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 hover:bg-white hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[170px]">{ev.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                        <span>{ev.startDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Day Events Inspector */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Scheduled Events ({selectedDayEvents.length})</h3>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    setSelectedEventModal(ev);
                  }}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2 hover:border-blue-300 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 m-0">{ev.title}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {ev.eventType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium m-0">{ev.description || 'No additional details.'}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>🕒 {ev.startTime}</span>
                    <span>📍 {ev.venue || 'Virtual'}</span>
                    <span>👥 {ev.attendeeCount || 15} Attendees</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Event Details on click */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#0473b8] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                  {selectedEventModal.eventType}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1 m-0">{selectedEventModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>Date: {selectedEventModal.startDate} {selectedEventModal.endDate && selectedEventModal.endDate !== selectedEventModal.startDate ? `to ${selectedEventModal.endDate}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Time: {selectedEventModal.startTime} {selectedEventModal.endTime ? `- ${selectedEventModal.endTime}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                <span>Venue: {selectedEventModal.venue || 'Virtual Meeting'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-indigo-500" />
                <span>Department: {selectedEventModal.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Registered: {selectedEventModal.attendeeCount || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                <span>Budget: ${Number(selectedEventModal.budget || 0).toLocaleString()}</span>
              </div>
            </div>

            {selectedEventModal.description && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-150 m-0">
                {selectedEventModal.description}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEventModal(null);
                  navigate('/events/all');
                }}
                className="px-5 py-2 bg-[#0473b8] hover:bg-[#03629e] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
              >
                Manage in All Events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendarPage;
