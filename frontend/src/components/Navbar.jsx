import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, LogOut, Shield, Award, PlusCircle, CheckSquare, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = React.useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-[var(--color-card)] border-b border-[var(--color-border)] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
      {/* Brand logo */}
      <Link to="/" className="flex items-center space-x-2.5">
        <svg className="w-6 h-6 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2z" strokeLinejoin="round" />
          <path d="M12 22V12" />
          <path d="M12 12L22 8.5" />
          <path d="M12 12L2 8.5" />
        </svg>
        <span className="text-xl font-extrabold font-heading text-[var(--color-text)] tracking-wide uppercase">
          Hunar<span className="text-[var(--color-primary)]">.</span>
        </span>
        <span className="bg-[var(--color-border)] text-[9px] font-bold px-2 py-0.5 rounded text-[var(--color-muted)] border border-[var(--color-border)]/60">
          PK
        </span>
      </Link>

      {/* Navigation items */}
      <div className="flex items-center space-x-6">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] rounded-xl transition duration-200"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            {/* Customer links */}
            {user.role === 'customer' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/customer" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5">
                  <Briefcase size={15} /> Find Talents
                </Link>
                <Link to="/customer/my-jobs" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5">
                  <CheckSquare size={15} /> My Jobs
                </Link>
                <Link to="/customer/post-job" className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition duration-200 flex items-center gap-1">
                  <PlusCircle size={14} /> Post a Job
                </Link>
              </div>
            )}

            {/* Worker links */}
            {user.role === 'worker' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/worker" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5">
                  <Briefcase size={15} /> My Panel
                </Link>
                <Link to="/worker/jobs" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5">
                  <CheckSquare size={15} /> Open Work
                </Link>
                <Link to="/worker/profile" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5">
                  <User size={15} /> Update Skills
                </Link>
              </div>
            )}

            {/* Admin links */}
            {user.role === 'admin' && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/admin" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200 flex items-center gap-1.5 text-amber-400">
                  <Shield size={15} /> Control Center
                </Link>
              </div>
            )}

            {/* Common User Profile & Logout section */}
            <div className="flex items-center space-x-4 border-l border-[var(--color-border)] pl-6">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={() => {
                  const current = localStorage.getItem('lang') || 'en';
                  localStorage.setItem('lang', current === 'en' ? 'ur' : 'en');
                  window.location.reload();
                }}
                className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-primary)]/40 text-[var(--color-text)] text-[9px] font-bold px-2.5 py-1 rounded-lg transition duration-200 uppercase tracking-wider"
              >
                {(localStorage.getItem('lang') || 'en') === 'en' ? 'Urdu' : 'English'}
              </button>

              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-[var(--color-text)]">{user.name}</span>
                <span className="text-[9px] text-[var(--color-muted)] font-bold uppercase tracking-wider">{user.role} Account</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-[var(--color-muted)] hover:text-[#EF4444] hover:bg-[var(--color-bg)] rounded-full transition duration-200"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/auth/login" className="text-sm font-semibold hover:text-[var(--color-primary)] transition duration-200">
              Log In
            </Link>
            <Link 
              to="/auth/register" 
              className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
