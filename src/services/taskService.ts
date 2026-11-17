const VITE_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const BASE_URL = `${VITE_API_URL}/tasks`;

export type TaskColumn = 'new-task' | 'scheduled' | 'in-progress' | 'completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface KanbanTask {
  id: string;
  _id?: string;
  title: string;
  type?: string;
  dueDate?: string;
  startDate?: string;
  column: TaskColumn;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TodoItem {
  id: string;
  _id?: string;
  title: string;
  category: string;
  completed: boolean;
  completedAt?: string;
  dueDate: string;
  priority?: string;
  description?: string;
  employeeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCounts {
  total: number;
  newTask: number;
  scheduled: number;
  inProgress: number;
  completed: number;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface SimpleEmployee {
  id: string;
  name: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
  const userId = localStorage.getItem('userId') || 'user-admin';
  const userRole = localStorage.getItem('userRole') || 'hr-admin';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': userRole,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
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
  async getTasks(params?: {
    column?: string;
    type?: string;
    priority?: string;
    search?: string;
    assigneeId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<KanbanTask[]> {
    const query = new URLSearchParams();
    if (params?.column && params.column !== 'all') query.set('column', params.column);
    if (params?.type && params.type !== 'All') query.set('type', params.type);
    if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const qs = query.toString();
    const data = await fetchJson<KanbanTask[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) {
      return data.map((t) => ({
        ...t,
        id: (t._id || t.id || '').toString(),
      }));
    }
    return [];
  },

  async getTaskById(id: string): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(`${BASE_URL}/${id}`);
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async createTask(task: Partial<KanbanTask>): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async updateTask(id: string, task: Partial<KanbanTask>): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async moveTask(id: string, column: TaskColumn): Promise<KanbanTask> {
    const data = await fetchJson<KanbanTask>(`${BASE_URL}/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ column }),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async deleteTask(id: string): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  async getTaskCounts(): Promise<TaskCounts> {
    return await fetchJson<TaskCounts>(`${BASE_URL}/counts`);
  },

  // ================= TODOS =================
  async getTodos(params?: {
    category?: string;
    completed?: boolean;
    priority?: string;
    search?: string;
  }): Promise<TodoItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.completed !== undefined) query.set('completed', String(params.completed));
    if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    const data = await fetchJson<TodoItem[]>(`${BASE_URL}/todos${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data)) {
      return data.map((td) => ({
        ...td,
        id: (td._id || td.id || '').toString(),
      }));
    }
    return [];
  },

  async getTodoById(id: string): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos/${id}`);
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async createTodo(todo: Partial<TodoItem>): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos`, {
      method: 'POST',
      body: JSON.stringify(todo),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async updateTodo(id: string, todo: Partial<TodoItem>): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todo),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async toggleTodo(id: string, completed?: boolean): Promise<TodoItem> {
    const data = await fetchJson<TodoItem>(`${BASE_URL}/todos/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify(completed !== undefined ? { completed } : {}),
    });
    return {
      ...data,
      id: (data._id || data.id || '').toString(),
    };
  },

  async deleteTodo(id: string): Promise<void> {
    await fetchJson<void>(`${BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
  },

  async getTodoStats(): Promise<TodoStats> {
    return await fetchJson<TodoStats>(`${BASE_URL}/todos/stats`);
  },

  // ================= EMPLOYEES HELPER =================
  async getEmployees(): Promise<SimpleEmployee[]> {
    try {
      const data = await fetchJson<any[]>(`${VITE_API_URL}/employees?limit=100`);
      if (Array.isArray(data)) {
        return data.map((emp) => ({
          id: (emp._id || emp.id || '').toString(),
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Unnamed Employee',
          jobTitle: emp.jobTitle || emp.position,
          department: emp.department,
          avatar: emp.avatar,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch employees for task assignment, using fallbacks');
    }
    return [
      { id: 'emp-1', name: 'Elena Rostova', jobTitle: 'Principal Architect', department: 'Engineering' },
      { id: 'emp-2', name: 'Marcus Vance', jobTitle: 'Staff Platform Engineer', department: 'Cloud Infra' },
      { id: 'emp-3', name: 'Sarah Joseph', jobTitle: 'VP People Operations', department: 'Human Resources' },
      { id: 'emp-4', name: 'Carlos Gomez', jobTitle: 'Senior DevOps Engineer', department: 'Engineering' },
      { id: 'emp-5', name: 'Michael Chang', jobTitle: 'Chief Legal Officer', department: 'Legal & Compliance' },
    ];
  },
};
