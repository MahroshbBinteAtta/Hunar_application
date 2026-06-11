import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { auth as authApi } from '../../api/api';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default customer
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-600' };
    if (pass.length < 6) return { score: 1, label: 'Weak (Short)', color: 'bg-rose-500' };
    
    let hasLetters = /[a-zA-Z]/.test(pass);
    let hasNumbers = /\d/.test(pass);
    let hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    
    if (hasLetters && hasNumbers && hasSpecial && pass.length >= 8) {
      return { score: 4, label: 'Very Strong', color: 'bg-emerald-500' };
    }
    if (hasLetters && hasNumbers) {
      return { score: 3, label: 'Strong', color: 'bg-cyan-500' };
    }
    return { score: 2, label: 'Medium', color: 'bg-amber-500' };
  };

  const isFormValid = name.trim().length >= 2 && email.includes('@') && password.length >= 6 && otp.length === 6 && otpSent;

  const { register, token, user } = useAuth();
  const navigate = useNavigate();

  // If role parameter is in URL query, set it
  useEffect(() => {
    if (roleParam === 'customer' || roleParam === 'worker' || roleParam === 'admin') {
      setRole(roleParam);
    }
  }, [roleParam]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'customer') navigate('/customer');
      else if (user.role === 'worker') navigate('/worker');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user, token, navigate]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSendingOtp(true);
    setOtpSuccess('');
    try {
      const res = await authApi.sendOtp(email);
      if (res.data?.success) {
        setOtpSent(true);
        setOtpSuccess(res.data.message || 'Verification code sent to your email!');
      } else {
        setError(res.data?.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Could not send OTP. Verify email syntax and make sure backend server is running.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role || !otp) {
      setError('Please fill in all fields and enter the verification code.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!otpSent) {
      setError('Please send and verify the email verification code first.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await register(name, email, password, role, otp);
      // Success redirection is handled by the useEffect above
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try using another email.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-md p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold font-heading text-[var(--color-primary)] tracking-wide">Create Account</h2>
            <p className="text-xs text-[var(--color-muted)]">Join the HUNAR marketplace today.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Ali"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Email Address</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50 px-4 rounded-xl text-xs font-bold transition duration-200 whitespace-nowrap"
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>
              {otpSuccess && <p className="text-emerald-500 text-xs mt-1 font-medium">{otpSuccess}</p>}
            </div>

            {/* OTP field */}
            {otpSent && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Verification Code (OTP)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                    <ShieldAlert size={16} />
                  </span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                    required
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            {/* Password field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Password (Min 6 chars)</label>
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
              
              {password && (() => {
                const strength = getPasswordStrength(password);
                return (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-[var(--color-muted)]">Password Strength:</span>
                      <span className={strength.score === 1 ? 'text-rose-500' : strength.score === 2 ? 'text-amber-500' : strength.score === 3 ? 'text-cyan-500' : 'text-emerald-500'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-bg)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${strength.color} transition-all duration-300`} 
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Role selector buttons */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block mb-2">I want to:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition duration-200 ${
                    role === 'customer'
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
                  }`}
                >
                  Hire Service Providers
                </button>
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition duration-200 ${
                    role === 'worker'
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
                  }`}
                >
                  Provide Work Services
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/20 disabled:text-[var(--color-muted)]/60 disabled:border-transparent disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 text-sm mt-6"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Register Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]/40 pt-6">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-[var(--color-primary)] font-bold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;
