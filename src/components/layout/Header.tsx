import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, X, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, User, ChevronDown } from 'lucide-react';
import { notificationBellService, BellNotification } from '../../services/notificationBellService';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleMobile: () => void;
  onLogout: () => void;
}

// ── Notification type icon ─────────────────────────────────────────────────
function NotifIcon({ type }: { type: BellNotification['type'] }) {
  const base = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'success': return <CheckCircle className={`${base} text-emerald-500`} />;
    case 'warning': return <AlertTriangle className={`${base} text-amber-500`} />;
    case 'error':   return <AlertCircle  className={`${base} text-rose-500`} />;
    default:        return <Info         className={`${base} text-blue-500`} />;
  }
}

// ── Relative time helper ───────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, onToggleMobile, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown]         = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications]       = useState<BellNotification[]>([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [notifLoading, setNotifLoading]         = useState(false);

  const hideSearch = location.pathname === '/employees/list' || location.pathname === '/employees';

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Fetch notifications when panel opens ────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const result = await notificationBellService.getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error('[Header] Failed to fetch notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Fetch unread count on mount (for badge)
  useEffect(() => {
    notificationBellService.getNotifications()
      .then(r => setUnreadCount(r.unreadCount))
      .catch(() => {});
  }, []);

  // Re-fetch when panel opens
  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

  // ── Close panels on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Mark single notification read ────────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    if (notifications.find(n => n.id === id)?.isRead) return;
    try {
      const updated = await notificationBellService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: updated.isRead } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Header] markAsRead failed:', err);
    }
  };

  // ── Mark all read ────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const all = await notificationBellService.markAllAsRead();
      setNotifications(all);
      setUnreadCount(0);
    } catch (err) {
      console.error('[Header] markAllAsRead failed:', err);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-slate-150 bg-white px-4 md:px-8 transition-all duration-300 ${
        sidebarOpen ? 'left-0 md:left-72' : 'left-0 md:left-20'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile: toggle mobile drawer */}
        <button
          onClick={onToggleMobile}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors md:hidden"
          title="Toggle Sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        {/* Desktop: toggle sidebar collapse */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors hidden md:inline-flex"
          title="Toggle Sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        {!hideSearch && (
          <div className="relative flex-1 max-w-xs focus-within:max-w-md transition-all duration-300 ease-in-out group">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-[#006666] group-focus-within:scale-110 transition-all duration-300 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search........"
              className="w-full pl-10 pr-9 py-2 border border-slate-300 bg-white rounded-full text-xs font-semibold text-slate-900 outline-none transition-all duration-300 ease-in-out placeholder:text-slate-400 focus:border-[#006666] focus:ring-4 focus:ring-[#006666]/15 focus:shadow-md hover:border-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: profile + bell */}
      <div className="flex items-center gap-3">

        {/* ── Profile Avatar & Menu ────────────────────────────────────────── */}
        <div className="relative flex items-center" ref={profileRef}>
          <div className="flex items-center gap-1 rounded-full p-0.5 hover:bg-slate-100 transition-colors">
            {/* Clicking the avatar opens the Profile section */}
            <button
              id="header-profile-avatar-btn"
              onClick={() => {
                setShowDropdown(false);
                navigate('/profile');
              }}
              className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 hover:border-[#004848] hover:ring-2 hover:ring-[#004848]/20 transition-all cursor-pointer bg-slate-100 flex items-center justify-center font-bold text-xs relative"
              title="Open Profile Section"
            >
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Sarah Joseph"
                className="h-full w-full object-cover"
              />
            </button>

            {/* Dropdown toggle chevron for account options */}
            <button
              id="header-profile-dropdown-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown((prev) => !prev);
                setShowNotifications(false);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Account Menu"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDropdown ? 'rotate-180 text-slate-700' : ''}`} />
            </button>
          </div>

          {/* Profile Popover */}
          {showDropdown && (
            <div className="absolute top-12 right-0 z-50 w-64 bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 text-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
              >
                <div className="relative shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Sarah Joseph"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">Sarah Joseph</h4>
                  <p className="text-[11px] font-medium text-slate-500 truncate">sarah.j@company.com</p>
                </div>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-teal-50 text-[#004848] font-bold text-xs transition-colors cursor-pointer group"
                >
                  <User className="w-4 h-4 text-[#004848] group-hover:scale-110 transition-transform" />
                  <span>Open Profile Section</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2.5 p-2.5 rounded-xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-100 text-rose-600 transition-all cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-rose-600">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bell Notification ───────────────────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification-bell-btn"
            onClick={() => {
              setShowNotifications(prev => !prev);
              setShowDropdown(false);
            }}
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center relative hover:bg-slate-50 cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#004848] text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div
              id="notification-panel"
              className="absolute top-12 right-0 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#004848]" />
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center h-5 px-1.5 rounded-full bg-[#004848] text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[11px] text-[#004848] font-semibold hover:underline transition-all"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      All read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                    <div
                      style={{
                        width: 18, height: 18,
                        border: '2px solid #e2e8f0',
                        borderTopColor: '#004848',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Loading…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                    <Bell className="h-7 w-7 opacity-30" />
                    <span className="text-sm">No notifications</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      id={`notif-${notif.id}`}
                      onClick={() => handleMarkRead(notif.id)}
                      className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                        notif.isRead ? 'opacity-60' : 'bg-teal-50/40'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Type icon */}
                      <div className="mt-0.5">
                        <NotifIcon type={notif.type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold text-slate-800 leading-snug ${!notif.isRead ? 'font-bold' : ''}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="mt-0.5 h-2 w-2 rounded-full bg-[#004848] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {relativeTime(notif.createdAt)}
                        </p>
                      </div>

                      {/* Mark read indicator */}
                      {notif.isRead && (
                        <div className="mt-0.5">
                          <Check className="h-3 w-3 text-slate-300" />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Panel Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                  <span className="text-[11px] text-slate-400">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    {unreadCount > 0 ? ` · ${unreadCount} unread` : ' · all read'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
