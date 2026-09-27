import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Download,
  Trash2,
  Share2
} from 'lucide-react';
import type { TaskItem } from '../types/task';

interface StatsOverviewProps {
  tasks: TaskItem[];
  onClearCompleted: () => void;
  onExportMarkdown: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  tasks,
  onClearCompleted,
  onExportMarkdown
}) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Overdue count
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueCount = tasks.filter(t => {
    if (t.completed || !t.dueDate) return false;
    const [y, m, d] = t.dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < now.getTime();
  }).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Progress & metrics */}
        <div className="flex items-center gap-4">
          {/* Circular progress visual */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 dark:text-indigo-500 transition-all duration-500 ease-out"
                strokeDasharray={`${percent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-bold text-xs text-slate-800 dark:text-slate-200">
              {percent}%
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {percent === 100 && total > 0
                  ? 'All tasks completed! 🚀'
                  : `${active} pending ${active === 1 ? 'task' : 'tasks'}`}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completed} of {total} items marked as finished
            </p>
          </div>
        </div>

        {/* Quick stat cards / actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-700 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{overdueCount} Overdue</span>
            </div>
          )}

          <button
            type="button"
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Export tasks to Markdown / Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {completed > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/60 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Batch delete all completed tasks"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Done ({completed})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

};
