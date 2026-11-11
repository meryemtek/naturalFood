import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { authStorage } from '../../api/authApi';
import { cartApi } from '../../api/storefront/cartApi';
import { createOrder, quoteOrder, type CreatedOrder, type OrderRequest } from '../../api/storefront/orderApi';
import { money, type Cart } from '../../api/storefront/storefrontApi';

export function CheckoutPage() {
  const profile = authStorage.getCustomer();
  const [quote, setQuote] = useState<{ shippingFee: number; total: number } | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [separateBilling, setSeparateBilling] = useState(false);
  const [form, setForm] = useState<OrderRequest>({ email: profile?.email ?? '', phone: profile?.phone ?? '', deliveryAddress: '', billingAddress: '' });
  const submitting = useRef(false);
  const keyRef = useRef('');

  useEffect(() => {
    const controller = new AbortController();
    cartApi.get(controller.signal).then(async value => {
      setCart(value);
      if (value?.id) {
        const storageKey = `naturalfood.checkout.${value.id}`;
        keyRef.current = sessionStorage.getItem(storageKey) || crypto.randomUUID();
        sessionStorage.setItem(storageKey, keyRef.current);
        if (value.items.length) setQuote(await quoteOrder(controller.signal));
      }
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Sipariş özeti yüklenemedi. Lütfen tekrar deneyin.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || !cart?.items.length || !keyRef.current || !quote) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const result = await createOrder({ ...form, billingAddress: separateBilling ? form.billingAddress : form.deliveryAddress }, keyRef.current);
      sessionStorage.removeItem(`naturalfood.checkout.${cart.id}`);
      setOrder(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally { submitting.current = false; setBusy(false); }
  };
  const field = (key: keyof OrderRequest, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const inputClass = 'w-full rounded-lg border border-secondary/30 bg-white px-3 py-3 text-on-surface';

  return <div className="min-h-screen bg-background text-on-surface flex flex-col">
    <StorefrontHeader />
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-8">
      {order ? <section className="mx-auto max-w-2xl rounded-xl border border-secondary/20 bg-surface-container-low p-8">
        <h1 className="text-2xl font-bold text-primary">Siparişiniz oluşturuldu</h1>
        <p className="mt-3">Sipariş numaranız: <strong>{order.number}</strong></p>
        <p className="mt-2">Durum: <strong>Ödeme bekleniyor</strong>. Henüz ödeme alınmadı.</p>
        <p className="mt-2">Kargo: {money(order.shippingFee)} · Toplam: <strong>{money(order.total)}</strong></p>
        <p className="mt-3 text-sm">Ürünleriniz {new Date(order.reservationExpiresAtUtc).toLocaleString('tr-TR')} tarihine kadar ayrılmıştır.</p>
        {!profile && <p className="mt-3 text-sm">Misafir sipariş takibi için bu tarayıcıdaki sepet bilgilerinizi koruyun ve sipariş numaranızı saklayın.</p>}
        <Link to="/products" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-bold text-white">Alışverişe devam et</Link>
      </section> : <>
        <nav className="mb-4 text-sm"><Link to="/sepetim">Sepetim</Link> / Ödeme ve Teslimat</nav>
        <h1 className="mb-6 text-3xl font-bold text-primary">Ödeme ve Teslimat</h1>
        {error && <p role="alert" className="mb-5 rounded-lg border border-secondary/30 p-4">{error}</p>}
        {loading ? <p>Sepetiniz yükleniyor...</p> : !cart?.items.length ? <p>Sepetiniz boş. <Link className="underline" to="/products">Ürünleri inceleyin.</Link></p> :
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-secondary/20 bg-surface-container-low p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-primary">İletişim ve teslimat bilgileri</h2>
            <label className="block font-semibold">E-posta<input className={`${inputClass} mt-1`} required type="email" maxLength={256} value={form.email} onChange={e => field('email', e.target.value)} /></label>
            <label className="block font-semibold">Telefon<input className={`${inputClass} mt-1`} required type="tel" maxLength={30} value={form.phone} onChange={e => field('phone', e.target.value)} /></label>
            <label className="block font-semibold">Teslimat adresi<textarea className={`${inputClass} mt-1`} required maxLength={1000} rows={4} placeholder="Ad soyad, il, ilçe, mahalle ve açık adres" value={form.deliveryAddress} onChange={e => field('deliveryAddress', e.target.value)} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={separateBilling} onChange={e => setSeparateBilling(e.target.checked)} /> Fatura adresim farklı</label>
            {separateBilling && <label className="block font-semibold">Fatura adresi<textarea className={`${inputClass} mt-1`} required maxLength={1000} rows={4} value={form.billingAddress} onChange={e => field('billingAddress', e.target.value)} /></label>}
          </section>
          <aside className="h-fit rounded-xl border border-primary/20 bg-surface-container-low p-6">
            <h2 className="text-xl font-bold text-primary">Sipariş özeti</h2>
            <ul className="my-4 space-y-2 text-sm">{cart.items.map(item => <li key={item.id} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><strong>{money(item.lineTotal)}</strong></li>)}</ul>
            <p className="flex justify-between border-t pt-4"><span>Ürünler</span><strong>{money(cart.subtotal)}</strong></p>
            {(cart.discount ?? 0) > 0 && <p className="mt-2 flex justify-between"><span>İndirim</span><strong>−{money(cart.discount ?? 0)}</strong></p>}
            <p className="mt-2 flex justify-between"><span>Ara toplam</span><strong>{money(cart.total)}</strong></p>
            {quote && <>
              <p className="mt-2 flex justify-between"><span>Kargo</span><strong>{money(quote.shippingFee)}</strong></p>
              <p className="mt-2 flex justify-between border-t pt-3"><span>Toplam</span><strong>{money(quote.total)}</strong></p>
              <p className="mt-2 text-sm">Tutar sipariş oluşturulurken güncel stok, fiyat ve kupon bilgileriyle yeniden doğrulanır.</p>
            </>}
            <p className="mt-3 text-sm">Sipariş ödeme bekliyor durumunda oluşturulur; bu işlem ödeme almaz.</p>
            {cart.couponError && <p role="alert" className="mt-3 text-sm">{cart.couponError}</p>}
            <button disabled={busy || !quote || Boolean(cart.couponError)} className="mt-5 w-full rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Sipariş oluşturuluyor...' : 'Siparişi oluştur'}</button>
          </aside>
        </form>}
      </>}
    </main><AuthFooter />
  </div>;
}
