// frontend/src/lib/api.ts
import axios from 'axios';


export const API_BASE = 'http://13.53.37.92:8080/api/v1'

console.log('🔧 API Base URL:', API_BASE);

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    console.log('📋 Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    console.log('📋 Response Headers:', response.headers);
    return response;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.response?.data);
    console.error('❌ Error Headers:', error.response?.headers);
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);



export interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  organization?: string | null;
  monthly_limit: number;
  requests_used: number;
}

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
  localStorage.setItem('access_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

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

export const apiKeys = {
  getAll: () =>
    api.get('/auth/keys'),
  create: (name: string) =>
    api.post('/api-keys', { name }),
  revoke: (id: string) =>
    api.delete(`/api-keys/${id}`),
  regenerate: (id: string) =>
    api.post(`/api-keys/${id}/regenerate`),
};

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
    api.get(`/export/${format}`, { 
      params, 
      responseType: 'blob' 
    }),
};

export const analytics = {
  getRegionSummary: () =>
    api.get('/analytics/regions'),
  getDepartmentRankings: () =>
    api.get('/analytics/departments'),
  getDashboardStats: () =>
    api.get('/analytics/dashboard'),
};

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