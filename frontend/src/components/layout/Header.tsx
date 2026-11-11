import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { authApi, authStorage } from '../../api/authApi';
import { theme } from '../../theme/tokens';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState(() => authStorage.getCustomer());

  useEffect(() => {
    adminApi
      .checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  useEffect(() => {
    const syncAuth = () => setCustomer(authStorage.getCustomer());
    window.addEventListener('storage', syncAuth);
    window.addEventListener('naturalfood:auth-changed', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('naturalfood:auth-changed', syncAuth);
    };
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/giris', { replace: true });
  };

  const fullName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Sistem Yöneticisi';
  const initials = customer
    ? `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';
  const roleLabel = customer?.role || 'Admin';

  return (
    <header
      className="admin-header"
      style={{
        height: '64px',
        backgroundColor: theme.colors.bgSurface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        transition: 'padding 0.2s ease, height 0.2s ease',
      }}
    >
      {/* Left: Mobile Hamburger & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {/* Hamburger Toggle Button (Mobile Only) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
          className="mobile-only-flex"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.bgSurface,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.espresso,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {isSidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Brand/Portal Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2
            className="desktop-only admin-header-title"
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: theme.colors.espresso,
              letterSpacing: '-0.2px',
              margin: 0,
            }}
          >
            Natural Food Operasyon & Yönetim Portalı
          </h2>
          <h2
            className="mobile-only admin-header-title"
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: theme.colors.espresso,
              letterSpacing: '-0.2px',
              margin: 0,
            }}
          >
            Natural Food
          </h2>
        </div>
      </div>

      {/* Right: API Health, Storefront Link, User Info & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Mağazaya Dön Linki */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: theme.radii.md,
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.espresso,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <span>🏪</span>
          <span className="desktop-only">Mağaza Vitrini</span>
        </Link>

        {/* API Health Pill */}
        <div
          className="admin-header-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: theme.radii.full,
            fontSize: '11.5px',
            fontWeight: 500,
            backgroundColor:
              isBackendHealthy === true
                ? theme.colors.statusSuccessBg
                : isBackendHealthy === false
                ? theme.colors.statusDangerBg
                : theme.colors.bgCanvas,
            color:
              isBackendHealthy === true
                ? theme.colors.statusSuccess
                : isBackendHealthy === false
                ? theme.colors.statusDanger
                : theme.colors.taupe,
            border: `1px solid ${
              isBackendHealthy === true
                ? '#D5E5D4'
                : isBackendHealthy === false
                ? '#F5D3CE'
                : theme.colors.border
            }`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor:
                isBackendHealthy === true
                  ? theme.colors.statusSuccess
                  : isBackendHealthy === false
                  ? theme.colors.statusDanger
                  : theme.colors.stoneMuted,
            }}
          />
          <span className="desktop-only">
            {isBackendHealthy === true
              ? 'API: Çevrimiçi'
              : isBackendHealthy === false
              ? 'API: Bağlantı Yok'
              : 'API: Kontrol...'}
          </span>
          <span className="mobile-only">
            {isBackendHealthy === true ? 'Çevrimiçi' : isBackendHealthy === false ? 'Çevrimdışı' : '...'}
          </span>
        </div>

        {/* User Pill */}
        <div
          className="admin-header-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primarySubtle,
              color: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '10px',
            }}
          >
            {initials}
          </div>
          <span
            className="desktop-only"
            style={{ fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso }}
          >
            {fullName}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: theme.radii.xs,
              backgroundColor: theme.colors.primarySubtle,
              color: theme.colors.primary,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* Çıkış Yap Butonu */}
        <button
          type="button"
          onClick={handleLogout}
          title="Yönetim Panelinden Çıkış Yap"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: theme.radii.md,
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: theme.colors.statusDangerBg,
            color: theme.colors.statusDanger,
            border: '1px solid #F5D3CE',
          }}
        >
          <span className="desktop-only">Çıkış Yap</span>
          <span className="mobile-only">✕</span>
        </button>
      </div>
    </header>
  );
};
