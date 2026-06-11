import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import axios from 'axios';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithToken, token, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if admin is already logged in
  useEffect(() => {
    if (token && user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, token, navigate]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your admin email address first.');
      return;
    }
    setError('');
    setSendingOtp(true);
    setOtpMessage('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/auth/send-otp`, null, { params: { email } });
      if (res.data?.success) {
        setOtpSent(true);
        setOtpMessage('A secure admin OTP has been generated! Check the terminal console.');
      } else {
        setError(res.data?.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Could not send OTP. Verify that the email is correct and the server is running.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !otp) {
      setError('Please fill in all fields (Email, Password, and OTP).');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/auth/admin/login`, {
        email,
        password,
        otp
      });

      // Login utilizing context handler
      loginWithToken(res.data.access_token, {
        user_id: res.data.user_id,
        role: res.data.role,
        email: email,
        name: "Admin User"
      });
      
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Admin login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-md p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex p-3 bg-red-500/10 border border-red-500/20 text-[var(--color-primary)] rounded-2xl mb-2">
              <KeyRound size={28} />
            </span>
            <h2 className="text-2xl font-extrabold text-[var(--color-text)] tracking-wide">Admin Secure Terminal</h2>
            <p className="text-xs text-[var(--color-muted)]">OTP verification is required for all administrative entries.</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl flex items-start gap-2 text-xs">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {otpMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs">
              {otpMessage}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Admin Email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hunar.pk"
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
                  {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Get OTP'}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Security Password</label>
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

            {/* OTP Verification Code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">One-Time Verification OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit verification code"
                maxLength={6}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] tracking-[0.2em] text-center font-mono placeholder-tracking-normal"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 text-sm mt-6 shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter Dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AdminLogin;
