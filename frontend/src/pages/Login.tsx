import React, { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, ShieldAlert, UserRound } from 'lucide-react';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register' && password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      const response = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { username, password } : { username, email, password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || !result.data) {
        throw new Error(mode === 'login' ? 'Invalid username or password.' : result?.error || 'Unable to register.');
      }
      onLogin(result.data as AuthUser);
    } catch (loginError: any) {
      setError(loginError?.message || 'Unable to register.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.18),_transparent_42%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold font-mono tracking-wide text-white">ResQ-Mind</h1>
              <span className="whitespace-nowrap rounded border border-emerald-800/60 bg-slate-950 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wide text-emerald-400">
                Simulated Live Data
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Real-Time Multi-Agent Disaster Response Coordination</p>
          </div>
        </div>

        <div className="border-l-2 border-red-500 pl-3 mb-7">
          <h2 className="text-lg font-semibold text-white">{mode === 'login' ? 'Command center access' : 'Create operations account'}</h2>
          <p className="text-sm text-slate-400 mt-1">AI-powered decision support for coordinated disaster response.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'));
            setError(null);
          }}
          className="mb-5 w-full text-center text-sm text-slate-400 hover:text-white transition"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Username</span>
            <div className="relative">
              <UserRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </label>

          {mode === 'register' && (
            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
          )}

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

          {mode === 'register' && (
            <label className="block">
              <span className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </label>
          )}

          {error && <p className="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Sign In' : 'Register'}
          </button>
        </form>

      </section>
    </main>
  );
};

export default Login;
