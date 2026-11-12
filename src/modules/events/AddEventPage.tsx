import React, { useState } from 'react';
import { Clock, ChevronDown, Search, X, Calendar, MapPin, Plus, CheckCircle2, User, DollarSign, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import { IEventTask } from '../../types/events';

export const AddEventPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Toggle states
  const [locationType, setLocationType] = useState<'in-person' | 'online'>('in-person');
  
  // Quick settings toggles
  const [sendReminder, setSendReminder] = useState(true);
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('Training Session');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('2026-08-15');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endDate, setEndDate] = useState('2026-08-15');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [timezone, setTimezone] = useState('UTC+4 (Dubai)');
  const [venue, setVenue] = useState('Main Conference Hall');
  const [dept, setDept] = useState('All Department');
  const [organizer, setOrganizer] = useState('Sarah Jo');
  const [allocatedBudget, setAllocatedBudget] = useState('5000');

  // Task / Checklist state
  const [checklistItems, setChecklistItems] = useState([
    'Prepare agenda slide deck',
    'Book venue and AV equipment',
    'Order corporate catering & drinks',
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddChecklist = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems([...checklistItems, newChecklistText.trim()]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate.trim()) {
      toast.error('Event title and start date are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const taskObjects: IEventTask[] = checklistItems.map((item, idx) => ({
        id: `TSK-${Date.now()}-${idx}`,
        name: item,
        due: startDate,
        assignee: organizer,
        status: 'In Progress',
        progress: 0,
      }));

      const budgetAmount = parseFloat(allocatedBudget) || 0;

      await eventService.createEvent({
        title: title.trim(),
        eventType,
        description: desc.trim(),
        startDate,
        startTime,
        endDate,
        endTime,
        timezone,
        venue: locationType === 'in-person' ? venue : 'Online / Virtual Platform',
        locationType,
        department: dept,
        organizer,
        attendeeCount: 20,
        status: 'Up coming',
        progress: `0/${taskObjects.length} Task`,
        tasks: taskObjects,
        budget: {
          allocated: budgetAmount,
          spent: 0,
          status: 'Approved',
        },
        sendReminder,
        syncCalendar,
        emailNotifications,
      });

      toast.success(`Event "${title}" scheduled and saved to MongoDB!`);
      navigate('/events/all');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 m-0">Add Events</h1>
        <p className="text-xs text-slate-500 mt-0.5">Schedule corporate meetings, training workshops, and company gatherings.</p>
      </div>

      {/* Columns layout */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Event details form (8/12 grid span) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Event Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Events Details
            </span>
            
            <div className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1.5">Events Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Q4 Executive Strategy Session"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 outline-none text-xs font-semibold bg-white focus:border-[#0473b8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5">Events Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none text-xs font-semibold focus:border-[#0473b8]"
                  >
                    <option value="Training Session">Training Session</option>
                    <option value="Team Meeting">Team Meeting</option>
                    <option value="Town Hall">Town Hall</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Social Event">Social Event</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5">Target Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 outline-none text-xs font-semibold focus:border-[#0473b8]"
                  >
                    <option value="All Department">All Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1.5">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Provide background context, objectives, and meeting links..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-800 outline-none resize-none focus:border-[#0473b8]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Schedule & Location */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Date & Location Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1.5">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                />
              </div>
              <div>
                <label className="block mb-1.5">Start Time *</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                />
              </div>
              <div>
                <label className="block mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                />
              </div>
              <div>
                <label className="block mb-1.5">End Time</label>
                <input
                  type="text"
                  placeholder="e.g. 05:00 PM"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1.5">Location Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locType"
                      checked={locationType === 'in-person'}
                      onChange={() => setLocationType('in-person')}
                      className="text-[#0473b8]"
                    />
                    <span>In-Person Physical Venue</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locType"
                      checked={locationType === 'online'}
                      onChange={() => setLocationType('online')}
                      className="text-[#0473b8]"
                    />
                    <span>Virtual / Online Meeting</span>
                  </label>
                </div>
              </div>

              {locationType === 'in-person' ? (
                <div>
                  <label className="block mb-1.5">Venue / Conference Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Boardroom A (5th Floor)"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block mb-1.5">Video Call Link</label>
                  <input
                    type="text"
                    placeholder="e.g. https://meet.google.com/abc-xyz-123"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Checklist & Operational Tasks */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Action Items & Checklist
            </span>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add task / checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0473b8]"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={item + idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Organizer, Budget & Submit (4/12 grid span) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Budget & Organizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Settings & Budget
            </span>

            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1.5 font-bold text-slate-800">Event Organizer</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8]"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-bold text-slate-800">Allocated Budget ($)</label>
                <input
                  type="number"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-[#0473b8] font-mono"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendReminder}
                    onChange={(e) => setSendReminder(e.target.checked)}
                    className="text-[#0473b8] rounded"
                  />
                  <span>Send Calendar Reminders (24h before)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(e) => setSyncCalendar(e.target.checked)}
                    className="text-[#0473b8] rounded"
                  />
                  <span>Sync with Outlook / Google Calendar</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="text-[#0473b8] rounded"
                  />
                  <span>Notify Registered Attendees via Email</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Action Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0473b8] hover:bg-[#03629e] text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Scheduling Event...' : 'Create & Schedule Event'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/events/all')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddEventPage;
