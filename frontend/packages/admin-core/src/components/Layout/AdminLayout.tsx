import React, { useState } from 'react';
import type { AdminLayoutProps } from '../../types';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title = 'Yönetim Paneli',
  logo,
  currentUser,
  navItems,
  activeNavKey,
  onNavSelect,
  onLogout,
  children,
  headerActions,
  userMenuSlot,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentNav = navItems.find((n) => n.key === activeNavKey);
  const currentTitle = currentNav?.label || title;

  return (
    <div style={styles.layoutContainer}>
      {/* Sol Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: isSidebarOpen ? '260px' : '72px',
          transition: 'width 0.25s ease',
        }}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.logoContainer}>
            {logo || <div style={styles.defaultLogo}>A</div>}
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

        {/* Gezinme Öğeleri */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = activeNavKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavSelect && onNavSelect(item.key)}
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
            <div style={styles.footerVersion}>v1.0.0 (Modüler Monolit)</div>
          )}
        </div>
      </aside>

      {/* Sağ Ana Bölüm */}
      <div style={styles.mainWrapper}>
        {/* Üst Bar (Header) */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>{currentTitle}</h1>
          </div>

          <div style={styles.headerRight}>
            {headerActions && <div>{headerActions}</div>}

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

        {/* İçerik Alanı (Slot / Children) */}
        <main style={styles.content}>{children}</main>
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
