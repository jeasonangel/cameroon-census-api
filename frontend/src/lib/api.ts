// frontend/src/lib/api.ts
import axios from 'axios';

// ✅ Fix: Use VITE_API_BASE with fallback
const API_BASE = import.meta.env.VITE_API_BASE || 
                 import.meta.env.VITE_API_URL || 
                 'https://cameroon-census-api-production.up.railway.app/api/v1';

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE);
}

export const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - add auth token
api.interceptors.request.use((cfg) => {
  // ✅ Fix: Use consistent token key
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        // Clear session
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please try again later.');
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Network error - please check your connection');
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  organization?: string | null;
  monthly_limit: number;
  requests_used: number;
}

// Session management
export function getUser(): User | null {
  const u = localStorage.getItem('user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  // ✅ Store in both keys for compatibility
  localStorage.setItem('access_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ─── AUTH ENDPOINTS ───
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
  
  requestPasswordReset: (email: string) =>
    api.post('/auth/request-reset', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// ─── API KEYS ENDPOINTS ───
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

// ─── DATA ENDPOINTS ───
export const data = {
  // Geography
  getRegions: (params?: any) =>
    api.get('/geography/regions', { params }),
  
  getDepartments: (regionId?: string) =>
    api.get('/geography/departments', { params: { regionId } }),
  
  getCommunes: (departmentId?: string) =>
    api.get('/geography/communes', { params: { departmentId } }),
  
  // Indicators
  getIndicators: (params?: any) =>
    api.get('/indicators', { params }),
  
  getIndicatorData: (indicatorId: string, params?: any) =>
    api.get(`/indicators/${indicatorId}/data`, { params }),
  
  // Data
  getData: (params?: any) =>
    api.get('/data', { params }),
  
  getDataByRegion: (regionId: string, params?: any) =>
    api.get(`/data/region/${regionId}`, { params }),
  
  getDataByDepartment: (departmentId: string, params?: any) =>
    api.get(`/data/department/${departmentId}`, { params }),
  
  // Export
  exportData: (format: string, params?: any) =>
    api.get(`/export/${format}`, { 
      params, 
      responseType: 'blob' 
    }),
};

// ─── ANALYTICS ENDPOINTS ───
export const analytics = {
  getRegionSummary: () =>
    api.get('/analytics/regions'),
  
  getDepartmentRankings: (params?: any) =>
    api.get('/analytics/departments', { params }),
  
  getCommuneAnalytics: (params?: any) =>
    api.get('/analytics/communes', { params }),
  
  getCustomAnalytics: (params?: any) =>
    api.get('/analytics/custom', { params }),
  
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),
};

// ─── ADMIN ENDPOINTS ───
export const admin = {
  // User management
  getUsers: (params?: any) =>
    api.get('/admin/users', { params }),
  
  getUserById: (id: string) =>
    api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
  
  // API Key management (admin)
  getAllApiKeys: (params?: any) =>
    api.get('/admin/api-keys', { params }),
  
  // Data import
  importData: (formData: FormData) =>
    api.post('/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  importCensusData: (formData: FormData) =>
    api.post('/admin/import/census', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  // Logs
  getLogs: (params?: any) =>
    api.get('/admin/logs', { params }),
  
  // Settings
  getSettings: () =>
    api.get('/admin/settings'),
  
  updateSettings: (data: any) =>
    api.put('/admin/settings', data),
};

export default api;