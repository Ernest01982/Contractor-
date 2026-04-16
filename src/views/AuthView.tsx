import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Hammer, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AuthViewProps {
  mode: 'login' | 'signup' | 'forgot_password';
  onBack: () => void;
}

export function AuthView({ mode: initialMode, onBack }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Password reset link sent! Please check your email.');
        setTimeout(() => setMode('login'), 3000);
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Account created successfully! Please check your email and click the confirmation link before logging in.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // App.tsx will detect the session change and navigate automatically
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <div className="flex justify-center">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Hammer className="text-emerald-600 h-10 w-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {mode === 'forgot_password' ? 'Reset your password' : mode === 'login' ? 'Log in to your account' : 'Create your workspace'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {mode === 'forgot_password' ? (
            <>
              Remember your password?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">Log in</button>
            </>
          ) : (
            <>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setMessage(null);
                }}
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm p-3 rounded-xl">
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-shadow"
                  placeholder="contractor@example.com"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required={mode !== 'forgot_password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-shadow text-slate-900"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'forgot_password' ? 'Send Reset Link' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
