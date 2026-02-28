// ============================================================
// API 客户端 - 对接后端 Spring Boot API
// 当后端不可用时自动降级到 mock 数据
// ============================================================

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '' : 'http://localhost:8080');

function getToken(): string | null {
  const user = localStorage.getItem('logistics_user');
  if (user) {
    try {
      return JSON.parse(user).token || null;
    } catch { return null; }
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(error.message || `请求失败: ${res.status}`);
  }

  const json = await res.json();
  // 后端返回 Result<T> 格式: { code, message, data }
  if (json.code !== undefined) {
    if (json.code !== 200) {
      throw new Error(json.message || '请求失败');
    }
    return json.data as T;
  }
  return json as T;
}

// ==================== 认证 ====================
export interface LoginResult {
  id: number;
  username: string;
  fullName: string;
  role: string;
  orgId: number;
  orgName: string;
  token: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    request<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

// ==================== 分页结果 ====================
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ==================== 运单 ====================
export const waybillApi = {
  list: (params: { page?: number; size?: number; status?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.status) qs.set('status', params.status);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/waybills?${qs.toString()}`);
  },
  get: (id: number) => request<any>(`/api/waybills/${id}`),
  create: (data: any) => request<any>('/api/waybills', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<void>(`/api/waybills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/api/waybills/${id}`, { method: 'DELETE' }),
  updateReceipt: (id: number, receiptStatus: string) =>
    request<void>(`/api/waybills/${id}/receipt`, { method: 'PUT', body: JSON.stringify({ receiptStatus }) }),
  getLogs: (id: number) => request<any[]>(`/api/waybills/${id}/logs`),
};

// ==================== 运输任务 ====================
export const transportApi = {
  list: (params: { page?: number; size?: number; status?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.status) qs.set('status', params.status);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/transport-tasks?${qs.toString()}`);
  },
  get: (id: number) => request<any>(`/api/transport-tasks/${id}`),
  create: (data: { routeId: number; vehicleId: number; waybillIds: number[] }) =>
    request<any>('/api/transport-tasks', { method: 'POST', body: JSON.stringify(data) }),
  confirmLoading: (id: number) => request<void>(`/api/transport-tasks/${id}/loading`, { method: 'PUT' }),
  confirmDeparture: (id: number) => request<void>(`/api/transport-tasks/${id}/depart`, { method: 'PUT' }),
  confirmArrival: (id: number) => request<void>(`/api/transport-tasks/${id}/arrive`, { method: 'PUT' }),
};

// ==================== 库存 ====================
export const inventoryApi = {
  list: (params: { page?: number; size?: number; status?: string; orgId?: number; keyword?: string; inventoryType?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.status) qs.set('status', params.status);
    if (params.orgId) qs.set('orgId', String(params.orgId));
    if (params.keyword) qs.set('keyword', params.keyword);
    if (params.inventoryType) qs.set('inventoryType', params.inventoryType);
    return request<PageResult<any>>(`/api/inventory?${qs.toString()}`);
  },
  get: (id: number) => request<any>(`/api/inventory/${id}`),
  outbound: (id: number) => request<void>(`/api/inventory/${id}/outbound`, { method: 'PUT' }),
  batchOutbound: (ids: number[]) =>
    request<void>('/api/inventory/batch-outbound', { method: 'PUT', body: JSON.stringify({ ids }) }),
};

