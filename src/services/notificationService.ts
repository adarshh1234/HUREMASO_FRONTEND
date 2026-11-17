export interface RecipientDeliveryItem {
  recipientId: string;
  name: string;
  department: string;
  contactAddress: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED' | 'READ';
  error?: string;
  messageId?: string;
  sentAt?: string;
  readAt?: string;
}

export interface BackendNotification {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'EMPLOYEE_APP' | 'HUREMASO';
  subject?: string;
  message: string;
  recipients: string;
  recipientType?: 'ALL_EMPLOYEES' | 'DEPARTMENT' | 'EMPLOYEES';
  departmentIds?: string[];
  employeeIds?: string[];
  announcementCategory?: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_SENT' | 'FAILED';
  createdBy?: string;
  recipientDeliveries?: RecipientDeliveryItem[];
  totalRecipientsCount?: number;
  validRecipientsCount?: number;
  invalidRecipientsCount?: number;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  readCount?: number;
  retryCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipientDepartment {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
}

export interface RecipientEmployee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  isValidForChannel: boolean;
  validationError?: string;
}

export interface RecipientsResponse {
  departments: RecipientDepartment[];
  employees: RecipientEmployee[];
  summary: {
    totalEmployees: number;
    validCount: number;
    invalidCount: number;
  };
}

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

export const notificationService = {
  /**
   * Channel mapping helper between frontend route strings and backend NotificationChannel enum
   */
  mapChannelToBackend(channelStr: string): 'EMAIL' | 'SMS' | 'WHATSAPP' | 'EMPLOYEE_APP' | 'HUREMASO' {
    const upper = channelStr.toUpperCase().replace(/\s+/g, '_').replace(/[']/g, '');
    if (upper.includes('SMS')) return 'SMS';
    if (upper.includes('WHATSAPP') || upper.includes('WHATS_APP')) return 'WHATSAPP';
    if (upper.includes('EMPLOYEE_APP') || upper.includes('EMPLOYEE')) return 'EMPLOYEE_APP';
    if (upper.includes('HUREMASO')) return 'HUREMASO';
    return 'EMAIL';
  },

  /**
   * Fetch dynamic recipients and departments validated for a specific channel
   */
  async getRecipients(channelStr: string): Promise<RecipientsResponse> {
    try {
      const backendChannel = this.mapChannelToBackend(channelStr);
      const res = await fetch(`${VITE_API_URL}/notifications/recipients?channel=${backendChannel}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch recipients`);
      }
      const json = await res.json();
      return json.data || { departments: [], employees: [], summary: { totalEmployees: 0, validCount: 0, invalidCount: 0 } };
    } catch (err) {
      console.error('[notificationService] Failed to fetch recipients:', err);
      throw err;
    }
  },

  /**
   * Fetch notifications from backend API with optional filtering
   */
  async getNotifications(params?: {
    channel?: string;
    status?: 'DRAFT' | 'SENT';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: BackendNotification[]; total: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.channel) {
        queryParams.append('channel', this.mapChannelToBackend(params.channel));
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      queryParams.append('page', String(params?.page || 1));
      queryParams.append('limit', String(params?.limit || 10));

      const res = await fetch(`${VITE_API_URL}/notifications?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch notifications`);
      }
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.pagination?.totalItems || json.data?.length || 0,
        totalPages: json.pagination?.totalPages || 1,
      };
    } catch (err) {
      console.error('[notificationService] Backend request failed:', err);
      throw err;
    }
  },

  /**
   * Get single notification by ID
   */
  async getNotificationById(id: string): Promise<BackendNotification> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch notification details`);
      }
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[notificationService] Failed to get notification by ID:', err);
      throw err;
    }
  },

  /**
   * Create a new notification (always creates DRAFT in backend)
   */
  async createNotification(payload: {
    channel: string;
    subject?: string;
    message: string;
    recipients: string;
    recipientType?: 'ALL_EMPLOYEES' | 'DEPARTMENT' | 'EMPLOYEES';
    departmentIds?: string[];
    employeeIds?: string[];
    announcementCategory?: string;
    status?: 'DRAFT' | 'SENT';
  }): Promise<BackendNotification> {
    const backendChannel = this.mapChannelToBackend(payload.channel);
    const body = {
      channel: backendChannel,
      subject: payload.subject || '',
      message: payload.message,
      recipients: payload.recipients || 'All Employees',
      recipientType: payload.recipientType || 'ALL_EMPLOYEES',
      departmentIds: payload.departmentIds || [],
      employeeIds: payload.employeeIds || [],
      announcementCategory: payload.announcementCategory || '',
      status: 'DRAFT',
    };

    try {
      const res = await fetch(`${VITE_API_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error?.message || `HTTP ${res.status}: Failed to create notification`);
      }

      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[notificationService] Backend post failed:', err);
      throw err;
    }
  },

  /**
   * Send a draft notification
   */
  async sendNotification(id: string): Promise<BackendNotification> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/${id}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to send draft`);
      }
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[notificationService] Send draft API call failed:', err);
      throw err;
    }
  },

  /**
   * Retry failed deliveries on a notification
   */
  async retryNotification(id: string): Promise<BackendNotification> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/${id}/retry`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to retry notification`);
      }
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error('[notificationService] Retry notification API call failed:', err);
      throw err;
    }
  },

  /**
   * Delete a draft notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${res.status}: Failed to delete draft`);
      }
    } catch (err) {
      console.error('[notificationService] Delete draft API call failed:', err);
      throw err;
    }
  },

  /**
   * In-App Employee notifications API
   */
  async getMyInAppNotifications(params?: { page?: number; limit?: number }): Promise<{
    data: BackendNotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const res = await fetch(`${VITE_API_URL}/notifications/my-notifications?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch in-app notifications`);
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.pagination?.totalItems || 0,
        unreadCount: json.pagination?.unreadCount || 0,
      };
    } catch (err) {
      console.error('[notificationService] Failed to fetch my in-app notifications:', err);
      throw err;
    }
  },

  async markAsRead(id: string, recipientId?: string): Promise<boolean> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/my-notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to mark notification as read`);
      const json = await res.json();
      return json.data?.updated ?? true;
    } catch (err) {
      console.error('[notificationService] Failed to mark as read:', err);
      throw err;
    }
  },

  async markAllAsRead(recipientId?: string): Promise<number> {
    try {
      const res = await fetch(`${VITE_API_URL}/notifications/my-notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to mark all as read`);
      const json = await res.json();
      return json.data?.count ?? 0;
    } catch (err) {
      console.error('[notificationService] Failed to mark all as read:', err);
      throw err;
    }
  },
};

export default notificationService;
