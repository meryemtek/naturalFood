import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { cartApi } from '../../api/storefront/cartApi';
import { money, type Cart } from '../../api/storefront/storefrontApi';
import './cart-layout.css';

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [notice, setNotice] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let requestNumber = 0;
    const load = () => {
      const current = ++requestNumber;
      setCart(null); setLoading(true); setNotice(''); setLoadError(false);
      cartApi.get(controller.signal).then(value => { if (current === requestNumber) setCart(value); }).catch(error => {
        if (!controller.signal.aborted && current === requestNumber) { setLoadError(true); setNotice(error instanceof Error ? error.message : 'Sepet yüklenemedi.'); }
      }).finally(() => { if (!controller.signal.aborted && current === requestNumber) setLoading(false); });
    };
    const cartChanged = (event: Event) => { const value = (event as CustomEvent<Cart>).detail; if (value) { requestNumber++; setCart(value); setLoading(false); } };
    load();
    window.addEventListener('naturalfood:auth-changed', load);
    window.addEventListener('naturalfood:cart-changed', cartChanged);
    return () => { controller.abort(); window.removeEventListener('naturalfood:auth-changed', load); window.removeEventListener('naturalfood:cart-changed', cartChanged); };
  }, []);

  const apply = async (action: () => Promise<Cart>, success?: string) => {
    if (busy) return;
    setBusy(true); setNotice('');
    try { const updated = await action(); setCart(updated); if (success) setNotice(success); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Sepet işlemi tamamlanamadı.'); }
    finally { setBusy(false); }
  };
  const items = cart?.items ?? [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const updateQuantity = (item: Cart['items'][number], quantity: number) => {
    if (quantity < 1) void apply(() => cartApi.remove(item.id), 'Ürün sepetten çıkarıldı.');
    else void apply(() => cartApi.set(item.productId, item.variantId, quantity));
  };
  const removeCoupon = () => void apply(() => cartApi.removeCoupon(), 'Kupon kaldırıldı.');
  const addCoupon = () => { const code = coupon.trim(); if (code) void apply(async () => { const result = await cartApi.coupon(code); setCoupon(''); return result; }, 'Kupon uygulandı.'); };

  return <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans">
    <StorefrontHeader />
    <main className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex-1">
      <nav className="text-sm text-on-surface-variant mb-4"><Link to="/">Ana Sayfa</Link> / <strong className="text-primary">Sepetim</strong></nav>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mb-6">Alışveriş Sepetim <span className="text-lg font-medium text-secondary">({itemCount} Ürün)</span></h1>
      {notice && <div role="status" className="mb-5 rounded-lg border border-secondary/30 bg-surface-container-low p-4 text-sm text-primary">{notice}</div>}
      {cart?.couponError && <div role="alert" className="mb-5 rounded-lg border border-error/20 bg-error-container p-4 text-sm text-on-error-container">{cart.couponError}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <section className="lg:col-span-8 rounded-xl border border-secondary/20 bg-surface-container-low overflow-hidden">
          {loading ? <p className="p-8 text-center">Sepetiniz yükleniyor...</p> : loadError ? <p className="p-8 text-center">Sepet bilgileri şu anda görüntülenemiyor.</p> : items.length === 0 ? <div className="p-10 text-center"><span className="material-symbols-outlined text-5xl text-secondary">remove_shopping_cart</span><h2 className="text-xl font-bold text-primary mt-3">Sepetiniz Boş</h2><p className="text-sm text-on-surface-variant mt-2">Ürünlerimizi inceleyip sepetinize ekleyebilirsiniz.</p><Link className="inline-block mt-5 rounded-lg bg-primary px-5 py-3 font-bold text-white" to="/products">Alışverişe Başla</Link></div> : <>
            {items.map(item => <div key={item.id} className="p-4 sm:p-6 border-b border-surface-container-highest flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 overflow-hidden">{item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl text-secondary">shopping_bag</span>}</div>
              <div className="flex-1 min-w-[150px]"><h2 className="text-base font-bold text-primary">{item.productSlug ? <Link to={`/products/${item.productSlug}`}>{item.name}</Link> : item.name}</h2>{(item.variantName || item.unitInfo) && <p className="text-sm text-secondary">{[item.variantName, item.unitInfo].filter(Boolean).join(' · ')}</p>}<p className="text-sm text-on-surface-variant">Birim fiyat: {money(item.unitPrice)}</p></div>
              <div className="flex items-center rounded-lg border border-secondary/30 bg-surface-container"><button type="button" disabled={busy} aria-label={`${item.name} miktarını azalt`} className="px-3 py-2" onClick={() => updateQuantity(item, item.quantity - 1)}>−</button><span className="min-w-8 text-center font-bold">{item.quantity}</span><button type="button" disabled={busy} aria-label={`${item.name} miktarını artır`} className="px-3 py-2" onClick={() => updateQuantity(item, item.quantity + 1)}>+</button></div>
              <strong className="whitespace-nowrap text-primary">{money(item.lineTotal)}</strong><button type="button" disabled={busy} aria-label={`${item.name} ürününü sepetten çıkar`} className="text-secondary" onClick={() => void apply(() => cartApi.remove(item.id), 'Ürün sepetten çıkarıldı.')}><span className="material-symbols-outlined">delete</span></button>
            </div>)}
            <div className="flex justify-between gap-3 p-5 text-sm"><Link className="font-bold text-primary" to="/products">← Alışverişe Devam Et</Link><button type="button" disabled={busy} onClick={() => { if (window.confirm('Sepetinizdeki tüm ürünleri çıkarmak istiyor musunuz?')) void apply(() => cartApi.clear(), 'Sepetiniz temizlendi.'); }}>Sepeti Temizle</button></div>
          </>}
        </section>
        <aside className="lg:col-span-4 rounded-xl border border-primary/20 bg-surface-container-low p-6">
          <h2 className="text-xl font-extrabold text-primary border-b border-surface-container-highest pb-3">Sipariş Özeti</h2>
          <div className="space-y-3 py-4 text-sm border-b border-surface-container-highest"><div className="flex justify-between"><span>Ürünler Toplamı</span><strong>{money(cart?.subtotal ?? 0)}</strong></div>{(cart?.discount ?? 0) > 0 && <div className="flex justify-between"><span>Kupon İndirimi</span><strong>−{money(cart?.discount ?? 0)}</strong></div>}<div className="flex justify-between gap-3"><span>Kargo</span><span>Ödeme aşamasında hesaplanır</span></div></div>
          <div className="py-4 border-b border-surface-container-highest"><label htmlFor="cart-coupon" className="block text-sm font-bold text-primary mb-2">İndirim Kuponu</label>{cart?.couponCode ? <div className="flex justify-between items-center gap-2 text-sm"><strong>{cart.couponCode}</strong><button type="button" disabled={busy} onClick={removeCoupon} className="underline">Kaldır</button></div> : <div className="flex gap-2"><input id="cart-coupon" value={coupon} onChange={e => setCoupon(e.target.value)} className="w-full min-w-0 rounded-lg border border-secondary/30 bg-white px-3 py-2 text-sm" placeholder="Kupon Kodunuz" /><button type="button" disabled={busy || !coupon.trim()} onClick={addCoupon} className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold">Uygula</button></div>}</div>
          <div className="flex justify-between items-center py-4"><strong className="text-primary">Ara Toplam</strong><strong className="text-xl text-primary">{money(cart?.total ?? 0)}</strong></div>
          <p className="text-xs text-on-surface-variant">Kargo ücreti ve nihai tutar sipariş oluşturulurken belirlenir.</p>
          {items.length && !busy ? <Link to="/odeme" className="mt-4 block w-full rounded-lg bg-primary-container px-5 py-3 text-center font-bold text-white">Ödeme ve Teslimat</Link> : <button type="button" disabled className="mt-4 w-full rounded-lg bg-primary-container px-5 py-3 font-bold text-white opacity-50">Ödeme ve Teslimat</button>}
        </aside>
      </div>
    </main><AuthFooter />
  </div>;
}
