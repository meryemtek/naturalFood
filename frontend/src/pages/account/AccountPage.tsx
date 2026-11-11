import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi, authStorage, type CustomerProfile } from '../../api/authApi';
import { accountApi } from '../../api/accountApi';
import { AuthFooter } from '../../components/auth/AuthFooter';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { AccountAddresses } from './AccountAddresses';
import { AccountFavorites } from './AccountFavorites';
import { AccountOrders } from './AccountOrders';
import { AccountProfile } from './AccountProfile';
import { AccountReviews } from './AccountReviews';
import './account.css';

const links = [
  ['/hesabim/siparisler', 'inventory_2', 'Siparişlerim'],
  ['/hesabim/favoriler', 'favorite', 'Favorilerim & İstek Listesi'],
  ['/hesabim/kuponlar', 'loyalty', 'Hasat Kulübü & Kuponlarım'],
  ['/hesabim/adresler', 'location_on', 'Kayıtlı Adreslerim & İletişim'],
  ['/hesabim', 'shield_person', 'Hesap Bilgilerim & Güvenlik'],
  ['/hesabim/yorumlar', 'rate_review', 'Yorum ve Değerlendirmelerim'],
];

export function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState('');
  const token = authStorage.getAccessToken();
  useEffect(() => {
    if (!token) return;
    let active = true;
    accountApi.profile().then(data => { if (active) setProfile(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Hesap bilgileri alınamadı.'); });
    return () => { active = false; };
  }, [token]);
  if (!token) return <Navigate to={`/giris?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  const logout = async () => { await authApi.logout(); navigate('/giris', { replace: true }); };
  const parts = location.pathname.split('/').filter(Boolean);
  const section = parts[1] || '';
  return <div className="account-page"><StorefrontHeader /><main className="account-container">
    <div className="account-breadcrumb"><Link to="/">Ana Sayfa</Link><span>›</span><Link to="/hesabim">Hesabım</Link><span>›</span><strong>{links.find(link => link[0] === (section ? `/hesabim/${section}` : '/hesabim'))?.[2] || 'Hesabım'}</strong></div>
    <div className="account-layout"><aside className="account-sidebar"><div className="account-sidebar-profile"><span className="account-avatar material-symbols-outlined">person</span><div><strong>{profile ? `${profile.firstName} ${profile.lastName}` : 'Hesabım'}</strong><p>{profile?.email}</p></div></div><nav aria-label="Hesap menüsü">{links.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/hesabim'} className={({ isActive }) => `account-nav-item${isActive ? ' is-active' : ''}`}><span className="material-symbols-outlined">{icon}</span><span>{label}</span><span className="account-nav-arrow">›</span></NavLink>)}<button type="button" onClick={logout} className="account-nav-item account-logout"><span className="material-symbols-outlined">logout</span>Çıkış Yap</button></nav></aside>
      <div className="account-content">{error ? <div className="account-card"><p className="account-error" role="alert">{error}</p><p>Oturumunuz sona ermiş olabilir. Yeniden giriş yapmayı deneyin.</p><button className="account-primary" onClick={logout}>Giriş ekranına dön</button></div> : !profile ? <p className="account-muted">Hesap bilgileriniz yükleniyor...</p> : section === '' ? <AccountProfile profile={profile} onUpdate={setProfile} /> : section === 'siparisler' ? <AccountOrders orderId={parts[2]} /> : section === 'adresler' ? <AccountAddresses /> : section === 'favoriler' ? <AccountFavorites /> : section === 'kuponlar' ? <><div className="account-heading"><div><h1>Hasat Kulübü &amp; Kuponlarım</h1></div></div><div className="account-card"><p>Hesaba özel puan ve kupon listesi henüz kullanıma sunulmadı.</p></div></> : section === 'yorumlar' ? <AccountReviews /> : <div className="account-card"><p>Bu hesap sayfası bulunamadı.</p><Link className="account-link" to="/hesabim">Hesabıma dön</Link></div>}</div>
    </div>
  </main><AuthFooter /></div>;
}
