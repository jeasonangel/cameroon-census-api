import axios from 'axios';

// ✅ Export API_BASE
export const API_BASE = import.meta.env.VITE_API_BASE || 
                        import.meta.env.VITE_API_URL || 
                        'https://cameroon-census-api-production.up.railway.app/api/v1';

if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE);
}

export const api = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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