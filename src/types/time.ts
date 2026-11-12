export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  punchIn: string;
  punchInNote: string;
  punchOut: string;
  punchOutNote: string;
  durationHours: number;
  status: 'Completed' | 'Pending' | 'Missing Out';
}

export interface FinanceRequest {
  id: string;
  employeeName: string;
  employeeId?: string;
  requestType?: string;
  type?: string;
  department: string;
  dateRequested: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  description?: string;
}

export interface PerformanceReview {
  id: string;
  employeeName: string;
  reviewer?: string;
  reviewerName?: string;
  jobTitle?: string;
  reviewPeriod: string;
  dueDate: string;
  status: 'Pending Self Review' | 'Pending Supervisor Review' | 'Completed' | 'Pending' | 'In Progress' | string;
  rating?: number;
  score?: number;
  feedback?: string;
}

export interface MessageLog {
  id: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Employee App';
  subject: string;
  recipients: string;
  message: string;
  dateSent: string;
  status: 'Sent' | 'Draft';
  replies?: number;
}
