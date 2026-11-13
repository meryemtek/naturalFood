import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { authStorage } from '../../api/authApi';
import { request } from '../../api/storefront/storefrontApi';
import type { Order } from '../../api/accountApi';
import { OrderCustomerDetail } from '../../components/orders/OrderCustomerDetail';
import '../account/account.css';

export function GuestOrderTrackingPage() {
  const [params] = useSearchParams();
  if (authStorage.getCustomer() && !params.get('number')) {
    return <Navigate to="/hesabim/siparisler" replace />;
  }
  const [number, setNumber] = useState(params.get('number') ?? '');
  const [key, setKey] = useState(() => authStorage.getGuestToken() ?? '');
  const [tracked, setTracked] = useState<{ order: Order; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setTracked(null);
    try {
      const order = await request<Order>('/api/orders/track', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Guest-Cart-Token': key.trim() }, body: JSON.stringify({ orderNumber: number.trim() }) });
      setTracked({ order, key: key.trim() });
    } catch { setError('Sipariş bulunamadı veya doğrulanamadı. Sipariş numarası ve takip anahtarını kontrol edin.'); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background text-on-surface"><StorefrontHeader /><main className="mx-auto max-w-3xl px-5 py-8">
    <h1 className="text-2xl font-bold">Misafir Sipariş Takibi</h1>
    <p className="my-4">Sipariş numaranız ve özel takip anahtarınızla siparişinizi görüntüleyebilirsiniz. Aynı tarayıcıda takip anahtarı otomatik doldurulur.</p>
    <form className="account-form account-card" onSubmit={submit}>
      <label>Sipariş numarası<input required maxLength={32} value={number} onChange={e => setNumber(e.target.value)} autoComplete="off" /></label>
      <label>Özel takip anahtarı<input required type="password" minLength={64} maxLength={64} value={key} onChange={e => setKey(e.target.value)} autoComplete="off" /></label>
      <p>Takip anahtarınızı paylaşmayın. Anahtar kaybolduysa destek ekibiyle iletişime geçin.</p>
      <button className="account-primary" disabled={busy}>{busy ? 'Sorgulanıyor…' : 'Siparişimi göster'}</button>
    </form>
    {error && <p role="alert" className="account-error">{error}</p>}
    {tracked && <OrderCustomerDetail key={`${tracked.order.id}-${tracked.key}`} initialOrder={tracked.order} guestKey={tracked.key} />}
  </main><AuthFooter /></div>;
}
