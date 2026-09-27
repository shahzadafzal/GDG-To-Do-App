import React, { useState } from 'react';
import { Download, Copy, Check, X, FileText, Code } from 'lucide-react';
import type { TaskItem } from '../types/task';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, tasks }) => {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    let md = `# Personal Task List\nExported on: ${new Date().toLocaleDateString()}\n\n`;
    
    // Group by category
    const byCategory: Record<string, TaskItem[]> = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(t);
    });

    Object.entries(byCategory).forEach(([cat, items]) => {
      md += `## ${cat}\n`;
      items.forEach(item => {
        const check = item.completed ? '[x]' : '[ ]';
        const priorityBadge = item.priority !== 'medium' ? ` (${item.priority.toUpperCase()})` : '';
        const due = item.dueDate ? ` [Due: ${item.dueDate}]` : '';
        md += `- ${check} ${item.title}${priorityBadge}${due}\n`;
        if (item.description) {
          md += `  > ${item.description.replace(/\n/g, '\n  > ')}\n`;
        }
        if (item.subtasks && item.subtasks.length > 0) {
          item.subtasks.forEach(sub => {
            const subCheck = sub.completed ? '[x]' : '[ ]';
            md += `    - ${subCheck} ${sub.title}\n`;
          });
        }
      });
      md += '\n';
    });

    return md;
  };

  const generateJson = () => {
    return JSON.stringify(tasks, null, 2);
  };

  const exportContent = format === 'markdown' ? generateMarkdown() : generateJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `tasksync-export-${new Date().toISOString().slice(0, 10)}.${format === 'markdown' ? 'md' : 'json'}`;
    const blob = new Blob([exportContent], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/70">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Export & Share Tasks</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                format === 'markdown'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown (.md)</span>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                format === 'json'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Backup (.json)</span>
            </button>
          </div>

          <textarea
            readOnly
            value={exportContent}
            rows={10}
            className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-200 rounded-xl outline-none resize-none border border-slate-800"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

};
