import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  CheckSquare, 
  Plus, 
  CheckCircle2, 
  Search,
  ChevronDown,
  Calendar,
  X,
  Settings,
  Loader2,
  Trash2,
  Edit3,
  Clock,
  User,
  AlertCircle,
  Filter,
  Check,
  Flag,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { 
  taskService, 
  KanbanTask, 
  TodoItem, 
  TaskColumn, 
  TaskPriority, 
  TaskCounts, 
  TodoStats,
  SimpleEmployee 
} from '../../services/taskService';

export const TasksPage: React.FC = () => {
  const toast = useToast();
  const location = useLocation();
  const path = location.pathname;

  const isKanban = path.includes('/tasks/kanban') || (!path.includes('/tasks/todo') && !path.includes('/tasks/kanban'));
  const isTodo = path.includes('/tasks/todo');

  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  // Task Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState('All');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('All');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('All');

  // Todo Filters
  const [todoSearch, setTodoSearch] = useState('');
  const [todoCategoryFilter, setTodoCategoryFilter] = useState('All');
  const [todoStatusFilter, setTodoStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  // Inline Creation Card State (Preserved from original design)
  const [isInlineTaskOpen, setIsInlineTaskOpen] = useState(false);
  const [inlineTaskName, setInlineTaskName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('Operational');

  // Calendar Date Picker Popover State (Preserved from original design)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDateDay, setSelectedDateDay] = useState(18);

  // Todo Quick Add Form State
  const [newTodoInput, setNewTodoInput] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('General');
  const [newTodoDueDate, setNewTodoDueDate] = useState('Today');
  const [newTodoPriority, setNewTodoPriority] = useState('Normal');

  // Modals State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

  const [showEditTodoModal, setShowEditTodoModal] = useState(false);
  const [showDeleteTodoConfirm, setShowDeleteTodoConfirm] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);

  // Full Task Form State
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formTaskType, setFormTaskType] = useState('Operational');
  const [formTaskColumn, setFormTaskColumn] = useState<TaskColumn>('new-task');
  const [formTaskPriority, setFormTaskPriority] = useState<TaskPriority>('Medium');
  const [formTaskDueDate, setFormTaskDueDate] = useState('Dec 20');
  const [formTaskStartDate, setFormTaskStartDate] = useState('');
  const [formTaskAssigneeId, setFormTaskAssigneeId] = useState('');
  const [formTaskDescription, setFormTaskDescription] = useState('');

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Counts & Stats
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    total: 0,
    newTask: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
  });

  const [todoStats, setTodoStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    pending: 0,
    percentage: 0,
  });

  // Fetch Kanban Tasks
  const fetchKanban = async () => {
    try {
      setLoading(true);
      const [tasks, counts, empList] = await Promise.all([
        taskService.getTasks({
          search: taskSearch,
          type: taskTypeFilter,
          priority: taskPriorityFilter,
          assigneeId: taskAssigneeFilter !== 'All' ? taskAssigneeFilter : undefined,
        }),
        taskService.getTaskCounts().catch(() => ({
          total: 0,
          newTask: 0,
          scheduled: 0,
          inProgress: 0,
          completed: 0,
        })),
        taskService.getEmployees().catch(() => []),
      ]);
      setKanbanTasks(tasks);
      setTaskCounts(counts);
      setEmployees(empList);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Todos
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const [todos, stats] = await Promise.all([
        taskService.getTodos({
          search: todoSearch,
          category: todoCategoryFilter,
          completed: todoStatusFilter === 'All' ? undefined : todoStatusFilter === 'Completed',
        }),
        taskService.getTodoStats().catch(() => ({
          total: 0,
          completed: 0,
          pending: 0,
          percentage: 0,
        })),
      ]);
      setTodoItems(todos);
      setTodoStats(stats);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isKanban) {
      fetchKanban();
    } else if (isTodo) {
      fetchTodos();
    }
  }, [path, taskTypeFilter, taskPriorityFilter, taskAssigneeFilter, todoCategoryFilter, todoStatusFilter]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isKanban) fetchKanban();
      if (isTodo) fetchTodos();
    }, 250);
    return () => clearTimeout(timer);
  }, [taskSearch, todoSearch]);

  // ================= KANBAN ACTIONS =================

  // Save Inline Task (Preserved from UI design)
  const handleSaveInlineTask = async () => {
    if (!inlineTaskName.trim()) {
      toast.error('Please enter a task name');
      return;
    }
    try {
      const created = await taskService.createTask({
        title: inlineTaskName.trim(),
        type: selectedType,
        dueDate: `Dec ${selectedDateDay}`,
        column: 'new-task',
        priority: 'Medium',
      });
      setKanbanTasks([created, ...kanbanTasks]);
      toast.success(`Task "${inlineTaskName.trim()}" added to New task!`);
      setInlineTaskName('');
      setIsInlineTaskOpen(false);
      setIsDropdownOpen(false);
      setIsCalendarOpen(false);
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  // Create Task (Full Modal)
  const handleCreateFullTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    const assignee = employees.find((emp) => emp.id === formTaskAssigneeId);
    try {
      const created = await taskService.createTask({
        title: formTaskTitle.trim(),
        type: formTaskType,
        column: formTaskColumn,
        priority: formTaskPriority,
        dueDate: formTaskDueDate,
        startDate: formTaskStartDate || undefined,
        assigneeId: formTaskAssigneeId || undefined,
        assigneeName: assignee ? assignee.name : undefined,
        description: formTaskDescription.trim() || undefined,
      });
      setKanbanTasks([created, ...kanbanTasks]);
      toast.success(`Task "${created.title}" created successfully!`);
      setShowTaskModal(false);
      setFormTaskTitle('');
      setFormTaskDescription('');
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  // Open Edit Task Modal
  const openEditTask = (e: React.MouseEvent, task: KanbanTask) => {
    e.stopPropagation();
    setSelectedTask(task);
    setFormTaskTitle(task.title);
    setFormTaskType(task.type || 'Operational');
    setFormTaskColumn(task.column);
    setFormTaskPriority(task.priority || 'Medium');
    setFormTaskDueDate(task.dueDate || '');
    setFormTaskStartDate(task.startDate || '');
    setFormTaskAssigneeId(task.assigneeId || '');
    setFormTaskDescription(task.description || '');
    setShowEditTaskModal(true);
  };

  // Save Edit Task
  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!formTaskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    const assignee = employees.find((emp) => emp.id === formTaskAssigneeId);
    try {
      const updated = await taskService.updateTask(selectedTask.id, {
        title: formTaskTitle.trim(),
        type: formTaskType,
        column: formTaskColumn,
        priority: formTaskPriority,
        dueDate: formTaskDueDate,
        startDate: formTaskStartDate || undefined,
        assigneeId: formTaskAssigneeId || undefined,
        assigneeName: assignee ? assignee.name : selectedTask.assigneeName,
        description: formTaskDescription.trim() || undefined,
      });
      setKanbanTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? updated : t)));
      if (selectedTask.id === updated.id) setSelectedTask(updated);
      toast.success('Task updated successfully!');
      setShowEditTaskModal(false);
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    }
  };

  // Move Task Column
  const moveTaskColumn = async (id: string, nextColumn: TaskColumn) => {
    try {
      const updated = await taskService.moveTask(id, nextColumn);
      setKanbanTasks((prev) => prev.map((kt) => (kt.id === id ? { ...kt, column: nextColumn } : kt)));
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask({ ...selectedTask, column: nextColumn });
      }
      toast.success(`Task moved to ${nextColumn}!`);
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to move task');
    }
  };

  // Delete Task
  const confirmDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await taskService.deleteTask(selectedTask.id);
      setKanbanTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      toast.info(`Task "${selectedTask.title}" deleted.`);
      setShowDeleteTaskConfirm(false);
      setShowTaskDetailsModal(false);
      setSelectedTask(null);
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: TaskColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = kanbanTasks.find((t) => t.id === taskId);
    if (!task || task.column === targetColumn) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic Update
    setKanbanTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: targetColumn } : t))
    );
    setDraggedTaskId(null);

    try {
      await taskService.moveTask(taskId, targetColumn);
      toast.success(`Task moved to ${targetColumn}!`);
      taskService.getTaskCounts().then(setTaskCounts).catch(() => {});
    } catch (err: any) {
      // Revert on failure
      setKanbanTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, column: task.column } : t))
      );
      toast.error(err.message || 'Failed to move task');
    }
  };

  // ================= TODO ACTIONS =================

  // Toggle Todo Completion
  const toggleTodo = async (id: string) => {
    const todo = todoItems.find((t) => t.id === id);
    if (!todo) return;
    const nextState = !todo.completed;

    // Optimistic update
    setTodoItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextState } : t))
    );

    try {
      const updated = await taskService.toggleTodo(id, nextState);
      setTodoItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
      );
      toast.info(nextState ? 'Task marked completed!' : 'Task marked pending.');
      taskService.getTodoStats().then(setTodoStats).catch(() => {});
    } catch (err: any) {
      // Revert
      setTodoItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: todo.completed } : t))
      );
      toast.error('Failed to update todo status');
    }
  };

  // Add Todo Item
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoInput.trim()) {
      toast.error('Please enter a todo task name');
      return;
    }
    try {
      const created = await taskService.createTodo({
        title: newTodoInput.trim(),
        category: newTodoCategory,
        completed: false,
        dueDate: newTodoDueDate,
        priority: newTodoPriority,
      });
      setTodoItems([created, ...todoItems]);
      setNewTodoInput('');
      toast.success('New todo item added!');
      taskService.getTodoStats().then(setTodoStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to add todo');
    }
  };

  // Edit Todo Submit
  const handleSaveEditTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTodo) return;
    try {
      const updated = await taskService.updateTodo(selectedTodo.id, {
        title: selectedTodo.title.trim(),
        category: selectedTodo.category,
        dueDate: selectedTodo.dueDate,
        priority: selectedTodo.priority,
        description: selectedTodo.description,
      });
      setTodoItems((prev) => prev.map((t) => (t.id === selectedTodo.id ? updated : t)));
      toast.success('Todo item updated!');
      setShowEditTodoModal(false);
      setSelectedTodo(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update todo');
    }
  };

  // Delete Todo
  const confirmDeleteTodo = async () => {
    if (!selectedTodo) return;
    try {
      await taskService.deleteTodo(selectedTodo.id);
      setTodoItems((prev) => prev.filter((t) => t.id !== selectedTodo.id));
      toast.info(`Todo "${selectedTodo.title}" removed.`);
      setShowDeleteTodoConfirm(false);
      setSelectedTodo(null);
      taskService.getTodoStats().then(setTodoStats).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete todo');
    }
  };

  // Dynamic Statistics
  const completedTodosCount = todoItems.filter((t) => t.completed).length;
  const progressPercent = todoItems.length > 0 ? Math.round((completedTodosCount / todoItems.length) * 100) : 0;

  // Type Color Pill Mapping
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'Operational': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Technical': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Strategic': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Hiring': return 'bg-red-100 text-red-800 border-red-200';
      case 'Financial': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Priority Color Mapping
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">

      {/* ================= VIEW 1: KANBAN BOARD ================= */}
      {isKanban && (
        <div className="space-y-4">
          {/* Top Bar with Title & Right-Aligned Dark Blue Circular + Button */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 shadow-xs flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-slate-800 m-0">Task Management</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kanban workflow: {taskCounts.total} tasks total ({taskCounts.inProgress} active, {taskCounts.completed} completed)
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowTaskModal(true);
              }}
              title="Add New Task"
              className="w-10 h-10 rounded-full bg-[#1e3a8a] text-white hover:bg-[#1d4ed8] shadow flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search tasks, assignees..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1e3a8a]"
              />
              {taskSearch && (
                <button onClick={() => setTaskSearch('')} className="absolute right-2.5 top-2 text-slate-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-500">Type:</span>
                <select
                  value={taskTypeFilter}
                  onChange={(e) => setTaskTypeFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Operational">Operational</option>
                  <option value="Technical">Technical</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Hiring">Hiring</option>
                  <option value="Financial">Financial</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-500">Priority:</span>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Assignee Filter */}
              {employees.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-500">Assignee:</span>
                  <select
                    value={taskAssigneeFilter}
                    onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                    className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer max-w-[130px] truncate"
                  >
                    <option value="All">All Assignees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Unified 4-Column Board matching design */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[620px]">
              {[
                { id: 'new-task' as TaskColumn, label: 'New task', count: taskCounts.newTask },
                { id: 'scheduled' as TaskColumn, label: 'Scheduled', count: taskCounts.scheduled },
                { id: 'in-progress' as TaskColumn, label: 'In Progress', count: taskCounts.inProgress },
                { id: 'completed' as TaskColumn, label: 'Completed', count: taskCounts.completed },
              ].map((col) => {
                const colTasks = kanbanTasks.filter((t) => t.column === col.id);
                return (
                  <div 
                    key={col.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="flex flex-col bg-white transition-colors"
                  >
                    {/* Centered Column Header */}
                    <div className="py-3 px-4 text-center font-bold text-slate-900 text-sm border-b border-slate-200 bg-white flex items-center justify-center gap-2">
                      <span>{col.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Column Items Container */}
                    <div className="p-4 space-y-3 flex-1 bg-white">

                      {/* INLINE TASK CREATION CARD inside "New task" column (Preserved from UI) */}
                      {col.id === 'new-task' && isInlineTaskOpen && (
                        <div className="bg-[#d9e6f6] border border-blue-200 rounded-xl p-4 shadow-sm space-y-4 relative animate-fade-in">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsInlineTaskOpen(false);
                              setIsDropdownOpen(false);
                              setIsCalendarOpen(false);
                            }}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-300/80 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5 text-slate-700" />
                          </button>

                          <input 
                            type="text"
                            placeholder="Task name"
                            value={inlineTaskName}
                            onChange={(e) => setInlineTaskName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInlineTask();
                              }
                            }}
                            autoFocus
                            className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 placeholder:text-slate-500 outline-none pr-8"
                          />

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              {/* 1. Chevron Dropdown */}
                              <div className="relative">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setIsDropdownOpen((prev) => !prev);
                                    setIsCalendarOpen(false);
                                  }}
                                  className="w-7 h-7 rounded-full border border-blue-400/40 bg-white/50 hover:bg-white flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>

                                {isDropdownOpen && (
                                  <div className="absolute top-9 left-0 z-30 w-44 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl space-y-0.5 text-xs select-none animate-fade-in">
                                    {[
                                      { label: 'Operational', color: 'bg-blue-100' },
                                      { label: 'Technical', color: 'bg-amber-300' },
                                      { label: 'Strategic', color: 'bg-emerald-200' },
                                      { label: 'Hiring', color: 'bg-red-200' },
                                      { label: 'Financial', color: 'bg-slate-300' },
                                    ].map((item) => (
                                      <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                          setSelectedType(item.label);
                                          setIsDropdownOpen(false);
                                          toast.info(`Selected type: ${item.label}`);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-all ${
                                          selectedType === item.label ? 'bg-slate-50 font-bold text-slate-900' : ''
                                        }`}
                                      >
                                        <span className={`w-3.5 h-3.5 rounded-sm ${item.color} shrink-0`}></span>
                                        <span>{item.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 2. Calendar Date Picker */}
                              <div className="relative">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setIsCalendarOpen((prev) => !prev);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="w-7 h-7 rounded-full border border-blue-400/40 bg-white/50 hover:bg-white flex items-center justify-center text-slate-700 transition-all cursor-pointer"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                </button>

                                {isCalendarOpen && (
                                  <div className="absolute top-9 left-0 z-30 w-64 bg-[#d9e6f6] border border-blue-200 rounded-2xl p-4 shadow-xl space-y-4 text-xs select-none animate-fade-in">
                                    <div className="flex justify-end items-center">
                                      <span className="bg-black text-white px-3 py-1 text-xs font-bold rounded-lg tracking-wide">
                                        December
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs">
                                      <span className="text-slate-600">Mo</span>
                                      <span className="text-slate-600">Tu</span>
                                      <span className="text-slate-600">We</span>
                                      <span className="text-slate-600">Th</span>
                                      <span className="text-slate-600">Fr</span>
                                      <span className="text-blue-500">Sa</span>
                                      <span className="text-blue-500">Su</span>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                      {Array.from({ length: 31 }).map((_, i) => {
                                        const dayNum = i + 1;
                                        const isSelected = dayNum === selectedDateDay;
                                        const isWeekend = i % 7 === 5 || i % 7 === 6;
                                        return (
                                          <button
                                            key={dayNum}
                                            type="button"
                                            onClick={() => {
                                              setSelectedDateDay(dayNum);
                                              toast.info(`Due date set to Dec ${dayNum}`);
                                            }}
                                            className={`h-7 flex items-center justify-center rounded-md font-semibold transition-all cursor-pointer ${
                                              isSelected 
                                                ? 'bg-black text-white font-extrabold shadow-sm' 
                                                : isWeekend 
                                                ? 'text-blue-500 hover:bg-white/50' 
                                                : 'text-slate-700 hover:bg-white/50'
                                            }`}
                                          >
                                            {dayNum}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setIsCalendarOpen(false)}
                                        className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
                                      >
                                        Close
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDateDay(18);
                                          setIsCalendarOpen(false);
                                        }}
                                        className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
                                      >
                                        Dec 18
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="w-7 h-7 rounded-full bg-[#3b82f6] text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                                K
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleSaveInlineTask}
                              className="bg-[#1c397c] text-white font-bold text-xs px-5 py-1.5 rounded-full hover:bg-[#1d4ed8] cursor-pointer shadow-xs transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Column Task Cards */}
                      {colTasks.map((task) => {
                        const initials = task.assigneeName 
                          ? task.assigneeName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                          : 'HR';

                        return (
                          <div
                            key={task.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetailsModal(true);
                            }}
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2.5 group"
                          >
                            {/* Card Header: Type Pill & Priority Badge */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getTypeColor(task.type)}`}>
                                {task.type || 'Operational'}
                              </span>

                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(task.priority)}`}>
                                  {task.priority || 'Medium'}
                                </span>

                                <button
                                  onClick={(e) => openEditTask(e, task)}
                                  title="Edit Task"
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <p className="m-0 leading-relaxed text-slate-900 font-bold group-hover:text-blue-700 transition-colors">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Due Date & Assignee Avatar */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <div className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>{task.dueDate || 'No Date'}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <div 
                                  title={task.assigneeName || 'Unassigned'}
                                  className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs"
                                >
                                  {initials}
                                </div>
                                <span className="text-[10px] text-slate-600 font-medium max-w-[70px] truncate">
                                  {task.assigneeName ? task.assigneeName.split(' ')[0] : 'Unassigned'}
                                </span>
                              </div>
                            </div>

                            {/* Quick Stage Transition Helper */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-slate-400">Drag to move</span>
                              {col.id !== 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = col.id === 'new-task' ? 'scheduled' : col.id === 'scheduled' ? 'in-progress' : 'completed';
                                    moveTaskColumn(task.id, next);
                                  }}
                                  className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                                >
                                  <span>Move Next</span>
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: TODO LIST ================= */}
      {isTodo && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#002222] via-[#004848] to-[#006666] rounded-2xl p-6 text-white shadow-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckSquare className="h-3.5 w-3.5 text-teal-300" />
              <span>Personal & HR Checklist</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white m-0">Todo List & Actions</h1>
            <p className="text-xs text-teal-100/80 mt-1">
              Personal checklist, statutory payroll cutoffs, exit formalities, and automated completion tracking.
            </p>
          </div>

          {/* Daily Todo Completion Progress Bar Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Daily Todo Completion Progress</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {completedTodosCount} of {todoItems.length} tasks finished
                </p>
              </div>
              <span className="text-xl font-extrabold text-[#004848]">{progressPercent}%</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#004848] to-[#007878] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search todo tasks..."
                  value={todoSearch}
                  onChange={(e) => setTodoSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#004848]"
                />
                {todoSearch && (
                  <button onClick={() => setTodoSearch('')} className="absolute right-3 top-2.5 text-slate-400">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                {(['All', 'Pending', 'Completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTodoStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-full font-bold transition-all border cursor-pointer ${
                      todoStatusFilter === st
                        ? 'bg-[#004848] text-white border-transparent'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">Category:</span>
              {['All', 'Payroll', 'Off-Boarding', 'Events', 'Compliance', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTodoCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    todoCategoryFilter === cat
                      ? 'bg-teal-100 text-teal-900 font-bold border border-teal-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add Form with Category & Due Date selection */}
          <form onSubmit={handleAddTodo} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="+ Add a new todo item and press Enter..."
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#004848]"
              />
              <button 
                type="submit"
                className="px-6 py-2.5 bg-[#004848] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#006666] cursor-pointer shrink-0"
              >
                Add Task
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Category:</span>
                <select
                  value={newTodoCategory}
                  onChange={(e) => setNewTodoCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none text-xs"
                >
                  <option>Payroll</option>
                  <option>Off-Boarding</option>
                  <option>Events</option>
                  <option>Compliance</option>
                  <option>General</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Due:</span>
                <select
                  value={newTodoDueDate}
                  onChange={(e) => setNewTodoDueDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none text-xs"
                >
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>Sept 06</option>
                  <option>Next Week</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Priority:</span>
                <select
                  value={newTodoPriority}
                  onChange={(e) => setNewTodoPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none text-xs"
                >
                  <option>Normal</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
          </form>

          {/* Checklist Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            {loading ? (
              <div className="flex items-center justify-center p-8 space-x-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#004848]" />
                <span className="text-xs font-semibold">Loading todos...</span>
              </div>
            ) : todoItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                No todos found matching current filters.
              </div>
            ) : (
              todoItems.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                    item.completed ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200 hover:border-[#004848]'
                  }`}
                >
                  {/* Left: Checkbox & Title */}
                  <div 
                    onClick={() => toggleTodo(item.id)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      item.completed ? 'bg-[#004848] border-[#004848] text-white' : 'border-slate-300'
                    }`}>
                      {item.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      {item.description && (
                        <span className="text-[11px] text-slate-500 block font-normal mt-0.5 line-clamp-1">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Category Badge, Due Date, Edit & Delete */}
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                      {item.category}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-500">
                      {item.dueDate}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTodo(item);
                          setShowEditTodoModal(true);
                        }}
                        title="Edit Todo"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTodo(item);
                          setShowDeleteTodoConfirm(true);
                        }}
                        title="Delete Todo"
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE KANBAN TASK ================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Create New Kanban Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateFullTask} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Task Title *</label>
                <input 
                  type="text"
                  placeholder="e.g. Implement Multi-Region VPC Peering"
                  value={formTaskTitle}
                  onChange={(e) => setFormTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#1e3a8a]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Type</label>
                  <select
                    value={formTaskType}
                    onChange={(e) => setFormTaskType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option>Operational</option>
                    <option>Technical</option>
                    <option>Strategic</option>
                    <option>Hiring</option>
                    <option>Financial</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Initial Column</label>
                  <select
                    value={formTaskColumn}
                    onChange={(e: any) => setFormTaskColumn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="new-task">New task</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Priority</label>
                  <select
                    value={formTaskPriority}
                    onChange={(e: any) => setFormTaskPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Due Date</label>
                  <input 
                    type="text"
                    placeholder="e.g. Dec 24, 2026"
                    value={formTaskDueDate}
                    onChange={(e) => setFormTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Assigned Employee</label>
                <select
                  value={formTaskAssigneeId}
                  onChange={(e) => setFormTaskAssigneeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Task Description</label>
                <textarea 
                  rows={3}
                  placeholder="Detailed task specifications and requirements..."
                  value={formTaskDescription}
                  onChange={(e) => setFormTaskDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e3a8a] text-white font-bold rounded-xl text-xs hover:bg-[#1d4ed8]"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TASK DETAILS ================= */}
      {showTaskDetailsModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${getTypeColor(selectedTask.type)}`}>
                  {selectedTask.type || 'Operational'}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 m-0">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setShowTaskDetailsModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold block">Status Column</span>
                <span className="font-bold text-slate-800 uppercase tracking-wide">{selectedTask.column}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Priority</span>
                <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] border ${getPriorityBadge(selectedTask.priority)}`}>
                  {selectedTask.priority || 'Medium'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Due Date</span>
                <span className="font-bold text-slate-800">{selectedTask.dueDate || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Assigned To</span>
                <span className="font-bold text-slate-800">{selectedTask.assigneeName || 'Unassigned'}</span>
              </div>
            </div>

            {selectedTask.description && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 m-0 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Stage Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Move to Column:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['new-task', 'scheduled', 'in-progress', 'completed'] as TaskColumn[]).map((colId) => (
                  <button
                    key={colId}
                    onClick={() => moveTaskColumn(selectedTask.id, colId)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                      selectedTask.column === colId
                        ? 'bg-[#1e3a8a] text-white border-transparent'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {colId}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-150">
              <button
                onClick={() => {
                  setShowTaskDetailsModal(false);
                  setShowDeleteTaskConfirm(true);
                }}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold"
              >
                Delete Task
              </button>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    setShowTaskDetailsModal(false);
                    openEditTask(e, selectedTask);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100"
                >
                  Edit Task
                </button>
                <button
                  onClick={() => setShowTaskDetailsModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT KANBAN TASK ================= */}
      {showEditTaskModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Kanban Task</h3>
              <button onClick={() => setShowEditTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Task Title *</label>
                <input 
                  type="text"
                  value={formTaskTitle}
                  onChange={(e) => setFormTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#1e3a8a]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Type</label>
                  <select
                    value={formTaskType}
                    onChange={(e) => setFormTaskType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option>Operational</option>
                    <option>Technical</option>
                    <option>Strategic</option>
                    <option>Hiring</option>
                    <option>Financial</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Priority</label>
                  <select
                    value={formTaskPriority}
                    onChange={(e: any) => setFormTaskPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Due Date</label>
                  <input 
                    type="text"
                    value={formTaskDueDate}
                    onChange={(e) => setFormTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Assigned Employee</label>
                  <select
                    value={formTaskAssigneeId}
                    onChange={(e) => setFormTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Description</label>
                <textarea 
                  rows={3}
                  value={formTaskDescription}
                  onChange={(e) => setFormTaskDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowEditTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e3a8a] text-white font-bold rounded-xl text-xs hover:bg-[#1d4ed8]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TODO ================= */}
      {showEditTodoModal && selectedTodo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Edit Todo Item</h3>
              <button onClick={() => setShowEditTodoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEditTodo} className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 font-bold text-slate-800">Task Title *</label>
                <input 
                  type="text"
                  value={selectedTodo.title}
                  onChange={(e) => setSelectedTodo({ ...selectedTodo, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#004848]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-800">Category</label>
                  <select
                    value={selectedTodo.category}
                    onChange={(e) => setSelectedTodo({ ...selectedTodo, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option>Payroll</option>
                    <option>Off-Boarding</option>
                    <option>Events</option>
                    <option>Compliance</option>
                    <option>General</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-800">Due Date</label>
                  <input 
                    type="text"
                    value={selectedTodo.dueDate}
                    onChange={(e) => setSelectedTodo({ ...selectedTodo, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-800">Description</label>
                <textarea 
                  rows={2}
                  value={selectedTodo.description || ''}
                  onChange={(e) => setSelectedTodo({ ...selectedTodo, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowEditTodoModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004848] text-white font-bold rounded-xl text-xs hover:bg-[#006666]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE TASK CONFIRM ================= */}
      {showDeleteTaskConfirm && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Are you sure you want to delete task <strong>"{selectedTask.title}"</strong>? This will permanently remove it from the Kanban board.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setShowDeleteTaskConfirm(false)}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE TODO CONFIRM ================= */}
      {showDeleteTodoConfirm && selectedTodo && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Are you sure you want to delete todo item <strong>"{selectedTodo.title}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setShowDeleteTodoConfirm(false)}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTodo}
                className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700"
              >
                Delete Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
