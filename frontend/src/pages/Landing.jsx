import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, ShieldCheck, MapPin, Users, 
  ArrowRight, PenTool, Sparkles, CheckCircle2,
  Wrench, Hammer, BookOpen, Car, Paintbrush, 
  UserCheck, Shield, HelpCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';

export const Landing = () => {
  const categories = [
    { name: "Electrician", desc: "Short circuits, wiring & repairs", icon: Zap },
    { name: "Plumber", desc: "Leakages, piping & plumbing fixtures", icon: Wrench },
    { name: "Carpenter", desc: "Furniture fabrication & repairs", icon: Hammer },
    { name: "AC Technician", desc: "Installation, gas filling & servicing", icon: Sparkles },
    { name: "Painter", desc: "Wall painting & structural coatings", icon: Paintbrush },
    { name: "Tutor", desc: "School subjects & skill training", icon: BookOpen },
    { name: "Driver", desc: "Personal & commercial transport", icon: Car },
    { name: "Mason", desc: "Concrete construction & tiling work", icon: Hammer },
    { name: "Welder", desc: "Iron gates, grills & metal repairs", icon: Wrench },
    { name: "Gardener", desc: "Lawn cutting & landscape upkeep", icon: Paintbrush },
    { name: "Cook", desc: "Domestic catering & meal preparation", icon: Users },
    { name: "Security Guard", desc: "Event watch & residential safety", icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[var(--color-border)]/50 border border-[var(--color-primary)]/30 px-3 py-1 rounded-full text-xs text-[var(--color-primary)] font-bold">
            <Sparkles size={14} /> <span>Connecting Skill with Opportunity</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight font-heading leading-tight">
            HUNAR
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-[var(--color-primary)] italic">
            The Missing Layer Between Skill and Opportunity
          </p>
          <p className="text-base text-[var(--color-muted)] max-w-lg leading-relaxed">
            Empowering Pakistan's 50 million+ informal workers with digitized identities and instant, hyper-local job matching. No middle-men, direct payments, and AI-powered pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              to="/auth/register?role=customer" 
              className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-sm font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition duration-200"
            >
              Hire Workers <ArrowRight size={16} />
            </Link>
            <Link 
              to="/auth/register?role=worker" 
              className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-white text-sm font-bold py-3 px-8 rounded-full flex items-center justify-center gap-2 transition duration-200"
            >
              Join as Worker
            </Link>
          </div>
        </div>
        
        {/* Decorative Grid Image Mockup */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-3xl rounded-full" />
          <div className="relative bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-3xl max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
              <span className="text-sm font-bold text-[var(--color-text)] tracking-wide">Live Matching Feed</span>
              <span className="bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold px-2 py-0.5 rounded border border-[#22C55E]/20 animate-pulse">Online</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-emerald-400">AC Technician job posted</span>
                  <span className="text-[var(--color-muted)]">Gulberg</span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] italic">"AC not cooling. Needs refrigerant top-up..."</p>
              </div>

              <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-amber-400">Electrician matched</span>
                  <span className="text-[var(--color-muted)]">Model Town</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px]">
                  <span className="bg-[#EAB308] text-[var(--color-bg)] font-extrabold px-1.5 py-0.2 rounded uppercase">Gold</span>
                  <span className="text-[var(--color-text)]">Ahmed R. (Score: 85)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Bar */}
      <section className="bg-[var(--color-card)] border-y border-[var(--color-border)] py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--color-primary)]">50M+</div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold">Pakistan's Informal Workers</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--color-primary)]">&lt; 4 seconds</div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold">Instant Matching</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--color-primary)]">100% Verified</div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold">CNIC KYC Checks</div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">How Hunar Works</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-xl mx-auto">Get connected in three simple steps. We take care of matching and verification.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto">
              <span className="text-[var(--color-primary)] font-extrabold text-lg">1</span>
            </div>
            <h3 className="font-bold text-[var(--color-text)]">Post a Job</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Describe your work requirements, choose location in Lahore, and view real-time AI budget suggestions.</p>
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto">
              <span className="text-[var(--color-primary)] font-extrabold text-lg">2</span>
            </div>
            <h3 className="font-bold text-[var(--color-text)]">Smart Match</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Our custom routing algorithm checks proximity and reputation, pushing alerts directly to workers.</p>
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto">
              <span className="text-[var(--color-primary)] font-extrabold text-lg">3</span>
            </div>
            <h3 className="font-bold text-[var(--color-text)]">Job Completed</h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Worker completes tasks, customer reviews the submission. Safe direct cash or transfer payouts.</p>
          </div>
        </div>
      </section>

      {/* Service Categories Grid */}
      <section className="bg-[var(--color-card)]/40 border-t border-[var(--color-border)] px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">12 Main Service Categories</h2>
            <p className="text-sm text-[var(--color-muted)] max-w-xl mx-auto">Explore the skills our verified workers list on their digital profiles.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((c, i) => {
              const IconComp = c.icon;
              return (
                <div key={i} className="bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] p-6 rounded-2xl space-y-3 transition duration-200 text-left">
                  <div className="text-[var(--color-primary)] p-2 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 rounded-xl w-fit">
                    <IconComp size={20} />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--color-text)]">{c.name}</h3>
                  <p className="text-[11px] text-[var(--color-muted)] leading-normal">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 md:px-12 py-20 max-w-7xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">What People Say</h2>
          <p className="text-sm text-[var(--color-muted)] max-w-xl mx-auto">Read honest feedback from customers and workers using the platform in Lahore.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl text-left space-y-4">
            <p className="text-xs text-[var(--color-muted)] italic leading-relaxed">
              "Mujhe ghar ki electricity wiring theek karwani thi. Maine Hunar pe job post ki, and within minutes Ahmed Raza bhai mere ghar pohanch gaye. Unki rating aur badge se boht bharosa mila!"
            </p>
            <div>
              <span className="font-bold text-xs text-[var(--color-text)] block">Zainab Bibi</span>
              <span className="text-[10px] text-[var(--color-muted)]">Customer — DHA Lahore</span>
            </div>
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl text-left space-y-4">
            <p className="text-xs text-[var(--color-muted)] italic leading-relaxed">
              "Pehle mujhe kaam dhoondne ke liye market me khara hona parta tha. Ab Hunar mobile app (web app) par hi mujhe notifications mil jate hain. Meray paas ab Gold Badge hai!"
            </p>
            <div>
              <span className="font-bold text-xs text-[var(--color-text)] block">Bilal Khan</span>
              <span className="text-[10px] text-[var(--color-muted)]">Carpenter — Johar Town</span>
            </div>
          </div>
          
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl text-left space-y-4">
            <p className="text-xs text-[var(--color-muted)] italic leading-relaxed">
              "As an admin, verifying CNIC data has made the informal market safe. Workers get respect and customers get reliable service. Truly a revolutionary step for Pakistan."
            </p>
            <div>
              <span className="font-bold text-xs text-[var(--color-text)] block">Admin Team</span>
              <span className="text-[10px] text-[var(--color-muted)]">Supervisor — Islamabad HQ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-card)] border-t border-[var(--color-border)] py-12 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-[var(--color-primary)] tracking-wider font-heading uppercase">Hunar</span>
            <span className="text-[10px] text-[var(--color-muted)]">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex space-x-6 text-xs text-[var(--color-muted)]">
            <a href="#" className="hover:text-[var(--color-primary)]">About Us</a>
            <a href="#" className="hover:text-[var(--color-primary)]">Terms of Service</a>
            <a href="#" className="hover:text-[var(--color-primary)]">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
