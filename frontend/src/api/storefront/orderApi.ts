import { authStorage } from '../authApi';
import { request, type Cart } from './storefrontApi';

export interface OrderRequest { email: string; phone: string; deliveryAddress: string; billingAddress: string }
export interface CreatedOrder {
  id: string; number: string; status: string; subtotal: number; shippingFee: number; total: number;
  discount: number; reservationExpiresAtUtc: string;
  lines: { name: string; sku: string; quantity: number; unitPrice: number }[];
}

export async function quoteOrder(signal?: AbortSignal): Promise<{ subtotal: number; discount: number; shippingFee: number; total: number }> {
  const token = authStorage.getAccessToken();
  const guestToken = authStorage.getGuestToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (guestToken) headers['X-Guest-Cart-Token'] = guestToken;
  else throw new Error('Sepet bulunamadı.');
  return request('/api/orders/quote', { headers, signal });
}

export async function createOrder(data: OrderRequest, idempotencyKey: string): Promise<CreatedOrder> {
  const token = authStorage.getAccessToken();
  const guestToken = authStorage.getGuestToken();
  if (!token && !guestToken) throw new Error('Sepet bulunamadı. Lütfen sepetinizi kontrol edin.');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (guestToken) headers['X-Guest-Cart-Token'] = guestToken;
  const order = await request<CreatedOrder>('/api/orders/', { method: 'POST', headers, body: JSON.stringify(data) });
  const empty: Cart = { items: [], subtotal: 0, total: 0 };
  window.dispatchEvent(new CustomEvent('naturalfood:cart-changed', { detail: empty }));
  return order;
}
