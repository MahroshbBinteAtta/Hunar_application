import React from 'react';
import { Award, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReliabilityBadge = ({ score, badge }) => {
  // Determine styles and glow classes depending on the badge tier
  let badgeColor = '';
  let glowClass = '';
  let Icon = Award;
  let textShadow = '';

  const cleanBadge = (badge || 'Needs Review').trim();

  if (cleanBadge === 'Gold') {
    badgeColor = 'from-yellow-400 via-amber-500 to-yellow-600 text-[var(--color-bg)]';
    glowClass = 'shadow-[0_0_20px_rgba(255,215,0,0.5)] border-[#EAB308]';
    textShadow = 'text-[#EAB308]';
    Icon = ShieldCheck;
  } else if (cleanBadge === 'Silver') {
    badgeColor = 'from-slate-300 via-slate-400 to-slate-500 text-[var(--color-bg)]';
    glowClass = 'shadow-[0_0_20px_rgba(192,192,192,0.4)] border-[#C0C0C0]';
    textShadow = 'text-[#C0C0C0]';
  } else if (cleanBadge === 'Bronze') {
    badgeColor = 'from-amber-600 via-amber-700 to-orange-800 text-white';
    glowClass = 'shadow-[0_0_15px_rgba(205,127,50,0.3)] border-[#CD7F32]';
    textShadow = 'text-[#CD7F32]';
  } else {
    badgeColor = 'from-rose-500 to-red-700 text-white';
    glowClass = 'shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-500';
    textShadow = 'text-red-500';
    Icon = AlertTriangle;
  }

  return (
    <div className="flex items-center space-x-3 bg-[var(--color-card)] p-3 rounded-xl border border-[var(--color-border)] w-fit">
      {/* Circle emblem */}
      <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${badgeColor} flex items-center justify-center border-2 ${glowClass}`}>
        <Icon size={24} className="stroke-[2.5]" />
      </div>
      
      {/* Details */}
      <div className="flex flex-col">
        <span className={`text-sm font-bold uppercase tracking-wider ${textShadow}`}>{cleanBadge} Badge</span>
        <div className="flex items-baseline space-x-1">
          <span className="text-lg font-extrabold text-[var(--color-text)]">{score}</span>
          <span className="text-xs text-[var(--color-muted)]">/100 score</span>
        </div>
      </div>
    </div>
  );
};
export default ReliabilityBadge;
