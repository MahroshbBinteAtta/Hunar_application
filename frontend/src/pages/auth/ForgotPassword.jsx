import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from 'axios';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError('');
    setSendingOtp(true);
    setOtpSuccess('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/auth/send-otp`, null, { params: { email } });
      if (res.data?.success) {
        setOtpSent(true);
        setOtpSuccess('A verification OTP has been sent! Check the terminal console.');
      } else {
        setError(res.data?.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Could not send OTP. Verify that the server is running.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await axios.post(`${API_URL}/auth/forgot-password/reset`, {
        email,
        otp,
        new_password: newPassword
      });

      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to reset password. Please check the OTP.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-md p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-2xl mb-2">
              <KeyRound size={28} />
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--color-text)] tracking-wide">Recover Password</h2>
            <p className="text-xs text-[var(--color-muted)]">Enter your email to request a secure verification OTP.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {otpSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs">
              {otpSuccess}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-4">
            {/* Email */}
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
                  className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50 px-4 rounded-xl text-xs font-bold transition duration-200"
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Request OTP'}
                </button>
              </div>
            </div>

            {/* OTP */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Verification OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP code"
                maxLength={6}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] tracking-[0.2em] text-center font-mono placeholder-tracking-normal"
                required
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-muted)]/50"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 text-sm mt-6"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Reset Password <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[var(--color-muted)] border-t border-[var(--color-border)]/40 pt-6">
            Remembered your password?{' '}
            <Link to="/auth/login" className="text-[var(--color-primary)] font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
