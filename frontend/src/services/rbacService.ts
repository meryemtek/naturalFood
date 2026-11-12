// Dynamic RBAC & Isolated Admin Auth Service for Natural Food Admin Panel
// Connects to .NET 10 Minimal API & PostgreSQL (admin.AdminUsers, admin.Roles, admin.ModulePermissions, admin.RolePermissions)

export interface ModulePermissionDto {
  id: string;
  key: string;
  title: string;
  category: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AdminAuthenticatedUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AdminLoginResponse {
  user: AdminAuthenticatedUserDto;
  role: string;
  permissions: string[];
  adminToken: string;
  expiresAtUtc: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissionKeys?: string[];
}

// Müşteri tarafındaki kk_access_token'dan tamamen izole admin oturum anahtarı
export const ADMIN_SESSION_STORAGE_KEY = 'nf_admin_session';
export const ACTIVE_ROLE_STORAGE_KEY = 'nf_active_admin_role';

export function getAdminSession(): AdminLoginResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ??
      window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AdminLoginResponse;
    if (!parsed?.adminToken || !parsed?.user || !parsed?.role) return null;

    if (parsed.expiresAtUtc) {
      const expiresAt = new Date(parsed.expiresAtUtc).getTime();
      if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
        clearAdminSession();
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminLoginResponse, rememberMe = true): void {
  if (typeof window === 'undefined') return;
  try {
    const target = rememberMe ? window.localStorage : window.sessionStorage;
    const other = rememberMe ? window.sessionStorage : window.localStorage;
    other.removeItem(ADMIN_SESSION_STORAGE_KEY);
    target.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
    window.localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, session.role);
  } catch {
    // ignore storage errors
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getActiveAdminRole(): string {
  if (typeof window === 'undefined') return 'SuperAdmin';
  try {
    const session = getAdminSession();
    if (session) {
      const baseIsSuperAdmin =
        session.role.trim().toLowerCase() === 'superadmin' ||
        session.role.trim().toLowerCase() === 'root';
      if (!baseIsSuperAdmin) {
        return session.role;
      }
      return window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY) || session.role;
    }
    return window.localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY) || 'SuperAdmin';
  } catch {
    return 'SuperAdmin';
  }
}

export function setActiveAdminRole(roleName: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, roleName);
  } catch {
    // ignore storage errors
  }
}

let fetchInterceptorInstalled = false;

/**
 * Yalnızca /api/admin/* isteklerine aktif admin oturum token'ını (Bearer)
 * ve X-Admin-Role başlığını ekleyen izole yardımcı sarmalayıcı.
 */
export function ensureAdminRoleFetchInterceptor(): void {
  if (typeof window === 'undefined' || fetchInterceptorInstalled) return;
  fetchInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.pathname + input.search
          : input.url;

    const isAdminApi = urlStr.startsWith('/api/admin') || urlStr.includes('/api/admin/');
    if (!isAdminApi) {
      return originalFetch(input, init);
    }

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    );

    const session = getAdminSession();
    if (session?.adminToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.adminToken}`);
    }
    if (!headers.has('X-Admin-Role')) {
      headers.set('X-Admin-Role', getActiveAdminRole());
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}

const BASE_URL = '/api/admin';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  ensureAdminRoleFetchInterceptor();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'İşlem sırasında bir hata oluştu.';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.title || data.message || JSON.stringify(data);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const rbacService = {
  loginAdmin: (email: string, password: string) =>
    request<AdminLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getRoles: () => request<RoleDto[]>('/roles'),

  createRole: (payload: CreateRolePayload) =>
    request<RoleDto>('/roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPermissions: () => request<ModulePermissionDto[]>('/permissions'),

  updateRolePermissions: (roleId: string, permissionKeys: string[]) =>
    request<RoleDto>(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionKeys }),
    }),

  getMyPermissions: (roleOverride?: string) =>
    request<string[]>('/auth/me/permissions', {
      headers: roleOverride ? { 'X-Admin-Role': roleOverride } : undefined,
    }),
};
