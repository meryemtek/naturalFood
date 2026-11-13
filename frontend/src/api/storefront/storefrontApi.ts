export interface Category { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; subCategories: Category[] }

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentCategoryId: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  basePrice: number;
  discountPrice: number | null;
  stockQuantity: number;
  unitInfo: string;
  mainImageUrl: string | null;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSeasonal?: boolean;
  variantCount: number;
  origin?: string | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  isMain: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  unitInfo: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
  displayOrder: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  basePrice: number;
  discountPrice: number | null;
  stockQuantity: number;
  sku: string;
  unitInfo: string;
  ingredients: string | null;
  allergens: string | null;
  origin: string | null;
  storageConditions: string | null;
  shelfLife: string | null;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSeasonal?: boolean;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
}

export interface Banner {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  targetUrl: string | null;
  buttonText: string | null;
}

export interface HomeData {
  heroBanners: Banner[];
  featuredCategories: Category[];
  bestSellers: Product[];
  featuredProducts: Product[];
  seasonalProducts: Product[];
  campaignAnnouncements: { id: string; title: string; description: string | null }[];
  brandStory: { title: string; summary: string } | null;
}

export interface Cart {
  id?: string;
  items: {
    id: string;
    name: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    productSlug?: string;
    imageUrl?: string | null;
    variantName?: string | null;
    unitInfo?: string;
  }[];
  subtotal: number;
  total: number;
  couponCode?: string | null;
  discount?: number;
  couponError?: string | null;
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
    try {
      const body = await response.json();
      message = body.detail || body.title || body.message || message;
    } catch {
      /* no structured error */
    }
    throw new Error(message);
  }
  return response.status === 204 || response.status === 202 ? (undefined as T) : response.json();
}

export const money = (value: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

