import React, { useState, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import type { AdminShellProps, AdminFeatureModule, NavigationItem, ModuleRoute } from '../../types';

export const AdminShell: React.FC<AdminShellProps> = ({
  title = 'Admin Shell',
  logo,
  modules,
  currentUser,
  userMenuSlot,
  defaultPath,
  onLogout,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Modülleri sırala
  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modules]);

  // Tüm rotaları topla
  const allRoutes = useMemo(() => {
    const list: ModuleRoute[] = [];
    sortedModules.forEach((m) => {
      m.routes.forEach((r) => {
        list.push(r);
      });
    });
    return list;
  }, [sortedModules]);

  // Tüm navigasyon elemanlarını topla
  const allNavItems = useMemo(() => {
    const list: NavigationItem[] = [];
    sortedModules.forEach((m) => {
      m.navItems.forEach((item) => {
        list.push(item);
      });
    });
    return list;
  }, [sortedModules]);

  // Varsayılan yönlendirme hedefi: defaultPath veya ilk navigasyon rotası
  const fallbackPath = defaultPath || allNavItems[0]?.path || allRoutes[0]?.path || '/';

  // Aktif sayfa başlığını belirle
  const activeNavItem = allNavItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  const activeTitle = activeNavItem?.label || title;

  return (
    <div style={styles.layoutContainer}>
      {/* Dinamik Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: isSidebarOpen ? '260px' : '72px',
          transition: 'width 0.25s ease',
        }}
      >
        {/* Logo & Başlık */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logoContainer}>
            {logo || <div style={styles.defaultLogo}>S</div>}
            {isSidebarOpen && <span style={styles.brandTitle}>{title}</span>}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={styles.toggleBtn}
            title={isSidebarOpen ? 'Kenar çubuğunu daralt' : 'Genişlet'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Modüller ve Menü Elemanları */}
        <nav style={styles.nav}>
          {sortedModules.map((mod: AdminFeatureModule) => {
            const hasItems = mod.navItems && mod.navItems.length > 0;
            if (!hasItems) return null;

            return (
              <div key={mod.id} style={styles.moduleSection}>
                {isSidebarOpen && (
                  <div style={styles.moduleTitle}>
                    {mod.title.toUpperCase()}
                  </div>
                )}
                <div style={styles.moduleItems}>
                  {mod.navItems.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + '/');

                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        style={{
                          ...styles.navItem,
                          backgroundColor: isActive ? '#2563eb' : 'transparent',
                          color: isActive ? '#ffffff' : '#94a3b8',
                          justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        }}
                        title={item.label}
                      >
                        {item.icon && <span style={styles.navIcon}>{item.icon}</span>}
                        {isSidebarOpen && (
                          <span style={styles.navLabel}>{item.label}</span>
                        )}
                        {isSidebarOpen && item.badge !== undefined && (
                          <span style={styles.badge}>{item.badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Altı: Çıkış & Sürüm */}
        <div style={styles.sidebarFooter}>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                ...styles.logoutBtn,
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              }}
              title="Çıkış Yap"
            >
              <span style={styles.navIcon}>⎋</span>
              {isSidebarOpen && <span>Çıkış Yap</span>}
            </button>
          )}
          {isSidebarOpen && (
            <div style={styles.footerVersion}>Pluggable Admin Shell v1.0</div>
          )}
        </div>
      </aside>

      {/* Sağ Ana Bölüm */}
      <div style={styles.mainWrapper}>
        {/* Üst Bar (Header) */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>{activeTitle}</h1>
          </div>

          <div style={styles.headerRight}>
            {userMenuSlot ? (
              userMenuSlot
            ) : currentUser ? (
              <div style={styles.userInfo}>
                <div style={styles.userText}>
                  <div style={styles.userName}>{currentUser.name}</div>
                  <div style={styles.userRole}>{currentUser.role}</div>
                </div>
                <div style={styles.avatar}>
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" style={styles.avatarImg} />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {/* Dinamik Rota İçerik Alanı */}
        <main style={styles.content}>
          <Routes>
            {/* Dinamik Olarak Modüllerden Gelen Rotalar */}
            {allRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path.replace(/^\//, '')}
                element={route.element}
              />
            ))}

            {/* Kök ve Eşleşmeyen Rotalar İçin Yönlendirme */}
            <Route path="/" element={<Navigate to={fallbackPath} replace />} />
            <Route path="*" element={<Navigate to={fallbackPath} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layoutContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#0f172a',
  },
  sidebar: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: '1px solid #1e293b',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  sidebarHeader: {
    padding: '20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1e293b',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    overflow: 'hidden',
  },
  defaultLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: '18px',
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px',
  },
  nav: {
    flex: 1,
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  moduleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  moduleTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.08em',
    padding: '4px 12px 6px 12px',
  },
  moduleItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'left',
    transition: 'background-color 0.15s, color 0.15s',
    width: '100%',
  },
  navIcon: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  footerVersion: {
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#0f172a',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userText: {
    textAlign: 'right',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
  },
  userRole: {
    fontSize: '12px',
    color: '#64748b',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  content: {
    flex: 1,
    padding: '28px',
  },
};
