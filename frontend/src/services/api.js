import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hq_token');
      localStorage.removeItem('hq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ═══════════════════════════════════════
// Auth API
// ═══════════════════════════════════════
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ═══════════════════════════════════════
// Queue API
// ═══════════════════════════════════════
export const queueAPI = {
  register: (data) => api.post('/queue/register', data),
  getStatus: (queueId) => api.get(`/queue/status/${queueId}`),
  getDoctorQueue: (doctorId, status) => api.get(`/queue/doctor/${doctorId}`, { params: { status } }),
  callPatient: (queueId) => api.patch(`/queue/${queueId}/call`),
  completeConsultation: (queueId, data) => api.patch(`/queue/${queueId}/complete`, data),
  markNoShow: (queueId) => api.patch(`/queue/${queueId}/no-show`),
};

// ═══════════════════════════════════════
// Doctor API
// ═══════════════════════════════════════
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  updateAvailability: (id, isAvailable) => api.patch(`/doctors/${id}/availability`, { isAvailable }),
  getDepartments: () => api.get('/doctors/departments'),
};

// ═══════════════════════════════════════
// Analytics API
// ═══════════════════════════════════════
export const analyticsAPI = {
  getDashboard: (date) => api.get('/analytics/dashboard', { params: { date } }),
  getPeakHours: () => api.get('/analytics/peak-hours'),
  getDoctorAnalytics: (doctorId, days) => api.get(`/analytics/doctor/${doctorId}`, { params: { days } }),
};

export default api;
