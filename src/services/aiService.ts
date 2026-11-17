const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/ai`;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  time?: string;
  timestamp?: string;
  category?: string;
  suggestedActions?: string[];
  citations?: string[];
  isDraftTemplate?: boolean;
}

export interface WorkforceAnalytics {
  projectedTurnoverRate: number;
  industryTurnoverBenchmark: number;
  retentionScore: number;
  workforceHealthIndex: number;
  totalEmployeesEvaluated: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  departmentRiskDistribution: Record<string, { high: number; medium: number; low: number }>;
}

export interface FlightRiskItem {
  id: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  jobTitle?: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  riskScore: number;
  indicators: Array<{ factor: string; weight: number; description?: string }>;
  recommendedActions: string[];
  status: 'Open' | 'Mitigating' | 'Resolved' | 'Dismissed';
  notes?: string;
}

export interface SkillGapItem {
  id: string;
  _id?: string;
  department: string;
  skillName: string;
  category: string;
  targetCompetencyScore: number;
  currentTeamScore: number;
  gapPercentage: number;
  readinessLevel: number;
  requiredStaffCount: number;
  qualifiedStaffCount: number;
  upskillingRecommended: boolean;
  notes?: string;
}

export interface ComplianceItem {
  id: string;
  _id?: string;
  complianceCode: string;
  title: string;
  category: string;
  jurisdiction: string;
  status: 'Compliant' | 'At Risk' | 'Non-Compliant' | 'Audit Ready';
  auditScore: number;
  discrepanciesCount: number;
  lastAuditedAt: string;
  nextDeadline: string;
  description: string;
  autoScanEnabled: boolean;
  affectedEmployeesCount?: number;
}

export interface DevelopmentRecommendationItem {
  id: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  recommendationTitle: string;
  recommendationType: 'Training' | 'Mentorship' | 'Course' | 'Certification' | 'Project';
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedDuration?: string;
  provider?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Dismissed';
  targetSkill?: string;
  progressPercentage?: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u.id || u._id) headers['x-user-id'] = u.id || u._id;
      if (u.name || u.empName) headers['x-user-name'] = u.name || u.empName;
      if (u.role) headers['x-user-role'] = u.role;
    } catch {
      // Ignore
    }
  } else {
    // Default logged-in role context for administrative AI dashboard access
    headers['x-user-id'] = 'user-1';
    headers['x-user-name'] = 'Sarah Joseph';
    headers['x-user-role'] = 'Admin';
  }
  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = getAuthHeaders();
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...options?.headers },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export const aiService = {
  // 1. Workforce Analytics & Flight Risk
  async getWorkforceAnalytics(): Promise<WorkforceAnalytics> {
    return fetchJson<WorkforceAnalytics>(`${BASE_URL}/workforce/analytics`);
  },

  async getFlightRisks(params?: { department?: string; riskLevel?: string; status?: string }): Promise<FlightRiskItem[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.append(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return fetchJson<FlightRiskItem[]>(`${BASE_URL}/workforce/flight-risks${qs ? `?${qs}` : ''}`);
  },

  async resolveFlightRisk(id: string, notes = 'Mitigation actions executed'): Promise<FlightRiskItem> {
    return fetchJson<FlightRiskItem>(`${BASE_URL}/workforce/flight-risks/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },

  async deleteFlightRisk(id: string): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/workforce/flight-risks/${id}`, {
      method: 'DELETE',
    });
  },

  // 2. Performance & Skill Gaps
  async getSkillGaps(): Promise<SkillGapItem[]> {
    return fetchJson<SkillGapItem[]>(`${BASE_URL}/performance/skills`);
  },

  async getDevelopmentRecommendations(employeeId?: string): Promise<DevelopmentRecommendationItem[]> {
    const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
    return fetchJson<DevelopmentRecommendationItem[]>(`${BASE_URL}/performance/recommendations${qs}`);
  },

  // 3. Conversational HR & EX
  async getConversation(conversationId = 'default-chat'): Promise<{ messages: ChatMessage[] }> {
    return fetchJson<{ messages: ChatMessage[] }>(`${BASE_URL}/chat/conversation?conversationId=${encodeURIComponent(conversationId)}`);
  },

  async sendChatMessage(message: string, conversationId = 'default-chat'): Promise<{ conversation: any; aiResponse: any }> {
    return fetchJson<any>(`${BASE_URL}/chat/message`, {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  },

  async clearConversation(conversationId = 'default-chat'): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/chat/clear`, {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });
  },

  async getSentimentMetrics(): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/ex/sentiment`);
  },

  async syncKnowledgeBase(): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/knowledge-base/sync`, {
      method: 'POST',
    });
  },

  async getKnowledgeDocuments(): Promise<any[]> {
    return fetchJson<any[]>(`${BASE_URL}/knowledge-base/documents`);
  },

  async getKnowledgeChunks(documentId?: string): Promise<any[]> {
    const qs = documentId ? `?documentId=${encodeURIComponent(documentId)}` : '';
    return fetchJson<any[]>(`${BASE_URL}/knowledge-base/chunks${qs}`);
  },

  async searchKnowledgeBase(q: string): Promise<any[]> {
    return fetchJson<any[]>(`${BASE_URL}/knowledge-base/search?q=${encodeURIComponent(q)}`);
  },

  // 4. Automated Compliance
  async getComplianceRecords(): Promise<ComplianceItem[]> {
    return fetchJson<ComplianceItem[]>(`${BASE_URL}/compliance`);
  },

  async runComplianceScan(): Promise<any> {
    return fetchJson<any>(`${BASE_URL}/compliance/scan`, {
      method: 'POST',
    });
  },
};

export default aiService;
