import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobs as jobsApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import JobCard from '../../components/JobCard';
import { Info, Briefcase } from 'lucide-react';

export const MyJobs = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await jobsApi.getCustomerJobs(user.user_id);
      setMyJobs(res.data || []);
    } catch (err) {
      console.error("Failed to load customer jobs:", err);
      setError("Failed to retrieve jobs. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleCompleteJob = async (jobId) => {
    try {
      await jobsApi.completeJob(jobId);
      fetchJobs(); // reload jobs
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to mark job as complete.");
    }
  };

  const handleRateJob = async (jobId, ratingQuality, ratingPunctuality, ratingCommunication, review) => {
    try {
      await jobsApi.rateJob(jobId, ratingQuality, ratingPunctuality, ratingCommunication, review);
      fetchJobs(); // reload jobs
    } catch (err) {
      // Propagate error back to JobCard form for visual display
      throw err;
    }
  };

  const handleReportDispute = async (jobId) => {
    try {
      await jobsApi.reportDispute(jobId);
      fetchJobs(); // reload jobs
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
            <Briefcase className="text-[var(--color-primary)]" /> My Posted Jobs
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Track open requests, accept completions, and rate worker performance.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
            {error}
          </div>
        ) : myJobs.length === 0 ? (
          <div className="bg-[var(--color-card)]/30 border border-[var(--color-border)]/60 p-12 rounded-2xl text-center space-y-2">
            <Info className="mx-auto text-[var(--color-muted)]" size={32} />
            <h3 className="text-sm font-bold text-[var(--color-text)]">No Jobs Posted Yet</h3>
            <p className="text-xs text-[var(--color-muted)] max-w-sm mx-auto">Create a job post by clicking "Post a Job" in the navigation bar to start receiving offers.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                role="customer"
                onComplete={handleCompleteJob}
                onRate={handleRateJob}
                onReportDispute={handleReportDispute}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default MyJobs;
