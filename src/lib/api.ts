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
  categories: () => api.get('/categories'),
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

// ─── Admin – Categories ───────────────────────────────
export const categoriesApi = {
  list: () => api.get('/admin/categories'),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/admin/categories', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  update: (id: number, data: FormData | Record<string, unknown>) =>
    api.post(`/admin/categories/${id}`, data, { // Use POST for FormData with _method=PUT
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  destroy: (id: number) => api.delete(`/admin/categories/${id}`),
};

// ─── Seller – Profile ────────────────────────────────
export const sellerProfileApi = {
  get: () => api.get('/seller/profile'),
  update: (data: Record<string, unknown>) => api.put('/seller/profile', data),
  changePassword: (data: Record<string, unknown>) => api.put('/seller/profile/password', data),
};

// ─── Seller – Subscription ───────────────────────────
export const sellerSubscriptionApi = {
  plans: () => api.get('/seller/subscription/plans'),
  current: () => api.get('/seller/subscription/current'),
  history: () => api.get('/seller/subscription/history'),
  subscribe: (plan_id: number) => api.post('/seller/subscription/subscribe', { plan_id }),
};

// ─── Seller – Products ───────────────────────────────
export const sellerProductsApi = {
  list: (params?: Record<string, unknown>) => api.get('/seller/products', { params }),
  show: (id: number) => api.get(`/seller/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/seller/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/seller/products/${id}`, data),
  destroy: (id: number) => api.delete(`/seller/products/${id}`),
  uploadImages: (id: number, formData: FormData) =>
    api.post(`/seller/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (productId: number, imageId: number) => api.delete(`/seller/products/${productId}/images/${imageId}`),
};

// ─── Seller – Orders ─────────────────────────────────
export const sellerOrdersApi = {
  list: (params?: Record<string, unknown>) => api.get('/seller/orders', { params }),
  show: (id: number) => api.get(`/seller/orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/seller/orders/${id}/status`, { status }),
};

// ─── Seller – Offers ─────────────────────────────────
export const sellerOffersApi = {
  list: () => api.get('/seller/offers'),
  create: (data: Record<string, unknown>) => api.post('/seller/offers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/seller/offers/${id}`, data),
  destroy: (id: number) => api.delete(`/seller/offers/${id}`),
};

// ─── Seller – Coupons ────────────────────────────────
export const sellerCouponsApi = {
  list: () => api.get('/seller/coupons'),
  create: (data: Record<string, unknown>) => api.post('/seller/coupons', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/seller/coupons/${id}`, data),
  destroy: (id: number) => api.delete(`/seller/coupons/${id}`),
};

// ─── Seller – Analytics ──────────────────────────────
export const sellerAnalyticsApi = {
  dashboard: () => api.get('/seller/analytics/dashboard'),
  revenue: (params?: Record<string, string>) => api.get('/seller/analytics/revenue', { params }),
};

// ─── Notifications ─────────────────────────────────────
export const notificationsApi = {
  // `base` should be 'seller' or 'customer' depending on the user's role
  list: (base: string) => api.get(`/${base}/notifications`),
  markAsRead: (base: string, id: string) => api.post(`/${base}/notifications/${id}/read`),
  markAllAsRead: (base: string) => api.post(`/${base}/notifications/read-all`),
  destroy: (base: string, id: string) => api.delete(`/${base}/notifications/${id}`)
};
