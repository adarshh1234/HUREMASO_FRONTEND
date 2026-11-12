import {
  LeaveRequest,
  LeaveBalance,
  AddEntitlementPayload,
  LeaveEntitlementRecord,
  EmployeeEntitlementFilter,
  LeaveUsageReportRecord,
  LeaveListRecord,
  AssignLeavePayload,
  LeavePeriodConfig,
  LeaveTypeConfig,
  WorkWeekConfig,
  HolidayRecord,
} from '../types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/leave`;

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

export const leaveService = {
  async getRequests(params?: { employeeId?: string; status?: string; leaveType?: string }): Promise<LeaveRequest[]> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.leaveType) query.append('leaveType', params.leaveType);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/requests${qs ? `?${qs}` : ''}`);
    return data.map((item) => ({
      ...item,
      id: item.id || item._id || '',
    }));
  },

  async getBalances(employeeId?: string): Promise<LeaveBalance[]> {
    const url = employeeId ? `${BASE_URL}/balances/${employeeId}` : `${BASE_URL}/balances`;
    const data = await fetchJson<any[]>(url);
    return data.map((item) => ({
      ...item,
      id: item.id || item._id || '',
    }));
  },

  async createRequest(data: Omit<LeaveRequest, 'id' | 'dateRequested' | 'status'>): Promise<LeaveRequest> {
    const payload = {
      ...data,
      dateRequested: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    const res = await fetchJson<any>(`${BASE_URL}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ...res, id: res.id || res._id || '' };
  },

  async updateRequestStatus(id: string, status: 'Approved' | 'Rejected' | 'Cancelled' | 'Pending'): Promise<LeaveRequest> {
    const res = await fetchJson<any>(`${BASE_URL}/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return { ...res, id: res.id || res._id || '' };
  },

  async saveBalances(balances: LeaveBalance[]): Promise<void> {
    for (const b of balances) {
      await fetchJson(`${BASE_URL}/balances`, {
        method: 'POST',
        body: JSON.stringify(b),
      });
    }
  },

  // --- Entitlement methods ---

  async addEntitlement(payload: AddEntitlementPayload): Promise<LeaveEntitlementRecord> {
    const parts = payload.leavePeriod.includes(' - ')
      ? payload.leavePeriod.split(' - ')
      : [payload.leavePeriod, payload.leavePeriod];
    const validFrom = parts[0] || '';
    const validTo = parts[1] || parts[0] || '';

    const body = {
      employeeId: payload.employeeName,
      leaveType: payload.leaveType,
      entitlementType: payload.targetType === 'individual' ? 'Added' : 'Bulk',
      validFrom,
      validTo,
      days: payload.entitlement,
    };
    const res = await fetchJson<any>(`${BASE_URL}/entitlements`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ...res, id: res.id || res._id || '' };
  },

  async getEmployeeEntitlements(filter?: EmployeeEntitlementFilter): Promise<LeaveEntitlementRecord[]> {
    const query = new URLSearchParams();
    if (filter?.employeeId) query.append('employeeId', filter.employeeId);
    if (filter?.employeeName) query.append('employeeName', filter.employeeName);
    if (filter?.leaveType) query.append('leaveType', filter.leaveType);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/entitlements${qs ? `?${qs}` : ''}`);
    return data.map((item) => ({
      ...item,
      id: item.id || item._id || '',
    }));
  },

  async getMyEntitlements(leaveType?: string, leavePeriod?: string): Promise<LeaveEntitlementRecord[]> {
    return this.getEmployeeEntitlements({ leaveType, leavePeriod });
  },

  // --- Report methods ---

  async getLeaveUsageReport(leaveType?: string): Promise<LeaveUsageReportRecord[]> {
    const balances = await this.getBalances();
    const filtered = leaveType ? balances.filter((b) => b.leaveType === leaveType) : balances;
    return filtered.map((b, idx) => ({
      id: `RPT-${idx + 1}`,
      leaveType: b.leaveType,
      leaveEntitlementDays: b.entitled,
      leavePendingApprovals: b.pending,
      leaveScheduledDays: b.scheduled,
      leaveTakenDays: b.taken,
      leaveBalanceDays: b.balance,
    }));
  },

  // --- Leave List methods ---

  async getLeaveList(filter?: { leaveType?: string; status?: string; employeeName?: string }): Promise<LeaveListRecord[]> {
    const [requests, balances] = await Promise.all([
      this.getRequests(filter ? { status: filter.status, leaveType: filter.leaveType } : undefined),
      this.getBalances(),
    ]);

    let filtered = requests;
    if (filter?.employeeName) {
      filtered = filtered.filter((r) =>
        r.employeeName?.toLowerCase().includes(filter.employeeName!.toLowerCase())
      );
    }

    return filtered.map((r) => {
      const bal = balances.find((b) => b.leaveType === r.leaveType);
      return {
        id: r.id,
        date: r.fromDate,
        employeeName: r.employeeName,
        leaveType: r.leaveType,
        leaveBalance: bal?.balance ?? 0,
        numberOfDays: r.numberOfDays,
        status: r.status,
        comments: r.comments,
      };
    });
  },

  // --- Assign Leave methods ---

  async assignLeave(payload: AssignLeavePayload): Promise<LeaveRequest> {
    const from = new Date(payload.fromDate);
    const to = new Date(payload.toDate);
    const diffDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const body = {
      employeeId: payload.employeeName,
      employeeName: payload.employeeName,
      department: '',
      leaveType: payload.leaveType,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      numberOfDays: diffDays,
      status: 'Approved',
      comments: payload.comment || '',
      dateRequested: new Date().toISOString().split('T')[0],
    };

    const res = await fetchJson<any>(`${BASE_URL}/requests`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ...res, id: res.id || res._id || '' };
  },

  // --- Configuration methods ---

  async getLeavePeriodConfig(): Promise<LeavePeriodConfig> {
    const data = await fetchJson<any>(`${BASE_URL}/period`);
    return data || { startMonth: 'January', startDay: 1, endMonth: 'December', endDay: 31 };
  },

  async saveLeavePeriodConfig(data: LeavePeriodConfig): Promise<void> {
    await fetchJson(`${BASE_URL}/period`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getLeaveTypeConfigs(): Promise<LeaveTypeConfig[]> {
    const data = await fetchJson<any[]>(`${BASE_URL}/types`);
    return data.map((item) => ({
      id: item.id || item._id || '',
      name: item.name,
    }));
  },

  async addLeaveTypeConfig(name: string): Promise<LeaveTypeConfig> {
    const res = await fetchJson<any>(`${BASE_URL}/types`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return { id: res.id || res._id || '', name: res.name };
  },

  async updateLeaveTypeConfig(id: string, name: string): Promise<LeaveTypeConfig> {
    const res = await fetchJson<any>(`${BASE_URL}/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return { id: res.id || res._id || '', name: res.name };
  },

  async deleteLeaveTypeConfig(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/types/${id}`, {
      method: 'DELETE',
    });
  },

  async getWorkWeekConfig(): Promise<WorkWeekConfig> {
    const data = await fetchJson<any>(`${BASE_URL}/work-week`);
    return data || {
      monday: 'Full Day',
      tuesday: 'Full Day',
      wednesday: 'Full Day',
      thursday: 'Full Day',
      friday: 'Full Day',
      saturday: 'Non-working',
      sunday: 'Non-working',
    };
  },

  async saveWorkWeekConfig(data: WorkWeekConfig): Promise<void> {
    await fetchJson(`${BASE_URL}/work-week`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getHolidays(fromDate?: string, toDate?: string): Promise<HolidayRecord[]> {
    const query = new URLSearchParams();
    if (fromDate) query.append('fromDate', fromDate);
    if (toDate) query.append('toDate', toDate);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/holidays${qs ? `?${qs}` : ''}`);
    return data.map((h) => ({
      id: h.id || h._id || '',
      name: h.name,
      date: h.date,
      dayType: h.dayType || (h.fullDay ? 'Full Day' : 'Half Day'),
      fullDay: h.fullDay ?? true,
      repeatsAnnually: h.repeatsAnnually ?? false,
    }));
  },

  async addHoliday(holiday: Omit<HolidayRecord, 'id'>): Promise<HolidayRecord> {
    const res = await fetchJson<any>(`${BASE_URL}/holidays`, {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
    return {
      ...res,
      id: res.id || res._id || '',
      dayType: res.dayType || (res.fullDay ? 'Full Day' : 'Half Day'),
    };
  },

  async updateHoliday(id: string, holiday: Omit<HolidayRecord, 'id'>): Promise<HolidayRecord> {
    const res = await fetchJson<any>(`${BASE_URL}/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holiday),
    });
    return {
      ...res,
      id: res.id || res._id || '',
      dayType: res.dayType || (res.fullDay ? 'Full Day' : 'Half Day'),
    };
  },

  async deleteHoliday(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/holidays/${id}`, {
      method: 'DELETE',
    });
  },
};

export default leaveService;
