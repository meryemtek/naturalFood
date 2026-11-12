import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi, authStorage, isAdminRole } from '../../api/authApi';
import { money, type Cart } from '../../api/storefront/storefrontApi';
import { cartApi } from '../../api/storefront/cartApi';
import { accountApi } from '../../api/accountApi';
import './StorefrontHeader.css';

interface StorefrontHeaderProps {
  wishlistCount?: number;
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

const categories = [
  ['Köy Kahvaltılıkları', 'kahvaltiliklar'],
  ['Salça & Soslar', 'salca-ve-soslar'],
  ['Zeytinyağları', 'zeytinyaglari'],
  ['Bal & Reçel', 'bal-ve-receller'],
  ['Kuru Gıdalar & Bakliyat', 'kuru-gidalar'],
  ['Kuruyemiş & Kuru Meyve', 'kuruyemisler'],
];

function getWishlistCount() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('naturalfood.guestWishlist') || '[]');
    return Array.isArray(value) ? value.length : 0;
  } catch { return 0; }
}

export function StorefrontHeader({ wishlistCount, onSearch, onCategorySelect }: StorefrontHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState(() => authStorage.getCustomer());
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryWrapRef = useRef<HTMLDivElement>(null);
  const [fallbackCart, setFallbackCart] = useState({ count: 0, total: 0 });
  const cartVersion = useRef(0);
  const [serverFavorites, setServerFavorites] = useState(0);
  const [guestFavorites, setGuestFavorites] = useState(getWishlistCount);
  const selectedCategory = new URLSearchParams(location.search).get('category');

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (categoryWrapRef.current && !categoryWrapRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const update = () => { cartVersion.current++; setCustomer(authStorage.getCustomer()); setFallbackCart({ count: 0, total: 0 }); setServerFavorites(0); };
    const updateCart = (event: Event) => { const cart = (event as CustomEvent<Cart>).detail; if (cart) { cartVersion.current++; setFallbackCart({ count: cart.items.reduce((sum, item) => sum + item.quantity, 0), total: cart.total }); } };
    const updateFavorites = () => { const token = authStorage.getAccessToken(); if (token) accountApi.wishlist().then(items => { if (authStorage.getAccessToken() === token) setServerFavorites(items.length); }).catch(() => {}); else setGuestFavorites(getWishlistCount()); };
    window.addEventListener('storage', update);
    window.addEventListener('naturalfood:auth-changed', update);
    window.addEventListener('naturalfood:cart-changed', updateCart);
    window.addEventListener('naturalfood:wishlist-changed', updateFavorites);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('naturalfood:auth-changed', update); window.removeEventListener('naturalfood:cart-changed', updateCart); window.removeEventListener('naturalfood:wishlist-changed', updateFavorites); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const currentVersion = cartVersion.current;
    cartApi.get(controller.signal)
      .then(cart => { if (currentVersion === cartVersion.current) setFallbackCart(cart ? { count: cart.items.reduce((sum, item) => sum + item.quantity, 0), total: cart.total } : { count: 0, total: 0 }); })
      .catch(() => {});
    if (authStorage.getAccessToken()) accountApi.wishlist().then(items => { if (!controller.signal.aborted) setServerFavorites(items.length); }).catch(() => {});
    return () => controller.abort();
  }, [customer]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (onSearch) onSearch(value);
    else navigate(value ? `/products?search=${encodeURIComponent(value)}` : '/products');
  };

  const handleSelectCategory = (slug: string) => {
    setCategoryMenuOpen(false);
    onCategorySelect?.(slug);
    navigate(slug ? `/products?category=${slug}` : '/products');
  };

  const logout = async () => {
    await authApi.logout();
    setCustomer(null);
    setMenuOpen(false);
    if (location.pathname.startsWith('/hesabim') || ['/giris', '/uye-ol'].includes(location.pathname)) navigate('/');
  };

  const count = fallbackCart.count;
  const total = fallbackCart.total;
  const favorites = authStorage.getAccessToken() ? serverFavorites : (wishlistCount ?? guestFavorites);
  const selectedCategoryLabel = categories.find(([, slug]) => slug === selectedCategory)?.[0] || 'Kategoriler';

  return <header className="store-header-shared">
    <div className="store-header-inner">
      <div className="store-header-row">
        <Link to="/" className="store-header-brand">
          <span className="store-header-logo material-symbols-outlined">potted_plant</span>
          <span><strong>Köyden Sofraya</strong><small>DOĞAL &amp; YÖRESEL GIDA</small></span>
        </Link>
        <form className="store-header-search" onSubmit={submit}>
          <div className="store-header-category-wrap" ref={categoryWrapRef}>
            <button
              type="button"
              aria-expanded={categoryMenuOpen}
              onClick={() => setCategoryMenuOpen(prev => !prev)}
              className="store-header-category"
            >
              <span>{selectedCategoryLabel}</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
            {categoryMenuOpen && (
              <div className="store-header-category-menu">
                <button type="button" onClick={() => handleSelectCategory('')} className={!selectedCategory ? 'is-active' : ''}>
                  Tüm Ürünler
                </button>
                {categories.map(([label, slug]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => handleSelectCategory(slug)}
                    className={selectedCategory === slug ? 'is-active' : ''}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="material-symbols-outlined store-header-search-icon">search</span>
          <input aria-label="Ürün ara" placeholder="Doğal tereyağı, erken hasat zeytinyağı, petek bal ara..." value={query} onChange={event => setQuery(event.target.value)} />
          <button type="submit">Ara</button>
        </form>
        <div className="store-header-actions">
          <Link to="/hesabim/favoriler" aria-label={`Favorilerim (${favorites})`} className="store-header-favorites"><span className="material-symbols-outlined">favorite</span>{favorites > 0 && <span className="store-header-badge">{favorites}</span>}</Link>
          {customer ? <div className="store-header-account-wrap">
            <button type="button" className="store-header-account" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span className="material-symbols-outlined">account_circle</span><span className="store-header-account-name">{customer.firstName}</span><span className="material-symbols-outlined store-header-chevron">expand_more</span></button>
            {menuOpen && <div className="store-header-menu">
              {isAdminRole(customer.role) && <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Yönetim Paneli</Link>}
              <Link to="/hesabim" onClick={() => setMenuOpen(false)}>Hesabım</Link>
              <button type="button" onClick={logout}>Çıkış Yap</button>
            </div>}
          </div> : <Link to="/giris" className="store-header-account"><span className="material-symbols-outlined">account_circle</span><span className="store-header-account-name">Giriş Yap</span></Link>}
          <Link to="/cart" className="store-header-cart"><span className="store-header-cart-icon"><span className="material-symbols-outlined">shopping_bag</span>{count > 0 && <span className="store-header-badge">{count}</span>}</span><span className="store-header-cart-text"><strong>Sepetim</strong><b>{money(total)}</b></span></Link>
        </div>
      </div>
      <nav className="store-header-nav" aria-label="Ana gezinme">
        <Link className={location.pathname === '/' ? 'is-active' : ''} to="/">Ana Sayfa</Link>
        <Link className={(location.pathname === '/products' || location.pathname === '/urunler') && !selectedCategory ? 'is-active' : ''} to="/products" onClick={() => onCategorySelect?.('')}>Tüm Ürünler</Link>
        {categories.map(([label, slug]) => <Link key={slug} className={selectedCategory === slug ? 'is-active' : ''} to={`/products?category=${slug}`} onClick={() => onCategorySelect?.(slug)}>{label}</Link>)}
        <Link className={location.pathname === '/hikayemiz' || location.pathname === '/hikaye' ? 'is-active' : ''} to="/hikayemiz">Hikâyemiz</Link>
      </nav>
    </div>
  </header>;
}
