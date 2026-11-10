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
    {items?.map(item => <section className="account-card account-row" key={item.id}><div>{item.productImageUrl && <img className="account-product-image" src={item.productImageUrl} alt="" />}<Link className="account-link" to={`/products/${item.productSlug}`}>{item.productName}</Link><p>{money(item.discountPrice ?? item.basePrice)}</p></div><button className="account-outline" disabled={busy === item.productId} onClick={() => remove(item.productId)}>Favoriden çıkar</button></section>)}
  </>;
}
