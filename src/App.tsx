import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  LayoutList, 
  Kanban, 
  Calendar, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpDown,
  Tag,
  Trash2,
  CheckSquare,
  Square,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  auth, 
  subscribeToUserTasks, 
  addTaskForUser, 
  toggleTaskCompletion, 
  updateTask, 
  deleteTask, 
  batchDeleteCompletedTasks,
  getUserTheme,
  saveUserTheme
} from './lib/firebase';
import type { TaskItem, TaskPriority, ViewFilter, ViewMode, SortOption, SubTask } from './types/task';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { TaskQuickAdd } from './components/TaskQuickAdd';
import { TaskCard } from './components/TaskCard';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { SecurityInspector } from './components/SecurityInspector';
import { StatsOverview } from './components/StatsOverview';
import { ExportModal } from './components/ExportModal';
import { Toast, type ToastMessage } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Theme State with instant localStorage caching and cross-device Firestore sync
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasksync_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Keep html class in sync with theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // When user logs in, load their remembered theme from their Firestore user document
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    getUserTheme(currentUser.uid).then((savedTheme) => {
      if (!isMounted) return;
      if (savedTheme) {
        setTheme(savedTheme);
        localStorage.setItem('tasksync_theme', savedTheme);
      } else {
        // First time or no remote theme yet: save current theme to their account
        saveUserTheme(currentUser.uid, theme);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Toggle Theme handler that updates state, localStorage and Firestore
  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tasksync_theme', nextTheme);
    if (currentUser) {
      saveUserTheme(currentUser.uid, nextTheme);
    }
    addToast(
      nextTheme === 'dark'
        ? 'Dark theme enabled (saved to your account)'
        : 'Light theme enabled (saved to your account)'
    );
  };
  
  // Filtering & View state
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');
  // View mode and advanced filter toggles
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Floating Add Task section toggle (collapsed to save space on mobile and home screen)
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  // Active advanced filters calculation
  const hasActiveAdvancedFilters = selectedCategory !== 'all' || selectedPriority !== 'all' || sortBy !== 'created-desc';
  const activeAdvancedFilterCount = 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (selectedPriority !== 'all' ? 1 : 0) + 
    (sortBy !== 'created-desc' ? 1 : 0);
  
  // Categories
  const [categories, setCategories] = useState<string[]>([
    'Personal', 'Work', 'Projects', 'Shopping', 'Health', 'Ideas'
  ]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Batch actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success', onUndo?: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, onUndo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (!user) {
        setTasks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Tasks Subscription (Isolated per currentUser.uid)
  useEffect(() => {
    if (!currentUser) return;

    setSyncStatus('syncing');
    const unsubscribe = subscribeToUserTasks(
      currentUser.uid,
      (userTasks) => {
        setTasks(userTasks);
        setSyncStatus('synced');
      },
      (error) => {
        console.error('Task listener error:', error);
        setSyncStatus('error');
        addToast('Cloud sync error: ' + error.message, 'error');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load custom categories if present
  useEffect(() => {
    if (tasks.length > 0) {
      const taskCategories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));
      setCategories(prev => Array.from(new Set([...prev, ...taskCategories])));
    }
  }, [tasks]);

  // Task Operations
  const handleQuickAdd = async (data: {
    title: string;
    priority: TaskPriority;
    category: string;
    dueDate?: string;
  }) => {
    if (!currentUser) return;
    try {
      setSyncStatus('syncing');
      await addTaskForUser(
        currentUser.uid,
        currentUser.email || '',
        currentUser.displayName || '',
        {
          title: data.title,
          description: '',
          completed: false,
          priority: data.priority,
          category: data.category,
          dueDate: data.dueDate || '',
          dueTime: '',
          tags: [],
          subtasks: []
        }
      );
      addToast('Task added to your isolated cloud vault');
      setIsAddSectionOpen(false);
    } catch (err: any) {
      console.error('Failed to add task:', err);
      addToast('Failed to save task: ' + err.message, 'error');
    }
  };

  const handleSaveModalTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: string;
    dueDate: string;
    dueTime: string;
    tags: string[];
    subtasks: SubTask[];
  }) => {
    if (!currentUser) return;
    try {
      setSyncStatus('syncing');
      if (editingTask) {
        await updateTask(currentUser.uid, editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          category: taskData.category,
          dueDate: taskData.dueDate,
          dueTime: taskData.dueTime,
          tags: taskData.tags,
          subtasks: taskData.subtasks
        });
        addToast('Task updated successfully');
      } else {
        await addTaskForUser(
          currentUser.uid,
          currentUser.email || '',
          currentUser.displayName || '',
          {
            title: taskData.title,
            description: taskData.description,
            completed: false,
            priority: taskData.priority,
            category: taskData.category,
            dueDate: taskData.dueDate,
            dueTime: taskData.dueTime,
            tags: taskData.tags,
            subtasks: taskData.subtasks
          }
        );
        addToast('New task created');
      }
      setIsAddSectionOpen(false);
      setEditingTask(null);
    } catch (err: any) {
      console.error('Failed to save task:', err);
      addToast('Error saving task: ' + err.message, 'error');
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    if (!currentUser) return;
    try {
      await toggleTaskCompletion(currentUser.uid, taskId, currentStatus);
      addToast(currentStatus ? 'Task marked active' : 'Task completed! 🎉');
    } catch (err: any) {
      console.error('Error toggling task:', err);
      addToast('Error toggling task: ' + err.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    try {
      await deleteTask(currentUser.uid, taskId);
      
      // Allow Undo
      addToast(
        'Task deleted',
        'info',
        async () => {
          if (!currentUser) return;
          await addTaskForUser(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName || '',
            {
              title: taskToDelete.title,
              description: taskToDelete.description,
              completed: taskToDelete.completed,
              priority: taskToDelete.priority,
              category: taskToDelete.category,
              dueDate: taskToDelete.dueDate,
              dueTime: taskToDelete.dueTime,
              tags: taskToDelete.tags,
              subtasks: taskToDelete.subtasks
            }
          );
        }
      );
    } catch (err: any) {
      console.error('Error deleting task:', err);
      addToast('Error deleting task: ' + err.message, 'error');
    }
  };

  const handleDuplicateTask = async (task: TaskItem) => {
    if (!currentUser) return;
    try {
      await addTaskForUser(
        currentUser.uid,
        currentUser.email || '',
        currentUser.displayName || '',
        {
          title: `${task.title} (Copy)`,
          description: task.description,
          completed: false,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          tags: [...task.tags],
          subtasks: task.subtasks.map(s => ({ ...s, id: 'sub_' + Math.random().toString(36).substring(2, 7) }))
        }
      );
      addToast('Task duplicated');
    } catch (err: any) {
      console.error('Error duplicating task:', err);
    }
  };

  const handleUpdateSubtasks = async (taskId: string, subtasks: SubTask[]) => {
    if (!currentUser) return;
    try {
      await updateTask(currentUser.uid, taskId, { subtasks });
    } catch (err: any) {
      console.error('Error updating subtasks:', err);
    }
  };

  const handleClearCompleted = async () => {
    if (!currentUser) return;
    const completedIds = tasks.filter(t => t.completed).map(t => t.id);
    if (completedIds.length === 0) return;

    if (window.confirm(`Delete ${completedIds.length} completed ${completedIds.length === 1 ? 'task' : 'tasks'}?`)) {
      try {
        await batchDeleteCompletedTasks(currentUser.uid, completedIds);
        addToast(`Cleared ${completedIds.length} completed tasks`);
      } catch (err: any) {
        console.error('Error clearing tasks:', err);
        addToast('Error clearing tasks: ' + err.message, 'error');
      }
    }
  };

  // Batch actions
  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const handleBatchDelete = async () => {
    if (!currentUser || selectedTaskIds.length === 0) return;
    if (window.confirm(`Delete ${selectedTaskIds.length} selected tasks?`)) {
      try {
        await batchDeleteCompletedTasks(currentUser.uid, selectedTaskIds);
        addToast(`Deleted ${selectedTaskIds.length} tasks`);
        setSelectedTaskIds([]);
      } catch (err: any) {
        addToast('Batch delete error: ' + err.message, 'error');
      }
    }
  };

  const handleBatchMarkComplete = async () => {
    if (!currentUser || selectedTaskIds.length === 0) return;
    try {
      for (const id of selectedTaskIds) {
        await toggleTaskCompletion(currentUser.uid, id, false);
      }
      addToast(`Marked ${selectedTaskIds.length} tasks as complete`);
      setSelectedTaskIds([]);
    } catch (err: any) {
      addToast('Error updating tasks: ' + err.message, 'error');
    }
  };

  // Filter & Sort Logic
  const filteredTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);

    return tasks.filter(task => {
      // 1. Status Filter
      if (activeFilter === 'active' && task.completed) return false;
      if (activeFilter === 'completed' && !task.completed) return false;
      if (activeFilter === 'today') {
        if (!task.dueDate) return false;
        if (task.dueDate !== todayStr) return false;
      }
      if (activeFilter === 'overdue') {
        if (task.completed || !task.dueDate) return false;
        const [y, m, d] = task.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        due.setHours(0, 0, 0, 0);
        if (due.getTime() >= now.getTime()) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Priority Filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(query));
        const catMatch = task.category?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !tagMatch && !catMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'created-desc') return b.createdAt - a.createdAt;
      if (sortBy === 'created-asc') return a.createdAt - b.createdAt;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'priority-desc') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'due-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });
  }, [tasks, activeFilter, selectedCategory, selectedPriority, searchQuery, sortBy]);

  // Loading Screen while resolving initial Firebase Auth
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse mb-4">
          <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
        </div>
        <div className="text-slate-800 dark:text-slate-100 font-bold text-base">Initializing TaskSync Pro...</div>
        <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">Connecting to Firebase Auth & Firestore</div>
      </div>
    );
  }

  // If user is not authenticated, show AuthScreen with Google Sign In
  if (!currentUser) {
    return (
      <AuthScreen 
        onAuthSuccess={() => {}} 
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Navigation bar */}
      <Navbar
        user={currentUser}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        syncStatus={syncStatus}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Productivity Banner & Stats */}
        <StatsOverview
          tasks={tasks}
          onClearCompleted={handleClearCompleted}
          onExportMarkdown={() => setIsExportModalOpen(true)}
        />

        {/* Quick Add Bar - Collapsible to save space on mobile and home screen */}
        {isAddSectionOpen ? (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <TaskQuickAdd
              onAddTask={handleQuickAdd}
              onOpenDetailedModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              categories={categories}
              onClose={() => setIsAddSectionOpen(false)}
              autoFocus
            />
          </div>
        ) : (
          <div className="hidden sm:flex items-center justify-between bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-3 sm:px-4 sm:py-3 transition-colors shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Plus className="w-4 h-4" />
              </div>
              <span>Click to add a new task item or tap the floating (+) button</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddSectionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        )}

        {/* Filters & Controls Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-2xs space-y-3 transition-colors">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Tasks', count: tasks.length },
                  { id: 'active', label: 'Active', count: tasks.filter(t => !t.completed).length },
                  { id: 'completed', label: 'Completed', count: tasks.filter(t => t.completed).length },
                  { 
                    id: 'today', 
                    label: 'Today', 
                    count: tasks.filter(t => t.dueDate === new Date().toISOString().slice(0, 10)).length 
                  },
                ] as const
              ).map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle & Batch Mode */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={() => {
                  setBatchMode(!batchMode);
                  if (batchMode) setSelectedTaskIds([]);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  batchMode
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{batchMode ? 'Cancel Selection' : 'Batch Select'}</span>
              </button>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Kanban Board View"
                >
                  <Kanban className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar (Visible by default) & Advanced Filters Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks or #tags..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                showAdvancedFilters || hasActiveAdvancedFilters
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Advanced Filters</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeAdvancedFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filters Dropdown Lists (HIDDEN by default, shown only when toggled) */}
          {showAdvancedFilters && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Category Filter */}
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="relative">
                  <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="due-asc">Due Date (Earliest)</option>
                    <option value="priority-desc">Priority (Highest)</option>
                    <option value="title-asc">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

              {hasActiveAdvancedFilters && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedPriority('all');
                      setSortBy('created-desc');
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Reset advanced filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Batch action banner */}
          {batchMode && (
            <div className="flex items-center justify-between p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="font-semibold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>Select All ({filteredTasks.length})</span>
                </button>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {selectedTaskIds.length} items selected
                </span>
              </div>

              {selectedTaskIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchMarkComplete}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Mark Complete
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task View Display */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteTask}
            onEdit={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onOpenCreateModal={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  {searchQuery ? 'No matching tasks' : 'Your task list is clear'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  {searchQuery
                    ? `No tasks matched your search "${searchQuery}". Try adjusting your filters.`
                    : 'Add a new task item above or click below to schedule your next goal.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Task</span>
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDuplicate={handleDuplicateTask}
                  onUpdateSubtasks={handleUpdateSubtasks}
                  isSelected={selectedTaskIds.includes(task.id)}
                  onToggleSelect={batchMode ? handleToggleSelectTask : undefined}
                />
              ))
            )}
          </div>
        )}
      </main>


      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModalTask}
        initialTask={editingTask}
        categories={categories}
        onAddCategory={(newCat) => {
          if (!categories.includes(newCat)) {
            setCategories([...categories, newCat]);
          }
        }}
      />

      {/* Security & Firestore Isolation Inspector Modal */}
      <SecurityInspector
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={currentUser}
      />

      {/* Export / Share Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
      />

      {/* Floating Add Task (+) Button (Floating on right corner on mobile/small screens) */}
      {!isAddSectionOpen && (
        <button
          type="button"
          onClick={() => {
            setIsAddSectionOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900 group"
          aria-label="Add new task"
          title="Add new task (+)"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      )}

      {/* Notification Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
