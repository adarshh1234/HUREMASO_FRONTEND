const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const PROFILE_URL = `${API_BASE}/profile`;

export interface BellNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: BellNotification[];
  unreadCount: number;
}

export const notificationBellService = {
  async getNotifications(): Promise<NotificationsResponse> {
    const res = await fetch(`${PROFILE_URL}/notifications`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch notifications`);
    const json = await res.json();
    return {
      notifications: (json.data || []).map((n: any) => ({ ...n, id: n.id || n._id })),
      unreadCount: json.pagination?.unreadCount ?? 0,
    };
  },

  async markAsRead(id: string): Promise<BellNotification> {
    const res = await fetch(`${PROFILE_URL}/notifications/${id}/read`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to mark notification as read`);
    const json = await res.json();
    return { ...json.data, id: json.data.id || json.data._id };
  },

  async markAllAsRead(): Promise<BellNotification[]> {
    const res = await fetch(`${PROFILE_URL}/notifications/read-all`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to mark all notifications as read`);
    const json = await res.json();
    return (json.data || []).map((n: any) => ({ ...n, id: n.id || n._id }));
  },
};

export default notificationBellService;
