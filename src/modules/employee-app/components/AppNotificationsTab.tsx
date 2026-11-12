import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  AlertTriangle, 
  Megaphone,
  Calendar,
  X,
  Smartphone,
  Eye
} from 'lucide-react';
import { 
  AppAnnouncement, 
  AnnouncementType, 
  AnnouncementAudience, 
  AnnouncementPriority, 
  AnnouncementStatus 
} from '../../../types/employeeApp.types';

interface AppNotificationsTabProps {
  announcements: AppAnnouncement[];
  total: number;
  loading: boolean;
  onFetchAnnouncements: (params?: any) => Promise<void>;
  onCreateAnnouncement: (data: Partial<AppAnnouncement>) => Promise<any>;
  onDeleteAnnouncement: (id: string) => Promise<any>;
}

export const AppNotificationsTab: React.FC<AppNotificationsTabProps> = ({
  announcements,
  total,
  loading,
  onFetchAnnouncements,
  onCreateAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<AppAnnouncement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'Announcement' as AnnouncementType,
    targetAudience: 'All' as AnnouncementAudience,
    targetDepartments: [] as string[],
    targetRoles: [] as string[],
    priority: 'Medium' as AnnouncementPriority,
    status: 'Sent' as AnnouncementStatus,
    sendPushNotification: true,
    sendInApp: true,
    clickActionUrl: '',
    createdBy: 'HR Communications Team',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchAnnouncements({
        search: searchTerm,
        type: typeFilter,
        priority: priorityFilter,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, typeFilter, priorityFilter, onFetchAnnouncements]);

  const handleCompose = () => {
    setFormData({
      title: '',
      message: '',
      type: 'Announcement',
      targetAudience: 'All',
      targetDepartments: [],
      targetRoles: [],
      priority: 'Medium',
      status: 'Sent',
      sendPushNotification: true,
      sendInApp: true,
      clickActionUrl: '',
      createdBy: 'HR Communications Team',
    });
    setIsComposeModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;

    try {
      setSubmitting(true);
      await onCreateAnnouncement(formData);
      setIsComposeModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Low</span>;
    }
  };

  const getTypeBadge = (type: AnnouncementType) => {
    switch (type) {
      case 'Alert':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Alert</span>;
      case 'Update':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">Update</span>;
      case 'Maintenance':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Maintenance</span>;
      case 'Policy':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Policy</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Announcement</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements, broadcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Megaphone className="w-4 h-4" />
              <span>Compose Mobile Broadcast</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Types</option>
            <option value="Announcement">Announcement</option>
            <option value="Alert">Alert</option>
            <option value="Update">Update</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Policy">Policy</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004848]"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Broadcasts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Broadcast Title & Details</th>
                <th className="py-3.5 px-4">Category & Priority</th>
                <th className="py-3.5 px-4">Target Audience</th>
                <th className="py-3.5 px-4">Read Tracking</th>
                <th className="py-3.5 px-4">Dispatched At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#004848] border-t-transparent rounded-full mb-2"></div>
                    <p className="font-medium">Loading notifications...</p>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No announcements found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Send a mobile announcement to notify staff instantly.</p>
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="max-w-md">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="font-bold text-slate-900 hover:text-[#004848] text-left block transition-colors truncate max-w-sm"
                        >
                          {item.title}
                        </button>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.message}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        {getPriorityBadge(item.priority)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.targetAudience === 'All' ? 'All Mobile Users' : item.targetAudience}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          <span>{item.readCount}</span>
                          <span className="text-slate-400 font-normal">/ {item.totalRecipients || 100}</span>
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-[#007878] h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((item.readCount || 0) / (item.totalRecipients || 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {item.sentAt ? (
                        <div>
                          <p className="font-medium text-slate-700">{new Date(item.sentAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">Scheduled</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingItem(item)}
                          title="View Announcement"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAnnouncement(item.id)}
                          title="Delete Broadcast"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Compose Announcement Modal */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-[#004848]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Compose Mobile App Broadcast</h3>
                  <p className="text-xs text-slate-500">Dispatch push notification & in-app banner to mobile users.</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Broadcast Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Closed Tomorrow for Public Holiday"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write clear announcement instructions or update details..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Alert">Alert</option>
                    <option value="Update">App Update</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Policy">Policy Memo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Red Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as AnnouncementAudience })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                  >
                    <option value="All">All Employees</option>
                    <option value="Department">Department</option>
                    <option value="Role">App Role</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action Deep-link / Web URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /self-service/leave or https://..."
                  value={formData.clickActionUrl}
                  onChange={(e) => setFormData({ ...formData, clickActionUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#004848]"
                />
              </div>

              {/* Delivery Channels */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">Dispatch Channels</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Send Mobile Push Notification (APNS / FCM)</span>
                  <input
                    type="checkbox"
                    checked={formData.sendPushNotification}
                    onChange={(e) => setFormData({ ...formData, sendPushNotification: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Show In-App Banner Dialog on Launch</span>
                  <input
                    type="checkbox"
                    checked={formData.sendInApp}
                    onChange={(e) => setFormData({ ...formData, sendInApp: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004848] focus:ring-[#004848]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#002222] via-[#004848] to-[#007878] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Dispatching...' : 'Dispatch Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Broadcast Detail Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getTypeBadge(viewingItem.type)}
                {getPriorityBadge(viewingItem.priority)}
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{viewingItem.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Dispatched by: {viewingItem.createdBy}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {viewingItem.message}
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>Audience: <span className="font-semibold text-slate-800">{viewingItem.targetAudience}</span></p>
              <p>Total Delivered: <span className="font-semibold text-slate-800">{viewingItem.readCount} / {viewingItem.totalRecipients} read</span></p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingItem(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
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
