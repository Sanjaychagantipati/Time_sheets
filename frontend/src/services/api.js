import axios from 'axios';

// Check if we should use local mock data fallback
export const isMockMode = () => {
  const mode = localStorage.getItem('vt_api_mode');
  if (mode === 'api') return false;
  // If not explicitly set, default to mock mode so it runs out-of-the-box
  return import.meta.env.VITE_API_MODE !== 'api';
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT authorization headers automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gracefully handle session expiry (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vt_token');
      localStorage.removeItem('vt_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
