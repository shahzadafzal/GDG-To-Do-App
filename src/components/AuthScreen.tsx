import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Layers, 
  Zap, 
  Database,
  ArrowRight,
  AlertCircle,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { signInWithGoogle, signInAsGuest, firebaseConfig } from '../lib/firebase';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onAuthSuccess,
  theme = 'light',
  onToggleTheme
}) => {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('Pop-up was blocked by your browser. Please allow popups for this site or use Guest Sandbox mode below.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in window was closed before completing. Click again to sign in.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain not yet authorized in Firebase Console. You can test immediately using Guest Sandbox Mode.');
      } else {
        setErrorMsg(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      setErrorMsg(null);
      await signInAsGuest();
      onAuthSuccess?.();
    } catch (err: any) {
      console.error('Guest sign-in error:', err);
      setErrorMsg(err?.message || 'Failed to initialize guest sandbox. Check network connection.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Top Bar with Brand & Theme Switcher */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-bold text-base text-slate-800 dark:text-white">TaskSync Pro</span>
        </div>

        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dark</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Top Banner */}
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Firebase Cloud Firestore & Authentication</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>Zero Cross-User Leakage</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Keep every task in sync,
          <span className="block bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 dark:from-indigo-400 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-transparent">
            strictly isolated to you.
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A modern collaborative to-do manager with instant real-time synchronization, subtasks, priorities, and database-level security rules that guarantee you only access your own data.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md mx-auto w-full mt-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-indigo-500/5 p-6 sm:p-8 transition-colors">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/20 mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white">
          Sign In to TaskSync Pro
        </h2>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Connect your Google Account to access your personal vault
        </p>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Authentication Notice</span>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading || guestLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow-md transition duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.26 21.3 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.2 0 10.05 0 12s.46 3.8 1.26 5.41l4.02-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          <ArrowRight className="w-4 h-4 ml-auto text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition" />
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">Or test isolated sandbox</span>
          </div>
        </div>

        {/* Guest Mode Sandbox Button */}
        <button
          onClick={handleGuestSignIn}
          disabled={loading || guestLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 active:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-60"
        >
          {guestLoading ? (
            <div className="w-4 h-4 border-2 border-slate-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>Continue as Guest (Instant Isolated Session)</span>
        </button>

        {/* Security Rule Note */}
        <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Strict Firestore Isolation Enforced</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Your tasks are stored at <code className="bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">/users/$&#123;uid&#125;/tasks</code>. Other accounts cannot view, search, or alter your data.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-4xl mx-auto w-full mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Database-Level Security</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Server-side Firestore rules require authenticated UID matching before any document read or write is approved.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Real-Time Cloud Sync</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Instant multi-tab and multi-device updates via Firestore active snapshots. Zero refresh needed.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Rich Task Organization</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Custom tags, subtask checklists, priority tiers (Urgent, High, Medium, Low), and due dates.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
        Connected to Firebase Project: <span className="font-mono text-slate-600 dark:text-slate-400">{firebaseConfig.projectId}</span>
      </div>
    </div>
  );
};

