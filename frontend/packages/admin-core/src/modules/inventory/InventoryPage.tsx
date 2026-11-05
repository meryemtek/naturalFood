import { useState, useMemo } from 'react';
import { AdminTable } from '../../components/Table/AdminTable';
import type { Column } from '../../types';

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
  { id: '1', sku: 'PRD-001', name: 'Kablosuz Mekanik Klavye', category: 'Elektronik', stock: 42, unitPrice: 1250, lastUpdated: '2026-11-04' },
  { id: '2', sku: 'PRD-002', name: 'Ultra HD 27" Gaming Monitör', category: 'Elektronik', stock: 8, unitPrice: 8900, lastUpdated: '2026-11-05' },
  { id: '3', sku: 'PRD-003', name: 'Ergonomik Yönetici Koltuğu', category: 'Mobilya', stock: 15, unitPrice: 4200, lastUpdated: '2026-11-02' },
  { id: '4', sku: 'PRD-004', name: 'Akıllı Masa Lambası LED', category: 'Aydınlatma', stock: 3, unitPrice: 650, lastUpdated: '2026-11-05' },
  { id: '5', sku: 'PRD-005', name: 'USB-C Hızlı Şarj İstasyonu (100W)', category: 'Aksesuar', stock: 0, unitPrice: 850, lastUpdated: '2026-11-01' },
];

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const handleStockChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stock: Math.max(0, item.stock + delta), lastUpdated: '2026-11-05' } : item
      )
    );
  };

  const columns: Column<InventoryItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Ürün Bilgisi',
        sortable: true,
        render: (_, row) => (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {row.sku} | {row.category}</div>
          </div>
        ),
      },
      {
        key: 'unitPrice',
        header: 'Birim Fiyat',
        sortable: true,
        render: (price: number) => (
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            {price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </span>
        ),
      },
      {
        key: 'stock',
        header: 'Stok Durumu',
        sortable: true,
        align: 'center',
        render: (stock: number) => {
          let bg = '#ecfdf5';
          let color = '#059669';
          let border = '#a7f3d0';
          let text = `${stock} Adet`;

          if (stock === 0) {
            bg = '#fef2f2';
            color = '#dc2626';
            border = '#fecaca';
            text = 'Tükendi (0)';
          } else if (stock <= 5) {
            bg = '#fffbeb';
            color = '#d97706';
            border = '#fde68a';
            text = `Kritik (${stock})`;
          }

          return (
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: bg,
                color,
                border: `1px solid ${border}`,
              }}
            >
              {text}
            </span>
          );
        },
      },
      {
        key: 'lastUpdated',
        header: 'Son Güncelleme',
        sortable: true,
        render: (val: string) => (
          <span style={{ fontSize: '13px', color: '#64748b' }}>{val}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Hızlı Stok Yönetimi',
        align: 'right',
        render: (_, row) => (
          <div style={{ display: 'inline-flex', gap: '6px' }}>
            <button
              onClick={() => handleStockChange(row.id, -1)}
              style={actionBtnStyle}
              title="Stok Azalt"
            >
              -1
            </button>
            <button
              onClick={() => handleStockChange(row.id, 1)}
              style={{ ...actionBtnStyle, backgroundColor: '#2563eb', color: '#fff', borderColor: '#2563eb' }}
              title="Stok Ekle"
            >
              +1
            </button>
            <button
              onClick={() => handleStockChange(row.id, 10)}
              style={{ ...actionBtnStyle, backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
              title="+10 Stok"
            >
              +10
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={infoBannerStyle}>
        <strong>📦 Eklenti Modülü (Pluggable Module):</strong> Bu sayfa, Admin Kabuğuna (AdminShell)
        sonradan dinamik olarak eklenen bağımsız <strong>InventoryModule</strong> tarafından sağlanmaktadır.
      </div>

      <AdminTable
        title="Stok & Depo Listesi"
        data={items}
        columns={columns}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Ürün adı veya SKU ile filtrele..."
        searchableKeys={['name', 'sku', 'category']}
      />
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const infoBannerStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: '8px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1e40af',
  fontSize: '14px',
};
