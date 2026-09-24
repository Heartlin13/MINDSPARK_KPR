import React, { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldAlert } from 'lucide-react';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error('Invalid username or password.');
      }
      onLogin(result.data);
    } catch (loginError: any) {
      setError('Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wide">ResQ-Mind</h1>
            <p className="text-xs text-slate-400 mt-1">Real-Time Multi-Agent Disaster Response Coordination</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold">Sign in to command center</h2>
          <p className="text-sm text-slate-400 mt-1">Use your authorized operations account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-11 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {error && <p className="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
};
