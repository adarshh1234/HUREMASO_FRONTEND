export type EventStatus = 'Draft' | 'Planing' | 'Planning' | 'In Progress' | 'Up coming' | 'Upcoming' | 'Completed' | 'Cancelled';
export type LocationType = 'in-person' | 'online';

export interface IEventTask {
  id?: string;
  name: string;
  due: string;
  dueDate?: string;
  assignee: string;
  status: 'In Progress' | 'Pending' | 'Not Started' | 'Completed';
  progress?: number;
}

export interface IEventBudgetInfo {
  allocated: number;
  spent: number;
  status: 'Approved' | 'Pending Review' | 'Over Budget';
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

export interface ISupportEvent {
  _id?: string;
  id: string;
  title: string;
  description: string;
  author: string;
  timeAgo?: string;
  replaysCount: number;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  replies?: Array<{ author: string; text: string; date: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEventsNewsletter {
  _id?: string;
  id: string;
  title: string;
  category: string;
  publishDate: string;
  author: string;
  reads: number;
  likes: number;
  status: 'Published' | 'Draft' | 'Scheduled';
  summary: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEventsBudgetItem {
  _id?: string;
  id: string;
  eventName: string;
  eventId?: string;
  category: string;
  allocated: number;
  spent: number;
  status: 'Approved' | 'Pending Review' | 'Over Budget';
  owner: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  eventType?: string;
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
