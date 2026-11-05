import type { AdminUser, CreateAdminUserRequest, AuditLog, PagedResult } from './types';

const BASE_URL = '/api/admin';

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

  return res.json();
}

export const adminApi = {
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

