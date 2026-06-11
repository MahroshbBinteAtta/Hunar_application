import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobs as jobsApi, worker as workerApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import JobCard from '../../components/JobCard';
import { Info, Briefcase, FileSignature, Layers } from 'lucide-react';

export const JobRequests = () => {
  const { user } = useAuth();
  const [openJobs, setOpenJobs] = useState([]);
  const [workerJobs, setWorkerJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'open'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workerProfile, setWorkerProfile] = useState(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      
      // Fetch worker profile to check KYC status
      const profRes = await workerApi.getProfile(user.user_id);
      setWorkerProfile(profRes.data);
      
      // Fetch open jobs
      const jobsRes = await jobsApi.getOpenJobs();
      setOpenJobs(jobsRes.data || []);

      // Fetch worker's active assigned jobs
      const workerJobsRes = await jobsApi.getWorkerJobs(user.user_id);
      const activeStates = ['accepted', 'en_route', 'arrived', 'in_progress', 'disputed'];
      const active = (workerJobsRes.data || []).filter(j => activeStates.includes(j.status));
      setWorkerJobs(active);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve open jobs or worker profile. Make sure the backend is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAcceptJob = async (jobId) => {
    if (!workerProfile) return;
    
    if (workerProfile.kyc_status !== 'verified') {
      alert("Verification Required: Your profile must be KYC verified by an administrator before accepting jobs. Please edit your profile to submit CNIC.");
      return;
    }

    try {
      await jobsApi.acceptJob(jobId, user.user_id);
      alert("Success! You have accepted the job request. The customer has been notified.");
      setActiveTab('active');
      loadData(); // reload
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to accept job.");
    }
  };

  const handleStatusChange = async (jobId, statusName) => {
    try {
      await jobsApi.updateJobStatus(jobId, statusName);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status.");
    }
  };

  const handleReportDispute = async (jobId) => {
    try {
      await jobsApi.reportDispute(jobId);
      loadData();
      alert("Dispute report filed. Administrators have been notified.");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to report dispute.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-wide flex items-center gap-2">
            <FileSignature className="text-[var(--color-primary)]" /> Worker Job Panel
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Manage active work progression, browse open requests, and coordinate with customers.</p>
        </div>

        {workerProfile && workerProfile.kyc_status !== 'verified' && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-start gap-2.5 text-xs">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Account Under Verification:</strong> Your KYC status is currently <span className="underline font-bold">{workerProfile.kyc_status}</span>. You will not be able to accept job requests until an administrator approves your CNIC and address. Update your details in the "Edit Profile" tab.
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] space-x-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-sm font-bold transition duration-200 border-b-2 px-1 ${
              activeTab === 'active'
                ? 'border-[var(--color-primary)] text-white'
                : 'border-transparent text-[var(--color-muted)] hover:text-white'
            }`}
          >
            My Active Jobs ({workerJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-3 text-sm font-bold transition duration-200 border-b-2 px-1 ${
              activeTab === 'open'
                ? 'border-[var(--color-primary)] text-white'
                : 'border-transparent text-[var(--color-muted)] hover:text-white'
            }`}
          >
            Browse Open Requests ({openJobs.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
            {error}
          </div>
        ) : activeTab === 'active' ? (
          workerJobs.length === 0 ? (
            <div className="bg-[var(--color-card)]/30 border border-[var(--color-border)]/60 p-12 rounded-2xl text-center space-y-2">
              <Layers className="mx-auto text-[var(--color-muted)]" size={32} />
              <h3 className="text-sm font-bold text-[var(--color-text)]">No Active Jobs</h3>
              <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">You do not have any active jobs right now. Go to the "Browse Open Requests" tab to accept job orders.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {workerJobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  role="worker"
                  onStatusChange={handleStatusChange}
                  onReportDispute={handleReportDispute}
                />
              ))}
            </div>
          )
        ) : openJobs.length === 0 ? (
          <div className="bg-[var(--color-card)]/30 border border-[var(--color-border)]/60 p-12 rounded-2xl text-center space-y-2">
            <Info className="mx-auto text-[var(--color-muted)]" size={32} />
            <h3 className="text-sm font-bold text-[var(--color-text)]">No Job Proposals Found</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">There are currently no open job posts matching the platform listings. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {openJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                role="worker"
                onAccept={handleAcceptJob}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default JobRequests;
