import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { worker as workerApi } from '../../api/api';
import Navbar from '../../components/Navbar';
import { User, ClipboardCheck, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const SKILLS_LIST = [
  "Electrician", "Plumber", "Carpenter", "AC Technician",
  "Painter", "Tutor", "Driver", "Mason", "Welder",
  "Gardener", "Cook", "Security Guard"
];

const LAHORE_NEIGHBORHOODS = [
  "Model Town", "Johar Town", "Gulberg", "DHA Phase 5", "Anarkali",
  "Bahria Town", "Iqbal Town", "Wapda Town", "Township", "Garden Town", "Cavalry Ground"
];

export const WorkerProfile = () => {
  const { user } = useAuth();
  
  // Profile Form States
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [location, setLocation] = useState(LAHORE_NEIGHBORHOODS[0]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  
  // KYC Form States
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [cnicFile, setCnicFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  
  // Status states
  const [kycStatus, setKycStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [cnicDocUrl, setCnicDocUrl] = useState(null);
  const [certDocUrl, setCertDocUrl] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [kycSuccessMsg, setKycSuccessMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [kycError, setKycError] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingKYC, setSubmittingKYC] = useState(false);

  const fetchWorkerData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await workerApi.getProfile(user.user_id);
      const data = res.data;
      
      setSelectedSkills(data.skills || []);
      setLocation(data.location || LAHORE_NEIGHBORHOODS[0]);
      setHourlyRate(data.hourly_rate || '');
      setExperienceYears(data.experience_years || '');
      setKycStatus(data.kyc_status || 'pending');
      setRejectionReason(data.rejection_reason || '');
      setCnicDocUrl(data.cnic_doc_url || null);
      setCertDocUrl(data.cert_doc_url || null);
      setProfilePhotoUrl(data.profile_photo_url || null);
    } catch (err) {
      console.error(err);
      setProfileError("Could not retrieve worker profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [user]);

  const handleSkillChange = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const checkMagicBytes = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const arr = new Uint8Array(e.target.result);
        if (arr.length < 4) {
          resolve(false);
          return;
        }
        const header = Array.from(arr.subarray(0, 4))
          .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
          .join('');
        const isPdf = header.startsWith('25504446'); // %PDF
        const isPng = header.startsWith('89504E47'); // \x89PNG
        const isJpg = header.startsWith('FFD8FF');   // JPEG
        resolve(isPdf || isPng || isJpg);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (5MB = 5 * 1024 * 1024)
    if (file.size > 5 * 1024 * 1024) {
      setKycError(`${type.toUpperCase()} file size exceeds the 5MB limit.`);
      e.target.value = null;
      return;
    }

    // Check magic bytes
    const isValid = await checkMagicBytes(file);
    if (!isValid) {
      setKycError(`${type.toUpperCase()} invalid file format. Only PDF, PNG, and JPG/JPEG files are allowed.`);
      e.target.value = null;
      return;
    }

    setKycError('');
    if (type === 'cnic') setCnicFile(file);
    else if (type === 'cert') setCertFile(file);
    else if (type === 'photo') setPhotoFile(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      setProfileError("Please select at least one skill.");
      return;
    }
    if (!hourlyRate || !experienceYears) {
      setProfileError("Please fill out all fields.");
      return;
    }

    setProfileError('');
    setProfileSuccessMsg('');
    setSubmittingProfile(true);
    try {
      await workerApi.updateProfile(user.user_id, {
        skills: selectedSkills,
        location,
        hourly_rate: Number(hourlyRate),
        experience_years: Number(experienceYears)
      });
      setProfileSuccessMsg("Profile details updated successfully!");
      fetchWorkerData(); // Refresh stats
    } catch (err) {
      setProfileError(err.response?.data?.detail || "Failed to update profile details.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleKYCSubmit = async (e) => {
    e.preventDefault();
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      setKycError("CNIC must follow the format XXXXX-XXXXXXX-X");
      return;
    }
    if (!address.trim()) {
      setKycError("Please fill in your current residential address.");
      return;
    }
    if (!cnicFile && !cnicDocUrl) {
      setKycError("Please select and upload a valid CNIC document file.");
      return;
    }

    setKycError('');
    setKycSuccessMsg('');
    setSubmittingKYC(true);
    try {
      if (cnicFile || certFile || photoFile) {
        const formData = new FormData();
        if (cnicFile) formData.append('cnic_file', cnicFile);
        if (certFile) formData.append('cert_file', certFile);
        if (photoFile) formData.append('profile_photo', photoFile);
        await workerApi.uploadDocs(user.user_id, formData);
      }
      await workerApi.submitKYC(user.user_id, cnic, address, selectedSkills);
      setKycSuccessMsg("Identity verification details and files submitted successfully! Awaiting administrator audit.");
      setKycStatus('pending');
      fetchWorkerData();
    } catch (err) {
      setKycError(err.response?.data?.detail || "Failed to submit verification data.");
    } finally {
      setSubmittingKYC(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        
        {/* Left Side: Profile details */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl space-y-6">
          <div className="space-y-2 border-b border-[var(--color-border)] pb-4">
            <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
              <User className="text-[var(--color-primary)]" size={20} /> Professional Details
            </h2>
            <p className="text-xs text-[var(--color-muted)]">Define your service pricing, experience, and skill set.</p>
          </div>

          {profileError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg flex items-start gap-1.5 text-xs">
              <AlertCircle size={15} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccessMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start gap-1.5 text-xs">
              <CheckCircle2 size={15} />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              {/* Location selection */}
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Service Location (Lahore)</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] cursor-pointer"
                >
                  {LAHORE_NEIGHBORHOODS.map((n, idx) => (
                    <option key={idx} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Hourly Rate */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Hourly Rate (PKR)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
                    required
                  />
                </div>

                {/* Experience Years */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Years of Experience</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
                    required
                  />
                </div>
              </div>

              {/* Skills checklist */}
              <div className="space-y-2">
                <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Skills Checklist (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-[var(--color-bg)] p-3 border border-[var(--color-border)] rounded-xl">
                  {SKILLS_LIST.map((s, idx) => (
                    <label key={idx} className="flex items-center space-x-2 text-[var(--color-text)] py-0.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(s)}
                        onChange={() => handleSkillChange(s)}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-bg)] w-3.5 h-3.5"
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingProfile}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-hover)] disabled:bg-[var(--color-primary)]/40 text-white font-bold py-2.5 rounded-xl transition duration-200 text-xs"
              >
                {submittingProfile ? "Updating Details..." : "Update Professional Profile"}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: CNIC KYC Details */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="space-y-2 border-b border-[var(--color-border)] pb-4 mb-4">
              <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
                <ClipboardCheck className="text-[var(--color-primary)]" size={20} /> Identity Verification
              </h2>
              <p className="text-xs text-[var(--color-muted)]">Provide credentials to gain trusted verification badges on the marketplace.</p>
            </div>

            {/* Status indicator banner */}
            <div className="mb-4">
              <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider block mb-1">Verification Status</span>
              {kycStatus === 'verified' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 size={16} /> Verified Professional
                </div>
              ) : kycStatus === 'rejected' ? (
                <div className="space-y-2">
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex flex-col gap-1 text-xs font-bold">
                    <span className="flex items-center gap-2"><ShieldAlert size={16} /> Verification Unsuccessful (Resubmit Documents)</span>
                    {rejectionReason && (
                      <span className="text-xs font-normal text-rose-300 mt-1">Reason: {rejectionReason}</span>
                    )}
                  </div>
                </div>
              ) : cnicDocUrl ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={16} /> Verification Pending Approval
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={16} /> Verification Documents Required
                </div>
              )}
            </div>

            {/* Uploaded Documents List */}
            {(cnicDocUrl || certDocUrl || profilePhotoUrl) && (
              <div className="mb-4 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl space-y-1.5 text-xs text-[var(--color-muted)]">
                <span className="font-bold text-[var(--color-text)] block mb-1">Uploaded Documents:</span>
                {profilePhotoUrl && (
                  <div>
                    Profile Photo: <a href={profilePhotoUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline font-semibold">View File</a>
                  </div>
                )}
                {cnicDocUrl && (
                  <div>
                    CNIC ID scan: <a href={cnicDocUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline font-semibold">View File</a>
                  </div>
                )}
                {certDocUrl && (
                  <div>
                    Certificate: <a href={certDocUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline font-semibold">View File</a>
                  </div>
                )}
              </div>
            )}

            {kycError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg flex items-start gap-1.5 text-xs mb-4">
                <AlertCircle size={15} />
                <span>{kycError}</span>
              </div>
            )}

            {kycSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start gap-1.5 text-xs mb-4">
                <CheckCircle2 size={15} />
                <span>{kycSuccessMsg}</span>
              </div>
            )}

            {(kycStatus === 'rejected' || (!cnicDocUrl && kycStatus === 'pending') || !kycStatus) && (
              <form onSubmit={handleKYCSubmit} className="space-y-4 text-xs">
                {/* CNIC Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">CNIC National ID Number</label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="35201-1234567-1"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
                    required
                  />
                  <span className="text-[10px] text-[var(--color-muted)] block">Format: XXXXX-XXXXXXX-X (include dashes)</span>
                </div>

                {/* Home Address */}
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Residential Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House 4B, Street 1, Sector G, Johar Town, Lahore"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl py-2.5 px-3 focus:border-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)] h-16 resize-none"
                    required
                  />
                </div>

                {/* File Uploads */}
                <div className="space-y-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl">
                  <span className="font-bold text-[var(--color-text)] block mb-1">Identity Files (PDF, PNG, JPG - Max 5MB)</span>
                  
                  {/* CNIC File */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">CNIC Scan/Photo *</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'cnic')}
                      accept=".png,.jpg,.jpeg,.pdf"
                      className="w-full bg-[var(--color-card)] text-[var(--color-text)] text-xs cursor-pointer border border-[var(--color-border)] rounded-lg p-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                      required={!cnicDocUrl}
                    />
                  </div>

                  {/* Cert File */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Skill Certificate (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'cert')}
                      accept=".png,.jpg,.jpeg,.pdf"
                      className="w-full bg-[var(--color-card)] text-[var(--color-text)] text-xs cursor-pointer border border-[var(--color-border)] rounded-lg p-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  {/* Profile Photo File */}
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-muted)] uppercase tracking-wider block">Profile Photo (Optional)</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      accept=".png,.jpg,.jpeg"
                      className="w-full bg-[var(--color-card)] text-[var(--color-text)] text-xs cursor-pointer border border-[var(--color-border)] rounded-lg p-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submittingKYC}
                  className="w-full bg-[var(--color-border)] hover:bg-[var(--color-card)] border border-[var(--color-primary)]/40 text-white font-bold py-2.5 rounded-xl transition duration-200 text-xs"
                >
                  {submittingKYC ? "Submitting Verification Documents..." : "Submit Verification Documents"}
                </button>
              </form>
            )}
          </div>

          <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[10px] text-[var(--color-muted)] leading-normal mt-auto">
            <strong>Security Notice:</strong> CNIC and address logs are stored securely using encryption policies. We do not share identity details with external parties.
          </div>
        </div>
      </main>
    </div>
  );
};
export default WorkerProfile;
