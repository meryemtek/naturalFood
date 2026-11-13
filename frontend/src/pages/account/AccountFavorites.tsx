import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, type WishlistItem } from '../../api/accountApi';
import { money } from '../../api/storefront/storefrontApi';

export function AccountFavorites() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { let active = true; accountApi.wishlist().then(data => { if (active) setItems(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Favoriler yüklenemedi.'); }); return () => { active = false; }; }, []);
  const remove = async (productId: string) => { setBusy(productId); setError(''); try { await accountApi.removeFavorite(productId); setItems(current => current?.filter(item => item.productId !== productId) ?? []); window.dispatchEvent(new Event('naturalfood:wishlist-changed')); } catch (e) { setError(e instanceof Error ? e.message : 'Ürün çıkarılamadı.'); } finally { setBusy(null); } };
  return <><div className="account-heading"><div><h1>Favorilerim &amp; İstek Listesi</h1><p>Beğendiğiniz ürünler burada saklanır.</p></div></div>
    {error && <p className="account-error" role="alert">{error}</p>}{!items && !error && <p className="account-muted">Favoriler yükleniyor...</p>}
    {items?.length === 0 && <section className="account-card"><p>Henüz favori ürününüz yok.</p><Link className="account-link" to="/products">Ürünleri keşfedin</Link></section>}
    {items && items.length > 0 && (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map(item => (
          <article
            key={item.id}
            className="rounded-xl border border-secondary/20 bg-surface overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="relative h-40 sm:h-44 bg-surface-container-low overflow-hidden">
              <Link to={`/products/${item.productSlug}`} className="block w-full h-full">
                {item.productImageUrl ? (
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={item.productImageUrl}
                    alt={item.productName}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary/50">
                    <span className="material-symbols-outlined text-4xl">eco</span>
                  </div>
                )}
              </Link>
              <button
                type="button"
                disabled={busy === item.productId}
                onClick={() => remove(item.productId)}
                title="Favoriden çıkar"
                aria-label={`${item.productName} ürününü favorilerden çıkar`}
                className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/95 border border-secondary/15 shadow-sm flex items-center justify-center text-tertiary hover:scale-105 transition-transform disabled:opacity-50"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  favorite
                </span>
              </button>
            </div>
            <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2">
              <Link
                to={`/products/${item.productSlug}`}
                className="text-sm font-bold text-primary leading-snug line-clamp-2 hover:underline"
              >
                {item.productName}
              </Link>
              <div className="pt-2 border-t border-surface-container flex items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <strong className="text-sm sm:text-base font-extrabold text-primary">
                    {money(item.discountPrice ?? item.basePrice)}
                  </strong>
                  {item.discountPrice != null && item.discountPrice < item.basePrice && (
                    <del className="text-xs text-outline">{money(item.basePrice)}</del>
                  )}
                </div>
                <Link
                  to={`/products/${item.productSlug}`}
                  className="text-xs font-semibold text-secondary hover:text-primary whitespace-nowrap"
                >
                  İncele
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    )}
  </>;
}
