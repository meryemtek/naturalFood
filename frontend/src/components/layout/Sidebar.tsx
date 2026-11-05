import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
}

const NAV_ITEMS: { section: string; items: NavItem[] }[] = [
  {
    section: 'GENEL BAKIŞ',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    section: 'E-TİCARET & KATALOG',
    items: [
      { path: '/inventory', label: 'Ürün & Stok', icon: '📦' },
    ],
  },
  {
    section: 'YÖNETİM & GÜVENLİK',
    items: [
      { path: '/admin/users', label: 'Yöneticiler', icon: '👥' },
      { path: '/admin/audit-logs', label: 'Denetim Kayıtları', icon: '🛡️' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Brand Logo */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff',
            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
          }}
        >
          E
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px', color: '#f8fafc' }}>
            E-Ticaret Panel
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Yönetici Portalı</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ padding: '20px 14px', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((group) => (
          <div key={group.section} style={{ marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                padding: '0 12px 8px 12px',
                letterSpacing: '0.05em',
              }}
            >
              {group.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    transition: 'all 0.15s ease',
                    borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  })}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0b1120',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          SA
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Super Admin
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>superadmin@ecommerce.local</div>
        </div>
      </div>
    </aside>
  );
};

