import { Candidate, Vacancy } from '../types';
import { getCandidates, saveCandidates, getVacancies, saveVacancies } from '../data/mockData';

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
        if (items.length > 0) {
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
      }
    } catch {
      // Fallback
    }
    return getCandidates();
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    return getCandidates().find((c) => c.id === id) || null;
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'dateApplied'> & { dateApplied?: string }): Promise<Candidate> {
    try {
      const payload = {
        ...candidate,
        tags: candidate.poolCategory ? [candidate.poolCategory] : candidate.skills,
      };
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
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
      }
    } catch {
      // Fallback
    }
    const list = getCandidates();
    const newCand: Candidate = {
      ...candidate,
      id: `CAND-${Math.floor(100 + Math.random() * 900)}`,
      dateApplied: candidate.dateApplied || new Date().toISOString().split('T')[0],
    };
    saveCandidates([newCand, ...list]);
    return newCand;
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    const list = getCandidates();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Candidate not found');
    list[index] = { ...list[index], ...updates };
    saveCandidates(list);
    return list[index];
  },

  async updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    const list = getCandidates();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Candidate not found');
    list[index].status = status;
    saveCandidates(list);
    return list[index];
  },

  async convertToEmployee(candidateId: string, payload?: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/candidates/${candidateId}/convert-to-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      throw new Error('Failed to convert candidate to employee');
    }
    return res.json();
  },

  async deleteCandidate(id: string): Promise<void> {
    try {
      await fetch(`${RECRUITMENT_API_BASE}/candidates/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const list = getCandidates().filter((c) => c.id !== id);
    saveCandidates(list);
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
        if (items.length > 0) {
          return items.map((item: any) => ({
            ...item,
            id: item.id || item._id,
            department: item.department || item.vacancy || item.title || 'General',
            jobTitle: item.jobTitle || item.title || 'Position',
            hiringManager: item.hiringManager || 'HR Manager',
            noOfOpenings: item.noOfOpenings || item.numberOfPositions || 1,
            description: item.description || item.jobDescription || '',
            requirements: item.requirements || '',
            status: item.status || 'Available',
            datePosted: item.datePosted || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-03-01'),
          }));
        }
      }
    } catch {
      // Fallback
    }
    return getVacancies();
  },

  async createVacancy(vacancy: Omit<Vacancy, 'id' | 'datePosted'> & { datePosted?: string }): Promise<Vacancy> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacancy),
      });
      if (res.ok) {
        const json = await res.json();
        const created = json.data || json;
        return {
          ...created,
          id: created.id || created._id,
        };
      }
    } catch {
      // Fallback
    }
    const list = getVacancies();
    const newVac: Vacancy = {
      ...vacancy,
      id: `VAC-${Math.floor(100 + Math.random() * 900)}`,
      datePosted: vacancy.datePosted || new Date().toISOString().split('T')[0],
      requirements: vacancy.requirements || '',
    };
    saveVacancies([newVac, ...list]);
    return newVac;
  },

  async updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    const list = getVacancies();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vacancy not found');
    list[index] = { ...list[index], ...updates };
    saveVacancies(list);
    return list[index];
  },

  async updateVacancyStatus(id: string, status: 'Available' | 'Closed'): Promise<Vacancy> {
    try {
      const res = await fetch(`${RECRUITMENT_API_BASE}/vacancies/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Fallback
    }
    const list = getVacancies();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vacancy not found');
    list[index].status = status;
    saveVacancies(list);
    return list[index];
  },

  async deleteVacancy(id: string): Promise<void> {
    try {
      await fetch(`${RECRUITMENT_API_BASE}/vacancies/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    const list = getVacancies().filter((v) => v.id !== id);
    saveVacancies(list);
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
    } catch {
      // Fallback
    }
    return [];
  },

  async createJobPosting(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async publishJobPosting(id: string, platform = 'LetsGetIn'): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    return res.json();
  },

  async closeJobPosting(id: string): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/job-postings/${id}/close`, {
      method: 'POST',
    });
    return res.json();
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
    const res = await fetch(`${RECRUITMENT_API_BASE}/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ===================== RESUMES & CV PARSER =====================
  async getResumes(params?: any): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams(params || {});
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

  async parseCv(data: { rawText?: string; vacancyId?: string; targetSkills?: string[]; fileName?: string }): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/resumes/parse-cv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
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
      const searchParams = new URLSearchParams(params || {});
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
    return res.json();
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
    } catch {
      // Fallback
    }
    return [];
  },

  async createTalentPool(data: any): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addCandidateToPool(poolId: string, data: { candidateId: string; notes?: string; rating?: number }): Promise<any> {
    const res = await fetch(`${RECRUITMENT_API_BASE}/talent-pool/${poolId}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

export default recruitmentService;
