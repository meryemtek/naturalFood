import React, { useState } from 'react';
import { StatCard } from '../../components/common/StatCard';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  unitPrice: number;
  lastUpdated: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', sku: 'PRD-001', name: 'Kablosuz Mekanik Klavye (RGB)', category: 'Elektronik', stock: 42, unitPrice: 1250, lastUpdated: '2026-11-04' },
  { id: '2', sku: 'PRD-002', name: 'Ultra HD 27" Gaming Monitör (144Hz)', category: 'Elektronik', stock: 8, unitPrice: 8900, lastUpdated: '2026-11-05' },
  { id: '3', sku: 'PRD-003', name: 'Ergonomik Yönetici Koltuğu (Fileli)', category: 'Mobilya', stock: 15, unitPrice: 4200, lastUpdated: '2026-11-02' },
  { id: '4', sku: 'PRD-004', name: 'Akıllı Masa Lambası LED (Kablosuz Şarjlı)', category: 'Aydınlatma', stock: 3, unitPrice: 650, lastUpdated: '2026-11-05' },
  { id: '5', sku: 'PRD-005', name: 'USB-C Hızlı Şarj İstasyonu (100W GaN)', category: 'Aksesuar', stock: 0, unitPrice: 850, lastUpdated: '2026-11-01' },
];

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const handleStockChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta), lastUpdated: 'Bugün' } : item
      )
    );
  };

  const totalStockCount = items.reduce((acc, curr) => acc + curr.stock, 0);
  const criticalStockCount = items.filter((i) => i.stock > 0 && i.stock <= 5).length;
  const outOfStockCount = items.filter((i) => i.stock === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
          Ürün Kataloğu ve Stok Yönetimi
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
          E-ticaret mağazasındaki ürünlerin anlık stok adetleri ve kritik seviye kontrolleri
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Toplam Ürün Çeşidi" value={`${items.length} Kalem`} icon="📦" subtitle="Aktif katalog" />
        <StatCard title="Toplam Depo Stoğu" value={`${totalStockCount} Adet`} icon="📊" subtitle="Fiziksel mevcudiyet" />
        <StatCard title="Kritik Stok" value={`${criticalStockCount} Ürün`} icon="⚠️" subtitle="5 ve altı kalanlar" isPositive={false} />
        <StatCard title="Tükenenler" value={`${outOfStockCount} Ürün`} icon="⛔" subtitle="Acil ikmal bekleyenler" isPositive={false} />
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          Ürün Envanter Listesi
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Ürün Bilgisi</th>
              <th style={{ padding: '14px 20px' }}>Birim Fiyat</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>Stok Durumu</th>
              <th style={{ padding: '14px 20px' }}>Son Değişiklik</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Hızlı Stok Değişimi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              let badgeBg = '#ecfdf5';
              let badgeColor = '#059669';
              let badgeBorder = '#a7f3d0';
              let badgeText = `${item.stock} Adet`;

              if (item.stock === 0) {
                badgeBg = '#fef2f2';
                badgeColor = '#dc2626';
                badgeBorder = '#fecaca';
                badgeText = 'Tükendi (0)';
              } else if (item.stock <= 5) {
                badgeBg = '#fffbeb';
                badgeColor = '#d97706';
                badgeBorder = '#fde68a';
                badgeText = `Kritik (${item.stock})`;
              }

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      SKU: <code style={{ color: '#2563eb' }}>{item.sku}</code> | {item.category}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                    {item.unitPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                      }}
                    >
                      {badgeText}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>{item.lastUpdated}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        disabled={item.stock <= 0}
                        onClick={() => handleStockChange(item.id, -1)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          cursor: item.stock <= 0 ? 'not-allowed' : 'pointer',
                          opacity: item.stock <= 0 ? 0.5 : 1,
                          fontSize: '12px',
                          color: '#dc2626',
                          fontWeight: 600,
                        }}
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleStockChange(item.id, 1)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#16a34a',
                          fontWeight: 600,
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
  );
};

