import React from 'react';
import { Star, MapPin, Clock, Briefcase, Award } from 'lucide-react';

export const WorkerCard = ({ worker, onHire }) => {
  const getBadgeColor = (badge) => {
    switch ((badge || '').trim()) {
      case 'Gold': return 'bg-[#EAB308] text-[var(--color-bg)] shadow-[0_0_8px_rgba(255,215,0,0.4)]';
      case 'Silver': return 'bg-[#C0C0C0] text-[var(--color-bg)] shadow-[0_0_8px_rgba(192,192,192,0.3)]';
      case 'Bronze': return 'bg-[#CD7F32] text-white shadow-[0_0_8px_rgba(205,127,50,0.2)]';
      default: return 'bg-red-500 text-white';
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
      <div>
        {/* Name and Badge */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)] tracking-wide">{worker.name}</h3>
            {/* Rating Stars */}
            <div className="flex items-center space-x-1 mt-1 text-[#EAB308]">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  fill={i < Math.floor(worker.rating_history || 5.0) ? "currentColor" : "none"}
                  className="stroke-[2]"
                />
              ))}
              <span className="text-xs font-semibold text-[var(--color-muted)] ml-1">
                {worker.rating_history ? worker.rating_history.toFixed(1) : "5.0"}
              </span>
            </div>
          </div>
          
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getBadgeColor(worker.reliability_badge)} flex items-center gap-1`}>
            <Award size={10} /> {worker.reliability_badge || 'Bronze'}
          </span>
        </div>

        {/* Location and Distance */}
        <div className="flex flex-col space-y-1.5 my-4 text-sm text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-[var(--color-primary)]" />
            <span>{worker.location}</span>
          </div>
          {worker.travel_time_mins !== undefined && worker.travel_time_mins !== 999 && (
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[var(--color-primary)]" />
              <span className="text-[var(--color-primary)] font-medium">{Math.round(worker.travel_time_mins)} mins travel time away</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Briefcase size={15} className="text-blue-400" />
            <span>{worker.experience_years} years experience</span>
          </div>
        </div>

        {/* Skills Tag Array */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {(worker.skills || []).map((skill, index) => (
            <span 
              key={index}
              className="text-[11px] font-medium bg-[var(--color-border)] text-[var(--color-text)] px-2.5 py-1 rounded-md border border-cyan-950"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing and Action button */}
      <div className="border-t border-[var(--color-border)] pt-4 flex justify-between items-center mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">Hourly Rate</span>
          <span className="text-lg font-extrabold text-[var(--color-text)]">Rs {worker.hourly_rate}</span>
        </div>
        {onHire && (
          <button 
            onClick={() => onHire(worker)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition duration-200"
          >
            Hire Worker
          </button>
        )}
      </div>
    </div>
  );
};
export default WorkerCard;
