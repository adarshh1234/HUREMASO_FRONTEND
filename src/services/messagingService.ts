import { MessageLog } from '../types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/mass-messages`;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export interface RecipientOption {
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface RecipientsResponse {
  departments: string[];
  employees: RecipientOption[];
}

export const messagingService = {
  async getRecipients(): Promise<RecipientsResponse> {
    return fetchJson<RecipientsResponse>(`${BASE_URL}/recipients`);
  },

  async getMessageLogs(channel?: string): Promise<MessageLog[]> {
    const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
    const data = await fetchJson<any[]>(`${BASE_URL}/history${qs}`);
    return (data || []).map((item) => {
      let chan: MessageLog['channel'] = 'Email';
      if (item.channel === 'SMS') chan = 'SMS';
      else if (item.channel === 'WHATSAPP') chan = 'WhatsApp';
      else if (item.channel === 'EMPLOYEE_APP') chan = 'Employee App';

      return {
        id: item.id || item._id,
        channel: chan,
        subject: item.subject || 'No Subject',
        recipients: Array.isArray(item.recipients) ? item.recipients.join(', ') : item.recipients || 'All Employees',
        message: item.message,
        dateSent: item.createdAt
          ? new Date(item.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: item.status === 'DRAFT' ? 'Draft' : 'Sent',
        replies: 0,
      };
    });
  },

  async sendMessage(payload: {
    channel?: string;
    subject: string;
    message: string;
    recipientType?: string;
    recipients?: string[];
    department?: string;
    status?: 'DRAFT' | 'SENT';
  }): Promise<any> {
    return fetchJson(`${BASE_URL}/send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createMessageLog(data: Omit<MessageLog, 'id' | 'dateSent'>): Promise<MessageLog> {
    const sent = await this.sendMessage({
      channel: data.channel?.toUpperCase(),
      subject: data.subject,
      message: data.message,
      recipients: [data.recipients],
      status: data.status === 'Draft' ? 'DRAFT' : 'SENT',
    });

    return {
      id: sent.id || sent._id || String(Date.now()),
      channel: data.channel,
      subject: data.subject,
      recipients: data.recipients,
      message: data.message,
      dateSent: new Date().toISOString().split('T')[0],
      status: data.status,
      replies: 0,
    };
  },

  async saveMessageLogs(logs: MessageLog[]): Promise<void> {
    // No-op for direct persistence
  },
};

export default messagingService;
