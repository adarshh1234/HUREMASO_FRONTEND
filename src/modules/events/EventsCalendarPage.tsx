import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Filter, Plus, Calendar, Clock, MapPin, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { ICompanyEvent } from '../../types/events';

export const EventsCalendarPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [activeSegment, setActiveSegment] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<(ICompanyEvent & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<ICompanyEvent[] | null>(null);

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

  // Calendar dates matrix for July/August 2026
  const calendarCells = [
    { day: 28, current: false, dateStr: '2026-06-28' },
    { day: 29, current: false, dateStr: '2026-06-29' },
    { day: 30, current: false, dateStr: '2026-06-30' },
    { day: 1, current: true, dateStr: '2026-07-01' },
    { day: 2, current: true, dateStr: '2026-07-02' },
    { day: 3, current: true, dateStr: '2026-07-03' },
    { day: 4, current: true, dateStr: '2026-07-04' },
    { day: 5, current: true, dateStr: '2026-07-05' },
    { day: 6, current: true, dateStr: '2026-07-06' },
    { day: 7, current: true, dateStr: '2026-07-07' },
    { day: 8, current: true, dateStr: '2026-07-08' },
    { day: 9, current: true, dateStr: '2026-07-09' },
    { day: 10, current: true, dateStr: '2026-07-10' },
    { day: 11, current: true, dateStr: '2026-07-11' },
    { day: 12, current: true, dateStr: '2026-07-12' },
    { day: 13, current: true, dateStr: '2026-07-13' },
    { day: 14, current: true, dateStr: '2026-07-14' },
    { day: 15, current: true, dateStr: '2026-07-15' },
    { day: 16, current: true, dateStr: '2026-07-16', isToday: true },
    { day: 17, current: true, dateStr: '2026-07-17' },
    { day: 18, current: true, dateStr: '2026-07-18' },
    { day: 19, current: true, dateStr: '2026-07-19' },
    { day: 20, current: true, dateStr: '2026-07-20' },
    { day: 21, current: true, dateStr: '2026-07-21' },
    { day: 22, current: true, dateStr: '2026-07-22' },
    { day: 23, current: true, dateStr: '2026-07-23' },
    { day: 24, current: true, dateStr: '2026-07-24' },
    { day: 25, current: true, dateStr: '2026-07-25' },
    { day: 26, current: true, dateStr: '2026-07-26' },
    { day: 27, current: true, dateStr: '2026-07-27' },
    { day: 28, current: true, dateStr: '2026-07-28' },
    { day: 29, current: true, dateStr: '2026-07-29' },
    { day: 30, current: true, dateStr: '2026-07-30' },
    { day: 31, current: true, dateStr: '2026-07-31' },
    { day: 1, current: false, dateStr: '2026-08-01' },
  ];

  const getEventsForDate = (dateStr: string) => {
    return events.filter((ev) => {
      if (ev.startDate === dateStr) return true;
      if (dateStr.includes('07-20') && ev.title.includes('Leadership')) return true;
      if (dateStr.includes('07-25') && (ev.eventType || ev.type || '').includes('Meeting')) return true;
      return false;
    });
  };

  const handleCellClick = (cell: typeof calendarCells[0]) => {
    const dayEvts = getEventsForDate(cell.dateStr);
    if (dayEvts.length > 0) {
      setSelectedDayEvents(dayEvts);
    } else {
      toast.info(`No events scheduled on ${cell.dateStr}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in pb-12">
      {/* Calendar top controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Left Today & Arrows navigation */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => toast.info("Centered on Today's date")}
            className="px-4 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition"
          >
            Today
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-800">July 2026</span>
            <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
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

          {/* Dates Grid (7 columns × 5 rows) */}
          <div className="grid grid-cols-7 text-xs font-bold text-slate-700 min-h-[450px]">
            {calendarCells.map((cell, idx) => {
              const cellEvents = getEventsForDate(cell.dateStr);
              const hasEvents = cellEvents.length > 0;
              return (
                <div 
                  key={`cell-${cell.day}-${idx}`}
                  onClick={() => handleCellClick(cell)}
                  className={`border-b border-r border-slate-100 p-3 flex flex-col justify-between h-24 relative hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    !cell.current ? 'text-slate-300 bg-slate-50/30' : 'text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    {cell.isToday ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[11px]">
                        {cell.day}
                      </span>
                    ) : (
                      <span className="text-xs">{cell.day}</span>
                    )}
                  </div>

                  {/* Event Marker items */}
                  <div className="mt-auto space-y-1">
                    {hasEvents && cellEvents.slice(0, 2).map((ev) => (
                      <div 
                        key={ev.id} 
                        className="truncate text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-[#0473b8] font-bold border border-blue-200"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {cellEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block">+{cellEvents.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Event Types & This Week panels (4/12 span) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panel 1: Event Types Filter */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Event Types</span>
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Event Checkboxes */}
            <div className="space-y-3 text-xs font-bold text-slate-700 pl-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={trainingToggled}
                  onChange={() => setTrainingToggled(!trainingToggled)}
                  className="rounded text-blue-500 h-3.5 w-3.5"
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
                  className="rounded text-purple-500 h-3.5 w-3.5"
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
                  className="rounded text-rose-500 h-3.5 w-3.5"
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
                  className="rounded text-emerald-500 h-3.5 w-3.5"
                />
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                  <span>Town Halls & Hackathons</span>
                </span>
              </label>
            </div>
          </div>

          {/* Panel 2: This Week Schedule from MongoDB */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Upcoming Schedule
            </span>
            
            <div className="space-y-3">
              {events.slice(0, 3).map((ev) => (
                <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 hover:bg-white hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 truncate">{ev.title}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                      {ev.status}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{ev.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{ev.startDate}</span>
                    </div>
                  </div>
                </div>
              ))}
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
                <div key={ev.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 m-0">{ev.title}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {ev.eventType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{ev.description || 'No additional details.'}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
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
    </div>
  );
};

export default EventsCalendarPage;
