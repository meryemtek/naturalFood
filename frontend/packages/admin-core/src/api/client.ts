import type {
  AdminUser,
  AuditLog,
  CreateAdminUserRequest,
  PagedResult,
  PaginationParams,
  UpdateStatusRequest,
  ApiClientConfig,
} from '../types';

export class AdminApiError extends Error {
  public status: number;
  public details?: any;
  public errors?: Record<string, string[]>;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.details = details;
    if (details && typeof details === 'object' && details.errors) {
      this.errors = details.errors;
    }
  }
}

export class AdminApiClient {
  private baseUrl: string;
  private getAuthToken?: () => string | null | Promise<string | null>;
  private onError?: (error: Error) => void;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = (config?.baseUrl || '/api/admin').replace(/\/+$/, '');
    this.getAuthToken = config?.getAuthToken;
    this.onError = config?.onError;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetails: any = null;
        let errorMessage = `API Hatası: ${response.status} ${response.statusText}`;

        try {
          errorDetails = await response.json();
          if (errorDetails.title) {
            errorMessage = errorDetails.title;
          } else if (errorDetails.message) {
            errorMessage = errorDetails.message;
          }
        } catch {
          // JSON değilse metin olarak dene
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // yoksay
          }
        }

        const apiError = new AdminApiError(errorMessage, response.status, errorDetails);
        if (this.onError) this.onError(apiError);
        throw apiError;
      }

      // 204 No Content kontrolü
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof AdminApiError) throw err;
      const networkError = new AdminApiError(
        err.message || 'Ağ hatası veya sunucuya erişilemiyor.',
        0,
        err
      );
      if (this.onError) this.onError(networkError);
      throw networkError;
    }
  }

  /**
   * Sayfalanabilir kullanıcı listesi getirir.
   */
  public async getUsers(params?: PaginationParams): Promise<PagedResult<AdminUser>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PagedResult<AdminUser>>(`/users${qs}`);
  }

  /**
   * Tekil kullanıcı detayını getirir.
   */
  public async getUserById(id: string): Promise<AdminUser> {
    return this.request<AdminUser>(`/users/${id}`);
  }

  /**
   * Yeni admin kullanıcısı oluşturur (Şifreli ve AuditLog oluşturulur).
   */
  public async createUser(req: CreateAdminUserRequest): Promise<AdminUser> {
    return this.request<AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  /**
   * Kullanıcının aktif/pasif durumunu günceller.
   */
  public async updateUserStatus(id: string, req: UpdateStatusRequest): Promise<AdminUser> {
    return this.request<AdminUser>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(req),
    });
  }

  /**
   * Sistem denetim kayıtlarını (AuditLogs) sayfalanabilir olarak getirir.
   */
  public async getAuditLogs(params?: PaginationParams): Promise<PagedResult<AuditLog>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<PagedResult<AuditLog>>(`/audit-logs${qs}`);
  }
}

// Varsayılan singleton istemci
export const adminApi = new AdminApiClient();

// Fabrika fonksiyonu: Dışarıdan özel yapılandırma ile yeni istemci oluşturulabilmesi için
export function createAdminApiClient(config?: ApiClientConfig): AdminApiClient {
  return new AdminApiClient(config);
}
