export type EventStatus =
  | 'Draft'
  | 'Planing'
  | 'Planning'
  | 'In Progress'
  | 'Up coming'
  | 'Upcoming'
  | 'Completed'
  | 'Cancelled';

export type LocationType = 'in-person' | 'online';

export interface IEventTask {
  id?: string;
  name: string;
  due: string;
  dueDate?: string;
  assignee: string;
  status: 'In Progress' | 'Pending' | 'Not Started' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High';
  progress?: number;
}

export interface IEventBudgetInfo {
  allocated: number;
  spent: number;
  status: 'Approved' | 'Pending Review' | 'Over Budget' | 'Rejected';
}

export type CompanyEvent = ICompanyEvent;
export interface ICompanyEvent {
  _id?: string;
  id: string;
  title: string;
  eventType?: string;
  type?: string;
  location?: string;
  participants?: any[];
  category?: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  timezone?: string;
  venue?: string;
  locationType?: LocationType;
  onlineUrl?: string;
  department?: string;
  organizer?: string;
  organizerId?: string;
  attendees?: string[];
  attendeeCount?: number;
  status: EventStatus;
  progress?: string;
  tasks?: IEventTask[];
  budget?: IEventBudgetInfo;
  sendReminder?: boolean;
  syncCalendar?: boolean;
  emailNotifications?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISupportEventReply {
  id?: string;
  author: string;
  text: string;
  date?: string;
  timestamp?: string;
}

export interface ISupportEvent {
  _id?: string;
  id: string;
  title: string;
  description: string;
  author: string;
  requesterEmail?: string;
  department?: string;
  category?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedAgent?: string;
  timeAgo?: string;
  replaysCount: number;
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  replies?: ISupportEventReply[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IEventsNewsletter {
  _id?: string;
  id: string;
  title: string;
  category: string;
  publishDate: string;
  scheduleDate?: string;
  author: string;
  reads: number;
  likes: number;
  likedBy?: string[];
  status: 'Published' | 'Draft' | 'Scheduled';
  summary: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEventExpense {
  id?: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  recordedBy?: string;
  approvalStatus?: 'Approved' | 'Pending Review' | 'Rejected';
  status?: 'Approved' | 'Pending Review' | 'Rejected' | string;
}

export interface IEventsBudgetItem {
  _id?: string;
  id: string;
  eventName?: string;
  eventTitle?: string;
  department?: string;
  eventId?: string;
  category: string;
  allocated: number;
  spent: number;
  status: 'Approved' | 'Pending Review' | 'Over Budget' | 'Rejected';
  owner?: string;
  expenses?: IEventExpense[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  eventType?: string;
  category?: string;
  department?: string;
  month?: string;
  year?: string;
}

export interface EventsSummaryStats {
  totalEvents: number;
  inProgressCount: number;
  upcomingCount: number;
  completedCount: number;
  totalBudgetPool: number;
  totalBudgetSpent: number;
  budgetVariance: number;
  totalNewsletters: number;
  totalSupportTickets: number;
}
