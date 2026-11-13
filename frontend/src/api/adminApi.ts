import type {
  AdminUser,
  CreateAdminUserRequest,
  AuditLog,
  PagedResult,
  BannerDto,
  CreateBannerRequest,
  UpdateBannerRequest,
} from './types';

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

  // 204 No Content ve 202 Accepted durumlarında JSON gövdesi bulunmaz
  if (res.status === 204 || res.status === 202) {
    return undefined as T;
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

  // Hero Slider & Bannerlar
  getBanners: () => request<BannerDto[]>('/banners'),

  getBannerById: (id: string) => request<BannerDto>(`/banners/${id}`),

  createBanner: (data: CreateBannerRequest) =>
    request<BannerDto>('/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBanner: (id: string, data: UpdateBannerRequest) =>
    request<BannerDto>(`/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateBannerStatus: (id: string, isActive: boolean) =>
    request<BannerDto>(`/banners/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  deleteBanner: (id: string) =>
    request<void>(`/banners/${id}`, {
      method: 'DELETE',
    }),

  uploadBannerImage: async (file: File): Promise<{ imageUrl: string; fileName: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/banners/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      let err = 'Görsel yüklenemedi.';
      try {
        const d = await res.json();
        err = d.detail || d.title || err;
      } catch {}
      throw new Error(err);
    }
    return res.json();
  },
};

