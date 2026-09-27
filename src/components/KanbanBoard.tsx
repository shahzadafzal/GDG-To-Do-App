import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Flag, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import type { TaskItem, TaskPriority } from '../types/task';

interface KanbanBoardProps {
  tasks: TaskItem[];
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (task: TaskItem) => void;
  onOpenCreateModal: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggleComplete,
  onDelete,
  onEdit,
  onOpenCreateModal
}) => {
  const pendingTasks = tasks.filter(t => !t.completed && (!t.subtasks || t.subtasks.every(s => !s.completed)));
  const inProgressTasks = tasks.filter(t => !t.completed && t.subtasks && t.subtasks.some(s => s.completed));
  const completedTasks = tasks.filter(t => t.completed);

  const renderColumn = (
    title: string, 
    items: TaskItem[], 
    icon: React.ReactNode, 
    badgeColor: string,
    emptyMessage: string
  ) => (
    <div className="flex-1 min-w-[280px] bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-col h-full transition-colors">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
          {items.length}
        </span>
      </div>

      {/* Column Tasks */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          items.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                  {task.title}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {task.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{task.category}</span>
                <button
                  onClick={() => onToggleComplete(task.id, task.completed)}
                  className={`px-2 py-0.5 rounded-md font-medium text-[10px] cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {task.completed ? 'Done' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
      {renderColumn(
        'To Do', 
        pendingTasks, 
        <Circle className="w-4 h-4 text-slate-500 dark:text-slate-400" />, 
        'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        'No pending tasks'
      )}
      {renderColumn(
        'In Progress', 
        inProgressTasks, 
        <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />, 
        'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
        'No tasks in progress'
      )}
      {renderColumn(
        'Completed', 
        completedTasks, 
        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />, 
        'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
        'No completed tasks yet'
      )}
    </div>
  );

};
