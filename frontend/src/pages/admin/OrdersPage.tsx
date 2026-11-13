import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi, type AdminOrderPage, type AdminOrderView, type OrderSummaryView } from '../../api/adminApi';
import { orderStatuses } from '../../api/storefront/orderWorkflowApi';
import { money } from '../../api/storefront/storefrontApi';
import { StatCard } from '../../components/common/StatCard';
import { AdminPagination } from '../../components/common/AdminPagination';
import { theme } from '../../theme/tokens';
import {
  OrderDrawer,
  formatShortOrderNumber,
  formatDateTime,
  getStatusBadgeClass,
} from './OrderManagement';
import './orders.css';

interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

export function OrdersPage() {
  const { pathname } = useLocation();
  const pathFilter = pathname.split('/')[2] ?? '';

  return <OrderManagementList key={pathFilter} initialFilter={pathFilter} />;
}

function OrderManagementList({ initialFilter }: { initialFilter: string }) {
  // Map route slug to filter key if needed
  const normalizedInitial =
    initialFilter === 'pending'
      ? 'preparing'
      : initialFilter === 'completed'
      ? 'delivered'
      : initialFilter === 'returns'
      ? 'returns'
      : '';

  const [activeTab, setActiveTab] = useState<string>(normalizedInitial);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const [data, setData] = useState<AdminOrderPage | null>(null);
  const [summary, setSummary] = useState<OrderSummaryView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refresh, setRefresh] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderView | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ ${label}`);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load summary KPIs
  const loadSummary = useCallback(async () => {
    try {
      const sum = await adminApi.getOrderSummary();
      setSummary(sum);
    } catch {
      // Ignore if summary endpoint is loading or fails
    }
  }, []);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const controller = new AbortController();
    try {
      const result = await adminApi.getOrders(page, activeTab, debouncedSearch, controller.signal);
      if (!controller.signal.aborted) {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString('tr-TR'));

        // If drawer is open, keep selected order synchronized
        if (selectedOrder) {
          const fresh = result.items.find((x) => x.order.id === selectedOrder.order.id);
          if (fresh) setSelectedOrder(fresh);
        }
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : 'Siparişler yüklenemedi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, debouncedSearch, selectedOrder]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refresh]);

  useEffect(() => {
    void fetchOrders();
  }, [page, activeTab, debouncedSearch, refresh]);

  // Auto-refresh interval (every 15 seconds)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void fetchOrders();
        void loadSummary();
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchOrders, loadSummary]);

  // Tab definitions
  const tabs: TabItem[] = useMemo(
    () => [
      { key: '', label: 'Tüm Siparişler', badge: summary?.totalOrders },
      { key: 'PendingPayment', label: 'Ödeme Bekleyen' },
      { key: 'preparing', label: 'Hazırlanıyor', badge: summary?.waitingPreparation },
      { key: 'shipped', label: 'Kargoda', badge: summary?.inTransit },
      { key: 'delivered', label: 'Teslim Edildi' },
      { key: 'returns', label: 'İptal / İade', badge: summary?.returnRequests },
    ],
    [summary]
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  return (
    <main className="admin-orders">
      {/* Toast Notification */}
      {toastMessage && <div className="order-toast">{toastMessage}</div>}

      {/* 1. Header */}
      <header className="admin-orders-header">
        <div>
          <div className="admin-orders-title-group">
            <h1 className="admin-orders-title">Sipariş Yönetimi</h1>
            <span className="admin-orders-badge">
              <span className="admin-orders-badge-dot"></span>
              PostgreSQL Canlı Sipariş Akışı
            </span>
          </div>
          <p className="admin-orders-subtitle">
            Üye ve misafir siparişleri, kargo takibi ve operasyonel durum güncellemeleri
            {lastUpdated && ` · Son senkronizasyon: ${lastUpdated}`}
          </p>
        </div>

        <button
          type="button"
          className="admin-orders-refresh-btn"
          disabled={isLoading}
          onClick={() => {
            setRefresh((r) => r + 1);
            showToast('Sipariş listesi yenileniyor...');
          }}
        >
          {isLoading ? '↻ Yenileniyor...' : '↻ Listeyi Yenile'}
        </button>
      </header>

      {/* 2. Üst Özet Metrikleri (4 Sade KPI Kartı) */}
      <section className="admin-orders-kpis" aria-label="Sipariş İstatistikleri">
        <StatCard
          title="Toplam Sipariş"
          value={summary ? `${summary.totalOrders} Adet` : data ? `${data.total} Adet` : '-'}
          icon="📦"
          subtitle="Tüm zamanlar sipariş havuzu"
        />
        <StatCard
          title="Hazırlanmayı Bekleyenler"
          value={summary ? `${summary.waitingPreparation} Adet` : '-'}
          icon="⏳"
          subtitle="Ödeme Alındı & Hazırlanıyor"
          isPositive={true}
        />
        <StatCard
          title="Kargodakiler"
          value={summary ? `${summary.inTransit} Adet` : '-'}
          icon="🚚"
          subtitle="Müşteriye sevk edilenler"
          isPositive={true}
        />
        <StatCard
          title="İptal / İade Talepleri"
          value={summary ? `${summary.returnRequests} Talep` : '-'}
          icon="↩️"
          subtitle="İnceleme ve iade kayıtları"
          isPositive={false}
        />
      </section>

      {/* 3. Filtre Çubuğu & Arama Kutusu */}
      <section className="admin-orders-toolbar">
        {/* Arama Kutusu */}
        <div className="admin-orders-search-wrapper">
          <span className="admin-orders-search-icon">🔍</span>
          <input
            type="text"
            className="admin-orders-search-input"
            placeholder="Sipariş no (#NF-...), müşteri e-posta, telefon veya ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-orders-search-clear"
              onClick={() => setSearchTerm('')}
              title="Aramayı temizle"
            >
              ✕
            </button>
          )}
        </div>

        {/* Durum Filtre Sekmeleri */}
        <div className="admin-orders-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`admin-orders-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: theme.radii.full,
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.colors.bgHover,
                      color: isActive ? '#FFFFFF' : theme.colors.cedar,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            backgroundColor: theme.colors.statusDangerBg,
            border: `1px solid #F5C6C0`,
            borderRadius: theme.radii.md,
            color: theme.colors.statusDanger,
            fontSize: '13.5px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Bağlantı Hatası:</strong> {error}
          </div>
          <button
            type="button"
            onClick={() => setRefresh((r) => r + 1)}
            style={{
              padding: '6px 14px',
              backgroundColor: theme.colors.statusDanger,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: theme.radii.xs,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* 4. Düzenli Sipariş Tablosu (Ana Liste) */}
      <section className="admin-orders-table-card">
        <div className="admin-orders-table-scroll">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Sipariş No</th>
                <th>Tarih & Saat</th>
                <th>Müşteri</th>
                <th>Ürün Özeti</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && !data ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: theme.colors.taupe }}>
                    Siparişler yükleniyor...
                  </td>
                </tr>
              ) : data && data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍃</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '4px' }}>
                      Kriterlere uygun sipariş bulunamadı
                    </div>
                    <p style={{ fontSize: '13px', color: theme.colors.taupe, margin: '0 0 16px 0' }}>
                      Arama terimini değiştirebilir veya filtre sekmelerini temizleyebilirsiniz.
                    </p>
                    {(searchTerm || activeTab) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setActiveTab('');
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.bgSurface,
                          color: theme.colors.espresso,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Filtreleri Temizle
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((item) => {
                  const shortNumber = formatShortOrderNumber(item.order.number);
                  const firstLine = item.order.lines[0];
                  const remainingLinesCount = item.order.lines.length - 1;

                  return (
                    <tr key={item.order.id}>
                      {/* Sipariş No */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="order-code-badge" title={item.order.number}>
                            {shortNumber}
                          </span>
                          <button
                            type="button"
                            className="order-copy-btn"
                            title="Tam sipariş kodunu kopyala"
                            onClick={() => copyToClipboard(item.order.number, 'Sipariş kodu kopyalandı')}
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Tarih & Saat */}
                      <td style={{ whiteSpace: 'nowrap', color: theme.colors.cedar, fontSize: '13px' }}>
                        {formatDateTime(item.order.createdAtUtc)}
                      </td>

                      {/* Müşteri */}
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{item.email}</span>
                          <span className="customer-contact">{item.phone}</span>
                          <span
                            className={
                              item.isGuest
                                ? 'customer-tag customer-tag--guest'
                                : 'customer-tag customer-tag--member'
                            }
                          >
                            {item.isGuest ? 'Misafir' : 'Üye'}
                          </span>
                        </div>
                      </td>

                      {/* Ürün Özeti */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: theme.colors.espresso, fontSize: '13px' }}>
                            {item.order.lines.length} Kalem Ürün
                          </strong>
                          {firstLine && (
                            <span style={{ fontSize: '12px', color: theme.colors.taupe }}>
                              {firstLine.name} (x{firstLine.quantity})
                              {remainingLinesCount > 0 ? ` +${remainingLinesCount} çeşit` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tutar */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: theme.colors.espresso, fontSize: '14px' }}>
                            {money(item.order.total)}
                          </strong>
                          <span style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>
                            {item.order.shippingFee === 0 ? 'Ücretsiz Kargo' : `Kargo: ${money(item.order.shippingFee)}`}
                          </span>
                        </div>
                      </td>

                      {/* Durum Rozeti */}
                      <td>
                        <span className={getStatusBadgeClass(item.order.status)}>
                          {orderStatuses[item.order.status] ?? item.order.status}
                        </span>
                      </td>

                      {/* İşlem */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="order-action-btn"
                          onClick={() => setSelectedOrder(item)}
                        >
                          Yönet / Detay ➔
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama Çubuğu */}
        {data && (
          <AdminPagination
            page={page}
            pageSize={pageSize}
            totalCount={data.total}
            itemCount={data.items.length}
            onPageChange={(p) => setPage(p)}
            label="sipariş"
          />
        )}
      </section>

      {/* 5. Sipariş Yönetim Detay Çekmecesi (Drawer) */}
      {selectedOrder && (
        <OrderDrawer
          orderItem={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => {
            setRefresh((r) => r + 1);
            void loadSummary();
          }}
        />
      )}
    </main>
  );
}
