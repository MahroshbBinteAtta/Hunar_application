import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'worker') navigate('/worker');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      // Success redirection is handled by the useEffect above
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-md p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold font-heading text-[var(--color-primary)] tracking-wide">Welcome Back</h2>
            <p className="text-xs text-[var(--color-muted)]">Sign in to your HUNAR account to get started.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hunar.pk"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Password</label>
                <Link to="/auth/forgot-password" className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 text-sm mt-6"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Log In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]/40 pt-6">
            New to HUNAR?{' '}
            <Link to="/auth/register" className="text-[var(--color-primary)] font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
