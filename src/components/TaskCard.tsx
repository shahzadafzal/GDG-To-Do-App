import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Tag, 
  Flag, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  ListChecks,
  AlertCircle
} from 'lucide-react';
import type { TaskItem, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (task: TaskItem) => void;
  onDuplicate: (task: TaskItem) => void;
  onUpdateSubtasks: (taskId: string, subtasks: TaskItem['subtasks']) => Promise<void>;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  onDuplicate,
  onUpdateSubtasks,
  isSelected = false,
  onToggleSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      await onToggleComplete(task.id, task.completed);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(task.id);
    } catch (err) {
      console.error('Delete error:', err);
      setIsDeleting(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string) => {
    const updated = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    await onUpdateSubtasks(task.id, updated);
  };

  // Format Due Date & calculate urgency
  const getDueDateInfo = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const [year, month, day] = task.dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        isOverdue: true,
        isToday: false,
        colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        isOverdue: false,
        isToday: true,
        colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
      };
    } else if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        isOverdue: false,
        isToday: false,
        colorClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60'
      };
    } else {
      return {
        label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isOverdue: false,
        isToday: false,
        colorClass: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      };
    }
  };

  const dueInfo = getDueDateInfo();

  const getPriorityStyle = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return 'text-red-700 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-900/60';
      case 'high':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
      case 'medium':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60';
      case 'low':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
    }
  };

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150 ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-80'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm'
      } ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30' : ''}`}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Batch Selector if enabled */}
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              className="mt-1 w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer opacity-40 group-hover:opacity-100 transition"
              title="Select for batch action"
            />
          )}

          {/* Completion Checkbox */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-150 cursor-pointer ${
              task.completed
                ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-500 text-transparent'
            }`}
            title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`text-sm font-semibold tracking-tight transition ${
                  task.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-950 dark:group-hover:text-indigo-300'
                }`}
              >
                {task.title}
              </h4>

              {/* Action buttons (desktop hover, always visible on mobile) */}
              <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onDuplicate(task)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                  title="Duplicate task"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition"
                  title="Edit task"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description Preview */}
            {task.description && (
              <p
                className={`mt-1 text-xs leading-relaxed line-clamp-2 ${
                  task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges & Meta info */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              {/* Priority badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold capitalize text-[11px] ${getPriorityStyle(
                  task.priority
                )}`}
              >
                <Flag className="w-2.5 h-2.5" />
                {task.priority}
              </span>

              {/* Category badge */}
              {task.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                  <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                  {task.category}
                </span>
              )}

              {/* Due Date badge */}
              {dueInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                    task.completed
                      ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : dueInfo.colorClass
                  }`}
                >
                  {dueInfo.isOverdue && !task.completed ? (
                    <AlertCircle className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5" />
                  )}
                  {dueInfo.label}
                  {task.dueTime && <span>· {task.dueTime}</span>}
                </span>
              )}

              {/* Subtasks Progress Pill */}
              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                >
                  <ListChecks className="w-2.5 h-2.5" />
                  <span>
                    {completedSubtasks}/{totalSubtasks} subtasks
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>
              )}

              {/* Tags */}
              {task.tags && task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Subtask checklist accordion */}
            {isExpanded && totalSubtasks > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 text-xs py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleSubtaskToggle(st.id)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span
                      className={`font-medium ${
                        st.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
