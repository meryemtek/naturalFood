import type { AdminUser, CreateAdminUserRequest, AuditLog, PagedResult } from './types';
import type { Workflow, Invoice } from './storefront/orderWorkflowApi';

const BASE_URL = '/api/admin';
export interface AdminOrderPage {
  items: { isGuest: boolean; email: string; phone: string; deliveryAddress: string; billingAddress: string; order: {
    id: string; number: string; status: string; createdAtUtc: string; subtotal: number; discount: number; shippingFee: number; total: number;
    lines: { name: string; sku: string; quantity: number; unitPrice: number }[];
  } }[];
  total: number; page: number; pageSize: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'Bir hata oluştu.';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.title || JSON.stringify(data);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.status === 204 ? undefined as T : res.json();
}

export const adminApi = {
  orderWorkflow: (id: string, signal?: AbortSignal) => request<Workflow>(`/orders/${id}/workflow`, { signal }),
  updateOrderStatus: (id: string, data: { expectedStatus: string; status: string; note: string; carrier: string; trackingNumber: string; trackingUrl: string; estimatedDeliveryUtc: string | null }) => request<void>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  resolveOrderRequest: (id: string, requestId: string, decision: string, response: string) => request<void>(`/orders/${id}/requests/${requestId}/resolve`, { method: 'POST', body: JSON.stringify({ decision, response }) }),
  issueDemoInvoice: (id: string) => request<void>(`/orders/${id}/invoice`, { method: 'POST' }),
  orderInvoice: (id: string) => request<Invoice>(`/orders/${id}/invoice`),
  getOrders: (page: number, filter: string, signal?: AbortSignal) => request<AdminOrderPage>(`/orders?page=${page}&pageSize=20&filter=${encodeURIComponent(filter)}`, { signal }),
  // Sağlık kontrolü
  checkHealth: () => request<{ status: string; module: string; databaseSchema: string }>('/health'),

  // Kullanıcılar
  getUsers: (page = 1, pageSize = 10) =>
    request<PagedResult<AdminUser>>(`/users?page=${page}&pageSize=${pageSize}`),

  getUserById: (id: string) => request<AdminUser>(`/users/${id}`),

  createUser: (data: CreateAdminUserRequest) =>
    request<AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUserStatus: (id: string, isActive: boolean) =>
    request<AdminUser>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  // Denetim Günlüğü
  getAuditLogs: (page = 1, pageSize = 10) =>
    request<PagedResult<AuditLog>>(`/audit-logs?page=${page}&pageSize=${pageSize}`),
};

