/**
 * Kullanıcı Kimlik Doğrulama & Oturum Yönetimi API Servisi
 */

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isGuest: boolean;
  role?: string;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  customer: CustomerProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kk_access_token',
  REFRESH_TOKEN: 'kk_refresh_token',
  CUSTOMER: 'kk_customer',
  GUEST_TOKEN: 'kk_guest_token',
};

export function isAdminRole(role?: string | null): boolean {
  return role === 'Admin' || role === 'SuperAdmin' || role === 'Moderator';
}

// ============================================================================
// Token & Oturum Yardımcıları (Local / Session Storage)
// ============================================================================

export const authStorage = {
  getAccessToken: (): string | null => getStoredValue(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: (): string | null => getStoredValue(STORAGE_KEYS.REFRESH_TOKEN),
  getCustomer: (): CustomerProfile | null => {
    const raw = getStoredValue(STORAGE_KEYS.CUSTOMER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  isAdmin: (): boolean => {
    const customer = authStorage.getCustomer();
    return isAdminRole(customer?.role);
  },
  getGuestToken: (): string | null =>
    localStorage.getItem(STORAGE_KEYS.GUEST_TOKEN) || localStorage.getItem('naturalfood.guestCartToken'),

  setAuth: (response: AuthResponse, rememberMe = true) => {
    const target = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.CUSTOMER].forEach(key => {
      other.removeItem(key);
    });
    target.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    target.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    target.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(response.customer));
    window.dispatchEvent(new Event('naturalfood:auth-changed'));
  },

  setGuestToken: (token: string) => {
    localStorage.setItem(STORAGE_KEYS.GUEST_TOKEN, token);
    localStorage.setItem('naturalfood.guestCartToken', token);
  },

  clearGuestToken: () => {
    localStorage.removeItem(STORAGE_KEYS.GUEST_TOKEN);
    localStorage.removeItem('naturalfood.guestCartToken');
  },

  updateCustomer: (customer: CustomerProfile) => {
    const storage = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(customer));
    window.dispatchEvent(new Event('naturalfood:auth-changed'));
  },

  clearAuth: () => {
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      storage.removeItem(STORAGE_KEYS.CUSTOMER);
    });
    window.dispatchEvent(new Event('naturalfood:auth-changed'));
  },

  isAuthenticated: (): boolean => {
    return Boolean(getStoredValue(STORAGE_KEYS.ACCESS_TOKEN));
  },
};

function getStoredValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

// Aynı anda başlayan sepet istekleri aynı oturum yenilemesini paylaşır.
let refreshInFlight: Promise<string> | null = null;

export async function ensureAccessToken(): Promise<string | null> {
  const token = authStorage.getAccessToken();
  if (!token) return null;
  let expiresAt = 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    expiresAt = typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch { /* Geçersiz anahtar yenilenmeyi gerektirir. */ }
  if (expiresAt > Date.now() + 30_000) return token;
  if (!refreshInFlight) {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) throw new Error('Oturum süreniz doldu. Lütfen yeniden giriş yapın.');
    const rememberMe = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) === token;
    refreshInFlight = (async () => {
      let response: Response;
      try {
        response = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      } catch {
        throw new Error('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
      }
      if (!response.ok) throw new Error(response.status === 401 ? 'Oturum süreniz doldu. Lütfen yeniden giriş yapın.' : 'Oturum yenilenemedi. Lütfen tekrar deneyin.');
      const updated: AuthResponse = await response.json();
      if (authStorage.getAccessToken() !== token || authStorage.getRefreshToken() !== refreshToken)
        throw new Error('Oturum değişti. Lütfen işlemi tekrar deneyin.');
      authStorage.setAuth(updated, rememberMe);
      return updated.accessToken;
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// ============================================================================
// API İstekleri
// ============================================================================

export async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getAccessToken();
  const guestToken = authStorage.getGuestToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (guestToken) {
    headers['X-Guest-Cart-Token'] = guestToken;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = response.status >= 500
      ? 'Sunucuya ulaşılamadı veya işlem tamamlanamadı. Lütfen tekrar deneyin.'
      : 'İşlem gerçekleştirilemedi.';
    try {
      const errorData = await response.json();
      if (errorData.errors) {
        // FluentValidation hata listesi
        const firstErrorKey = Object.keys(errorData.errors)[0];
        errorMessage = errorData.errors[firstErrorKey][0];
      } else {
        errorMessage = errorData.message || errorData.detail || errorData.title || errorMessage;
      }
    } catch {
      // Yapılandırılmış bir hata yanıtı yoksa genel mesaj gösterilir.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }

  return response.json();
}

async function mergeGuestCartIfPresent(): Promise<void> {
  const guestToken = authStorage.getGuestToken();
  const accessToken = authStorage.getAccessToken();
  if (!guestToken || !accessToken) return;

  try {
    const cart = await authFetch('/api/cart/merge', { method: 'POST' });
    if (authStorage.getGuestToken() === guestToken) authStorage.clearGuestToken();
    if (authStorage.getAccessToken() === accessToken) window.dispatchEvent(new CustomEvent('naturalfood:cart-changed', { detail: cart }));
  } catch (error) {
    console.warn('Misafir sepeti hesapla birleştirilemedi:', error);
  }
}

async function authenticate(
  path: '/api/auth/login' | '/api/auth/register',
  payload: LoginPayload | RegisterPayload,
  rememberMe: boolean,
): Promise<AuthResponse> {
  const response = await authFetch<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  authStorage.setAuth(response, rememberMe);
  await mergeGuestCartIfPresent();
  return response;
}

export const authApi = {
  /**
   * Yeni kullanıcı kaydı oluşturur ve otomatik oturum açar
   */
  register: (payload: RegisterPayload, rememberMe = true): Promise<AuthResponse> =>
    authenticate('/api/auth/register', payload, rememberMe),

  /**
   * E-posta ve şifre ile giriş yapar
   */
  login: (payload: LoginPayload, rememberMe = true): Promise<AuthResponse> =>
    authenticate('/api/auth/login', payload, rememberMe),

  /**
   * Çıkış yapar ve refresh token'ı iptal eder
   */
  logout: async (): Promise<void> => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Çıkış hatası kullanıcıyı engellememeli
      }
    }
    authStorage.clearAuth();
  },

  /**
   * Giriş yapmış kullanıcının profil bilgilerini getirir
   */
  getProfile: async (): Promise<CustomerProfile> => {
    return authFetch<CustomerProfile>('/api/customer/profile');
  },

  /**
   * Şifre sıfırlama bağlantısı talep eder
   */
  forgotPassword: async (email: string): Promise<{ message: string; devResetUrl?: string | null }> => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || data?.title || 'Şifre sıfırlama talebi gönderilemedi.');
    }
    return data;
  },

  /**
   * Token ile yeni şifre belirler
   */
  resetPassword: async (payload: { token: string; email: string; newPassword: string; newPasswordConfirm: string }): Promise<{ message: string }> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data?.errors) {
        const first = Object.values(data.errors as Record<string, string[]>)[0];
        if (first?.length) throw new Error(first[0]);
      }
      throw new Error(data?.message || data?.detail || data?.title || 'Şifre sıfırlanamadı.');
    }
    return data;
  },

  /**
   * Misafir sepetini giriş yapan kullanıcının hesabıyla birleştirir
   */
  mergeCart: async (): Promise<void> => {
    await authFetch('/api/cart/merge', {
      method: 'POST',
    });
  },
};
