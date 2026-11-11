import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { theme } from '../../theme/tokens';
import {
  inventoryService,
  InventoryItemDto,
} from '../../services/inventoryService';

export const InventoryPage: React.FC = () => {
  // Live State from .NET 10 & PostgreSQL
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<{ [id: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Fetch inventory from PostgreSQL via Minimal API
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await inventoryService.getInventory({
        search: searchTerm.trim() || undefined,
        criticalOnly: filterCriticalOnly ? true : undefined,
        pageSize: 50,
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error('Envanter yüklenemedi:', err);
      setError(err?.message || 'Envanter listesi sunucudan yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterCriticalOnly]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle fast +1 / -1 Stock Adjustment
  const handleStockChange = async (id: string, delta: number) => {
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem || (targetItem.stockQuantity <= 0 && delta < 0)) return;

    // Optimistic UI Update
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStock = Math.max(0, item.stockQuantity + delta);
          const nextStatus = nextStock <= 0 ? 'OutOfStock' : nextStock <= 5 ? 'LowStock' : 'InStock';
          return {
            ...item,
            stockQuantity: nextStock,
            status: nextStatus,
            lastUpdatedUtc: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    setUpdatingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const updated = await inventoryService.updateStock(id, {
        delta,
        reason: `Envanter ekranı hızlı stok değişimi (${delta > 0 ? `+${delta}` : delta})`,
      });

      // Synchronize with server response
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );

      showToast(`✓ "${updated.name}" güncel stoğu: ${updated.stockQuantity} ${updated.unitInfo}`);
    } catch (err: any) {
      console.error('Stok güncellenemedi:', err);
      alert(`Stok güncelleme hatası: ${err.message}`);
      // Rollback to server state
      fetchInventory();
    } finally {
      setUpdatingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  // KPI Calculations
  const totalStockCount = items.reduce((acc, curr) => acc + curr.stockQuantity, 0);
  const criticalStockCount = items.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= 5).length;
  const outOfStockCount = items.filter((i) => i.stockQuantity === 0).length;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) +
        ' ' +
        d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: theme.colors.bgSurface,
            color: theme.colors.espresso,
            border: `1px solid ${theme.colors.border}`,
            borderLeft: `4px solid ${theme.colors.primary}`,
            borderRadius: theme.radii.sm,
            padding: '12px 20px',
            boxShadow: '0 4px 16px rgba(45, 36, 30, 0.08)',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.stoneMuted,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px', margin: 0 }}>
              Stok Durumu ve Envanter Yönetimi
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: theme.radii.full, backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2E7D32', display: 'inline-block' }}></span>
              PostgreSQL Canlı Envanter
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
            Doğal gıda ürünlerinin anlık depo stok adetleri, kritik emniyet sınırları ve anında PATCH güncellemeleri
          </p>
        </div>

        <button
          onClick={() => fetchInventory()}
          disabled={isLoading}
          style={{
            padding: '9px 16px',
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgSurface,
            color: theme.colors.cedar,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isLoading ? 'Yenileniyor...' : '↻ Envanteri Yenile'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '14px' }}>
        <StatCard title="Toplam Ürün Çeşidi" value={`${totalCount} Kalem`} icon="📦" subtitle="catalog.Products verisi" />
        <StatCard title="Toplam Depo Stoğu" value={`${totalStockCount} Birim`} icon="📊" subtitle="Fiziksel mevcudiyet" />
        <StatCard title="Kritik Emniyet Stoğu" value={`${criticalStockCount} Ürün`} icon="⚠️" subtitle="5 ve altı kalanlar" isPositive={false} />
        <StatCard title="Tükenen Ürünler" value={`${outOfStockCount} Ürün`} icon="⛔" subtitle="Acil sipariş bekleyenler" isPositive={false} />
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#FDF2F2', border: '1px solid #F8B4B4', borderRadius: theme.radii.md, color: '#9B1C1C', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>Bağlantı Hatası:</strong> {error}</div>
          <button onClick={() => fetchInventory()} style={{ padding: '6px 14px', backgroundColor: '#9B1C1C', color: '#FFFFFF', border: 'none', borderRadius: theme.radii.xs, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Yeniden Dene
          </button>
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>
            Doğal Gıda Envanter Listesi ({items.length} Kalem)
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              style={{
                padding: '6px 12px',
                borderRadius: theme.radii.xs,
                border: filterCriticalOnly ? '1px solid #C53030' : `1px solid ${theme.colors.border}`,
                backgroundColor: filterCriticalOnly ? '#FDE8E8' : theme.colors.bgSurface,
                color: filterCriticalOnly ? '#C53030' : theme.colors.espresso,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {filterCriticalOnly ? '✓ Sadece Kritik Stoklar' : 'Kritik Stokları Filtrele (≤5)'}
            </button>

            <input
              type="text"
              placeholder="Envanterde ürün adı veya SKU ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: theme.radii.xs,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '12.5px',
                flex: '1 1 200px', maxWidth: '100%', boxSizing: 'border-box',
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: theme.colors.taupe }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: `3px solid ${theme.colors.border}`, borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '12px', fontSize: '13.5px' }}>PostgreSQL veritabanından envanter yükleniyor...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: theme.colors.taupe }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>Kayıtlı envanter ürünü bulunamadı.</p>
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px', verticalAlign: 'middle' }}>Ürün Bilgisi</th>
                  <th style={{ padding: '14px 20px', verticalAlign: 'middle' }}>Birim Fiyat</th>
                  <th style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>Stok Durumu</th>
                  <th style={{ padding: '14px 20px', verticalAlign: 'middle' }}>Son Değişiklik</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>Hızlı Stok Değişimi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  let badgeBg = theme.colors.statusSuccessBg;
                  let badgeColor = theme.colors.statusSuccess;
                  let badgeBorder = '#D5E5D4';
                  let badgeText = `${item.stockQuantity} ${item.unitInfo}`;

                  if (item.stockQuantity === 0) {
                    badgeBg = theme.colors.statusDangerBg;
                    badgeColor = theme.colors.statusDanger;
                    badgeBorder = '#F5D3CE';
                    badgeText = 'Tükendi (0)';
                  } else if (item.stockQuantity <= 5) {
                    badgeBg = theme.colors.statusWarningBg;
                    badgeColor = theme.colors.statusWarning;
                    badgeBorder = '#FDF0E2';
                    badgeText = `Kritik (${item.stockQuantity} ${item.unitInfo})`;
                  }

                  const isItemUpdating = updatingIds[item.id];

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}`, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.bgSurface)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: theme.colors.espresso }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: theme.colors.taupe, marginTop: '2px' }}>
                          SKU: <code style={{ color: theme.colors.primary, fontWeight: 600, fontFamily: 'monospace' }}>{item.sku}</code> | {item.category}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: theme.colors.espresso, verticalAlign: 'middle' }}>
                        {item.unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: theme.radii.full,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badgeColor,
                            }}
                          />
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: theme.colors.taupe, verticalAlign: 'middle' }}>
                        {formatDate(item.lastUpdatedUtc)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            disabled={item.stockQuantity <= 0 || isItemUpdating}
                            onClick={() => handleStockChange(item.id, -1)}
                            title="Stoktan 1 Birim Düş"
                            style={{
                              padding: '5px 12px',
                              borderRadius: theme.radii.xs,
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.bgSurface,
                              cursor: item.stockQuantity <= 0 || isItemUpdating ? 'not-allowed' : 'pointer',
                              opacity: item.stockQuantity <= 0 || isItemUpdating ? 0.4 : 1,
                              fontSize: '12.5px',
                              color: theme.colors.statusDanger,
                              fontWeight: 700,
                            }}
                          >
                            -1
                          </button>

                          <button
                            disabled={isItemUpdating}
                            onClick={() => handleStockChange(item.id, 1)}
                            title="Stoğa 1 Birim Ekle"
                            style={{
                              padding: '5px 12px',
                              borderRadius: theme.radii.xs,
                              border: `1px solid ${theme.colors.border}`,
                              backgroundColor: theme.colors.bgSurface,
                              cursor: isItemUpdating ? 'not-allowed' : 'pointer',
                              opacity: isItemUpdating ? 0.4 : 1,
                              fontSize: '12.5px',
                              color: theme.colors.primary,
                              fontWeight: 700,
                            }}
                          >
                            +1
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
