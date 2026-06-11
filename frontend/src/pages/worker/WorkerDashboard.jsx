import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { worker as workerApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import ReliabilityBadge from '../../components/ReliabilityBadge';
import { 
  Briefcase, Star, ClipboardList, CheckCircle, Clock, 
  MessageSquare, UserCircle, Bell, Trash2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const JobAlertCard = ({ notif, isUrdu, t }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft === 0) return null;

  const progressPercent = (timeLeft / 300) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div 
      className="bg-[var(--color-bg)] border-l-4 border-[var(--color-primary)] rounded-r-xl p-4 flex flex-col gap-2 border-y border-r border-[var(--color-border)] animate-fade-in relative overflow-hidden"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1 max-w-[80%]">
          <h4 className="font-bold text-sm text-[var(--color-text)]">{notif.title}</h4>
          <div className="flex flex-wrap gap-x-4 text-xs text-[var(--color-muted)]">
            <span>{t("Location", "Jaga")}: <strong className="text-[var(--color-text)]">{notif.location}</strong></span>
            <span>{t("Skill", "Hunar")}: <strong className="text-[var(--color-text)]">{notif.skill_required}</strong></span>
            <span>{t("Budget", "Budget")}: <strong className="text-emerald-400">Rs {notif.budget}</strong></span>
          </div>
        </div>
        
        <Link 
          to="/worker/jobs"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-[10px] font-extrabold px-3 py-1.5 rounded uppercase tracking-wider transition"
        >
          {t("View Job", "Kaam Dekhein")}
        </Link>
      </div>

      <div className="flex items-center justify-between text-[9px] text-[var(--color-muted)] mt-1">
        <span>{t("Alert Expiry", "Time Baqi")}: {mins}:{secs.toString().padStart(2, '0')}</span>
        <div className="w-2/3 bg-[var(--color-border)] h-1 rounded overflow-hidden">
          <div 
            className="bg-[var(--color-primary)] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const WorkerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isUrdu = localStorage.getItem('lang') === 'ur';
  const t = (enText, urText) => isUrdu ? urText : enText;

  // WebSocket hook connection
  const { notifications, isConnected, clearNotifications } = useWebSocket(user?.user_id);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await workerApi.getProfile(user.user_id);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch worker profile. Please verify that the API is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1 space-y-8 animate-fade-in">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-wide">
              {t("Welcome Back", "Khush Aamdeed")}, {user?.name || 'Worker'}!
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              {t("Manage jobs, view real-time alerts, and level up your badges.", "Apne kamo ka hisaab rakhein, real-time alerts dekhein aur badges barhaein.")}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 bg-[var(--color-card)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[var(--color-text)]">{t("WebSocket: ", "WebSocket Connection: ")}{isConnected ? t("Online", "Faal") : t("Reconnecting...", "Dobara connect ho raha hai...")}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
            {error}
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Profile Emblem & Rep Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Reliability Badge Summary */}
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-3xl shadow-md space-y-4">
                <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">
                  {t("Reputation Profile", "Shuhrat Profile")}
                </span>
                <ReliabilityBadge 
                  score={profile.reliability_score} 
                  badge={profile.reliability_badge} 
                />
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  {t(
                    "Earn Gold status by completing work on time, maintaining star ratings > 4.0, and avoiding contract cancellations.",
                    "Gold badge hasil karne ke liye time par kaam poora karein, average rating 4.0 se upar rakhein aur cancellations se bachein."
                  )}
                </p>
              </div>

              {/* Stats Breakdown cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[var(--color-muted)]">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t("Completed", "Mukammal")}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-[var(--color-text)]">{profile.total_jobs}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block">{t("Jobs Done", "Kaam Mukammal")}</span>
                  </div>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[var(--color-muted)]">
                    <Star size={18} className="text-[#EAB308]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t("Rating", "Darja")}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-[var(--color-text)]">{profile.rating_history?.toFixed(1) || '5.0'}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block">{t("Avg Stars", "Ausat Sitare")}</span>
                  </div>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[var(--color-muted)]">
                    <ClipboardList size={18} className="text-indigo-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t("Success", "Kamyabi")}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-[var(--color-text)]">{Math.round(profile.job_completion_rate * 100)}%</span>
                    <span className="text-[10px] text-[var(--color-muted)] block">{t("Completion", "Kam-yabi Rate")}</span>
                  </div>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[var(--color-muted)]">
                    <Clock size={18} className="text-rose-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{t("Response", "Jawaab")}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-[var(--color-text)]">{profile.response_time_hours}h</span>
                    <span className="text-[10px] text-[var(--color-muted)] block">{t("Average Time", "Ausat Waqt")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Real-time Dispatch Feeds & Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispatch Alert Console */}
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl shadow-md p-6 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)] mb-4">
                  <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Bell size={18} className="text-[var(--color-primary)]" /> {t("Active Opportunities Near You", "Aap Ke Qareeb Kaam Ke Mauqe")}
                  </h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-500 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Trash2 size={12} /> {t("Clear Feed", "Feed Saaf Karein")}
                    </button>
                  )}
                </div>

                {/* Notifications list */}
                <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 flex-1">
                  {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 text-[var(--color-muted)]">
                      <Bell size={36} className="text-[var(--color-border)] mb-3 animate-bounce" />
                      <p className="text-sm font-semibold text-[var(--color-text)]">{t("Looking out for matching jobs in your area...", "Aap ke ilaqay me naye kaamo ki talaash jari hai...")}</p>
                      <p className="text-[11px] max-w-xs mt-1">
                        {t(
                          "When a customer posts a matching skill request in Lahore, it will appear here instantly in real-time.",
                          "Jab koi customer aapke hunar se milta julta kaam Lahore me post karega, woh yahan foran real-time me dikh jayega."
                        )}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <JobAlertCard 
                        key={notif.id} 
                        notif={notif} 
                        isUrdu={isUrdu} 
                        t={t} 
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Quick links block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link 
                  to="/worker/jobs" 
                  className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 rounded-2xl flex justify-between items-center transition duration-200"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-[var(--color-text)] block">{t("Browse Open Jobs", "Kaam Talash Karein")}</span>
                    <span className="text-[10px] text-[var(--color-muted)]">{t("Accept requests and start earning", "Kaam accept karein aur paise kamaein")}</span>
                  </div>
                  <ArrowRight size={18} className="text-[var(--color-primary)]" />
                </Link>

                <Link 
                  to="/worker/profile" 
                  className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-5 rounded-2xl flex justify-between items-center transition duration-200"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-[var(--color-text)] block">{t("Edit Worker Profile", "Profile Tabdeel Karein")}</span>
                    <span className="text-[10px] text-[var(--color-muted)]">{t("Update location, rate, and KYC", "Apni location, rate aur KYC badlein")}</span>
                  </div>
                  <ArrowRight size={18} className="text-[var(--color-primary)]" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
export default WorkerDashboard;
