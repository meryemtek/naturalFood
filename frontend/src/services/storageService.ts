// Frontend Storage Conditions Service for Natural Food Admin
// Connects directly to .NET 10 Minimal API & PostgreSQL (catalog.StorageConditions)

export interface StorageConditionDto {
  id: string;
  name: string;
  minTemperature: number;
  maxTemperature: number;
  maxHumidity?: number | null;
  requiresColdChain: boolean;
  defaultShelfZone: string;
  description?: string | null;
  productCount: number;
  sampleProducts: string[];
}

export interface CreateStorageConditionData {
  name: string;
  minTemperature: number;
  maxTemperature: number;
  maxHumidity?: number | null;
  requiresColdChain: boolean;
  defaultShelfZone: string;
  description?: string | null;
}

export interface ProductStorageItemDto {
  id: string;
  name: string;
  sku: string;
  category: string;
  storageConditionId?: string | null;
  storageConditionName?: string | null;
  minTemperature?: number | null;
  maxTemperature?: number | null;
  requiresColdChain: boolean;
  shelfLocation?: string | null;
  stockQuantity: number;
}

export interface UpdateProductStorageData {
  storageConditionId?: string | null;
  shelfLocation?: string | null;
}

const BASE_URL = '/api/admin/storage-conditions';

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

export const storageService = {
  getStorageConditions: async (): Promise<StorageConditionDto[]> => {
    return request<StorageConditionDto[]>(BASE_URL);
  },

  createStorageCondition: async (data: CreateStorageConditionData): Promise<StorageConditionDto> => {
    return request<StorageConditionDto>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProductsStorage: async (): Promise<ProductStorageItemDto[]> => {
    return request<ProductStorageItemDto[]>(`${BASE_URL}/products`);
  },

  updateProductStorage: async (
    productId: string,
    data: UpdateProductStorageData
  ): Promise<ProductStorageItemDto> => {
    return request<ProductStorageItemDto>(`/api/admin/products/${productId}/storage`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
