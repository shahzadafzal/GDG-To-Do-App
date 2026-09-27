import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Tag, 
  Flag, 
  Maximize2, 
  CornerDownLeft,
  Sparkles,
  X
} from 'lucide-react';
import type { TaskPriority } from '../types/task';

interface TaskQuickAddProps {
  onAddTask: (data: {
    title: string;
    priority: TaskPriority;
    category: string;
    dueDate?: string;
  }) => Promise<void>;
  onOpenDetailedModal: () => void;
  categories: string[];
  onClose?: () => void;
  autoFocus?: boolean;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({
  onAddTask,
  onOpenDetailedModal,
  categories,
  onClose,
  autoFocus = true
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState(categories[0] || 'Personal');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        priority,
        category,
        dueDate: dueDate || undefined
      });
      setTitle('');
      setDueDate('');
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to add quick task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60';
      case 'high': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
      case 'medium': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60';
      case 'low': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm ${
      isFocused 
        ? 'border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-500/10 shadow-md' 
        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add a new task item (e.g., 'Review project launch plan' or 'Buy groceries')..."
            className="flex-1 text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent border-none outline-none font-medium"
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDetailedModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
              title="Open comprehensive task details"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">More details</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Close add task section"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-1.5 hidden xs:inline">Priority:</span>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md capitalize transition cursor-pointer ${
                    priority === p ? getPriorityColor(p) + ' shadow-xs border' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Category Selector */}
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 absolute left-2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-7 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Shortcut */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 absolute left-2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-7 pr-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-2 ml-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Add Task</span>
                  <CornerDownLeft className="w-3 h-3 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

};
