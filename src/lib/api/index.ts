import { api, setTokens, clearTokens } from './client';

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => api('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  me: () => api('/auth/me'),
  setTokens,
  clearTokens,
};

// ─── Dashboard ───────────────────────────────────────
export const dashboardApi = {
  get: () => api('/dashboard'),
};

// ─── Inventory ───────────────────────────────────────
export const inventoryApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/inventory${qs}`);
  },
  get: (id: string) => api(`/inventory/${id}`),
  create: (data: any) => api('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/inventory/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) => api('/inventory/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  exportCsv: () => api<string>('/inventory/export/csv'),
  categories: () => api<string[]>('/inventory/categories'),
  warehouses: () => api<string[]>('/inventory/warehouses'),
  units: () => api<string[]>('/inventory/units'),
};

// ─── Purchase Orders ─────────────────────────────────
export const purchaseOrderApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/purchase-orders${qs}`);
  },
  get: (id: string) => api(`/purchase-orders/${id}`),
  create: (data: any) => api('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    api(`/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => api(`/purchase-orders/${id}`, { method: 'DELETE' }),
};

// ─── Shipments ───────────────────────────────────────
export const shipmentApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/shipments${qs}`);
  },
  get: (id: string) => api(`/shipments/${id}`),
  create: (data: any) => api('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    api(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cities: () => api('/shipments/cities'),
  routeGeometry: (params: { fromLat: number; fromLng: number; toLat: number; toLng: number }) => {
    const qs = new URLSearchParams({
      fromLat: String(params.fromLat),
      fromLng: String(params.fromLng),
      toLat: String(params.toLat),
      toLng: String(params.toLng),
    });
    return api<{ coordinates: [number, number][]; fallback?: boolean }>(`/shipments/route-geometry?${qs}`);
  },
};

// ─── Suppliers ───────────────────────────────────────
export const supplierApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/suppliers${qs}`);
  },
  get: (id: string) => api(`/suppliers/${id}`),
  create: (data: any) => api('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/suppliers/${id}`, { method: 'DELETE' }),
};

// ─── Payments ────────────────────────────────────────
export const paymentApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/payments${qs}`);
  },
  get: (id: string) => api(`/payments/${id}`),
  create: (data: any) => api('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    api(`/payments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  exportCsv: () => api<string>('/payments/export/csv'),
};

// ─── Reports ─────────────────────────────────────────
export const reportApi = {
  summary: () => api('/reports/summary'),
  turnover: () => api('/reports/turnover'),
  costBreakdown: () => api('/reports/cost-breakdown'),
  movingProducts: () => api('/reports/moving-products'),
  inventoryValuation: () => api('/reports/inventory-valuation'),
  supplierPerformance: () => api('/reports/supplier-performance'),
  purchaseOrderSummary: () => api('/reports/purchase-order-summary'),
  stockMovement: () => api('/reports/stock-movement'),
};

// ─── Settings ────────────────────────────────────────
export const settingsApi = {
  getCompany: () => api('/settings/company'),
  updateCompany: (data: any) => api('/settings/company', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api('/settings/company/logo', { method: 'POST', body: fd });
  },

  getUsers: () => api('/settings/users'),
  createUser: (data: any) => api('/settings/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => api(`/settings/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => api(`/settings/users/${id}`, { method: 'DELETE' }),

  getWarehouses: () => api('/settings/warehouses'),
  createWarehouse: (data: any) => api('/settings/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id: string, data: any) => api(`/settings/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id: string) => api(`/settings/warehouses/${id}`, { method: 'DELETE' }),

  getNotifications: () => api('/settings/notifications'),
  updateNotifications: (data: any) => api('/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }),

  getPermissions: () => api('/settings/permissions'),
  updatePermissions: (permissions: any[]) =>
    api('/settings/permissions', { method: 'PUT', body: JSON.stringify({ permissions }) }),
};
