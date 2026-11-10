// Frontend Inventory Service for Natural Food Admin
// Connects directly to .NET 10 Minimal API & PostgreSQL (catalog.Products & admin.AuditLogs)

export interface InventoryItemDto {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  stockQuantity: number;
  unitInfo: string;
  status: 'InStock' | 'LowStock' | 'OutOfStock' | string;
  imageUrl?: string | null;
  lastUpdatedUtc?: string | null;
}

export interface PaginatedInventory {
  items: InventoryItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UpdateStockData {
  delta?: number;
  newQuantity?: number;
  reason?: string;
}

const BASE_URL = '/api/admin/inventory';

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

  return res.json();
}

export const inventoryService = {
  // GET /api/admin/inventory
  getInventory: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    criticalOnly?: boolean;
  }): Promise<PaginatedInventory> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.criticalOnly) query.append('criticalOnly', 'true');

    const queryString = query.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    return request<PaginatedInventory>(url);
  },

  // PATCH /api/admin/inventory/{id}/stock
  updateStock: async (id: string, data: UpdateStockData): Promise<InventoryItemDto> => {
    return request<InventoryItemDto>(`${BASE_URL}/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
