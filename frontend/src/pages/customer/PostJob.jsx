import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobs as jobsApi, ml as mlApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import PriceSuggestion from '../../components/PriceSuggestion';
import { PlusCircle, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const SKILL_CATEGORIES = [
  "Electrician", "Plumber", "Carpenter", "AC Technician",
  "Painter", "Tutor", "Driver", "Mason", "Welder",
  "Gardener", "Cook", "Security Guard"
];

const LAHORE_NEIGHBORHOODS = [
  "Model Town", "Johar Town", "Gulberg", "DHA Phase 5", "Anarkali",
  "Bahria Town", "Iqbal Town", "Wapda Town", "Township", "Garden Town", "Cavalry Ground"
];

export const PostJob = () => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [skillRequired, setSkillRequired] = useState(SKILL_CATEGORIES[0]);
  const [location, setLocation] = useState(LAHORE_NEIGHBORHOODS[0]);
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  
  // AI pricing suggestion state
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Fetch AI pricing recommendation when skill or location changes
  const fetchPriceRecommendation = async () => {
    if (!skillRequired || !location) return;
    setLoadingPrice(true);
    try {
      const res = await mlApi.getPrice(skillRequired, location, 5, 50.0); // Mid-tier, average demand
      setPricingSuggestion(res.data);
    } catch (err) {
      console.error("Pricing prediction failed:", err);
    } finally {
      setLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchPriceRecommendation();
  }, [skillRequired, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !budget || !description) {
      setSubmitError('Please fill out all required fields.');
      return;
    }
    
    // Server validation check
    const minPrice = pricingSuggestion?.min_price || 0;
    if (Number(budget) < minPrice) {
      setSubmitError(`Budget cannot be under Rs ${minPrice}. Please raise budget to submit.`);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await jobsApi.postJob(title, skillRequired, location, Number(budget), description);
      navigate('/customer/my-jobs');
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to post job. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 uppercase tracking-wider">Step 1: Choose a Skill Category</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SKILL_CATEGORIES.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSkillRequired(s)}
            className={`p-4 rounded-xl border text-xs font-semibold transition duration-150 text-center flex flex-col items-center justify-center gap-2 ${
              skillRequired === s
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-white'
                : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50 text-[var(--color-muted)]'
            }`}
          >
            <Sparkles className={skillRequired === s ? 'text-[var(--color-primary)]' : 'text-slate-500'} size={18} />
            {s}
          </button>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5 shadow-md"
        >
          Next Step <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 uppercase tracking-wider">Step 2: Tell Us What You Need</h3>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Job Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Need AC Leakage Repair and Servicing"
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
          required
        />
        <span className="text-[10px] text-[var(--color-muted)] block">Be descriptive (minimum 5 characters).</span>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Detailed Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your request in detail (minimum 10 characters)..."
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] h-32 resize-none"
          required
        />
      </div>
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="bg-[var(--color-border)] hover:bg-[var(--color-card)] text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={title.trim().length < 5 || description.trim().length < 10}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5"
        >
          Next Step <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 uppercase tracking-wider">Step 3: Select Service Location</h3>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Lahore Neighborhood</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 px-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] cursor-pointer"
        >
          {LAHORE_NEIGHBORHOODS.map((n, idx) => (
            <option key={idx} value={n}>{n}</option>
          ))}
        </select>
        <p className="text-[10px] text-[var(--color-muted)] mt-2 leading-relaxed">
          Exact GPS coordinates are concealed from workers until the job is active to ensure customer privacy. Neighborhood is shared initially.
        </p>
      </div>
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="bg-[var(--color-border)] hover:bg-[var(--color-card)] text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5"
        >
          Next Step <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const minPrice = pricingSuggestion?.min_price || 0;
    const isBudgetInvalid = budget && Number(budget) < minPrice;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 uppercase tracking-wider">Step 4: Set Price & Confirm</h3>
        
        {/* Dynamic Price Prediction Display */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">AI Suggested Price Range (Locked Guarantee)</label>
          {loadingPrice ? (
            <div className="py-2 flex items-center space-x-2 text-[10px] text-[var(--color-muted)]">
              <div className="w-3.5 h-3.5 border-2 border-t-[var(--color-primary)] border-white/20 rounded-full animate-spin" />
              <span>Fetching AI suggested price...</span>
            </div>
          ) : (
            pricingSuggestion && (
              <PriceSuggestion 
                min_price={pricingSuggestion.min_price} 
                max_price={pricingSuggestion.max_price}
                suggested_price={pricingSuggestion.suggested_price}
              />
            )
          )}
        </div>

        {/* Budget Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Your Proposed Budget (PKR) *</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={`e.g. ${pricingSuggestion?.suggested_price || 1500}`}
              className={`w-full bg-[var(--color-bg)] border rounded-xl py-3 px-4 focus:outline-none text-sm text-[var(--color-text)] ${
                isBudgetInvalid ? 'border-rose-500 focus:border-rose-500' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'
              }`}
              required
            />
            {pricingSuggestion && (
              <button
                type="button"
                onClick={() => setBudget(pricingSuggestion.suggested_price)}
                className="bg-[var(--color-primary)]/25 hover:bg-[var(--color-primary)]/35 text-[var(--color-primary)] border border-[var(--color-primary)]/50 rounded-xl px-4 text-xs font-bold whitespace-nowrap transition"
              >
                Use Suggestion
              </button>
            )}
          </div>
          {isBudgetInvalid && (
            <span className="text-[10px] text-rose-400 block mt-1">
              Error: Budget cannot be below the fair minimum of Rs {minPrice} to protect labor rates.
            </span>
          )}
        </div>

        {/* Confirmation Summary Card */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 space-y-2 text-xs text-[var(--color-muted)]">
          <span className="font-bold text-[var(--color-text)] block border-b border-[var(--color-border)] pb-1 mb-2">Job Details Summary:</span>
          <div><strong className="text-[var(--color-text)]">Category:</strong> {skillRequired}</div>
          <div><strong className="text-[var(--color-text)]">Title:</strong> {title}</div>
          <div><strong className="text-[var(--color-text)]">Location:</strong> {location}</div>
          <div className="line-clamp-2"><strong className="text-[var(--color-text)]">Description:</strong> {description}</div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep(3)}
            className="bg-[var(--color-border)] hover:bg-[var(--color-card)] text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isBudgetInvalid || !budget}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-2.5 px-6 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Publish Job <CheckCircle2 size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-10 w-full flex-1">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-wide flex items-center gap-2">
              <PlusCircle className="text-[var(--color-primary)]" /> Post a Job Request
            </h1>
            <p className="text-sm text-[var(--color-muted)]">Describe what you need done. Our real-time worker dispatch will notify available matches immediately.</p>
          </div>

          {/* Step Progress Dots */}
          <div className="flex justify-center items-center gap-4 py-2 border-y border-[var(--color-border)]/40">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    step === s
                      ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/35 scale-110'
                      : step > s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-muted)]'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-12 h-0.5 ml-4 ${
                      step > s ? 'bg-emerald-600' : 'bg-[var(--color-border)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </form>
        </div>
      </main>
    </div>
  );
};
export default PostJob;
