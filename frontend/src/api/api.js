import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth = {
  register: (name, email, password, role, otp) => 
    apiClient.post('/auth/register', { name, email, password, role, otp }),
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  sendOtp: (email) => 
    apiClient.post('/auth/send-otp', null, { params: { email } }),
  getMe: () => 
    apiClient.get('/auth/me'),
};

export const worker = {
  createProfile: (userId, skills, location, hourlyRate, experienceYears) => 
    apiClient.post(`/worker/profile/${userId}`, { skills, location, hourly_rate: hourlyRate, experience_years: experienceYears }),
  getProfile: (userId) => 
    apiClient.get(`/worker/profile/${userId}`),
  updateProfile: (userId, data) => 
    apiClient.put(`/worker/profile/${userId}`, data),
  submitKYC: (userId, cnic, address, skills) => 
    apiClient.post(`/worker/kyc/${userId}`, { cnic, address, skills }),
  uploadDocs: (userId, formData) =>
    apiClient.post(`/worker/upload-docs/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getAllWorkers: () => 
    apiClient.get('/worker/all'),
  getAvailableWorkers: () => 
    apiClient.get('/worker/available'),
};

export const jobs = {
  postJob: (title, skillRequired, location, budget, description) => 
    apiClient.post('/jobs', { title, skill_required: skillRequired, location, budget, description }),
  getOpenJobs: () => 
    apiClient.get('/jobs/open'),
  getCustomerJobs: (userId) => 
    apiClient.get(`/jobs/customer/${userId}`),
  getWorkerJobs: (workerId) => 
    apiClient.get(`/jobs/worker/${workerId}`),
  acceptJob: (jobId, workerId) => 
    apiClient.put(`/jobs/accept/${jobId}/${workerId}`),
  completeJob: (jobId) => 
    apiClient.put(`/jobs/complete/${jobId}`),
  updateJobStatus: (jobId, statusName) =>
    apiClient.put(`/jobs/status/${jobId}/${statusName}`),
  reportDispute: (jobId) =>
    apiClient.post(`/jobs/report/${jobId}`),
  rateJob: (jobId, ratingQuality, ratingPunctuality, ratingCommunication, review) => 
    apiClient.post(`/jobs/rate/${jobId}`, {
      rating_quality: ratingQuality,
      rating_punctuality: ratingPunctuality,
      rating_communication: ratingCommunication,
      review
    }),
};

export const admin = {
  getStats: () => 
    apiClient.get('/admin/stats'),
  getPendingKYC: () => 
    apiClient.get('/admin/pending-kyc'),
  verifyKYC: (workerId) => 
    apiClient.put(`/admin/verify-kyc/${workerId}`),
  rejectKYC: (workerId, reason) => 
    apiClient.put(`/admin/reject-kyc/${workerId}`, { reason }),
  getUsersDirectory: (role, q) =>
    apiClient.get('/admin/users/directory', { params: { role, q } }),
  toggleSuspendUser: (userId, suspendStatus) =>
    apiClient.put(`/admin/users/suspend/${userId}/${suspendStatus}`),
  getAllJobs: () => 
    apiClient.get('/admin/all-jobs'),
  forceJobAction: (jobId, actionName) =>
    apiClient.put(`/admin/jobs/force-action/${jobId}/${actionName}`),
  getAuditLogs: () =>
    apiClient.get('/admin/audit-logs'),
  getDocToken: (filepath) =>
    apiClient.get('/admin/doc-token', { params: { filepath } }),
};

export const ml = {
  getReliability: (jobCount, rating, disputes, onTimeRate) => 
    apiClient.post('/ml/reliability', { job_count: jobCount, rating, disputes, on_time_rate: onTimeRate }),
  getPrice: (jobType, location, experienceLevel, demandIndex) => 
    apiClient.post('/ml/price', { job_type: jobType, location, experience_level: experienceLevel, demand_index: demandIndex }),
  getDemandForecast: () => 
    apiClient.get('/ml/demand-forecast'),
  checkSpam: (reviewText) => 
    apiClient.post('/ml/spam-check', { review_text: reviewText }),
  getDSADemo: (skill, location, sortBy) => 
    apiClient.get('/dsa/demo', { params: { skill, location, sort_by: sortBy } }),
};

export default apiClient;
