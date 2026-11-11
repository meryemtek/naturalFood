// Frontend Customer Reviews Service for Natural Food Admin Dashboard & CRM
// Connects directly to .NET 10 Minimal API & PostgreSQL (experience.Reviews)

export interface DashboardAttentionReviewDto {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  commentText: string;
  createdAtUtc: string;
  hasResponse: boolean;
  adminResponse?: string | null;
  status: string;
}

export interface DashboardReviewsAttentionResponse {
  averageStoreRating: number;
  totalReviewCount: number;
  unresolvedNegativeCount: number;
  criticalReviews: DashboardAttentionReviewDto[];
}

export interface AdminReviewItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  commentText: string;
  status: string;
  hasResponse: boolean;
  adminResponse?: string | null;
  respondedAtUtc?: string | null;
  createdAtUtc: string;
}

export interface PaginatedAdminReviewsResponse {
  items: AdminReviewItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number;
  pendingCount: number;
  negativeUnresolvedCount: number;
}

export interface QuickReviewResponseData {
  responseText?: string | null;
  markAsReviewed?: boolean;
}

const BASE_URL = '/api/admin/reviews';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'Sunucuda bir hata oluştu.';
    try {
      const data = await res.json();
      if (data.errors) {
        errorDetail = Object.values(data.errors).flat().join(' ');
      } else {
        errorDetail = data.detail || data.title || JSON.stringify(data);
      }
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const reviewService = {
  getDashboardAttention: async (): Promise<DashboardReviewsAttentionResponse> => {
    return request<DashboardReviewsAttentionResponse>(`${BASE_URL}/dashboard-attention`);
  },

  getAllReviews: async (params?: {
    rating?: number;
    status?: string;
    onlyNegative?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedAdminReviewsResponse> => {
    const query = new URLSearchParams();
    if (params?.rating) query.append('rating', params.rating.toString());
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.onlyNegative !== undefined) query.append('onlyNegative', String(params.onlyNegative));
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const qs = query.toString();
    return request<PaginatedAdminReviewsResponse>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
  },

  quickRespond: async (
    reviewId: string,
    data: QuickReviewResponseData
  ): Promise<AdminReviewItemDto> => {
    return request<AdminReviewItemDto>(`${BASE_URL}/${reviewId}/quick-response`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (reviewId: string, status: string): Promise<AdminReviewItemDto> => {
    return request<AdminReviewItemDto>(`${BASE_URL}/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
