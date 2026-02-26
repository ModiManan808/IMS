import axios, { AxiosError } from 'axios';

// Pull from environment at build time. In production set REACT_APP_API_URL to
// your backend URL (e.g. https://ims-api.onrender.com).
const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000, // 15 s – prevents hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response interceptor: handle token expiry & network errors ───────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const isAuthPage =
      window.location.pathname === '/login' ||
      window.location.pathname === '/forgot-password' ||
      window.location.pathname.startsWith('/reset-password');

    if ((status === 401 || status === 403) && !isAuthPage) {
      // Session expired or invalidated – clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sidebarOpen');
      window.location.href = '/login';
    }

    // Surface a friendly message for network failures
    if (!error.response) {
      return Promise.reject(
        new Error('Cannot reach the server. Please check your connection.')
      );
    }

    return Promise.reject(error);
  }
);

export default api;
