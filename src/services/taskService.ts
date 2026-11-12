const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/tasks`;

export type TaskColumn = 'new-task' | 'scheduled' | 'in-progress' | 'completed';

export interface KanbanTask {
  id: string | number;
  _id?: string;
  title: string;
  type?: string;
  dueDate?: string;
  column: TaskColumn;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  order?: number;
}

export interface TodoItem {
  id: string | number;
  _id?: string;
  title: string;
  category: string;
  completed: boolean;
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High';
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

export const taskService = {
  // ================= KANBAN TASKS =================
  async getTasks(params?: { column?: string; type?: string; search?: string }): Promise<KanbanTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.column) query.set('column', params.column);
      if (params?.type && params.type !== 'All') query.set('type', params.type);
      if (params?.search) query.set('search', params.search);

      const qs = query.toString();
      const data = await fetchJson<KanbanTask[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return data.map((t) => ({
          ...t,
          id: t._id || t.id,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch tasks from API, falling back to local defaults', err);
    }
    return [
      { id: 1, title: 'Prepare Calculus quiz questions', column: 'new-task', type: 'Operational' },
      { id: 2, title: 'Draft syllabus for Quantum Physics', column: 'new-task', type: 'Technical' },
      { id: 3, title: 'Verify Aisha Kumar Background PCC Documents', column: 'new-task', type: 'Hiring' },
      { id: 4, title: 'Review term exams schedule', column: 'scheduled', type: 'Strategic' },
      { id: 5, title: 'Schedule Q3 All-Hands Townhall Meeting', column: 'scheduled', type: 'Operational' },
      { id: 6, title: 'Onboard new math co-teacher', column: 'in-progress', type: 'Hiring' },
      { id: 7, title: 'Draft Executive Severance Letter for Restructure', column: 'in-progress', type: 'Financial' },
      { id: 8, title: 'Submit Q3 budget analysis', column: 'completed', type: 'Financial' },
      { id: 9, title: 'Complete Employee App Travel Documents Feature Test', column: 'completed', type: 'Technical' },
    ];
  },

  async createTask(task: Omit<KanbanTask, 'id' | '_id'>): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async updateTask(id: string | number, task: Partial<KanbanTask>): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async moveTask(id: string | number, column: TaskColumn, order?: number): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(`${BASE_URL}/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ column, order }),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async deleteTask(id: string | number): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= TODOS =================
  async getTodos(params?: { category?: string; completed?: boolean; search?: string }): Promise<TodoItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'All') query.set('category', params.category);
      if (params?.completed !== undefined) query.set('completed', String(params.completed));
      if (params?.search) query.set('search', params.search);

      const qs = query.toString();
      const data = await fetchJson<TodoItem[]>(`${BASE_URL}/todos${qs ? `?${qs}` : ''}`);
      if (Array.isArray(data)) {
        return data.map((td) => ({
          ...td,
          id: td._id || td.id,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch todos from API, falling back to local defaults', err);
    }
    return [
      { id: 101, title: 'Approve September Monthly Payroll OneTap Disbursement', category: 'Payroll', completed: true, dueDate: 'Today' },
      { id: 102, title: 'Conduct Exit Interview for Senior Frontend Engineer', category: 'Off-Boarding', completed: false, dueDate: 'Tomorrow' },
      { id: 103, title: 'Issue Repatriation Flight Ticket Voucher', category: 'Off-Boarding', completed: false, dueDate: 'Sept 06' },
      { id: 104, title: 'Publish Q3 Internal HR Newsletter & Events Schedule', category: 'Events', completed: true, dueDate: 'Aug 31' },
      { id: 105, title: 'Audit YubiKey Hardware Security Token Distribution', category: 'Compliance', completed: true, dueDate: 'Aug 28' },
    ];
  },

  async createTodo(todo: Omit<TodoItem, 'id' | '_id'>): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos`, {
      method: 'POST',
      body: JSON.stringify(todo),
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async toggleTodo(id: string | number): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos/${id}/toggle`, {
      method: 'PATCH',
    });
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  async deleteTodo(id: string | number): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
  },
};
