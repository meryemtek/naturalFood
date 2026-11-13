import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { theme } from '../../theme/tokens';
import { usePermissions } from '../../context/PermissionContext';

interface SubMenuItem {
  path: string;
  label: string;
  requiredPermission?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  requiredPermission?: string;
  subItems?: SubMenuItem[];
}

interface SectionGroup {
  sectionTitle: string;
  items: MenuItem[];
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, adminSession, activeRole, activeRoleDisplay, logout } = usePermissions();
  const displayFullName = adminSession?.user?.fullName || activeRoleDisplay;
  const displayEmail = adminSession?.user?.email || `${activeRole.toLowerCase()}@naturalfood.local`;
  const avatarInitials = displayFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AD';
  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  const SECTIONS: SectionGroup[] = [
    {
      sectionTitle: 'DASHBOARD',
      items: [
        {
          id: 'modern',
          label: 'Anasayfa',
          path: '/dashboard',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          ),
        },
      ],
    },
    {
      sectionTitle: 'ÜRÜN VE MENÜ YÖNETİMİ',
      items: [
        {
          id: 'product-menu-mgmt',
          label: 'Ürün ve Menü Yönetimi',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          ),
          subItems: [
            { path: '/products/definition', label: 'Gelişmiş Ürün Tanımlama', requiredPermission: 'products.view' },
            { path: '/products/allergens-nutrition', label: 'İçerik ve Alerjen Bilgileri', requiredPermission: 'products.view' },
            { path: '/products/lot-expiry', label: 'STT / TETT ve Parti (Lot) Takibi', requiredPermission: 'products.view' },
            { path: '/products/storage-conditions', label: 'Saklama Koşulları', requiredPermission: 'storage.view' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'SİPARİŞ VE SEVKİYAT YÖNETİMİ',
      items: [
        {
          id: 'order-ops',
          label: 'Sipariş İşlemleri',
          requiredPermission: 'orders.view',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          ),
          subItems: [
            { path: '/orders', label: 'Tüm Siparişler' },
            { path: '/orders/pending', label: 'Bekleyen Siparişler' },
            { path: '/orders/completed', label: 'Tamamlanan Siparişler' },
            { path: '/orders/returns', label: 'İptal ve İade Talepleri' },
          ],
        },
        {
          id: 'shipping-ops',
          label: 'Kargo & Sevkiyat',
          requiredPermission: 'orders.view',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          ),
          subItems: [
            { path: '/shipping/shipments', label: 'Sevkiyat ve Kargo Takibi' },
            { path: '/shipping/carriers', label: 'Kargo Entegrasyonları' },
            { path: '/shipping/zones', label: 'Teslimat Bölgeleri' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'STOK VE DEPO YÖNETİMİ',
      items: [
        {
          id: 'stock-ops',
          label: 'Stok ve Depo Yönetimi',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="5" rx="1" />
              <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
              <path d="M10 13h4" />
            </svg>
          ),
          subItems: [
            { path: '/inventory', label: 'Stok Durumu (Envanter)', requiredPermission: 'inventory.view' },
            { path: '/inventory/suppliers-procurement', label: 'Tedarikçi ve Alım Yönetimi', requiredPermission: 'inventory.view' },
            { path: '/inventory/warehouses', label: 'Depo Tanımları', requiredPermission: 'storage.view' },
            { path: '/inventory/transactions', label: 'Stok Hareketleri ve Fişler', requiredPermission: 'inventory.view' },
            { path: '/inventory/alerts', label: 'Kritik Stok Uyarıları', requiredPermission: 'inventory.view' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'MÜŞTERİ İLİŞKİLERİ VE DESTEK (CRM)',
      items: [
        {
          id: 'crm-ops',
          label: 'Müşteri Yönetimi',
          requiredPermission: 'crm.manage',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
          subItems: [
            { path: '/crm/customers', label: 'Müşteri Listesi' },
            { path: '/crm/segments', label: 'Müşteri Segmentleri' },
          ],
        },
        {
          id: 'support-ops',
          label: 'Destek ve Talepler',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          ),
          subItems: [
            { path: '/crm/tickets', label: 'Destek Biletleri (Tickets)', requiredPermission: 'crm.manage' },
            { path: '/crm/reviews', label: 'Müşteri Değerlendirmeleri', requiredPermission: 'crm.reviews' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'PAZARLAMA VE KAMPANYA YÖNETİMİ',
      items: [
        {
          id: 'campaign-ops',
          label: 'Kampanya & İndirim',
          requiredPermission: 'marketing.view',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
          ),
          subItems: [
            { path: '/marketing/coupons', label: 'İndirim Kuponları' },
            { path: '/marketing/campaigns', label: 'Promosyon ve Kampanyalar' },
            { path: '/marketing/flash-sales', label: 'Flaş İndirimler' },
          ],
        },
        {
          id: 'loyalty-ops',
          label: 'Sadakat & İletişim',
          requiredPermission: 'marketing.view',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          ),
          subItems: [
            { path: '/marketing/loyalty', label: 'Sadakat ve Puan Programı' },
            { path: '/marketing/newsletters', label: 'E-Bülten & SMS Gönderimi' },
          ],
        },
        {
          id: 'slider-ops',
          label: 'Slider & Vitrin Yönetimi',
          requiredPermission: 'marketing.view',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ),
          subItems: [
            { path: '/marketing/slider', label: 'Ana Sayfa Hero Slider' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'RAPORLAMA VE ANALİTİK',
      items: [
        {
          id: 'analytics-ops',
          label: 'Satış & Ciro Analitiği',
          requiredPermission: 'finance.reports',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
          subItems: [
            { path: '/analytics/sales', label: 'Satış Analitiği' },
            { path: '/analytics/revenue', label: 'Gelir ve Ciro Raporu' },
            { path: '/analytics/products', label: 'Ürün Performans Analizi' },
            { path: '/analytics/traffic', label: 'Ziyaretçi ve Sepet Analitiği' },
          ],
        },
      ],
    },
    {
      sectionTitle: 'ROL, GÜVENLİK VE SİSTEM AYARLARI',
      items: [
        {
          id: 'auth-security',
          label: 'Yetkilendirme & Güvenlik',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
          subItems: [
            { path: '/admin/users', label: 'Rol Bazlı Yetkilendirme', requiredPermission: 'users.manage' },
            { path: '/admin/roles', label: 'Modül Yetki Matrisi (RBAC)', requiredPermission: 'users.manage' },
            { path: '/admin/audit-logs', label: 'Denetim Kayıtları (Audit Logs)', requiredPermission: 'users.manage' },
            { path: '/settings/security', label: 'İki Aşamalı Doğrulama (2FA)', requiredPermission: 'users.manage' },
          ],
        },
        {
          id: 'integrations-settings',
          label: 'Entegrasyonlar & Ayarlar',
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          ),
          subItems: [
            { path: '/settings/payments', label: 'Ödeme ve Fatura Entegrasyonları', requiredPermission: 'finance.reports' },
            { path: '/settings/invoicing', label: 'E-Fatura & Mali Ayarlar', requiredPermission: 'finance.reports' },
            { path: '/settings/general', label: 'Genel Sistem ve API Ayarları', requiredPermission: 'users.manage' },
          ],
        },
      ],
    },
  ];

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'product-menu-mgmt': true,
    'auth-security': false,
    'integrations-settings': false,
    'order-ops': false,
    'stock-ops': false,
  });

  useEffect(() => {
    SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveChild = item.subItems.some((sub) => sub.path === location.pathname);
          if (hasActiveChild) {
            setOpenAccordions((prev) => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      style={{
        width: '270px',
        backgroundColor: theme.colors.bgSurface,
        color: theme.colors.espresso,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        userSelect: 'none',
      }}
    >
      {/* Brand Logo Header: Farm-to-Table Artisanal Identity */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textInverse,
            }}
          >
            {/* Artisanal Botanical Leaf / Shield Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px', color: theme.colors.espresso }}>
              Natural Food
            </div>
            <div style={{ fontSize: '11px', color: theme.colors.taupe, fontWeight: 500 }}>
              Organik Operasyon Paneli
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Menüyü Kapat"
          className="mobile-only"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: theme.colors.taupe,
            fontSize: '18px',
            padding: '4px 8px',
            borderRadius: theme.radii.sm,
          }}
        >
          ✕
        </button>
      </div>

      {/* Navigation Sections */}
      <nav
        style={{
          padding: '14px 10px 24px 10px',
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {SECTIONS.map((section) => ({
          ...section,
          items: section.items
            .map((item) => {
              if (item.subItems) {
                const filteredSubs = item.subItems.filter((sub) =>
                  hasPermission(sub.requiredPermission ?? item.requiredPermission)
                );
                if (filteredSubs.length === 0) return null;
                return { ...item, subItems: filteredSubs };
              }
              return hasPermission(item.requiredPermission) ? item : null;
            })
            .filter((x): x is MenuItem => x !== null),
        }))
          .filter((section) => section.items.length > 0)
          .map((section, sIndex) => (
          <div key={sIndex} style={{ marginBottom: '14px' }}>
            {/* Category / Section Title */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: theme.colors.taupe,
                padding: '14px 16px 6px 16px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {section.sectionTitle}
            </div>

            {/* Section Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item) => {
                // Single Item (e.g. Modern / Dashboard)
                if (item.path && !item.subItems) {
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => onClose?.()}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '9px 16px',
                        margin: '1px 6px',
                        borderRadius: theme.radii.md,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive ? theme.colors.primary : 'transparent',
                        color: isActive ? theme.colors.textInverse : theme.colors.espresso,
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                      })}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        if (!target.classList.contains('active')) {
                          target.style.backgroundColor = theme.colors.bgHover;
                          target.style.color = theme.colors.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        if (!target.classList.contains('active')) {
                          target.style.backgroundColor = 'transparent';
                          target.style.color = theme.colors.espresso;
                        }
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </NavLink>
                  );
                }

                // Accordion Item
                const isOpen = !!openAccordions[item.id];
                const hasActiveChild = item.subItems?.some((sub) => sub.path === location.pathname);
                const isSelected = isOpen || hasActiveChild;

                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Accordion Parent Header Button: Deep Sage / Forest Green when open */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: 'calc(100% - 12px)',
                        padding: '9px 16px',
                        margin: '1px 6px',
                        borderRadius: theme.radii.md,
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                        color: isSelected ? theme.colors.textInverse : theme.colors.espresso,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                          e.currentTarget.style.color = theme.colors.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = theme.colors.espresso;
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Dropdown Chevron */}
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Submenu Accordion Body with Hollow Circle Bullets ○ */}
                    {isOpen && item.subItems && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          padding: '4px 0 6px 0',
                        }}
                      >
                        {item.subItems.map((sub) => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              onClick={() => onClose?.()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '7px 16px 7px 42px',
                                margin: '1px 6px',
                                borderRadius: theme.radii.md,
                                textDecoration: 'none',
                                fontSize: '13.5px',
                                fontWeight: isSubActive ? 600 : 400,
                                color: isSubActive ? theme.colors.primary : theme.colors.cedar,
                                backgroundColor: isSubActive ? theme.colors.bgActiveSubmenu : 'transparent',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                                  e.currentTarget.style.color = theme.colors.primary;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = theme.colors.cedar;
                                }
                              }}
                            >
                              {/* Hollow Circle Bullet (○) turned filled on active */}
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  border: isSubActive ? `1.5px solid ${theme.colors.primary}` : `1.5px solid ${theme.colors.stoneMuted}`,
                                  backgroundColor: isSubActive ? theme.colors.primary : 'transparent',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                              />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sub.label}
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Card: Dynamic Authenticated Admin User + Çıkış Yap */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.bgCanvas,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: theme.colors.bgActiveSubmenu,
              color: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12.5px',
              border: '1px solid #D5E5D4',
            }}
          >
            {avatarInitials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: theme.colors.espresso,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayFullName}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: theme.colors.primary,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeRoleDisplay}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: theme.colors.taupe,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayEmail}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdminLogout}
          style={{
            width: '100%',
            padding: '7px 12px',
            borderRadius: theme.radii.sm,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.espresso,
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
};