// ==================== 基础数据 ====================
export const baseDataApi = {
  // 网点
  listOrgs: (params: { page?: number; size?: number; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/organizations?${qs.toString()}`);
  },
  allOrgs: () => request<any[]>('/api/organizations/all'),
  createOrg: (data: any) => request<any>('/api/organizations', { method: 'POST', body: JSON.stringify(data) }),
  updateOrg: (id: number, data: any) => request<void>(`/api/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrg: (id: number) => request<void>(`/api/organizations/${id}`, { method: 'DELETE' }),

  // 线路
  listRoutes: (params: { page?: number; size?: number; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/routes?${qs.toString()}`);
  },
  allRoutes: () => request<any[]>('/api/routes/all'),
  createRoute: (data: any) => request<any>('/api/routes', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id: number, data: any) => request<void>(`/api/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoute: (id: number) => request<void>(`/api/routes/${id}`, { method: 'DELETE' }),

  // 车辆
  listVehicles: (params: { page?: number; size?: number; status?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.status) qs.set('status', params.status);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/vehicles?${qs.toString()}`);
  },
  availableVehicles: () => request<any[]>('/api/vehicles/available'),
  createVehicle: (data: any) => request<any>('/api/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: number, data: any) => request<void>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: number) => request<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // 客户
  listCustomers: (params: { page?: number; size?: number; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/customers?${qs.toString()}`);
  },
  createCustomer: (data: any) => request<any>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: any) => request<void>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request<void>(`/api/customers/${id}`, { method: 'DELETE' }),
};

// ==================== 财务 ====================
export const financeApi = {
  list: (params: { page?: number; size?: number; type?: string; status?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/finance?${qs.toString()}`);
  },
  settle: (id: number) => request<void>(`/api/finance/${id}/settle`, { method: 'PUT' }),
  batchSettle: (ids: number[]) =>
    request<void>('/api/finance/batch-settle', { method: 'PUT', body: JSON.stringify({ ids }) }),
  verify: (id: number) => request<void>(`/api/finance/${id}/verify`, { method: 'PUT' }),
  batchVerify: (ids: number[]) =>
    request<void>('/api/finance/batch-verify', { method: 'PUT', body: JSON.stringify({ ids }) }),
  cancel: (id: number) => request<void>(`/api/finance/${id}/cancel`, { method: 'PUT' }),
  summary: () => request<any>('/api/finance/summary'),
  trend: () => request<any[]>('/api/finance/trend'),
};

// ==================== 签收管理 ====================
export const signApi = {
  list: (params: { page?: number; size?: number; keyword?: string; signType?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    if (params.signType) qs.set('signType', params.signType);
    return request<PageResult<any>>(`/api/sign?${qs.toString()}`);
  },
  sign: (data: any) => request<any>('/api/sign', { method: 'POST', body: JSON.stringify(data) }),
  unsign: (waybillId: number) => request<void>(`/api/sign/${waybillId}/unsign`, { method: 'PUT' }),
  getByWaybill: (waybillId: number) => request<any>(`/api/sign/waybill/${waybillId}`),
};

// ==================== 异常管理 ====================
export const exceptionApi = {
  list: (params: { page?: number; size?: number; keyword?: string; exceptionType?: string; handleStatus?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    if (params.exceptionType) qs.set('exceptionType', params.exceptionType);
    if (params.handleStatus) qs.set('handleStatus', params.handleStatus);
    return request<PageResult<any>>(`/api/exception?${qs.toString()}`);
  },
  get: (id: number) => request<any>(`/api/exception/${id}`),
  create: (data: any) => request<any>('/api/exception', { method: 'POST', body: JSON.stringify(data) }),
  handle: (id: number, data: { handleResult: string; handleAmount?: number; handlerId?: number; handlerName?: string }) =>
    request<void>(`/api/exception/${id}/handle`, { method: 'PUT', body: JSON.stringify(data) }),
  close: (id: number) => request<void>(`/api/exception/${id}/close`, { method: 'PUT' }),
};

// ==================== 回单管理 ====================
export const receiptApi = {
  list: (params: { page?: number; size?: number; keyword?: string; action?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.keyword) qs.set('keyword', params.keyword);
    if (params.action) qs.set('action', params.action);
    return request<PageResult<any>>(`/api/receipt?${qs.toString()}`);
  },
  getByWaybill: (waybillId: number) => request<any[]>(`/api/receipt/waybill/${waybillId}`),
  signReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/sign`, { method: 'POST', body: JSON.stringify(data) }),
  sendReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/send`, { method: 'POST', body: JSON.stringify(data) }),
  receiveReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/receive`, { method: 'POST', body: JSON.stringify(data) }),
  returnReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/return`, { method: 'POST', body: JSON.stringify(data) }),
  unsignReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/unsign`, { method: 'POST', body: JSON.stringify(data) }),
  unsendReceipt: (waybillId: number, data: any) =>
    request<void>(`/api/receipt/${waybillId}/unsend`, { method: 'POST', body: JSON.stringify(data) }),
};

// ==================== 数据分析 ====================
export const dashboardApi = {
  overview: () => request<any>('/api/dashboard/overview'),
  waybillTrend: () => request<any[]>('/api/dashboard/waybill-trend'),
  orgStats: () => request<any[]>('/api/dashboard/org-stats'),
};

// ==================== 用户管理 ====================
export const userApi = {
  list: (params: { page?: number; size?: number; role?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.role) qs.set('role', params.role);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/users?${qs.toString()}`);
  },
  get: (id: number) => request<any>(`/api/users/${id}`),
  create: (data: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<void>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id: number, password: string) =>
    request<void>(`/api/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  delete: (id: number) => request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};

// ==================== 预警 ====================
export const alertApi = {
  list: (params: { page?: number; size?: number; type?: string; status?: string; level?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    if (params.level) qs.set('level', params.level);
    return request<PageResult<any>>(`/api/alerts?${qs.toString()}`);
  },
  stats: () => request<{ unhandled: number; total: number }>('/api/alerts/stats'),
  handle: (id: number) => request<void>(`/api/alerts/${id}/handle`, { method: 'PUT' }),
  ignore: (id: number) => request<void>(`/api/alerts/${id}/ignore`, { method: 'PUT' }),
  read: (id: number) => request<void>(`/api/alerts/${id}/read`, { method: 'PUT' }),
  batchRead: (ids: number[]) => request<void>('/api/alerts/batch-read', { method: 'PUT', body: JSON.stringify({ ids }) }),
};

// ==================== 操作日志 ====================
export const operationLogApi = {
  list: (params: { page?: number; size?: number; module?: string; keyword?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.size) qs.set('size', String(params.size));
    if (params.module) qs.set('module', params.module);
    if (params.keyword) qs.set('keyword', params.keyword);
    return request<PageResult<any>>(`/api/operation-logs?${qs.toString()}`);
  },
};
