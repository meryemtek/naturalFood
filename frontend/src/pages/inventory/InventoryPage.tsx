import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { theme } from '../../theme/tokens';
import {
  productInventoryStore,
  InventoryItem,
} from '../../services/productInventoryStore';

export const InventoryPage: React.FC = () => {
  // Load unified persistent inventory data
  const [items, setItems] = useState<InventoryItem[]>(() =>
    productInventoryStore.getInventory()
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to updates from ProductDefinitionPage or other components
  useEffect(() => {
    const unsubscribe = productInventoryStore.subscribe(() => {
      setItems(productInventoryStore.getInventory());
    });
    return unsubscribe;
  }, []);

  const handleStockChange = (id: string, delta: number) => {
    productInventoryStore.updateStockDelta(id, delta);
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockCount = items.reduce((acc, curr) => acc + curr.stock, 0);
  const criticalStockCount = items.filter((i) => i.stock > 0 && i.stock <= 5).length;
  const outOfStockCount = items.filter((i) => i.stock === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px', margin: 0 }}>
          Stok Durumu ve Envanter Yönetimi
        </h1>
        <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
          Doğal ve taze gıda ürünlerinin anlık depo stok adetleri, kritik emniyet sınırları ve stok çıkışları
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Toplam Ürün Çeşidi" value={`${items.length} Kalem`} icon="📦" subtitle="Kayıtlı doğal ürün" />
        <StatCard title="Toplam Depo Stoğu" value={`${totalStockCount} Birim`} icon="📊" subtitle="Fiziksel mevcudiyet" />
        <StatCard title="Kritik Emniyet Stoğu" value={`${criticalStockCount} Ürün`} icon="⚠️" subtitle="5 ve altı kalanlar" isPositive={false} />
        <StatCard title="Tükenen Ürünler" value={`${outOfStockCount} Ürün`} icon="⛔" subtitle="Acil sipariş bekleyenler" isPositive={false} />
      </div>

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
            Doğal Gıda Envanter Listesi ({filteredItems.length} Kalem)
          </div>
          <input
            type="text"
            placeholder="Envanterde ürün adı veya SKU ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: theme.radii.xs,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12.5px',
              minWidth: '240px',
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
              {filteredItems.map((item) => {
                let badgeBg = theme.colors.statusSuccessBg;
                let badgeColor = theme.colors.statusSuccess;
                let badgeBorder = '#D5E5D4';
                let badgeText = `${item.stock} ${item.unit}`;

                if (item.stock === 0) {
                  badgeBg = theme.colors.statusDangerBg;
                  badgeColor = theme.colors.statusDanger;
                  badgeBorder = '#F5D3CE';
                  badgeText = 'Tükendi (0)';
                } else if (item.stock <= 5) {
                  badgeBg = theme.colors.statusWarningBg;
                  badgeColor = theme.colors.statusWarning;
                  badgeBorder = '#FDF0E2';
                  badgeText = `Kritik (${item.stock} ${item.unit})`;
                }

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
                      {item.lastUpdated}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          disabled={item.stock <= 0}
                          onClick={() => handleStockChange(item.id, -1)}
                          title="Stoktan 1 Birim Düş"
                          style={{
                            padding: '4px 10px',
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.bgSurface,
                            cursor: item.stock <= 0 ? 'not-allowed' : 'pointer',
                            opacity: item.stock <= 0 ? 0.4 : 1,
                            fontSize: '12px',
                            color: theme.colors.statusDanger,
                            fontWeight: 700,
                          }}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleStockChange(item.id, 1)}
                          title="Stoğa 1 Birim Ekle"
                          style={{
                            padding: '4px 10px',
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.bgSurface,
                            cursor: 'pointer',
                            fontSize: '12px',
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
        </div>
      </div>
    </div>
  );
};

