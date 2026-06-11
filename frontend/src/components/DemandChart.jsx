import React from 'react';
import { TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

export const DemandChart = ({ demand_forecast }) => {
  if (!demand_forecast || demand_forecast.length === 0) {
    return <div className="text-sm text-[var(--color-muted)] italic">No forecast data loaded.</div>;
  }

  // Find the highest forecast count for sizing proportions
  const maxBookings = Math.max(...demand_forecast.map(w => w.predicted_bookings), 10);

  const getBarColor = (trend) => {
    switch (trend) {
      case 'High': return 'bg-rose-500';
      case 'Medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getBgColor = (trend) => {
    switch (trend) {
      case 'High': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-md w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)] tracking-wide flex items-center gap-1.5">
            <TrendingUp className="text-[var(--color-primary)]" size={20} /> Demand Trend Forecast
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">Predicted bookings count for the upcoming month.</p>
        </div>
      </div>

      <div className="space-y-4">
        {demand_forecast.map((item, index) => {
          const percentage = (item.predicted_bookings / maxBookings) * 100;
          return (
            <div key={index} className="space-y-1">
              {/* Labels */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--color-text)]">{item.skill}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[var(--color-text)]">{item.predicted_bookings} Bookings</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBgColor(item.trend)}`}>
                    {item.trend}
                  </span>
                </div>
              </div>
              
              {/* Bar Container */}
              <div className="w-full bg-[var(--color-bg)] h-3 rounded-full overflow-hidden border border-[var(--color-border)]/40">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getBarColor(item.trend)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Alert tip */}
      <div className="mt-6 p-3 bg-[var(--color-border)]/30 border border-[var(--color-border)] rounded-xl flex items-start space-x-2 text-xs text-[var(--color-muted)]">
        <AlertCircle size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Market Tip:</strong> Categories labeled <span className="text-rose-400 font-bold">High</span> present the greatest earning potential. Suggest pricing near the upper bounds to optimize worker matching success!
        </p>
      </div>
    </div>
  );
};
export default DemandChart;
