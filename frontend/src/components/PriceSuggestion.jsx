import React from 'react';
import { Sparkles } from 'lucide-react';

export const PriceSuggestion = ({ min_price, max_price, suggested_price }) => {
  if (min_price === undefined || max_price === undefined) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--color-border)]/40 to-[var(--color-card)]/80 border border-[var(--color-primary)]/30 rounded-xl p-4 my-3 flex items-center space-x-3 shadow-md animate-fade-in premium-glow">
      <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg border border-[var(--color-primary)]/20">
        <Sparkles className="text-[var(--color-primary)] animate-pulse" size={20} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">AI Suggested Price</span>
          {suggested_price && (
            <span className="text-xs font-bold text-[var(--color-text)]">Target: Rs {Math.round(suggested_price)}</span>
          )}
        </div>
        <div className="text-base font-extrabold text-[var(--color-text)] mt-0.5">
          Rs {Math.round(min_price).toLocaleString()} – Rs {Math.round(max_price).toLocaleString()}
        </div>
        <p className="text-[10px] text-[var(--color-muted)] mt-1 leading-normal">
          Based on job category, Lahore neighborhood demand metrics, and average worker experience level.
        </p>
      </div>
    </div>
  );
};
export default PriceSuggestion;
