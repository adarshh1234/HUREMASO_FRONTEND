import { Candidate, Vacancy } from '../types';

const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const RECRUITMENT_API_BASE = `${VITE_API_URL}/recruitment`;

export interface CandidateQueryParams {
  search?: string;
  vacancy?: string;
  status?: string;
  skills?: string;
  page?: number;
  limit?: number;
}

export interface VacancyQueryParams {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface JobPostingItem {
  id?: string;
  _id?: string;
  title: string;
  department: string;
  platformPostId?: string;
  locationType?: string;
  salaryRange?: string;
  applicantsCount?: number;
  liveUrl?: string;
  status?: string;
  platform?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const recruitmentService = {
  // ===================== CANDIDATES =====================
  async getCandidates(params?: CandidateQueryParams): Promise<Candidate[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const items = json.items || json.data || [];
        return items.map((item: any) => ({
          ...item,
          id: item.id || item._id,
          name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Candidate',
          email: item.email || '',
          phone: item.phone || item.contactNumber || '',
          vacancy: item.vacancy || item.jobTitle || (item.vacancyId?.title || item.vacancyId?.jobTitle) || 'General',
          hiringManager: item.hiringManager || 'HR Team',
          dateApplied: item.dateApplied || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-03-01'),
          status: item.status || 'Applied',
          experienceYears: item.experienceYears !== undefined ? item.experienceYears : (item.experience || 0),
          skills: Array.isArray(item.skills) ? item.skills : (typeof item.skills === 'string' ? item.skills.split(',').map((s: string) => s.trim()) : []),
          education: item.education || '',
          resumeUrl: item.resumeUrl || '',
          poolCategory: item.poolCategory || item.talentPool || (item.tags && item.tags[0]) || 'Technical Skills',
          talentPool: item.talentPool || item.poolCategory || (item.tags && item.tags[0]) || 'Technical Skills',
          notes: item.notes || '',
        }));
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
    }
    return [];
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        const item = json.data || json;
        return {
          ...item,
          id: item.id || item._id,
          name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Candidate',
          email: item.email || '',
          phone: item.phone || item.contactNumber || '',
          skills: Array.isArray(item.skills) ? item.skills : [],
          status: item.status || 'Applied',
        };
      }
    } catch (err) {
      console.error(`Error loading candidate ${id}:`, err);
    }
    return null;
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'dateApplied'> & { dateApplied?: string }): Promise<Candidate> {
    const payload = {
      ...candidate,
      tags: candidate.poolCategory ? [candidate.poolCategory] : candidate.skills,
    };
    const res = await fetch(`${RECRUITMENT_API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create candidate in MongoDB');
    }
    const created = json.data || json;
    return {
      ...created,
      id: created.id || created._id,
      name: created.name || candidate.name,
      email: created.email || candidate.email,
      phone: created.phone || candidate.phone,
      skills: created.skills || candidate.skills,
      experienceYears: created.experienceYears !== undefined ? created.experienceYears : candidate.experienceYears,
      education: created.education || candidate.education,
      resumeUrl: created.resumeUrl || candidate.resumeUrl,
      poolCategory: candidate.poolCategory || 'Technical Skills',
      talentPool: candidate.talentPool || candidate.poolCategory || 'Technical Skills',
      status: created.status || candidate.status || 'Applied',
      dateApplied: created.dateApplied || candidate.dateApplied || new Date().toISOString().split('T')[0],
    };
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update candidate');
    }
    const data = json.data || json;
    return { ...data, id: data.id || data._id };
  },

  async updateCandidateStatus(id: string, status: string, comment?: string): Promise<Candidate> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update candidate status');
    }
    const data = json.data || json;
    return { ...data, id: data.id || data._id };
  },

  async deleteCandidate(id: string): Promise<void> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Failed to delete candidate');
    }
  },

  // ===================== VACANCIES =====================
  async getVacancies(params?: VacancyQueryParams): Promise<Vacancy[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
      }
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const items = json.items || json.data || [];
        return items.map((item: any) => ({
          ...item,
          id: item.id || item._id,
          department: item.department || item.vacancy || item.title || 'General',
          jobTitle: item.jobTitle || item.title || 'Position',
          hiringManager: item.hiringManager || 'HR Manager',
          noOfOpenings: item.noOfOpenings || item.numberOfPositions || 1,
          filledPositions: item.filledPositions !== undefined ? item.filledPositions : 0,
          remainingPositions: item.remainingPositions !== undefined ? item.remainingPositions : (item.noOfOpenings || item.numberOfPositions || 1),
          description: item.description || item.jobDescription || '',
          requirements: item.requirements || '',
          status: item.status || 'Available',
          datePosted: item.datePosted || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-03-01'),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
      }
    } catch (err) {
      console.error('Error loading vacancies:', err);
    }
    return [];
  },

  async getVacancyById(id: string): Promise<Vacancy | null> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        const item = json.data || json;
        return {
          ...item,
          id: item.id || item._id,
          department: item.department || item.vacancy || item.title || 'General',
          jobTitle: item.jobTitle || item.title || 'Position',
          noOfOpenings: item.noOfOpenings || item.numberOfPositions || 1,
          status: item.status || 'Available',
        };
      }
    } catch (err) {
      console.error(`Error loading vacancy ${id}:`, err);
    }
    return null;
  },

  async getVacancyPipeline(id: string): Promise<any> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${encodeURIComponent(id)}/pipeline`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (err) {
      console.error(`Error loading vacancy pipeline for ${id}:`, err);
    }
    return null;
  },

  async createVacancy(vacancy: Omit<Vacancy, 'id' | 'datePosted'> & { datePosted?: string }): Promise<Vacancy> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacancy),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create vacancy');
    }
    const created = json.data || json;
    return {
      ...created,
      id: created.id || created._id,
      noOfOpenings: created.noOfOpenings || created.numberOfPositions || vacancy.noOfOpenings || 1,
      filledPositions: 0,
      remainingPositions: created.noOfOpenings || vacancy.noOfOpenings || 1,
    };
  },

  async updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update vacancy');
    }
    const data = json.data || json;
    return { ...data, id: data.id || data._id };
  },

  async updateVacancyStatus(id: string, status: string): Promise<Vacancy> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update vacancy status');
    }
    const data = json.data || json;
    return { ...data, id: data.id || data._id };
  },

  async deleteVacancy(id: string): Promise<void> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Failed to delete vacancy');
    }
  },

  // ===================== JOB POSTINGS & LETGETIN =====================
  async getJobPostings(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
      const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch (err) {
      console.error('Error fetching job postings:', err);
    }
    return [];
  },

  async getJobPostingById(id: string): Promise<any> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (err) {
      console.error(`Error fetching job posting ${id}:`, err);
    }
    return null;
  },

  async createJobPosting(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create job posting');
    }
    return json.data || json;
  },

  async updateJobPosting(id: string, data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update job posting');
    }
    return json.data || json;
  },

  async publishJobPosting(id: string, platform = 'LetsGetIn'): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to publish job posting');
    }
    return json.data || json;
  },

  async unpublishJobPosting(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}/unpublish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to unpublish job');
    }
    return json.data || json;
  },

  async closeJobPosting(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}/close`, {
      method: 'POST',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to close job posting');
    }
    return json.data || json;
  },

  async deleteJobPosting(id: string): Promise<void> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || 'Failed to delete job posting');
    }
  },

  async postToLetGetIn(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/post-letgetin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to publish job to LetGetIn');
    }
    return json.data || json;
  },

  async getActiveLetGetIn(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
      const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/letgetin/active?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch (err) {
      console.error('Error fetching active LetGetIn postings:', err);
    }
    return [];
  },

  async syncLetGetIn(): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/letgetin/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to synchronize with LetGetIn network');
    }
    return json.data || json;
  },

  // ===================== TALENT POOL =====================
  async getTalentPools(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
      const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch (err) {
      console.error('Error fetching talent pools:', err);
    }
    return [];
  },

  async createTalentPool(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create talent pool');
    }
    return json.data || json;
  },

  async updateTalentPool(id: string, data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update talent pool');
    }
    return json.data || json;
  },

  async deleteTalentPool(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to delete talent pool');
    }
    return json;
  },

  async addCandidateToPool(poolId: string, data: { candidateId: string; notes?: string; rating?: number }): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${encodeURIComponent(poolId)}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to add candidate to talent pool');
    }
    return json.data || json;
  },

  async removeCandidateFromPool(poolId: string, candidateId: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${encodeURIComponent(poolId)}/candidates/${encodeURIComponent(candidateId)}`, {
      method: 'DELETE',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to remove candidate from talent pool');
    }
    return json.data || json;
  },

  async associateCandidateWithJob(poolId: string, candidateId: string, vacancyId: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${encodeURIComponent(poolId)}/associate-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, vacancyId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to associate candidate with job vacancy');
    }
    return json.data || json;
  },

  // ===================== APPLICATIONS & PIPELINE =====================
  async getApplications(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
      const res = await fetch(`${RECRUITMENT_API_BASE}/applications?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getApplicationMetrics(): Promise<any> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/applications/metrics`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    return {};
  },

  async createApplication(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateApplicationStatus(id: string, data: { status: string; stage?: string; comment?: string }): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/applications/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteApplication(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/applications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json().catch(() => ({}));
  },

  // ===================== RESUMES & CV PARSER =====================
  async getResumes(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            searchParams.append(k, String(v));
          }
        });
      }
      const res = await fetch(`${RECRUITMENT_API_BASE}/resumes?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getResumeMetrics(): Promise<{
    totalResumes: number;
    verifiedCount: number;
    highMatchCount: number;
    shortlistedCount: number;
  }> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/metrics`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    return { totalResumes: 0, verifiedCount: 0, highMatchCount: 0, shortlistedCount: 0 };
  },

  async syncLetsGetInResumes(): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/sync-letsgetin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to sync resumes from LetsGetIn network');
    }
    return json.data || json;
  },

  async createResume(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to create resume');
    }
    return json.data || json;
  },

  async deleteResume(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json().catch(() => ({}));
  },

  async matchResumeVacancy(resumeId: string, vacancyId: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/${encodeURIComponent(resumeId)}/match-vacancy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vacancyId }),
    });
    return res.json();
  },

  async parseCv(data: { rawText?: string; vacancyId?: string; targetSkills?: string[]; fileName?: string; fileUrl?: string }): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/parse-cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to parse CV');
    }
    return json.data || json;
  },

  // ===================== INTERVIEWS & FEEDBACK =====================
  async getInterviews(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
      const res = await fetch(`${RECRUITMENT_API_BASE}/interviews?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.items || json.data || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async createInterview(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getFeedback(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            searchParams.append(k, String(v));
          }
        });
      }
      const res = await fetch(`${RECRUITMENT_API_BASE}/feedback?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async createFeedback(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.message || 'Failed to submit interview feedback');
    }
    return json.data || json;
  },

  async deleteFeedback(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/feedback/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json().catch(() => ({}));
  },
};

export default recruitmentService;
