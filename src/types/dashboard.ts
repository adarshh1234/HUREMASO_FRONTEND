export interface TimeWeeklyDayMetric {
  day: string;
  shortDay: string;
  date: string;
  hours: number;
}

export interface TimeAtWorkMetric {
  punchedIn: boolean;
  punchedAt?: string;
  statusText: string;
  todayDurationMinutes: number;
  todayFormattedTime: string;
  weekRangeLabel: string;
  weeklyHours: TimeWeeklyDayMetric[];
  employeeName?: string;
  employeeAvatar?: string;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage?: number;
}

export interface WorkforceMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  terminatedEmployees: number;
  departmentDistribution: DistributionItem[];
  subUnitDistribution: DistributionItem[];
  locationDistribution: DistributionItem[];
  employmentStatusDistribution: DistributionItem[];
}

export interface EmployeeOnLeaveItem {
  id: string;
  employeeId: string;
  name: string;
  subUnit: string;
  department: string;
  leaveType: string;
  avatar?: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
}

export interface AttendanceLeaveMetrics {
  todayPresents: number;
  todayAbsence: number;
  onLeaveToday: number;
  pendingLeaveRequestsCount: number;
  approvedLeaveRequestsCount: number;
  employeesOnLeaveToday: EmployeeOnLeaveItem[];
  leaveTypeDistribution: DistributionItem[];
}

export interface PayrollMetrics {
  totalMonthlyPayroll: number;
  paidAmount: number;
  pendingAmount: number;
  disbursedCount: number;
  pendingCount: number;
  currency: string;
}

export interface RecruitmentOnboardingMetrics {
  openVacanciesCount: number;
  activeCandidatesCount: number;
  candidatesToInterviewCount: number;
  onboardingCount: number;
  offboardingCount: number;
  newApplicationsCount: number;
}

export interface PerformanceMetrics {
  pendingSelfReviewsCount: number;
  pendingAppraisalsCount: number;
  completedAppraisalsCount: number;
  averagePerformanceRating: number;
}

export interface ActionItem {
  id: string;
  title: string;
  count: number;
  module: string;
  route: string;
  icon?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MyActionsMetrics {
  pendingSelfReviews: number;
  candidatesToInterview: number;
  timesheetsToApprove: number;
  pendingLeaveApprovals: number;
  pendingEmployeeRequests: number;
  pendingTasksCount: number;
  items: ActionItem[];
}

export interface BuzzPost {
  id: string;
  author: string;
  authorId?: string;
  avatar?: string;
  date: string;
  formattedDate: string;
  content: string;
  type: string;
  title?: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'leave' | 'recruitment' | 'attendance' | 'payroll' | 'employee' | 'task' | 'general';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  actor?: string;
  badge?: string;
}

export interface DashboardOverviewResponse {
  timeAtWork: TimeAtWorkMetric;
  workforce: WorkforceMetrics;
  attendanceLeave: AttendanceLeaveMetrics;
  payroll: PayrollMetrics;
  recruitment: RecruitmentOnboardingMetrics;
  performance: PerformanceMetrics;
  myActions: MyActionsMetrics;
  buzzPosts: BuzzPost[];
  recentActivities: RecentActivityItem[];
}

export interface DashboardSummaryMetrics {
  totalEmployees: number;
  todayPresents: number;
  todayAbsence: number;
  onLeaveToday: number;
  openVacancies: number;
  pendingActionsTotal: number;
  monthlyPayrollTotal: number;
}
