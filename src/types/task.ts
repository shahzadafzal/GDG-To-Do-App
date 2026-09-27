export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  tags: string[];
  subtasks: SubTask[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
}

export type ViewFilter = 'all' | 'active' | 'completed' | 'today' | 'overdue';
export type ViewMode = 'list' | 'kanban' | 'timeline';
export type SortOption = 'created-desc' | 'created-asc' | 'due-asc' | 'priority-desc' | 'title-asc';
