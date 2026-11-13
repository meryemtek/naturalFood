import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { authStorage } from '../../api/authApi';
import { cartApi } from '../../api/storefront/cartApi';
import { createOrder, quoteOrder, type CreatedOrder, type OrderRequest } from '../../api/storefront/orderApi';
import { money, type Cart } from '../../api/storefront/storefrontApi';
import { CheckoutAddressFields, emptyCheckoutAddress, formatCheckoutAddress } from './CheckoutAddressFields';
import { PaytrSimulationPanel } from './PaytrSimulationPanel';
import { accountApi, type Address } from '../../api/accountApi';

export function CheckoutPage() {
  const profile = authStorage.getCustomer();
  const [quote, setQuote] = useState<{ shippingFee: number; total: number } | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paytrOpen, setPaytrOpen] = useState(false);
  const [separateBilling, setSeparateBilling] = useState(false);
  const [guestCheckout, setGuestCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(emptyCheckoutAddress);
  const [billingAddress, setBillingAddress] = useState(emptyCheckoutAddress);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressError, setAddressError] = useState('');
  const [addressRetry, setAddressRetry] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [selectedBilling, setSelectedBilling] = useState('');
  const [form, setForm] = useState<OrderRequest>({ email: profile?.email ?? '', phone: profile?.phone ?? '', deliveryAddress: '', billingAddress: '' });
  const submitting = useRef(false);
  const keyRef = useRef('');
  const customerId = profile?.id;

  useEffect(() => {
    let active = true;
    if (customerId) accountApi.addresses().then(value => { if (active) { setAddresses(value); setAddressError(''); } })
      .catch(() => { if (active) setAddressError('Kayıtlı adresler yüklenemedi. Yeniden deneyebilir veya adresinizi elle girebilirsiniz.'); });
    return () => { active = false; };
  }, [customerId, addressRetry]);
  const selectAddress = (id: string, billing: boolean) => {
    const saved = addresses.find(address => address.id === id);
    const value = saved ? { recipientName: saved.recipientName, city: saved.city, district: saved.district, neighborhood: saved.neighborhood ?? '', fullAddress: saved.fullAddress } : emptyCheckoutAddress;
    if (billing) { setSelectedBilling(id); setBillingAddress(value); }
    else { setSelectedDelivery(id); setDeliveryAddress(value); if (saved) setForm(previous => ({ ...previous, phone: saved.phone })); }
  };
  const savedExtras = (id: string) => {
    const saved = addresses.find(address => address.id === id);
    return saved ? [saved.postalCode, saved.companyName, saved.taxOffice, saved.taxNumber].filter(Boolean).join(', ') : '';
  };

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
    if (!profile && !guestCheckout) return;
    const completeAddress = (address: typeof deliveryAddress) => Object.values(address).every(value => value.trim());
    if (!completeAddress(deliveryAddress) || (separateBilling && !completeAddress(billingAddress))) {
      setError('Lütfen adres alanlarının tamamını doldurun.');
      return;
    }
    submitting.current = true; setBusy(true); setError('');
    try {
      const formattedDeliveryAddress = [formatCheckoutAddress(deliveryAddress), savedExtras(selectedDelivery)].filter(Boolean).join(', ');
      const formattedBillingAddress = separateBilling ? [formatCheckoutAddress(billingAddress), savedExtras(selectedBilling)].filter(Boolean).join(', ') : formattedDeliveryAddress;
      if (formattedDeliveryAddress.length > 1000 || formattedBillingAddress.length > 1000) throw new Error('Adres bilgileri en fazla 1000 karakter olabilir. Lütfen kısaltın.');
      const result = await createOrder({ ...form, deliveryAddress: formattedDeliveryAddress, billingAddress: formattedBillingAddress }, keyRef.current);
      sessionStorage.removeItem(`naturalfood.checkout.${cart.id}`);
      setOrder(result);
      setPaytrOpen(result.status === 'PendingPayment');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sipariş oluşturulamadı. Lütfen tekrar deneyin.');
    } finally { submitting.current = false; setBusy(false); }
  };
  const field = (key: keyof OrderRequest, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const inputClass = 'w-full rounded-lg border border-secondary/30 bg-white px-3 py-3 text-on-surface';

  return <div className="min-h-screen bg-background text-on-surface flex flex-col">
    <StorefrontHeader />
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 sm:px-5 py-6 sm:py-8">
      {order ? (
        paytrOpen && order.status === 'PendingPayment' ? (
          <PaytrSimulationPanel
            order={order}
            onPaid={(nextStatus) => {
              setOrder(prev => prev ? { ...prev, status: nextStatus } : prev);
              setPaytrOpen(false);
            }}
            onSkip={() => setPaytrOpen(false)}
          />
        ) : (
          <section className="mx-auto max-w-2xl rounded-xl border border-secondary/20 bg-surface-container-low p-5 sm:p-8">
            <h1 className="text-2xl font-bold text-primary">
              {order.status === 'Paid' ? 'Ödemeniz alındı ve siparişiniz onaylandı' : 'Siparişiniz oluşturuldu'}
            </h1>
            <p className="mt-3">Sipariş numaranız: <strong>{order.number}</strong></p>
            <p className="mt-2">
              Durum:{' '}
              <strong>{order.status === 'Paid' ? 'Ödeme doğrulandı (PayTR Test)' : 'Ödeme bekleniyor'}</strong>
              {order.status === 'Paid' ? '.' : '. Henüz ödeme alınmadı.'}
            </p>
            <p className="mt-2">Kargo: {money(order.shippingFee)} · Toplam: <strong>{money(order.total)}</strong></p>
            {order.status === 'PendingPayment' && (
              <>
                <p className="mt-3 text-sm">Ürünleriniz {new Date(order.reservationExpiresAtUtc).toLocaleString('tr-TR')} tarihine kadar ayrılmıştır.</p>
                <button
                  type="button"
                  onClick={() => setPaytrOpen(true)}
                  className="mt-4 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
                >
                  PayTR ile Şimdi Öde (Simülasyon)
                </button>
              </>
            )}
            {!profile && <div className="mt-3 text-sm"><Link className="underline" to={`/siparis-takip?number=${order.number}`}>Siparişimi takip et</Link><details className="mt-3"><summary>Başka cihazdan takip için özel anahtar</summary><p>Bu anahtarı güvenli bir yerde saklayın ve kimseyle paylaşmayın.</p><input className="mt-2 w-full rounded border p-2" aria-label="Özel takip anahtarınız" readOnly value={authStorage.getGuestToken() ?? ''} onFocus={e => e.target.select()} /></details></div>}
            {profile && <Link className="mt-3 block underline" to={`/hesabim/siparisler/${order.id}`}>Sipariş detayını görüntüle</Link>}
            <Link to="/products" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-bold text-white">Alışverişe devam et</Link>
          </section>
        )
      ) : <>
        <nav className="mb-4 text-sm"><Link to="/sepetim">Sepetim</Link> / Ödeme ve Teslimat</nav>
        <h1 className="mb-6 text-3xl font-bold text-primary">Ödeme ve Teslimat</h1>
        {error && <p role="alert" className="mb-5 rounded-lg border border-secondary/30 p-4">{error}</p>}
        {loading ? <p>Sepetiniz yükleniyor...</p> : !cart?.items.length ? <p>Sepetiniz boş. <Link className="underline" to="/products">Ürünleri inceleyin.</Link></p> :
        !profile && !guestCheckout ? <section className="rounded-xl border border-secondary/20 bg-surface-container-low p-6">
          <h2 className="text-xl font-bold text-primary">Siparişinize nasıl devam etmek istersiniz?</h2>
          <p className="mt-2">Üye olmadan iletişim ve teslimat bilgilerinizi girerek sipariş verebilirsiniz.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setGuestCheckout(true)} className="rounded-lg bg-primary px-5 py-3 font-bold text-white">Misafir kullanıcı olarak devam et</button>
            <Link to="/giris?returnUrl=%2Fodeme" className="rounded-lg border border-secondary/30 px-5 py-3 font-bold text-primary">Giriş yap</Link>
            <Link to="/uye-ol?returnUrl=%2Fodeme" className="rounded-lg border border-secondary/30 px-5 py-3 font-bold text-primary">Üye ol</Link>
          </div>
        </section> : <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-4 rounded-xl border border-secondary/20 bg-surface-container-low p-4 sm:p-6 lg:col-span-2 min-w-0">
            <h2 className="text-xl font-bold text-primary">İletişim ve teslimat bilgileri</h2>
            {!profile && <p role="status" className="text-sm">Misafir kullanıcı olarak devam ediyorsunuz.</p>}
            <label className="block font-semibold">E-posta<input className={`${inputClass} mt-1`} required type="email" maxLength={256} value={form.email} onChange={e => field('email', e.target.value)} /></label>
            <label className="block font-semibold">Telefon<input className={`${inputClass} mt-1`} required type="tel" maxLength={30} value={form.phone} onChange={e => field('phone', e.target.value)} /></label>
            {addressError && <p role="alert">{addressError} <button type="button" className="underline" onClick={() => setAddressRetry(n => n + 1)}>Tekrar dene</button></p>}
            {!!addresses.length && (
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="checkout-delivery-address" className="font-semibold">Kayıtlı teslimat adresi</label>
                  <button type="button" onClick={() => selectAddress('', false)} className="text-sm font-bold text-primary underline">
                    + Yeni adres ekle
                  </button>
                </div>
                <select id="checkout-delivery-address" className={inputClass} value={selectedDelivery} onChange={e => selectAddress(e.target.value, false)}>
                  {addresses.map(address => <option value={address.id} key={address.id}>{address.title} — {address.district} / {address.city}{address.isDefault ? ' (Varsayılan)' : ''}</option>)}
                  <option value="">Yeni adres gir</option>
                </select>
              </div>
            )}
            <CheckoutAddressFields title="Teslimat adresi" section="shipping" value={deliveryAddress} onChange={value => { setSelectedDelivery(''); setDeliveryAddress(value); }} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={separateBilling} onChange={e => setSeparateBilling(e.target.checked)} /> Fatura adresim farklı</label>
            {separateBilling && <>
              {!!addresses.length && (
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor="checkout-billing-address" className="font-semibold">Kayıtlı fatura adresi</label>
                    <button type="button" onClick={() => selectAddress('', true)} className="text-sm font-bold text-primary underline">
                      + Yeni adres ekle
                    </button>
                  </div>
                  <select id="checkout-billing-address" className={inputClass} value={selectedBilling} onChange={e => selectAddress(e.target.value, true)}>
                    {addresses.map(address => <option value={address.id} key={address.id}>{address.title} — {address.district} / {address.city}{address.isDefault ? ' (Varsayılan)' : ''}</option>)}
                    <option value="">Yeni adres gir</option>
                  </select>
                </div>
              )}
              <CheckoutAddressFields title="Fatura adresi" section="billing" value={billingAddress} onChange={value => { setSelectedBilling(''); setBillingAddress(value); }} />
            </>}
          </section>
          <aside className="h-fit rounded-xl border border-primary/20 bg-surface-container-low p-4 sm:p-6 min-w-0">
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
            <p className="mt-3 text-sm">Sipariş oluşturulduktan sonra <strong>PayTR Test / Simülasyon</strong> ödeme ekranına yönlendirileceksiniz.</p>
            {cart.couponError && <p role="alert" className="mt-3 text-sm">{cart.couponError}</p>}
            <button disabled={busy || !quote || Boolean(cart.couponError)} className="mt-5 w-full rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Sipariş oluşturuluyor...' : 'Siparişi oluştur ve ödemeye geç'}</button>
          </aside>
        </form>}
      </>}
    </main><AuthFooter />
  </div>;
}
