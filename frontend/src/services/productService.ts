// Frontend Product Service for Natural Food Admin
// Connects directly to .NET 10 Minimal API & PostgreSQL

export interface ProductDto {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category: string;
  saleUnit: string;
  basePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  status: 'Active' | 'LowStock' | 'OutOfStock' | 'Draft' | string;
  imageUrl?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface PaginatedProducts {
  items: ProductDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateProductData {
  name: string;
  category: string;
  saleUnit: string;
  sellingPrice: number;
  basePrice?: number;
  stockQuantity?: number;
  sku?: string | null;
  barcode?: string | null;
  status?: string;
  imageUrl?: string | null;
}

export interface UpdateProductData {
  name: string;
  category: string;
  saleUnit: string;
  sellingPrice: number;
  basePrice?: number;
  stockQuantity?: number;
  sku?: string | null;
  barcode?: string | null;
  status: string;
  imageUrl?: string | null;
}

// Vite proxy routes /api to http://localhost:5000/api
const BASE_URL = '/api/admin/products';

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

  // Handle empty responses or 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const productService = {
  // GET /api/admin/products
  getProducts: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    unit?: string;
  }): Promise<PaginatedProducts> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.unit && params.unit !== 'all') query.append('unit', params.unit);

    const queryString = query.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    return request<PaginatedProducts>(url);
  },

  // GET /api/admin/products/{id}
  getProductById: async (id: string): Promise<ProductDto> => {
    return request<ProductDto>(`${BASE_URL}/${id}`);
  },

  // POST /api/admin/products
  createProduct: async (data: CreateProductData): Promise<ProductDto> => {
    return request<ProductDto>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/admin/products/{id}
  updateProduct: async (id: string, data: UpdateProductData): Promise<ProductDto> => {
    return request<ProductDto>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/admin/products/{id}
  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
