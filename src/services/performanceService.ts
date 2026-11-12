import { PerformanceReview } from '../types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/performance`;

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

export interface KPIItem {
  id: string;
  _id?: string;
  title: string;
  jobTitle?: string;
  department?: string;
  minRating?: number;
  maxRating?: number;
  weight?: number;
  status?: string;
}

export interface PerformanceTrackerItem {
  id: string;
  _id?: string;
  employeeId: string;
  trackerName: string;
  reviewers?: string[];
  logs?: Array<{ logDate: string; achievement: string; rating: number; reviewerName?: string }>;
  status?: string;
}

export interface AppraisalRecordItem {
  id: string;
  _id?: string;
  employeeId: string;
  period: string;
  appraisalType?: string;
  aiScore?: number;
  attendanceScore?: number;
  managerScore?: number;
  peerScore?: number;
  finalRating?: number;
  status?: 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Published';
  feedback?: string;
  competencies?: Array<{ name: string; score: number; status: string }>;
}

export const performanceService = {
  // Reviews
  async getPerformanceReviews(params?: {
    employeeId?: string;
    reviewerId?: string;
    status?: string;
    department?: string;
  }): Promise<PerformanceReview[]> {
    const query = new URLSearchParams();
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.reviewerId) query.append('reviewerId', params.reviewerId);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.department) query.append('department', params.department);
    const qs = query.toString();
    const data = await fetchJson<any[]>(`${BASE_URL}/reviews${qs ? `?${qs}` : ''}`);
    return (data || []).map((r) => ({
      id: r.id || r._id || '',
      employeeName: r.employeeName || (r.employeeId as any)?.firstName || r.employeeId || 'Employee',
      reviewer: r.reviewerName || r.reviewer || (r.reviewerId as any)?.firstName || 'Reviewer',
      reviewerName: r.reviewerName || r.reviewer || (r.reviewerId as any)?.firstName || 'Reviewer',
      jobTitle: r.jobTitle || 'Engineering',
      reviewPeriod: r.reviewPeriod || `${r.periodStart || '2026-01-01'} to ${r.periodEnd || '2026-12-31'}`,
      dueDate: r.dueDate || r.reviewDate || '2026-12-31',
      status: (r.status === 'Completed' ? 'Completed' : 'Pending Self Review'),
      rating: r.rating || r.score || 4.5,
      score: r.rating || r.score || 4.5,
      feedback: r.feedback || '',
    }));
  },

  async createReview(review: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const data = await fetchJson<any>(`${BASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        employeeId: review.employeeName,
        reviewerId: review.reviewer || review.reviewerName,
        reviewPeriod: review.reviewPeriod,
        dueDate: review.dueDate,
        rating: review.rating || review.score,
        feedback: review.feedback,
        status: review.status === 'Completed' ? 'Completed' : 'Pending',
      }),
    });
    return {
      id: data.id || data._id || '',
      employeeName: review.employeeName || '',
      reviewer: review.reviewer || review.reviewerName || '',
      reviewerName: review.reviewerName || review.reviewer || '',
      jobTitle: review.jobTitle || 'Engineering',
      reviewPeriod: review.reviewPeriod || '',
      dueDate: review.dueDate || '',
      status: review.status || 'Pending Self Review',
      rating: review.rating || review.score,
      score: review.score || review.rating,
      feedback: review.feedback,
    };
  },

  async updateReview(id: string, review: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const data = await fetchJson<any>(`${BASE_URL}/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    });
    return {
      id: data.id || data._id || id,
      employeeName: review.employeeName || '',
      reviewer: review.reviewer || review.reviewerName || '',
      reviewerName: review.reviewerName || review.reviewer || '',
      jobTitle: review.jobTitle || 'Engineering',
      reviewPeriod: review.reviewPeriod || '',
      dueDate: review.dueDate || '',
      status: review.status || 'Pending Self Review',
      rating: review.rating || review.score,
      score: review.score || review.rating,
      feedback: review.feedback,
    };
  },

  async savePerformanceReviews(reviews: PerformanceReview[]): Promise<void> {
    for (const r of reviews) {
      await this.createReview(r);
    }
  },

  // Trackers
  async getTrackers(employeeId?: string): Promise<PerformanceTrackerItem[]> {
    const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    const data = await fetchJson<any[]>(`${BASE_URL}/trackers${qs}`);
    return (data || []).map((t) => ({ ...t, id: t.id || t._id || '' }));
  },

  async createTracker(tracker: Partial<PerformanceTrackerItem>): Promise<PerformanceTrackerItem> {
    const data = await fetchJson<any>(`${BASE_URL}/trackers`, {
      method: 'POST',
      body: JSON.stringify(tracker),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  // Appraisals
  async getAppraisals(employeeId?: string): Promise<AppraisalRecordItem[]> {
    const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    const data = await fetchJson<any[]>(`${BASE_URL}/appraisals${qs}`);
    return (data || []).map((a) => ({ ...a, id: a.id || a._id || '' }));
  },

  async createAppraisal(appraisal: Partial<AppraisalRecordItem>): Promise<AppraisalRecordItem> {
    const data = await fetchJson<any>(`${BASE_URL}/appraisals`, {
      method: 'POST',
      body: JSON.stringify(appraisal),
    });
    return { ...data, id: data.id || data._id || '' };
  },

  // Summary
  async getSummaryStats(): Promise<any> {
    return fetchJson(`${BASE_URL}/stats/summary`);
  },
};

export default performanceService;
