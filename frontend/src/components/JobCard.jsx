import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, Calendar, Star, CheckCircle, Flag, ShieldAlert } from 'lucide-react';

export const JobCard = ({ job, role, onAccept, onComplete, onRate, onStatusChange, onReportDispute }) => {
  const [showRateForm, setShowRateForm] = useState(false);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [review, setReview] = useState('');
  const [rateError, setRateError] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'accepted': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'en_route': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'arrived': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'in_progress': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'disputed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const activeStatuses = ["accepted", "en_route", "arrived", "in_progress", "completed"];
  const statusLabels = {
    accepted: "Accepted",
    en_route: "En Route",
    arrived: "Arrived",
    in_progress: "In Progress",
    completed: "Complete"
  };

  const getStatusStepIndex = (status) => {
    return activeStatuses.indexOf(status);
  };

  const handleRateSubmit = (e) => {
    e.preventDefault();
    setRateError('');
    onRate(job.job_id, ratingQuality, ratingPunctuality, ratingCommunication, review)
      .then(() => {
        setShowRateForm(false);
        setReview('');
      })
      .catch((err) => {
        setRateError(err.response?.data?.detail || "Spam reviews are blocked by safety filters.");
      });
  };

  const formattedDate = job.created_at 
    ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const currentStep = getStatusStepIndex(job.status);

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 hover:border-[var(--color-primary)]/30 transition-all duration-300 shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${getStatusColor(job.status)}`}>
              {job.status === 'en_route' ? 'En Route' : job.status === 'in_progress' ? 'In Progress' : job.status}
            </span>
            {job.status === 'disputed' && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded flex items-center gap-1">
                <ShieldAlert size={10} /> Disputed
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text)] tracking-wide mt-2">{job.title}</h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-[var(--color-muted)] block">Locked Price</span>
          <span className="text-base font-extrabold text-[var(--color-primary)]">Rs {job.budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--color-muted)] mb-4 leading-relaxed">
        {job.description}
      </p>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)] bg-[var(--color-bg)]/50 p-3 rounded-xl mb-4 border border-[var(--color-border)]/40">
        <div className="flex items-center gap-1.5">
          <Briefcase size={14} className="text-[var(--color-primary)]" />
          <span>Category: <strong className="text-[var(--color-text)]">{job.skill_required}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-[var(--color-primary)]" />
          <span>Location: <strong className="text-[var(--color-text)]">{job.location}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Calendar size={14} className="text-[var(--color-muted)]" />
          <span>Posted on: <strong className="text-[var(--color-text)]">{formattedDate}</strong></span>
        </div>
      </div>

      {/* AI price suggestion badge */}
      {job.price_suggestion && job.status === 'open' && (
        <div className="text-[11px] font-medium bg-[var(--color-border)]/40 text-[var(--color-text)] py-2 px-3 rounded-lg border border-[var(--color-border)] mb-4 flex justify-between items-center">
          <span className="text-[var(--color-muted)]">AI Estimated Market Price:</span>
          <span className="text-[#EAB308] font-bold">Rs {job.price_suggestion.min} – Rs {job.price_suggestion.max}</span>
        </div>
      )}

      {/* Stage Progress Indicator */}
      {currentStep !== -1 && (
        <div className="mb-6 bg-[var(--color-bg)]/60 border border-[var(--color-border)]/40 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider block font-bold">Job Status Pipeline</span>
            {["accepted", "en_route", "arrived", "in_progress"].includes(job.status) && onReportDispute && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to flag this job as disputed? This will pause progress and alert administrators for dispute mediation.")) {
                    onReportDispute(job.job_id);
                  }
                }}
                className="text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Flag size={12} /> Raise Dispute
              </button>
            )}
          </div>
          
          <div className="flex justify-between items-center relative pt-2">
            {/* Background Line */}
            <div className="absolute left-4 right-4 h-0.5 bg-[var(--color-border)] -z-0" />
            
            {/* Foreground Progress Line */}
            <div 
              className="absolute left-4 h-0.5 bg-[var(--color-primary)] transition-all duration-300"
              style={{
                width: `${(currentStep / (activeStatuses.length - 1)) * 90}%`,
                zIndex: 0
              }}
            />

            {activeStatuses.map((stepName, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div key={idx} className="flex flex-col items-center z-10 relative">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/30 scale-110' 
                        : isCompleted 
                        ? 'bg-[var(--color-hover)] text-white' 
                        : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-muted)]'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[9px] text-[var(--color-muted)] mt-1 font-semibold whitespace-nowrap">
                    {statusLabels[stepName]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4 border-t border-[var(--color-border)]/50 pt-4">
        {/* Worker accepting jobs */}
        {role === 'worker' && job.status === 'open' && onAccept && (
          <button
            onClick={() => onAccept(job.job_id)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
          >
            Accept Job Proposal
          </button>
        )}

        {/* Worker active job progression buttons */}
        {role === 'worker' && onStatusChange && (
          <>
            {job.status === 'accepted' && (
              <button
                onClick={() => onStatusChange(job.job_id, 'en_route')}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
              >
                Start Travel (En Route)
              </button>
            )}
            {job.status === 'en_route' && (
              <button
                onClick={() => onStatusChange(job.job_id, 'arrived')}
                className="bg-[#00ADB5] hover:bg-[#008f96] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
              >
                Confirm Arrival (Arrived)
              </button>
            )}
            {job.status === 'arrived' && (
              <button
                onClick={() => onStatusChange(job.job_id, 'in_progress')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
              >
                Begin Labor (In Progress)
              </button>
            )}
            {job.status === 'in_progress' && (
              <button
                onClick={() => onStatusChange(job.job_id, 'completed')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200 flex items-center gap-1.5"
              >
                <CheckCircle size={15} /> Complete Work
              </button>
            )}
          </>
        )}

        {/* Customer marked as accepted work confirmation */}
        {role === 'customer' && job.status === 'accepted' && onComplete && (
          <button
            onClick={() => onComplete(job.job_id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200 flex items-center gap-1.5"
          >
            <CheckCircle size={15} /> Confirm Work Complete
          </button>
        )}

        {/* Customer rating the completed job */}
        {role === 'customer' && job.status === 'completed' && !job.rating && onRate && (
          <button
            onClick={() => setShowRateForm(!showRateForm)}
            className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-primary)] text-[var(--color-text)] text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
          >
            Leave Review & Rate
          </button>
        )}
      </div>

      {/* Review content displays if left */}
      {job.rating !== undefined && job.rating !== null && (
        <div className="mt-4 border-t border-[var(--color-border)]/40 pt-4 text-xs space-y-2">
          <span className="text-[var(--color-muted)] block font-semibold">Customer Review Summary:</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[var(--color-bg)]/55 p-3 rounded-xl border border-[var(--color-border)]/30">
            <div>
              <span className="text-[10px] text-[var(--color-muted)] block mb-0.5">Quality of Service</span>
              <div className="flex text-[#EAB308]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < (job.rating_quality || job.rating) ? "currentColor" : "none"} />
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-[10px] text-[var(--color-muted)] block mb-0.5">Punctuality</span>
              <div className="flex text-[#EAB308]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < (job.rating_punctuality || job.rating) ? "currentColor" : "none"} />
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-[10px] text-[var(--color-muted)] block mb-0.5">Communication</span>
              <div className="flex text-[#EAB308]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < (job.rating_communication || job.rating) ? "currentColor" : "none"} />
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[var(--color-bg)]/30 rounded-xl border border-[var(--color-border)]/20">
            <span className="text-[10px] text-[var(--color-muted)] block font-semibold mb-1">Average: ⭐ {job.rating}</span>
            {job.review && <p className="text-[var(--color-text)] italic">"{job.review}"</p>}
          </div>
        </div>
      )}

      {/* Embedded rating popup form */}
      {showRateForm && (
        <form onSubmit={handleRateSubmit} className="mt-4 border-t border-[var(--color-border)]/60 pt-4 animate-fade-in space-y-4">
          <h4 className="text-xs font-bold text-[var(--color-text)]">Rate Worker Performance (3 Dimensions)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--color-bg)]/55 p-4 rounded-xl border border-[var(--color-border)]/40">
            {/* Quality rating */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 uppercase">Quality of Work</span>
              <div className="flex text-[#EAB308] space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingQuality(star)}
                    className="hover:scale-110 transition duration-150"
                  >
                    <Star size={16} fill={star <= ratingQuality ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Punctuality rating */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 uppercase">Punctuality</span>
              <div className="flex text-[#EAB308] space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingPunctuality(star)}
                    className="hover:scale-110 transition duration-150"
                  >
                    <Star size={16} fill={star <= ratingPunctuality ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Communication rating */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-[var(--color-muted)] mb-1.5 uppercase">Communication</span>
              <div className="flex text-[#EAB308] space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingCommunication(star)}
                    className="hover:scale-110 transition duration-150"
                  >
                    <Star size={16} fill={star <= ratingCommunication ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[var(--color-muted)] uppercase">Written Review (Optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell other customers about your experience (e.g. tidy cleanup, professional tools)..."
              className="w-full text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-2.5 focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)] resize-none h-16"
              maxLength={250}
            />
          </div>

          {rateError && (
            <p className="text-[11px] text-[#EF4444]">{rateError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRateForm(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition duration-200"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default JobCard;
