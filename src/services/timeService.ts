import { AttendanceRecord } from '../types';
import {
  getAttendanceRecords as getMockAttendanceRecords,
  saveAttendanceRecords as saveMockAttendanceRecords,
  getPunchStatus as getMockPunchStatus,
  savePunchStatus as saveMockPunchStatus,
} from '../data/mockData';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/time`;

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

export const timeService = {
  // ================= ATTENDANCE =================
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    try {
      const data = await fetchJson<any[]>(`${BASE_URL}/attendance/records`);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const firstPunch = item.punches?.[0];
          const lastPunch = item.punches?.[item.punches.length - 1];
          const punchOutStr = lastPunch?.punchOutTime
            ? new Date(lastPunch.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';
          const punchInStr = firstPunch?.punchInTime
            ? new Date(firstPunch.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';
          return {
            id: item.id || item._id,
            employeeName: item.employeeName || item.employeeId?.name || 'Sarah Jenkins',
            date: item.date,
            punchIn: punchInStr,
            punchInNote: firstPunch?.punchInNote || '',
            punchOut: punchOutStr,
            punchOutNote: lastPunch?.punchOutNote || '',
            durationHours: Number(item.totalWorkingHours) || 8,
            status: (lastPunch?.punchOutTime ? 'Completed' : 'Pending') as any,
          };
        });
      }
    } catch {
      // fallback to mock data
    }
    return getMockAttendanceRecords();
  },

  async saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
    saveMockAttendanceRecords(records);
  },

  async getPunchStatus(): Promise<{ punchedIn: boolean; time?: string; record?: any }> {
    try {
      const res = await fetchJson<{ punchedIn: boolean; time?: string; record?: any }>(`${BASE_URL}/attendance/punch-status`);
      return res;
    } catch {
      return getMockPunchStatus();
    }
  },

  async savePunchStatus(status: { punchedIn: boolean; time?: string }): Promise<void> {
    saveMockPunchStatus(status);
  },

  async punchIn(note?: string): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/attendance/punch-in`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    } catch {
      saveMockPunchStatus({ punchedIn: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      return { success: true };
    }
  },

  async punchOut(note?: string): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/attendance/punch-out`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
    } catch {
      saveMockPunchStatus({ punchedIn: false });
      return { success: true };
    }
  },

  async getAttendanceConfig(): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/attendance/config`);
    } catch {
      return { recordWorkingTime: true, canEditRecords: true, supervisorCanEdit: true, standardHours: 8, breakDuration: 60, gracePeriodMinutes: 15 };
    }
  },

  async saveAttendanceConfig(data: any): Promise<any> {
    return fetchJson(`${BASE_URL}/attendance/config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ================= TIMESHEETS =================
  async getTimesheets(params?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetchJson<any>(`${BASE_URL}/timesheets${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res.items || [];
    } catch {
      return [];
    }
  },

  async getMyTimesheets(employeeId?: string, period?: string): Promise<any[]> {
    try {
      const query = new URLSearchParams({ ...(employeeId ? { employeeId } : {}), ...(period ? { period } : {}) }).toString();
      return await fetchJson<any[]>(`${BASE_URL}/timesheets/my${query ? `?${query}` : ''}`);
    } catch {
      return [];
    }
  },

  async saveTimesheet(data: any): Promise<any> {
    return fetchJson(`${BASE_URL}/timesheets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitTimesheet(id: string, comment?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/timesheets/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  async approveTimesheet(id: string, approverName = 'Manager', comment?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/timesheets/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approverName, comment }),
    });
  },

  async rejectTimesheet(id: string, approverName = 'Manager', comment?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/timesheets/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approverName, comment }),
    });
  },

  // ================= OVERTIME =================
  async getOvertimeRecords(params?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetchJson<any>(`${BASE_URL}/overtime${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res.items || [];
    } catch {
      return [
        { id: '1', employeeName: 'Alex Rivera', department: 'Operations', date: '2026-09-18', hours: 4, multiplier: '1.5x', amountText: '$120.00', status: 'Approved' },
        { id: '2', employeeName: 'Sarah Jenkins', department: 'Engineering', date: '2026-09-17', hours: 3, multiplier: '2.0x', amountText: '$180.00', status: 'Pending Approval' },
      ];
    }
  },

  async getOvertimeMetrics(): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/overtime/metrics`);
    } catch {
      return { totalOtHours: 148, totalOtHoursText: '148.5 hrs', pendingApprovalsCount: 6, totalPayoutValuation: 4850, totalPayoutValuationText: '$4,850.00' };
    }
  },

  async calculateOvertime(hours: number, multiplier = 1.5, baseRate = 20): Promise<any> {
    return fetchJson(`${BASE_URL}/overtime/calculate`, {
      method: 'POST',
      body: JSON.stringify({ hours, multiplier, baseRate }),
    });
  },

  async createOvertime(data: any): Promise<any> {
    return fetchJson(`${BASE_URL}/overtime`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOvertimeStatus(id: string, status: string, approverName = 'Manager', comments?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/overtime/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approverName, comments }),
    });
  },

  // ================= REPLACEMENT =================
  async getReplacementRecords(params?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetchJson<any>(`${BASE_URL}/replacement${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res.items || [];
    } catch {
      return [
        { id: '1', substituteEmployeeName: 'Marcus Chen', department: 'Product Design', shiftDate: '2026-09-13', daysEarned: 1, reason: 'Weekend deployment coverage', status: 'Approved' },
      ];
    }
  },

  async getReplacementMetrics(): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/replacement/metrics`);
    } catch {
      return { activeReplacementShifts: 12, pendingShiftSwaps: 3, rosterCoverageRate: '98.4%' };
    }
  },

  async createReplacement(data: any): Promise<any> {
    return fetchJson(`${BASE_URL}/replacement`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReplacementStatus(id: string, status: string, approverName = 'Manager', comments?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/replacement/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approverName, comments }),
    });
  },

  // ================= LEAVE SALARY =================
  async getLeaveSalaryRecords(params?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetchJson<any>(`${BASE_URL}/leave-salary${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res.items || [];
    } catch {
      return [
        { id: '1', employeeName: 'Sarah Jenkins', department: 'Engineering', leaveType: 'Earned Leave (EL)', availableBalance: 24, daysEncashing: 10, totalValuationText: '$1,800.00', status: 'Approved for Payroll' },
        { id: '2', employeeName: 'Alex Rivera', department: 'Operations', leaveType: 'Annual Leave', availableBalance: 18, daysEncashing: 5, totalValuationText: '$750.00', status: 'Pending' },
      ];
    }
  },

  async getLeaveSalaryMetrics(): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/leave-salary/metrics`);
    } catch {
      return { totalEncashableDays: 342, totalEncashableDaysText: '342 Days', totalEncashmentValuation: 42850, totalEncashmentValuationText: '$42,850.00', activeApplicationsCount: 8 };
    }
  },

  async calculateLeaveSalary(daysEncashing: number, employeeId?: string, leaveType = 'Annual Leave'): Promise<any> {
    return fetchJson(`${BASE_URL}/leave-salary/calculate`, {
      method: 'POST',
      body: JSON.stringify({ daysEncashing, employeeId, leaveType }),
    });
  },

  async createLeaveSalary(data: any): Promise<any> {
    return fetchJson(`${BASE_URL}/leave-salary`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLeaveSalaryStatus(id: string, status: string): Promise<any> {
    return fetchJson(`${BASE_URL}/leave-salary/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // ================= TIME PAYROLL =================
  async getTimePayrollRecords(params?: any): Promise<any[]> {
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetchJson<any>(`${BASE_URL}/payroll${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res.items || [];
    } catch {
      return [
        { id: 'TP-101', name: 'Sarah Jenkins', dept: 'Engineering', daysPresent: 22, paidLeave: 1, shiftAllowance: '$250', netAdjustment: '+$3,850', status: 'Processed' },
        { id: 'TP-102', name: 'Alex Rivera', dept: 'Operations', daysPresent: 21, paidLeave: 2, shiftAllowance: '$180', netAdjustment: '+$3,420', status: 'Processed' },
        { id: 'TP-103', name: 'Marcus Chen', dept: 'Product Design', daysPresent: 20, paidLeave: 0, shiftAllowance: '$0', netAdjustment: '+$3,100', status: 'Pending Sync' },
        { id: 'TP-104', name: 'Emily Watson', dept: 'Quality Assurance', daysPresent: 23, paidLeave: 0, shiftAllowance: '$320', netAdjustment: '+$4,150', status: 'Processed' },
      ];
    }
  },

  async getTimePayrollSummary(): Promise<any> {
    try {
      return await fetchJson(`${BASE_URL}/payroll/summary`);
    } catch {
      return {
        totalPayableHoursLoggedText: '14,820 hrs',
        complianceRate: '99.2% attendance compliance',
        shiftDifferentialAllowanceText: '$18,450',
        unpaidLopDeductionsText: '-$2,120',
      };
    }
  },

  async calculateTimePayroll(month?: string): Promise<any> {
    return fetchJson(`${BASE_URL}/payroll/calculate`, {
      method: 'POST',
      body: JSON.stringify({ month }),
    });
  },

  async exportTimePayrollFeed(month?: string): Promise<any[]> {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    return fetchJson<any[]>(`${BASE_URL}/payroll/export${query}`);
  },

  // ================= REPORTS =================
  async getProjectReport(params: { projectName?: string; fromDate?: string; toDate?: string; onlyApproved?: boolean }): Promise<any> {
    const query = new URLSearchParams();
    if (params.projectName) query.append('projectName', params.projectName);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.onlyApproved !== undefined) query.append('onlyApproved', String(params.onlyApproved));
    return fetchJson(`${BASE_URL}/reports/project?${query.toString()}`);
  },

  async getEmployeeReport(params: { employeeName?: string; projectName?: string; activityName?: string; fromDate?: string; toDate?: string; onlyApproved?: boolean }): Promise<any> {
    const query = new URLSearchParams();
    if (params.employeeName) query.append('employeeName', params.employeeName);
    if (params.projectName) query.append('projectName', params.projectName);
    if (params.activityName) query.append('activityName', params.activityName);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.onlyApproved !== undefined) query.append('onlyApproved', String(params.onlyApproved));
    return fetchJson(`${BASE_URL}/reports/employee?${query.toString()}`);
  },

  async getAttendanceSummaryReport(params: { employeeName?: string; jobTitle?: string; subUnit?: string; employmentStatus?: string; fromDate?: string; toDate?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params.employeeName) query.append('employeeName', params.employeeName);
    if (params.jobTitle) query.append('jobTitle', params.jobTitle);
    if (params.subUnit) query.append('subUnit', params.subUnit);
    if (params.employmentStatus) query.append('employmentStatus', params.employmentStatus);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    return fetchJson(`${BASE_URL}/reports/attendance-summary?${query.toString()}`);
  },
};

export default timeService;
