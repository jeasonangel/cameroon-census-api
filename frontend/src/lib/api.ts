// frontend/src/lib/api.ts
import axios from 'axios';

// Get the base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session on unauthorized
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User management
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setSession = (token: string, user: any) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

// Auth endpoints
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () => {
    clearSession();
  },
  me: () =>
    api.get('/auth/me'),
};

// API Keys endpoints
export const apiKeys = {
  getAll: () =>
    api.get('/api-keys'),
  create: (name: string) =>
    api.post('/api-keys', { name }),
  revoke: (id: string) =>
    api.delete(`/api-keys/${id}`),
  regenerate: (id: string) =>
    api.post(`/api-keys/${id}/regenerate`),
};

// Data endpoints
export const data = {
  getRegions: (params?: any) =>
    api.get('/geography/regions', { params }),
  getDepartments: (regionId?: string) =>
    api.get('/geography/departments', { params: { regionId } }),
  getCommunes: (departmentId?: string) =>
    api.get('/geography/communes', { params: { departmentId } }),
  getIndicators: (params?: any) =>
    api.get('/indicators', { params }),
  getData: (params?: any) =>
    api.get('/data', { params }),
  exportData: (format: string, params?: any) =>
    api.get(`/export/${format}`, { params, responseType: 'blob' }),
};

// Analytics endpoints
export const analytics = {
  getRegionSummary: () =>
    api.get('/analytics/regions'),
  getDepartmentRankings: () =>
    api.get('/analytics/departments'),
  getCustomAnalytics: (params?: any) =>
    api.get('/analytics/custom', { params }),
};

// Admin endpoints
export const admin = {
  getUsers: (params?: any) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
  importData: (formData: FormData) =>
    api.post('/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getLogs: (params?: any) =>
    api.get('/admin/logs', { params }),
  getSettings: () =>
    api.get('/admin/settings'),
  updateSettings: (data: any) =>
    api.put('/admin/settings', data),
};

export default api;