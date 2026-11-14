import { authStorage, ensureAccessToken } from '../authApi';
import { request, type Cart } from './storefrontApi';

let guestCreation: Promise<string> | null = null;

function credentials(): Record<string, string> | null {
  const accessToken = authStorage.getAccessToken();
  if (accessToken) return { Authorization: `Bearer ${accessToken}` };
  const guestToken = authStorage.getGuestToken();
  return guestToken ? { 'X-Guest-Cart-Token': guestToken } : null;
}

async function ensureCredentials(): Promise<Record<string, string>> {
  if (authStorage.getAccessToken()) await ensureAccessToken();
  const existing = credentials();
  if (existing) return existing;
  if (!guestCreation) {
    guestCreation = request<{ token: string }>('/api/cart/guest', { method: 'POST' })
      .then(guest => guest.token).finally(() => { guestCreation = null; });
  }
  const token = await guestCreation;
  const current = credentials();
  if (current) return current;
  authStorage.setGuestToken(token);
  return { 'X-Guest-Cart-Token': token };
}

function ownerKey(): string {
  const token = authStorage.getAccessToken();
  return token ? `customer:${token}` : `guest:${authStorage.getGuestToken() ?? ''}`;
}

function ownerFromHeaders(headers: Record<string, string>): string {
  return headers.Authorization ? `customer:${headers.Authorization.slice(7)}` : `guest:${headers['X-Guest-Cart-Token'] ?? ''}`;
}

function checkOwner(owner: string) {
  if (owner !== ownerKey()) throw new Error('Oturum değişti. Sepet yeniden yükleniyor.');
}

function changed(cart: Cart, owner: string): Cart {
  checkOwner(owner);
  window.dispatchEvent(new CustomEvent('naturalfood:cart-changed', { detail: cart }));
  return cart;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeVariantId(variantId: string | null | undefined): string | null {
  return variantId && UUID_RE.test(variantId) ? variantId : null;
}

export const cartApi = {
  async get(signal?: AbortSignal): Promise<Cart | null> {
    if (authStorage.getAccessToken()) await ensureAccessToken();
    const headers = credentials();
    return headers ? request<Cart>('/api/cart/', { headers, signal }) : null;
  },
  async add(productId: string, variantId: string | null, quantity: number): Promise<Cart> {
    const safeVariantId = normalizeVariantId(variantId);
    const headers = await ensureCredentials();
    const owner = ownerFromHeaders(headers); checkOwner(owner);
    const current = await request<Cart>('/api/cart/', { headers });
    const previous = current.items.find(item => item.productId === productId && item.variantId === safeVariantId);
    checkOwner(owner);
    return changed(await request<Cart>('/api/cart/items', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, variantId: safeVariantId, quantity: (previous?.quantity ?? 0) + quantity }) }), owner);
  },
  async set(productId: string, variantId: string | null, quantity: number): Promise<Cart> {
    const safeVariantId = normalizeVariantId(variantId);
    const headers = await ensureCredentials();
    const owner = ownerFromHeaders(headers); checkOwner(owner);
    return changed(await request<Cart>('/api/cart/items', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, variantId: safeVariantId, quantity }) }), owner);
  },
  async remove(id: string): Promise<Cart> {
    const headers = await ensureCredentials(); const owner = ownerFromHeaders(headers); checkOwner(owner);
    return changed(await request<Cart>(`/api/cart/items/${encodeURIComponent(id)}`, { method: 'DELETE', headers }), owner);
  },
  async clear(): Promise<Cart> {
    const headers = await ensureCredentials(); const owner = ownerFromHeaders(headers); checkOwner(owner);
    return changed(await request<Cart>('/api/cart/', { method: 'DELETE', headers }), owner);
  },
  async coupon(code: string): Promise<Cart> {
    const headers = await ensureCredentials(); const owner = ownerFromHeaders(headers); checkOwner(owner);
    return changed(await request<Cart>('/api/cart/coupon', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }), owner);
  },
  async removeCoupon(): Promise<Cart> {
    const headers = await ensureCredentials(); const owner = ownerFromHeaders(headers); checkOwner(owner);
    return changed(await request<Cart>('/api/cart/coupon', { method: 'DELETE', headers }), owner);
  },
};
