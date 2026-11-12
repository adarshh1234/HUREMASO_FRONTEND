const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/employee-config`;

export interface OptionalFieldsConfig {
  showNickname: boolean;
  askSmoker: boolean;
  getFamilyDetails: boolean;
  getEducationDetails: boolean;
  showMilitaryService?: boolean;
}

export interface CustomFieldConfig {
  id?: string;
  name: string;
  screen: string;
  fieldType: string;
}

export interface ReportingMethodConfig {
  id?: string;
  name: string;
}

export interface TerminationReasonConfig {
  id?: string;
  name: string;
}

export interface EmployeeConfigurationData {
  optionalFields: OptionalFieldsConfig;
  customFields: CustomFieldConfig[];
  reportingMethods: ReportingMethodConfig[];
  terminationReasons: TerminationReasonConfig[];
}

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

export const employeeConfigService = {
  async getConfig(): Promise<EmployeeConfigurationData> {
    const data = await fetchJson<any>(BASE_URL);
    return {
      optionalFields: data?.optionalFields || {
        showNickname: true,
        askSmoker: true,
        getFamilyDetails: true,
        getEducationDetails: true,
      },
      customFields: (data?.customFields || []).map((f: any) => ({
        id: f.id || f._id || f.name,
        name: f.name,
        screen: f.screen || 'Personal Details',
        fieldType: f.fieldType || 'Text or Number',
      })),
      reportingMethods: (data?.reportingMethods || []).map((m: any) => ({
        id: m.id || m._id || m.name,
        name: m.name,
      })),
      terminationReasons: (data?.terminationReasons || []).map((r: any) => ({
        id: r.id || r._id || r.name,
        name: r.name,
      })),
    };
  },

  async updateConfig(data: Partial<EmployeeConfigurationData>): Promise<EmployeeConfigurationData> {
    return fetchJson<EmployeeConfigurationData>(BASE_URL, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateOptionalFields(optionalFields: OptionalFieldsConfig): Promise<OptionalFieldsConfig> {
    return fetchJson<OptionalFieldsConfig>(`${BASE_URL}/optional-fields`, {
      method: 'PUT',
      body: JSON.stringify(optionalFields),
    });
  },

  async addCustomField(field: CustomFieldConfig): Promise<CustomFieldConfig[]> {
    return fetchJson<CustomFieldConfig[]>(`${BASE_URL}/custom-fields`, {
      method: 'POST',
      body: JSON.stringify(field),
    });
  },

  async deleteCustomField(id: string): Promise<CustomFieldConfig[]> {
    return fetchJson<CustomFieldConfig[]>(`${BASE_URL}/custom-fields/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async addReportingMethod(method: { name: string }): Promise<ReportingMethodConfig[]> {
    return fetchJson<ReportingMethodConfig[]>(`${BASE_URL}/reporting-methods`, {
      method: 'POST',
      body: JSON.stringify(method),
    });
  },

  async deleteReportingMethod(id: string): Promise<ReportingMethodConfig[]> {
    return fetchJson<ReportingMethodConfig[]>(`${BASE_URL}/reporting-methods/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async addTerminationReason(reason: { name: string }): Promise<TerminationReasonConfig[]> {
    return fetchJson<TerminationReasonConfig[]>(`${BASE_URL}/termination-reasons`, {
      method: 'POST',
      body: JSON.stringify(reason),
    });
  },

  async deleteTerminationReason(id: string): Promise<TerminationReasonConfig[]> {
    return fetchJson<TerminationReasonConfig[]>(`${BASE_URL}/termination-reasons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async importData(records: any[]): Promise<{ importedCount: number; errors: any[] }> {
    return fetchJson<{ importedCount: number; errors: any[] }>(`${BASE_URL}/import`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },
};

export default employeeConfigService;
