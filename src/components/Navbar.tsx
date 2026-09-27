import React from 'react';
import type { User } from 'firebase/auth';
import { 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  CloudCheck, 
  User as UserIcon,
  Sparkles,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { logOut } from '../lib/firebase';

interface NavbarProps {
  user: User;
  onOpenSecurityModal: () => void;
  syncStatus: 'synced' | 'syncing' | 'error';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onOpenSecurityModal,
  syncStatus,
  theme,
  onToggleTheme
}) => {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logOut();
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">TaskSync</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Secure Firebase To-Do & Collaboration
            </p>
          </div>
        </div>

        {/* Sync & Security Badges */}
        <div className="hidden md:flex items-center gap-2">
          {/* Cloud Sync Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <CloudCheck className="w-3.5 h-3.5" />
            <span>Firebase Live Sync</span>
          </div>

          {/* Database Isolation Badge */}
          <button
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Inspect Firestore Security Rules & User Isolation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Vault Isolated</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <Database className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer shadow-2xs group"
            title={theme === 'dark' ? 'Switch to Light Theme (saved to your account)' : 'Switch to Dark Theme (saved to your account)'}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="hidden sm:inline font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                <span className="hidden sm:inline font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* User Profile badge */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={displayName} 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-indigo-500/20 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs">
                {initial}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {displayName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[140px]">
                {user.email || 'Guest Account'}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition cursor-pointer disabled:opacity-50"
            title="Sign out of your account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

