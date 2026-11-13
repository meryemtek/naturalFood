import { ensureAccessToken } from '../authApi';
import type { Order } from '../accountApi';
import { request } from './storefrontApi';

export const orderStatuses: Record<string, string> = { PendingPayment: 'Ödeme bekleniyor', Paid: 'Ödeme doğrulandı', Preparing: 'Hazırlanıyor', Processing: 'Hazırlanıyor', Shipped: 'Kargoya verildi', Delivered: 'Teslim edildi', Completed: 'Tamamlandı', Cancelled: 'İptal edildi', Refunded: 'Ödeme iade edildi', Returned: 'İade edildi' };
export const requestStatuses: Record<string, string> = { Pending: 'Değerlendirme bekleniyor', Approved: 'Onaylandı', Rejected: 'Reddedildi' };
export interface Workflow {
  history: { id: string; status: string; note: string; createdAtUtc: string }[];
  shipment: { carrier: string; trackingNumber: string; trackingUrl: string | null; estimatedDeliveryUtc: string | null; status: string } | null;
  requests: { id: string; kind: string; reason: string; status: string; response: string | null; createdAtUtc: string; resolvedAtUtc: string | null }[];
  notifications: { id: string; channel: string; message: string; deliveryStatus: string; createdAtUtc: string }[];
  invoice: { number: string; issuedAtUtc: string; isDemo: boolean } | null;
}
export interface Invoice { invoice: NonNullable<Workflow['invoice']>; order: Order; email: string; billingAddress: string }
export async function orderRequest<T>(id: string, path: string, guestKey?: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (guestKey) headers['X-Guest-Cart-Token'] = guestKey;
  else {
    const token = await ensureAccessToken();
    if (!token) throw new Error('Lütfen giriş yapın.');
    headers.Authorization = `Bearer ${token}`;
  }
  return request<T>(`/api/orders/${id}${path}`, { ...options, headers });
}
