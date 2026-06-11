import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { admin as adminApi, ml as mlApi, worker as workerApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import DemandChart from '../../components/DemandChart';
import PriceSuggestion from '../../components/PriceSuggestion';
import { 
  Shield, Users, ClipboardList, CheckCircle2, AlertTriangle, 
  Search, PlayCircle, BarChart3, Calculator, Cpu, Hammer, MapPin,
  Ban, Check, AlertOctagon, FileText, Activity
} from 'lucide-react';

const SKILLS_LIST = [
  "Electrician", "Plumber", "Carpenter", "AC Technician",
  "Painter", "Tutor", "Driver", "Mason", "Welder",
  "Gardener", "Cook", "Security Guard"
];

const LAHORE_NEIGHBORHOODS = [
  "Model Town", "Johar Town", "Gulberg", "DHA Phase 5", "Anarkali",
  "Bahria Town", "Iqbal Town", "Wapda Town", "Township", "Garden Town", "Cavalry Ground"
];

export const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kyc');
  const [stats, setStats] = useState({
    total_users: 0,
    total_workers: 0,
    total_jobs: 0,
    pending_kyc: 0,
    active_jobs: 0,
    completed_jobs: 0
  });

  const [pendingKyc, setPendingKyc] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [demandForecast, setDemandForecast] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [allUsersList, setAllUsersList] = useState([]);
  const [copiedJson, setCopiedJson] = useState(false);
  
  // Users Directory states
  const [usersDirectory, setUsersDirectory] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Workers Directory filter states
  const [workerQuery, setWorkerQuery] = useState('');
  const [workerSkillFilter, setWorkerSkillFilter] = useState('');

  // KYC Preview states
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(null); // workerId
  const [rejectReasonText, setRejectReasonText] = useState('');

  const [loading, setLoading] = useState(true);
  
  // Price Simulation States
  const [simJobType, setSimJobType] = useState(SKILLS_LIST[0]);
  const [simLocation, setSimLocation] = useState(LAHORE_NEIGHBORHOODS[0]);
  const [simPriceRes, setSimPriceRes] = useState(null);
  const [simPriceLoading, setSimPriceLoading] = useState(false);

  // DSA Simulation States
  const [simSkill, setSimSkill] = useState('elect');
  const [simDsaLocation, setSimDsaLocation] = useState(LAHORE_NEIGHBORHOODS[0]);
  const [simDsaSort, setSimDsaSort] = useState('hourly_rate');
  const [simDsaRes, setSimDsaRes] = useState(null);
  const [simDsaLoading, setSimDsaLoading] = useState(false);

  const loadAdminDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, kycRes, jobsRes, demandRes, logsRes, workersRes, allUsersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPendingKYC(),
        adminApi.getAllJobs(),
        mlApi.getDemandForecast(),
        adminApi.getAuditLogs(),
        workerApi.getAllWorkers(),
        adminApi.getUsersDirectory('', '')
      ]);
      setStats(statsRes.data);
      setPendingKyc(kycRes.data || []);
      setAllJobs(jobsRes.data || []);
      setDemandForecast(demandRes.data || null);
      setAuditLogs(logsRes.data || []);
      setWorkersList(workersRes.data || []);
      setAllUsersList(allUsersRes.data || []);
      
      // Load user directory
      const usersRes = await adminApi.getUsersDirectory(userRoleFilter, userQuery);
      setUsersDirectory(usersRes.data || []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminDashboard();
    }
  }, [user]);

  // Reactive user search
  useEffect(() => {
    if (user && user.role === 'admin') {
      const fetchUsers = async () => {
        try {
          const res = await adminApi.getUsersDirectory(userRoleFilter, userQuery);
          setUsersDirectory(res.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchUsers();
    }
  }, [userQuery, userRoleFilter]);

  const handleVerifyKyc = async (workerId) => {
    if (window.confirm("Approve worker registration profile and grant identity badge?")) {
      try {
        await adminApi.verifyKYC(workerId);
        alert("Worker KYC successfully verified!");
        loadAdminDashboard();
      } catch (err) {
        alert("Failed to verify worker.");
      }
    }
  };

  const handleRejectKycSubmit = async (workerId) => {
    if (!rejectReasonText.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await adminApi.rejectKYC(workerId, rejectReasonText);
      alert("Worker KYC rejected.");
      setShowRejectInput(null);
      setRejectReasonText('');
      loadAdminDashboard();
    } catch (err) {
      alert("Failed to reject worker KYC.");
    }
  };

  const handleLoadDoc = async (filepath) => {
    if (!filepath) return;
    try {
      const res = await adminApi.getDocToken(filepath);
      setPreviewUrl(res.data.signed_url);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not retrieve temporary signed document preview token.");
    }
  };

  const handleToggleSuspend = async (userId, isSuspended) => {
    const action = isSuspended ? "unsuspend" : "suspend";
    if (window.confirm(`Are you sure you want to ${action} this user account?`)) {
      try {
        await adminApi.toggleSuspendUser(userId, !isSuspended);
        alert(`User account has been successfully ${action}ed.`);
        loadAdminDashboard();
      } catch (err) {
        alert("Failed to update user account suspension status.");
      }
    }
  };

  const handleForceJobAction = async (jobId, actionName) => {
    const actionWord = actionName === 'complete' ? 'COMPLETE' : 'CANCEL';
    if (window.confirm(`FORCE ACTION: Are you sure you want to FORCE ${actionWord} on job ID ${jobId}? This action will be permanent and logged.`)) {
      try {
        await adminApi.forceJobAction(jobId, actionName);
        alert(`Job status forced successfully.`);
        loadAdminDashboard();
      } catch (err) {
        alert("Failed to force job action.");
      }
    }
  };

  const runPriceSimulation = async (e) => {
    e.preventDefault();
    setSimPriceLoading(true);
    try {
      const res = await mlApi.getPrice(simJobType, simLocation, 5, 65.0); // Mid-tier, high demand index
      setSimPriceRes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimPriceLoading(false);
    }
  };

  const runDsaSimulation = async (e) => {
    e.preventDefault();
    setSimDsaLoading(true);
    try {
      const res = await mlApi.getDSADemo(simSkill, simDsaLocation, simDsaSort);
      setSimDsaRes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimDsaLoading(false);
    }
  };

  const handleCopyJson = (jsonText) => {
    navigator.clipboard.writeText(jsonText);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const renderStatsChart = () => {
    const data = [
      { label: "Completed Jobs", count: stats.completed_jobs || 0, color: "#10B981" },
      { label: "Active Contracts", count: stats.active_jobs || 0, color: "#3B82F6" },
      { label: "Identity Verifications", count: stats.pending_kyc || 0, color: "#F59E0B" },
      { label: "Total Marketplace Jobs", count: stats.total_jobs || 0, color: "#8B5CF6" }
    ];
    const maxVal = Math.max(...data.map(d => d.count), 1);

    return (
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider block">Completed & Active Jobs Ratio</h3>
        <div className="space-y-3">
          {data.map((item, idx) => {
            const pct = (item.count / maxVal) * 100;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--color-muted)]">{item.label}</span>
                  <span className="text-[var(--color-text)]">{item.count}</span>
                </div>
                <div className="w-full bg-[var(--color-bg)] h-2.5 rounded-full overflow-hidden border border-[var(--color-border)]/40">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-rose-400 flex items-center justify-center font-bold">
        Access Denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 w-full flex-1 space-y-8 animate-fade-in">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-wide flex items-center gap-2">
              <Shield className="text-[#EAB308]" /> Admin Control Center
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">Verify member credentials, monitor active marketplace contracts, analyze labor demand, and inspect matching diagnostics.</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl">
            <div className="flex justify-between items-center text-[var(--color-muted)]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Users</span>
              <Users size={16} />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-text)] mt-2">{stats.total_users}</p>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl">
            <div className="flex justify-between items-center text-[var(--color-muted)]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Registered Workers</span>
              <Users size={16} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-text)] mt-2">{stats.total_workers}</p>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl">
            <div className="flex justify-between items-center text-[var(--color-muted)]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Jobs</span>
              <ClipboardList size={16} />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-text)] mt-2">{stats.total_jobs}</p>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl">
            <div className="flex justify-between items-center text-[var(--color-muted)]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Pending KYC</span>
              <AlertTriangle size={16} className="text-[#EAB308]" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-text)] mt-2">{stats.pending_kyc}</p>
          </div>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl">
            <div className="flex justify-between items-center text-[var(--color-muted)]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Active Contracts</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-text)] mt-2">{stats.active_jobs}</p>
          </div>
        </div>

        {/* Stats visual overview */}
        {renderStatsChart()}

        {/* Tab Buttons */}
        <div className="flex border-b border-[var(--color-border)] overflow-x-auto">
          <button 
            onClick={() => setActiveTab('kyc')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'kyc' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Identity Verifications ({pendingKyc.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'users' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            User Management Directory
          </button>
          <button 
            onClick={() => setActiveTab('workers')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'workers' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Worker Profiles Directory ({workersList.length})
          </button>
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'jobs' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Marketplace Job Contracts
          </button>
          <button 
            onClick={() => setActiveTab('demand')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'demand' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Market Demand Insights
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'audit' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            System Activity Logs ({auditLogs.length})
          </button>
          <button 
            onClick={() => setActiveTab('dsa_demo')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'dsa_demo' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Matching Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('price_demo')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition duration-150 whitespace-nowrap ${activeTab === 'price_demo' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}
          >
            Pricing Simulator
          </button>
        </div>

        {/* Tab Content rendering */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. Pending KYC */}
            {activeTab === 'kyc' && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md">
                {pendingKyc.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[var(--color-muted)] italic">No pending identity verifications awaiting review.</div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--color-bg)] text-[var(--color-muted)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]/60">
                          <th className="p-4">Name</th>
                          <th className="p-4">Skills</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Document Previews</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]/40">
                        {pendingKyc.map((w, idx) => (
                          <React.Fragment key={idx}>
                            <tr className="hover:bg-[var(--color-bg)]/40 text-[var(--color-text)]">
                              <td className="p-4 font-bold">{w.name}</td>
                              <td className="p-4">{w.skills.join(', ')}</td>
                              <td className="p-4">{w.location}</td>
                              <td className="p-4 space-x-2">
                                {w.cnic_doc_url && (
                                  <button 
                                    onClick={() => handleLoadDoc(w.cnic_doc_url)}
                                    className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-2.5 py-1 rounded border border-[var(--color-border)] font-bold"
                                  >
                                    CNIC Scan
                                  </button>
                                )}
                                {w.cert_doc_url && (
                                  <button 
                                    onClick={() => handleLoadDoc(w.cert_doc_url)}
                                    className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-2.5 py-1 rounded border border-[var(--color-border)] font-bold"
                                  >
                                    Cert Scan
                                  </button>
                                )}
                                {w.profile_photo_url && (
                                  <button 
                                    onClick={() => handleLoadDoc(w.profile_photo_url)}
                                    className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-2.5 py-1 rounded border border-[var(--color-border)] font-bold"
                                  >
                                    Profile Pic
                                  </button>
                                )}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button 
                                  onClick={() => handleVerifyKyc(w.user_id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded transition"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => setShowRejectInput(showRejectInput === w.user_id ? null : w.user_id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-3 rounded transition"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                            
                            {/* Rejection input nested row */}
                            {showRejectInput === w.user_id && (
                              <tr className="bg-rose-950/20 border-l border-rose-500">
                                <td colSpan="5" className="p-4">
                                  <div className="flex gap-4 items-center">
                                    <span className="font-bold text-rose-400 text-xs">Reason for Rejection:</span>
                                    <input 
                                      type="text" 
                                      value={rejectReasonText}
                                      onChange={(e) => setRejectReasonText(e.target.value)}
                                      placeholder="CNIC details are blurred. Please resubmit clear scan..."
                                      className="flex-1 bg-[var(--color-bg)] border border-rose-500/40 rounded-xl px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none"
                                    />
                                    <button 
                                      onClick={() => handleRejectKycSubmit(w.user_id)}
                                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs"
                                    >
                                      Submit Rejection
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. User Directory */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-wrap gap-4 items-center">
                  <div className="flex-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--color-muted)]">
                      <Search size={15} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search users by name or email..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-xs text-[var(--color-text)] cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="worker">Workers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md">
                  {usersDirectory.length === 0 ? (
                    <div className="p-12 text-center text-sm text-[var(--color-muted)] italic">No users found matching search query.</div>
                  ) : (
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[var(--color-bg)] text-[var(--color-muted)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]/60">
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Suspension Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]/40">
                          {usersDirectory.map((usr, idx) => (
                            <tr key={idx} className="hover:bg-[var(--color-bg)]/40 text-[var(--color-text)]">
                              <td className="p-4 font-bold">{usr.name}</td>
                              <td className="p-4">{usr.email}</td>
                              <td className="p-4 uppercase font-bold text-[10px] tracking-wider text-[var(--color-muted)]">{usr.role}</td>
                              <td className="p-4">
                                {usr.is_suspended ? (
                                  <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    SUSPENDED
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    ACTIVE
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {usr.role !== 'admin' && (
                                  <button
                                    onClick={() => handleToggleSuspend(usr.user_id, usr.is_suspended)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                      usr.is_suspended 
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                    }`}
                                  >
                                    {usr.is_suspended ? 'Unsuspend' : 'Suspend Account'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Worker Profiles Directory */}
            {activeTab === 'workers' && (
              <div className="space-y-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-wrap gap-4 items-center">
                  <div className="flex-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--color-muted)]">
                      <Search size={15} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Search workers by name or location..."
                      value={workerQuery}
                      onChange={(e) => setWorkerQuery(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  
                  <select
                    value={workerSkillFilter}
                    onChange={(e) => setWorkerSkillFilter(e.target.value)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 text-xs text-[var(--color-text)] cursor-pointer"
                  >
                    <option value="">All Skills</option>
                    {SKILLS_LIST.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md">
                  {(() => {
                    const filtered = workersList.filter(w => {
                      const matchesQuery = !workerQuery || 
                        w.name.toLowerCase().includes(workerQuery.toLowerCase()) ||
                        w.location.toLowerCase().includes(workerQuery.toLowerCase());
                      const matchesSkill = !workerSkillFilter || w.skills.includes(workerSkillFilter);
                      return matchesQuery && matchesSkill;
                    });

                    if (filtered.length === 0) {
                      return <div className="p-12 text-center text-sm text-[var(--color-muted)] italic">No workers found matching your filter criteria.</div>;
                    }

                    return (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--color-bg)] text-[var(--color-muted)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]/60">
                              <th className="p-4">Name</th>
                              <th className="p-4">Skills</th>
                              <th className="p-4">Location</th>
                              <th className="p-4">Hourly Rate</th>
                              <th className="p-4">Experience</th>
                              <th className="p-4">Reliability</th>
                              <th className="p-4">Jobs / Disputes</th>
                              <th className="p-4">Verification Status</th>
                              <th className="p-4 text-right">Verification Files</th>
                              <th className="p-4 text-center">Inspect Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)]/40">
                            {filtered.map((w, idx) => (
                              <tr key={idx} className="hover:bg-[var(--color-bg)]/40 text-[var(--color-text)]">
                                <td className="p-4 font-bold">{w.name}</td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {w.skills.map((s, sidx) => (
                                      <span key={sidx} className="bg-[var(--color-border)]/40 text-[var(--color-text)] px-1.5 py-0.5 rounded text-[10px]">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4">{w.location}</td>
                                <td className="p-4 font-bold text-[var(--color-text)]">Rs {w.hourly_rate}/hr</td>
                                <td className="p-4">{w.experience_years} years</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      w.reliability_badge === 'Gold' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                                      w.reliability_badge === 'Silver' ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                                      'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                                    }`}>
                                      {w.reliability_badge}
                                    </span>
                                    <span className="text-[10px] text-[var(--color-muted)]">({w.reliability_score.toFixed(1)})</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-[var(--color-text)]">{w.total_jobs} done</span>
                                  {w.disputes > 0 && (
                                    <span className="text-rose-400 font-bold ml-1.5">({w.disputes} disputes)</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    w.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    w.kyc_status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {w.kyc_status}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-1.5">
                                  {w.cnic_doc_url ? (
                                    <button 
                                      onClick={() => handleLoadDoc(w.cnic_doc_url)}
                                      className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-2 py-1 rounded border border-[var(--color-border)] font-bold text-[10px]"
                                    >
                                      CNIC
                                    </button>
                                  ) : (
                                    <span className="text-gray-600 text-[10px] italic">No docs</span>
                                  )}
                                  {w.cert_doc_url && (
                                    <button 
                                      onClick={() => handleLoadDoc(w.cert_doc_url)}
                                      className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-2 py-1 rounded border border-[var(--color-border)] font-bold text-[10px]"
                                    >
                                      Cert
                                    </button>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={() => setSelectedWorker(w)}
                                    className="bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/35 border border-[var(--color-primary)]/30 text-[var(--color-primary)] px-2.5 py-1 rounded font-bold text-[10px] transition"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 4. Marketplace Job Contracts */}
            {activeTab === 'jobs' && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md">
                {allJobs.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[var(--color-muted)] italic">No jobs posted in database.</div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--color-bg)] text-[var(--color-muted)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]/60">
                          <th className="p-4">Title</th>
                          <th className="p-4">Skill Required</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Locked Price</th>
                          <th className="p-4">Status / Dispute</th>
                          <th className="p-4">Rating</th>
                          <th className="p-4 text-right">Emergency Force Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]/40">
                        {allJobs.map((job, idx) => (
                          <tr key={idx} className="hover:bg-[var(--color-bg)]/40 text-[var(--color-text)]">
                            <td className="p-4 font-bold">{job.title}</td>
                            <td className="p-4">{job.skill_required}</td>
                            <td className="p-4">{job.location}</td>
                            <td className="p-4 font-bold text-emerald-400">Rs {job.budget.toLocaleString()}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold ${
                                  job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  job.status === 'accepted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  job.status === 'disputed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                }`}>
                                  {job.status}
                                </span>
                                {job.status === 'disputed' && (
                                  <AlertOctagon size={13} className="text-rose-400 animate-pulse" />
                                )}
                              </div>
                            </td>
                            <td className="p-4">{job.rating ? `${job.rating}/5 Stars` : 'N/A'}</td>
                            <td className="p-4 text-right space-x-2">
                              {job.status !== 'completed' && job.status !== 'cancelled' && (
                                <>
                                  <button
                                    onClick={() => handleForceJobAction(job.job_id, 'complete')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded transition text-[10px]"
                                  >
                                    Force Complete
                                  </button>
                                  <button
                                    onClick={() => handleForceJobAction(job.job_id, 'cancel')}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded transition text-[10px]"
                                  >
                                    Force Cancel
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 5. Demand Forecast */}
            {activeTab === 'demand' && demandForecast && (
              <div className="space-y-6">
                <DemandChart demand_forecast={demandForecast.demand_forecast} />
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-xl text-[var(--color-primary)]">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider block font-semibold">AI Recommended Action</span>
                    <p className="text-[var(--color-text)] mt-0.5 font-medium">{demandForecast.recommendation}</p>
                    <span className="text-[10px] text-[var(--color-muted)] mt-1 block">Forecast calculated for current month: {demandForecast.current_month}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Security Audit Logs */}
            {activeTab === 'audit' && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md">
                {auditLogs.length === 0 ? (
                  <div className="p-12 text-center text-sm text-[var(--color-muted)] italic">No admin actions logged yet.</div>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--color-bg)] text-[var(--color-muted)] uppercase tracking-wider font-semibold border-b border-[var(--color-border)]/60">
                          <th className="p-4">Admin Email</th>
                          <th className="p-4">Action Taken</th>
                          <th className="p-4">Details</th>
                          <th className="p-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]/40 font-mono text-[var(--color-muted)]">
                        {auditLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-[var(--color-bg)]/40">
                            <td className="p-4 font-bold text-[var(--color-text)]">{log.admin_email}</td>
                            <td className="p-4"><span className="text-[var(--color-primary)] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 px-2 py-0.5 rounded">{log.action}</span></td>
                            <td className="p-4 text-xs text-[var(--color-text)]">{log.details}</td>
                            <td className="p-4 text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 7. DSA Sandbox */}
            {activeTab === 'dsa_demo' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Inputs */}
                <form onSubmit={runDsaSimulation} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl space-y-4 md:col-span-1">
                  <h3 className="font-bold text-[var(--color-text)] text-sm flex items-center gap-1.5 border-b border-[var(--color-border)] pb-3 mb-4">
                    <Cpu size={16} className="text-[var(--color-primary)]" /> Match Criteria
                  </h3>
                  
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-[var(--color-muted)] uppercase block">Skill Query</label>
                    <input
                      type="text"
                      value={simSkill}
                      onChange={(e) => setSimSkill(e.target.value)}
                      placeholder="e.g. elect"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 focus:outline-none text-[var(--color-text)]"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-[var(--color-muted)] uppercase block">Customer Location</label>
                    <select
                      value={simDsaLocation}
                      onChange={(e) => setSimDsaLocation(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 focus:outline-none text-[var(--color-text)] cursor-pointer"
                    >
                      {LAHORE_NEIGHBORHOODS.map((n, idx) => (
                        <option key={idx} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-[var(--color-muted)] uppercase block">Sort Property</label>
                    <select
                      value={simDsaSort}
                      onChange={(e) => setSimDsaSort(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 focus:outline-none text-[var(--color-text)] cursor-pointer"
                    >
                      <option value="hourly_rate">hourly_rate (cheap first)</option>
                      <option value="rating_history">rating_history (stars first)</option>
                      <option value="reliability_score">reliability_score (badge first)</option>
                      <option value="travel_time_mins">travel_time_mins (close first)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white font-bold py-2 rounded-xl text-xs transition flex justify-center items-center gap-1.5"
                  >
                    <PlayCircle size={15} /> Execute Pipeline
                  </button>
                </form>

                {/* Console Log outputs */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-md md:col-span-2 flex flex-col min-h-[400px]">
                  <div className="bg-[var(--color-bg)] p-3 border-b border-[var(--color-border)] flex justify-between items-center text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">
                    <span>HunarAlgorithmicEngine Pipeline Output</span>
                    {simDsaLoading && <span className="animate-pulse text-[var(--color-primary)]">Calculating match scores...</span>}
                  </div>
                  <div className="p-4 bg-[var(--color-bg)] text-xs font-mono text-emerald-400 overflow-auto flex-1 h-[400px]">
                    {simDsaRes ? (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(simDsaRes, null, 2)}</pre>
                    ) : (
                      <p className="text-[var(--color-muted)] italic">Input configurations and click "Execute Pipeline" to view output logs.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. Pricing Simulator */}
            {activeTab === 'price_demo' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Inputs */}
                <form onSubmit={runPriceSimulation} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl space-y-4 md:col-span-1">
                  <h3 className="font-bold text-[var(--color-text)] text-sm flex items-center gap-1.5 border-b border-[var(--color-border)] pb-3 mb-4">
                    <Calculator size={16} className="text-[var(--color-primary)]" /> Simulator Parameters
                  </h3>
                  
                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-[var(--color-muted)] uppercase block">Job Category</label>
                    <select
                      value={simJobType}
                      onChange={(e) => setSimJobType(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 focus:outline-none text-[var(--color-text)] cursor-pointer"
                    >
                      {SKILLS_LIST.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-semibold text-[var(--color-muted)] uppercase block">Neighborhood</label>
                    <select
                      value={simLocation}
                      onChange={(e) => setSimLocation(e.target.value)}
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2 px-3 focus:outline-none text-[var(--color-text)] cursor-pointer"
                    >
                      {LAHORE_NEIGHBORHOODS.map((n, idx) => (
                        <option key={idx} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white font-bold py-2 rounded-xl text-xs transition flex justify-center items-center gap-1.5"
                  >
                    <PlayCircle size={15} /> Predict Market Price
                  </button>
                </form>

                {/* Outputs */}
                <div className="md:col-span-2 space-y-4">
                  {simPriceLoading ? (
                    <div className="p-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl flex justify-center">
                      <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
                    </div>
                  ) : simPriceRes ? (
                    <div className="space-y-4 animate-fade-in">
                      <PriceSuggestion 
                        min_price={simPriceRes.min_price} 
                        max_price={simPriceRes.max_price}
                        suggested_price={simPriceRes.suggested_price}
                      />
                      <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl text-xs space-y-2">
                        <h4 className="font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 mb-3">Model Output Breakdown</h4>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Suggested Price (Target):</span>
                          <span className="font-bold text-[var(--color-text)]">Rs {simPriceRes.suggested_price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Suggested Range:</span>
                          <span className="font-bold text-[#EAB308]">{simPriceRes.suggested_range}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl text-center text-xs text-[var(--color-muted)] italic">
                      Adjust inputs and simulate marketplace pricing dynamics.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Worker Full Profile Dossier Modal */}
      {selectedWorker && (() => {
        const workerUser = allUsersList.find(u => u.user_id === selectedWorker.user_id);
        const workerEmail = workerUser ? workerUser.email : 'N/A';
        const isSuspended = workerUser ? workerUser.is_suspended : false;
        const jsonString = JSON.stringify(selectedWorker, null, 2);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col my-8 max-h-[90vh] overflow-hidden animate-fade-in text-xs">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                  <Shield className="text-[var(--color-primary)]" size={16} /> Professional Dossier: {selectedWorker.name}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedWorker(null);
                    setCopiedJson(false);
                  }}
                  className="p-1.5 hover:bg-[var(--color-bg)] rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
                {/* Profile Overview */}
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-[var(--color-bg)]/30 p-4 rounded-xl border border-[var(--color-border)]/40">
                  <div className="relative">
                    {selectedWorker.profile_photo_url ? (
                      <img 
                        src={selectedWorker.profile_photo_url} 
                        alt={selectedWorker.name} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-primary)]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#EAB308] flex items-center justify-center text-[var(--color-bg)] text-xl font-bold">
                        {selectedWorker.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-card)] ${
                      selectedWorker.is_available ? 'bg-emerald-500' : 'bg-gray-500'
                    }`} title={selectedWorker.is_available ? 'Available' : 'Unavailable'} />
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h4 className="text-sm font-extrabold text-[var(--color-text)]">{selectedWorker.name}</h4>
                    <p className="text-[10px] text-[var(--color-muted)] font-mono">User ID: {selectedWorker.user_id}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">Email: <span className="text-[var(--color-text)] font-medium">{workerEmail}</span></p>
                    
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedWorker.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {selectedWorker.is_available ? 'AVAILABLE' : 'BUSY/AWAY'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isSuspended ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isSuspended ? 'SUSPENDED' : 'ACTIVE ACCOUNT'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedWorker.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        selectedWorker.kyc_status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        KYC: {selectedWorker.kyc_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Skills & Trade</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedWorker.skills.map((s, idx) => (
                        <span key={idx} className="bg-[var(--color-border)] text-[10px] text-[var(--color-text)] px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Location</span>
                    <p className="text-xs text-[var(--color-text)] font-bold pt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-[var(--color-primary)]" /> {selectedWorker.location}
                    </p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Labor Rate</span>
                    <p className="text-xs text-[var(--color-primary)] font-extrabold pt-1">Rs {selectedWorker.hourly_rate}/hour</p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Experience</span>
                    <p className="text-xs text-[var(--color-text)] font-bold pt-1">{selectedWorker.experience_years} Years Active</p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Trust Level</span>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        selectedWorker.reliability_badge === 'Gold' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        selectedWorker.reliability_badge === 'Silver' ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                        'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                      }`}>
                        {selectedWorker.reliability_badge}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted)]">({selectedWorker.reliability_score.toFixed(1)}/100)</span>
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Market Standing</span>
                    <p className="text-xs text-[var(--color-text)] font-bold pt-1">⭐ {selectedWorker.rating_history.toFixed(1)} Avg Rating</p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Completed Jobs</span>
                    <p className="text-xs text-emerald-400 font-bold pt-1">{selectedWorker.total_jobs} Contracts Finished</p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Disputes</span>
                    <p className={`text-xs font-bold pt-1 ${selectedWorker.disputes > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                      {selectedWorker.disputes} Disputes Logged
                    </p>
                  </div>
                  <div className="bg-[var(--color-bg)]/50 p-3 rounded-xl border border-[var(--color-border)]/40 space-y-0.5">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider">Job Performance</span>
                    <p className="text-xs text-[var(--color-text)] font-bold pt-1">
                      {(selectedWorker.job_completion_rate * 100).toFixed(0)}% Completion / {selectedWorker.cancellation_history} cancels
                    </p>
                  </div>
                </div>

                {/* KYC Rejection Reason if applicable */}
                {selectedWorker.kyc_status === 'rejected' && selectedWorker.rejection_reason && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Verification Feedback Summary
                    </span>
                    <p className="text-xs text-[var(--color-text)] italic">{selectedWorker.rejection_reason}</p>
                  </div>
                )}

                {/* Document Preview Buttons */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-wider block">Identity & Skill Documents</span>
                  <div className="flex flex-wrap gap-3">
                    {selectedWorker.cnic_doc_url ? (
                      <button 
                        onClick={() => handleLoadDoc(selectedWorker.cnic_doc_url)}
                        className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-3 py-1.5 rounded-xl border border-[var(--color-border)] font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText size={14} /> Preview CNIC Identity Scan
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs italic">No CNIC Uploaded</span>
                    )}
                    
                    {selectedWorker.cert_doc_url ? (
                      <button 
                        onClick={() => handleLoadDoc(selectedWorker.cert_doc_url)}
                        className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-3 py-1.5 rounded-xl border border-[var(--color-border)] font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText size={14} /> Preview Trade Certificate
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs italic">No Certificate Uploaded</span>
                    )}

                    {selectedWorker.profile_photo_url && (
                      <button 
                        onClick={() => handleLoadDoc(selectedWorker.profile_photo_url)}
                        className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] text-[#EAB308] px-3 py-1.5 rounded-xl border border-[var(--color-border)] font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText size={14} /> Preview Profile Image
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible MongoDB JSON view */}
                <details className="mt-6 border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-bg)]/50 group">
                  <summary className="p-3 text-xs font-bold text-[var(--color-muted)] cursor-pointer hover:bg-[var(--color-bg)] flex justify-between items-center select-none">
                    <span>🗄️ Raw MongoDB-Equivalent JSON Data</span>
                    <span className="text-[10px] text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 border-t border-[var(--color-border)] space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] text-gray-500 font-mono">Collection: workers</span>
                      <button
                        type="button"
                        onClick={() => handleCopyJson(jsonString)}
                        className="bg-[var(--color-border)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                      >
                        {copiedJson ? '✓ Copied' : 'Copy JSON'}
                      </button>
                    </div>
                    <pre className="bg-[var(--color-bg)] border border-[var(--color-border)]/60 text-emerald-400 p-3.5 rounded-lg font-mono text-[10px] overflow-auto max-h-[250px] leading-relaxed scrollbar-thin">
                      {jsonString}
                    </pre>
                  </div>
                </details>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/30 flex justify-end">
                <button 
                  onClick={() => {
                    setSelectedWorker(null);
                    setCopiedJson(false);
                  }}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-xs font-bold px-4 py-2 rounded-xl text-white transition"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sandboxed Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                <FileText className="text-[#EAB308]" size={16} /> Document File Sandbox Preview
              </h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                className="p-1 hover:bg-[var(--color-bg)] rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-[var(--color-bg)] flex-1 flex justify-center items-center">
              <iframe 
                src={previewUrl} 
                title="Document Sandbox Preview" 
                className="w-full h-[450px] border border-[var(--color-border)] rounded-xl bg-slate-900" 
                sandbox=""
              />
            </div>
            <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
              <button 
                onClick={() => setPreviewUrl(null)}
                className="bg-[var(--color-border)] hover:bg-[var(--color-card)] text-xs font-bold px-4 py-2 rounded-lg text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminPanel;
