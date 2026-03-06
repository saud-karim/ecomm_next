import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('safqa_token');
    const locale = localStorage.getItem('admin_locale') || 'en';

    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('safqa_token');
      localStorage.removeItem('safqa_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ─── Admin – Analytics ──────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/admin/dashboard'),
  analytics: (params?: Record<string, string>) => api.get('/admin/analytics', { params }),
  reports: (params?: Record<string, string>) => api.get('/admin/reports', { params }),
};

// ─── Admin – Users ──────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  show: (id: number) => api.get(`/admin/users/${id}`),
  toggle: (id: number) => api.put(`/admin/users/${id}/toggle`),
  destroy: (id: number) => api.delete(`/admin/users/${id}`),
};

// ─── Admin – Sellers ────────────────────────────────
export const sellersApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/sellers', { params }),
  show: (id: number) => api.get(`/admin/sellers/${id}`),
  approve: (id: number) => api.put(`/admin/sellers/${id}/approve`),
  reject: (id: number, reason: string) => api.put(`/admin/sellers/${id}/reject`, { reason }),
  destroy: (id: number) => api.delete(`/admin/sellers/${id}`),
};

// ─── Admin – Products ────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/products', { params }),
  show: (id: number) => api.get(`/admin/products/${id}`),
  approve: (id: number) => api.put(`/admin/products/${id}/approve`),
  reject: (id: number, reason: string) => api.put(`/admin/products/${id}/reject`, { reason }),
  destroy: (id: number) => api.delete(`/admin/products/${id}`),
};

// ─── Admin – Orders ──────────────────────────────────
export const ordersApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/orders', { params }),
  show: (id: number) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
};

// ─── Admin – Plans ───────────────────────────────────
export const plansApi = {
  list: () => api.get('/admin/plans'),
  create: (data: Record<string, unknown>) => api.post('/admin/plans', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/admin/plans/${id}`, data),
  destroy: (id: number) => api.delete(`/admin/plans/${id}`),
};

// ─── Admin – Subscriptions ───────────────────────────
export const subscriptionsApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/subscriptions', { params }),
  show: (id: number) => api.get(`/admin/subscriptions/${id}`),
};
