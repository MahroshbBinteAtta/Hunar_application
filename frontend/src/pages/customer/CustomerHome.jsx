import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ml as mlApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import WorkerCard from '../../components/WorkerCard';
import { Search, MapPin, SlidersHorizontal, Terminal, Info, X, Map } from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';

const COORDINATES = {
  "Model Town": [31.4806, 74.3224],
  "Johar Town": [31.4697, 74.2728],
  "Gulberg": [31.5204, 74.3587],
  "DHA Phase 5": [31.4688, 74.4287],
  "Anarkali": [31.5724, 74.3108],
  "Bahria Town": [31.3664, 74.1843],
  "Iqbal Town": [31.5115, 74.2801],
  "Wapda Town": [31.4278, 74.2687],
  "Township": [31.4549, 74.3090],
  "Garden Town": [31.5031, 74.3275],
  "Cavalry Ground": [31.5073, 74.3734]
};

const SKILL_CATEGORIES = [
  "Electrician", "Plumber", "Carpenter", "AC Technician",
  "Painter", "Tutor", "Driver", "Mason", "Welder",
  "Gardener", "Cook", "Security Guard"
];

// Custom markers using free-to-use color markers from CDN
const workerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export const CustomerHome = () => {
  const { user } = useAuth();
  
  // Search parameters
  const [skillQuery, setSkillQuery] = useState('');
  const [location, setLocation] = useState('Model Town');
  const [sortBy, setSortBy] = useState('hourly_rate');
  
  // Results & Trace
  const [workers, setWorkers] = useState([]);
  const [trace, setTrace] = useState([]);
  const [trieMatches, setTrieMatches] = useState([]);
  const [targetSkill, setTargetSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Map visibility toggle
  const [showMap, setShowMap] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Trace Modal state
  const [showTraceModal, setShowTraceModal] = useState(false);

  const neighborhoods = [
    "Model Town", "Johar Town", "Gulberg", "DHA Phase 5", "Anarkali", 
    "Bahria Town", "Iqbal Town", "Wapda Town", "Township", "Garden Town", "Cavalry Ground"
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Direct call to DSA engine runner
      const res = await mlApi.getDSADemo(skillQuery, location, sortBy);
      setWorkers(res.data.final_ranking || []);
      setTrace(res.data.pipeline_trace || []);
      setTrieMatches(res.data.trie_matches || []);
      setTargetSkill(res.data.target_skill || '');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch matched workers. Make sure the API backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Perform initial search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 w-full space-y-8 flex-1">
        {/* Welcome block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-text)] tracking-wide">
              Hello, {user?.name || 'Customer'}!
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">Find top-rated local professionals in Lahore instantly.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition duration-200"
            >
              <Map size={14} className="text-[var(--color-primary)]" /> 
              {showMap ? 'Hide Proximity Map' : 'Show Proximity Map'}
            </button>
            
            <button
              onClick={() => setShowTraceModal(true)}
              className="border border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition duration-200"
            >
              <Terminal size={14} /> See How We Matched You
            </button>
          </div>
        </div>

        {/* Search bar & Filter Panel */}
        <form onSubmit={handleSearch} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Skill query */}
          <div className="space-y-1 md:col-span-2 relative">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Search Skill / Profession</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={skillQuery}
                onChange={(e) => {
                  setSkillQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type 'elect' or 'carp'..."
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
              />
              
              {/* Trie Autocomplete Suggestions */}
              {showSuggestions && skillQuery.trim() && (
                (() => {
                  const filtered = SKILL_CATEGORIES.filter(s => 
                    s.toLowerCase().startsWith(skillQuery.toLowerCase()) &&
                    s.toLowerCase() !== skillQuery.toLowerCase()
                  );
                  if (filtered.length === 0) return null;
                  return (
                    <div className="absolute left-0 right-0 mt-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl z-[999] max-h-48 overflow-y-auto">
                      {filtered.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSkillQuery(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors duration-150 border-b border-[var(--color-border)]/20 last:border-b-0"
                        >
                          <span className="text-[var(--color-muted)] font-mono mr-1.5">Trie match:</span>
                          <strong className="text-[var(--color-text)]">{suggestion.substring(0, skillQuery.length)}</strong>
                          <span>{suggestion.substring(skillQuery.length)}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Location neighborhood */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Your Location (Lahore)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-muted)]">
                <MapPin size={16} />
              </span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] appearance-none"
              >
                {neighborhoods.map((n, idx) => (
                  <option key={idx} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Search button */}
          <button
            type="submit"
            className="bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white text-sm font-bold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
          >
            Find Workers
          </button>
        </form>

        {/* Sorting options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--color-border)]/40 pb-4">
          <div className="text-xs text-[var(--color-muted)]">
            {targetSkill && <span>Matching target: <strong className="text-[var(--color-primary)]">"{targetSkill}"</strong></span>}
            {trieMatches.length > 0 && <span className="ml-2">({trieMatches.join(', ')})</span>}
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[var(--color-muted)] flex items-center gap-1"><SlidersHorizontal size={13} /> Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                // Trigger sort update immediately
                setTimeout(() => handleSearch(), 50);
              }}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg py-1.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)] cursor-pointer"
            >
              <option value="hourly_rate">Lowest Price</option>
              <option value="rating_history">Highest Rating</option>
              <option value="reliability_score">Reliability Badge</option>
              <option value="travel_time_mins">Closest Proximity</option>
            </select>
          </div>
        </div>

        {/* Split grid: Workers List & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Workers List Column */}
          <div className={`${showMap ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
                <p className="text-xs text-[var(--color-muted)]">Running 4-stage matching algorithm...</p>
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
                {error}
              </div>
            ) : workers.length === 0 ? (
              <div className="bg-[var(--color-card)]/30 border border-[var(--color-border)]/60 p-12 rounded-2xl text-center space-y-2">
                <Info className="mx-auto text-[var(--color-muted)]" size={32} />
                <h3 className="text-sm font-bold text-[var(--color-text)]">No Available Workers Found</h3>
                <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto">Try refining your skill category prefix or select another starting neighborhood.</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${showMap ? '' : 'lg:grid-cols-3'} gap-6`}>
                {workers.map((worker, index) => (
                  <WorkerCard 
                    key={index} 
                    worker={worker} 
                    onHire={(w) => alert(`Hiring requested for ${w.name}! To hire workers, please post a new job request from the navbar.`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Map Column */}
          {showMap && (
            <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3 z-0">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-md">
                <h3 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Map size={14} /> Proximity Map
                </h3>
                
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-[var(--color-border)] z-0">
                  <MapContainer 
                    center={COORDINATES[location] || COORDINATES["Model Town"]} 
                    zoom={12} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    
                    {/* Recenter script */}
                    <RecenterMap center={COORDINATES[location] || COORDINATES["Model Town"]} />

                    {/* Customer Marker */}
                    <Marker 
                      position={COORDINATES[location] || COORDINATES["Model Town"]} 
                      icon={customerIcon}
                    >
                      <Popup>
                        <div className="text-xs font-sans text-gray-900">
                          <strong className="text-blue-600 block">Your Location</strong>
                          <span>{location}</span>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Worker Markers */}
                    {workers.map((w, idx) => {
                      const coords = COORDINATES[w.location];
                      if (!coords) return null;
                      return (
                        <Marker 
                          key={idx} 
                          position={coords} 
                          icon={workerIcon}
                        >
                          <Popup>
                            <div className="text-xs font-sans text-gray-900 space-y-1">
                              <strong className="text-[var(--color-primary)] block">{w.name}</strong>
                              <div className="text-gray-600">
                                <span>Rating: ⭐ {w.rating_history || 5.0}</span><br />
                                <span>Rate: Rs {w.hourly_rate}</span><br />
                                <span>Travel Time: {w.travel_time_mins} mins</span><br />
                                <span>GPS Distance: {w.gps_distance_km} km</span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
                
                <div className="flex gap-4 text-[10px] text-[var(--color-muted)] mt-3 justify-center">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Customer Location</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> Matched Workers</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DSA Trace Modal */}
      {showTraceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2">
                <Terminal size={18} /> Match Diagnostics & Path
              </h3>
              <button 
                onClick={() => setShowTraceModal(false)}
                className="p-1 hover:bg-[var(--color-bg)] rounded-full text-[var(--color-muted)] hover:text-[var(--color-text)] transition"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto font-mono text-xs text-emerald-400 bg-[var(--color-bg)] flex-1 space-y-2">
              <p className="text-[var(--color-muted)] italic mb-4">// Step-by-step trace of how our system identified your ideal worker</p>
              {trace.map((step, idx) => (
                <div key={idx} className="border-l-2 border-emerald-500/20 pl-3 py-1">
                  <span className="text-[var(--color-muted)] mr-2">[{idx + 1}]</span>
                  {step}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => setShowTraceModal(false)}
                className="bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-border)] text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerHome;
