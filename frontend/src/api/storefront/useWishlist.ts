import { useEffect, useState } from 'react';
import { accountApi } from '../accountApi';
import { authStorage } from '../authApi';

const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const guestKey = 'naturalfood.guestWishlist';
function guestItems(): string[] {
  try { const items: unknown = JSON.parse(localStorage.getItem(guestKey) || '[]'); return Array.isArray(items) ? items.filter((id): id is string => typeof id === 'string' && validId(id)) : []; }
  catch { return []; }
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => authStorage.getAccessToken() ? [] : guestItems());
  useEffect(() => {
    let active = true;
    let generation = 0;
    const load = () => {
      const current = ++generation;
      if (authStorage.getAccessToken()) accountApi.wishlist().then(items => { if (active && current === generation) setIds(items.map(item => item.productId)); }).catch(() => { if (active && current === generation) setIds([]); });
      else setIds(guestItems());
    };
    load(); window.addEventListener('naturalfood:auth-changed', load); window.addEventListener('naturalfood:wishlist-changed', load);
    return () => { active = false; window.removeEventListener('naturalfood:auth-changed', load); window.removeEventListener('naturalfood:wishlist-changed', load); };
  }, []);

  const toggle = async (id: string) => {
    if (!validId(id)) throw new Error('Bu ürün henüz favorilere eklenemiyor.');
    const exists = ids.includes(id);
    if (authStorage.getAccessToken()) {
      if (exists) await accountApi.removeFavorite(id); else await accountApi.addFavorite(id);
    } else {
      const next = exists ? ids.filter(value => value !== id) : [...ids, id];
      localStorage.setItem(guestKey, JSON.stringify(next));
      setIds(next);
    }
    window.dispatchEvent(new Event('naturalfood:wishlist-changed'));
    return !exists;
  };
  return { ids, toggle };
}
