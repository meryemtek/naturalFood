// Frontend Lot Tracking Service for Natural Food Admin
// Connects directly to .NET 10 Minimal API & PostgreSQL (catalog.ProductLots)

export interface ProductLotDto {
  id: string;
  productId: string;
  productName: string;
  productSku?: string | null;
  lotNumber: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  daysLeft: number;
  status: 'Active' | 'NearExpiry' | 'Expired' | 'WrittenOff' | string;
  autoDiscount?: string | null;
  createdAtUtc: string;
}

export interface LotSummaryMetricsDto {
  totalLots: number;
  activeLots: number;
  nearExpiryCount: number;
  criticalCount: number;
  expiredCount: number;
  writtenOffCount: number;
}

export interface PaginatedLotsResponse {
  items: ProductLotDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: LotSummaryMetricsDto;
}

export interface CreateLotData {
  productId: string;
  lotNumber?: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  status?: string;
}

export interface UpdateLotStatusData {
  status: 'Active' | 'NearExpiry' | 'Expired' | 'WrittenOff' | string;
}

const BASE_URL = '/api/admin/lots';

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

export const lotService = {
  getLots: async (params?: {
    productId?: string;
    expiringWithinDays?: number;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedLotsResponse> => {
    const query = new URLSearchParams();
    if (params?.productId) query.append('productId', params.productId);
    if (params?.expiringWithinDays) query.append('expiringWithinDays', params.expiringWithinDays.toString());
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const qs = query.toString();
    const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;
    return request<PaginatedLotsResponse>(url);
  },

  createLot: async (data: CreateLotData): Promise<ProductLotDto> => {
    return request<ProductLotDto>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLotStatus: async (id: string, data: UpdateLotStatusData): Promise<ProductLotDto> => {
    return request<ProductLotDto>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
