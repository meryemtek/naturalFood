import { authFetch, type CustomerProfile } from './authApi';

export interface Address {
  id: string; title: string; recipientName: string; phone: string; city: string; district: string;
  neighborhood: string | null; fullAddress: string; postalCode: string | null;
  isDefault: boolean; isBillingAddress: boolean; companyName: string | null; taxOffice: string | null; taxNumber: string | null;
}
export type AddressInput = Omit<Address, 'id'>;
export interface WishlistItem { id: string; productId: string; productName: string; productSlug: string; productImageUrl: string | null; basePrice: number; discountPrice: number | null; inStock: boolean; }
export interface Order { id: string; number: string; status: string; subtotal: number; shippingFee: number; total: number; createdAtUtc: string; discount: number; couponCode: string | null; lines: { name: string; sku: string; quantity: number; unitPrice: number }[]; }
export interface CustomerReview { id: string; productId: string; productName: string | null; productSlug: string | null; rating: number; text: string; status: string; createdAtUtc: string; }

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
export const accountApi = {
  profile: () => authFetch<CustomerProfile>('/api/customer/profile'),
  updateProfile: (value: { firstName: string; lastName: string; phone: string | null }) => authFetch<CustomerProfile>('/api/customer/profile', json('PUT', value)),
  changePassword: (value: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => authFetch<{ message: string }>('/api/customer/change-password', json('POST', value)),
  addresses: () => authFetch<Address[]>('/api/customer/addresses/'),
  saveAddress: (value: AddressInput, id?: string) => authFetch<Address>(id ? `/api/customer/addresses/${id}` : '/api/customer/addresses/', json(id ? 'PUT' : 'POST', value)),
  deleteAddress: (id: string) => authFetch<void>(`/api/customer/addresses/${id}`, { method: 'DELETE' }),
  wishlist: () => authFetch<WishlistItem[]>('/api/customer/wishlist/'),
  addFavorite: (productId: string) => authFetch<WishlistItem>(`/api/customer/wishlist/${productId}`, { method: 'POST' }),
  removeFavorite: (productId: string) => authFetch<void>(`/api/customer/wishlist/${productId}`, { method: 'DELETE' }),
  orders: (signal?: AbortSignal) => authFetch<Order[]>('/api/orders/', { signal }),
  order: (id: string, signal?: AbortSignal) => authFetch<Order>(`/api/orders/${id}`, { signal }),
  reviews: () => authFetch<CustomerReview[]>('/api/customer/reviews'),
};
