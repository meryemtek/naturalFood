import React, { useState } from 'react';
import { theme } from '../../theme/tokens';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  supplierType: string;
  orderDate: string;
  expectedDelivery: string;
  totalItems: number;
  totalAmount: string;
  status: 'Onaylandı' | 'Yolda' | 'Kısmi Teslim' | 'Tamamlandı';
  statusColor: string;
  statusBg: string;
}

interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  waybillNumber: string;
  supplier: string;
  receiptDate: string;
  lotAssigned: string;
  temperature: string;
  isColdChainValid: boolean;
  orderedQty: string;
  receivedQty: string;
  discrepancy: string;
  inspector: string;
  qualityStatus: 'Kabul Edildi' | 'Şartlı Kabul' | 'Karantina / Red';
  qualityColor: string;
  qualityBg: string;
}

export const SupplierProcurementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts'>('orders');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: '1',
      poNumber: 'PO-2026-1108',
      supplier: 'Ege Organik Zeytin ve Zeytinyağı Kooperatifi',
      supplierType: 'Yerel Üretici Kooperatifi',
      orderDate: '04.11.2026',
      expectedDelivery: '08.11.2026',
      totalItems: 300,
      totalAmount: '₺92,500.00',
      status: 'Yolda',
      statusColor: theme.colors.statusInfo,
      statusBg: theme.colors.statusInfoBg,
    },
    {
      id: '2',
      poNumber: 'PO-2026-1105',
      supplier: 'Trakya Süt & Doğal Mandıra Çiftliği',
      supplierType: 'Süt ve Şarküteri Üreticisi',
      orderDate: '02.11.2026',
      expectedDelivery: '06.11.2026',
      totalItems: 450,
      totalAmount: '₺64,200.00',
      status: 'Tamamlandı',
      statusColor: theme.colors.primary,
      statusBg: theme.colors.primarySubtle,
    },
    {
      id: '3',
      poNumber: 'PO-2026-1102',
      supplier: 'Kastamonu Siyez ve Ata Tohum Çiftçileri',
      supplierType: 'Organik Tahıl Birliği',
      orderDate: '01.11.2026',
      expectedDelivery: '07.11.2026',
      totalItems: 800,
      totalAmount: '₺58,900.00',
      status: 'Kısmi Teslim',
      statusColor: theme.colors.statusWarning,
      statusBg: theme.colors.statusWarningBg,
    },
    {
      id: '4',
      poNumber: 'PO-2026-1098',
      supplier: 'Toros Dağları Doğal Arıcılık & Bal',
      supplierType: 'Sertifikalı Arıcılar Birliği',
      orderDate: '29.10.2026',
      expectedDelivery: '10.11.2026',
      totalItems: 120,
      totalAmount: '₺41,300.00',
      status: 'Onaylandı',
      statusColor: theme.colors.cedar,
      statusBg: '#F5F2EF',
    },
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: '1',
      receiptNumber: 'MK-2026-0945',
      waybillNumber: 'IRS-882194',
      supplier: 'Trakya Süt & Doğal Mandıra Çiftliği',
      receiptDate: '06.11.2026 09:30',
      lotAssigned: 'LOT-2026-1106-MLK',
      temperature: '+3.2°C (Soğuk Zincir Uygun)',
      isColdChainValid: true,
      orderedQty: '450 Adet',
      receivedQty: '450 Adet',
      discrepancy: '0 (Tam Teslimat)',
      inspector: 'Ahmet Yılmaz (Depo Şefi)',
      qualityStatus: 'Kabul Edildi',
      qualityColor: theme.colors.primary,
      qualityBg: theme.colors.primarySubtle,
    },
    {
      id: '2',
      receiptNumber: 'MK-2026-0944',
      waybillNumber: 'IRS-774012',
      supplier: 'Kastamonu Siyez ve Ata Tohum Çiftçileri',
      receiptDate: '05.11.2026 14:15',
      lotAssigned: 'LOT-2026-1105-FLR',
      temperature: '19.8°C (Kuru Gıda)',
      isColdChainValid: true,
      orderedQty: '800 Kg',
      receivedQty: '500 Kg',
      discrepancy: '-300 Kg (Kalan Yolda)',
      inspector: 'Canan Öz (Kalite Kontrol)',
      qualityStatus: 'Şartlı Kabul',
      qualityColor: theme.colors.statusWarning,
      qualityBg: theme.colors.statusWarningBg,
    },
    {
      id: '3',
      receiptNumber: 'MK-2026-0943',
      waybillNumber: 'IRS-663810',
      supplier: 'Antalya Organik Sera Kooperatifi',
      receiptDate: '03.11.2026 11:00',
      lotAssigned: 'LOT-2026-1103-VEG',
      temperature: '+7.8°C (Limit Aşımı: Maks +4°C)',
      isColdChainValid: false,
      orderedQty: '200 Kasa',
      receivedQty: '200 Kasa',
      discrepancy: 'Kritik Sıcaklık Hatası',
      inspector: 'Ahmet Yılmaz (Depo Şefi)',
      qualityStatus: 'Karantina / Red',
      qualityColor: theme.colors.statusDanger,
      qualityBg: theme.colors.statusDangerBg,
    },
  ];

  const filteredOrders = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = goodsReceipts.filter((gr) =>
    gr.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gr.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gr.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gr.lotAssigned.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
              Tedarikçi ve Alım Yönetimi
            </h1>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.primarySubtle, color: theme.colors.primary, border: '1px solid #D5E5D4' }}>
              Toptancı & Mal Kabul
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
            Toptancı satın alma siparişleri (PO), mal kabul kayıtları, parti (lot) eşleştirmesi ve soğuk zincir teslimat kontrolleri.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              padding: '9px 16px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgCard,
              color: theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 İrsaliye Doğrula
          </button>
          <button
            style={{
              padding: '9px 18px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span> Yeni Toptancı Siparişi (PO)
          </button>
        </div>
      </div>

      {/* KPI Cards: Earth & Botanical Tones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Anlaşmalı Tedarikçi & Çiftlik', val: '28 Kooperatif', sub: 'Tamamı Organik Sertifikalı', color: theme.colors.primary, bg: theme.colors.primarySubtle },
          { label: 'Açık Satın Alma Siparişi', val: '4 Sipariş', sub: '₺256,900 Beklenen Hacim', color: theme.colors.cedar, bg: '#F5F2EF' },
          { label: 'Bu Haftaki Mal Kabul', val: '18 Kabul Fişi', sub: '1,420 Birim Ürün Girişi', color: theme.colors.statusSuccess, bg: theme.colors.statusSuccessBg },
          { label: 'Soğuk Zincir Kabul Oranı', val: '%98.5', sub: 'Sıcaklık ve Tazelik Onaylı', color: theme.colors.statusInfo, bg: theme.colors.statusInfoBg },
        ].map((kpi, idx) => (
          <div key={idx} style={{ padding: '18px 20px', backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '12px', color: theme.colors.taupe, fontWeight: 600 }}>{kpi.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, marginTop: '4px' }}>{kpi.val}</div>
            <div style={{ fontSize: '11.5px', color: kpi.color, fontWeight: 600, marginTop: '2px' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher & Search Bar */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '9px 20px',
              borderRadius: theme.radii.md,
              border: activeTab === 'orders' ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
              backgroundColor: activeTab === 'orders' ? theme.colors.primary : theme.colors.bgSurface,
              color: activeTab === 'orders' ? theme.colors.textInverse : theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>📦</span> Toptancı Siparişleri ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            style={{
              padding: '9px 20px',
              borderRadius: theme.radii.md,
              border: activeTab === 'receipts' ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
              backgroundColor: activeTab === 'receipts' ? theme.colors.primary : theme.colors.bgSurface,
              color: activeTab === 'receipts' ? theme.colors.textInverse : theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>📥</span> Mal Kabul Kayıtları ({goodsReceipts.length})
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder={activeTab === 'orders' ? 'Sipariş No veya Tedarikçi Ara...' : 'Fiş No, İrsaliye, Tedarikçi veya Lot Ara...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              minWidth: '280px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* TAB 1: TOPTANCI SİPARİŞLERİ */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.espresso, margin: 0 }}>
              Aktif Satın Alma ve Toptancı Tedarik Siparişleri
            </h3>
            <span style={{ fontSize: '12px', color: theme.colors.taupe }}>
              Toplam {filteredOrders.length} sipariş
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 20px' }}>Sipariş No (PO)</th>
                <th style={{ padding: '14px 16px' }}>Tedarikçi / Kooperatif</th>
                <th style={{ padding: '14px 16px' }}>Sipariş Tarihi</th>
                <th style={{ padding: '14px 16px' }}>Beklenen Teslim</th>
                <th style={{ padding: '14px 16px' }}>Miktar</th>
                <th style={{ padding: '14px 16px' }}>Toplam Tutar</th>
                <th style={{ padding: '14px 16px' }}>Durum</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((po) => (
                <tr key={po.id} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700, color: theme.colors.primary }}>
                    {po.poNumber}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: theme.colors.espresso }}>{po.supplier}</div>
                    <div style={{ fontSize: '11px', color: theme.colors.taupe }}>{po.supplierType}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.colors.taupe }}>
                    {po.orderDate}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: theme.colors.espresso }}>
                    {po.expectedDelivery}
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.colors.espresso }}>
                    {po.totalItems} Birim
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: theme.colors.espresso }}>
                    {po.totalAmount}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: theme.radii.full,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: po.statusBg,
                        border: `1px solid ${po.statusColor}`,
                        color: po.statusColor,
                      }}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.bgSurface,
                        fontSize: '12px',
                        color: theme.colors.primary,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Detay / Mal Kabul
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MAL KABUL VE GİRİŞ KAYITLARI */}
      {activeTab === 'receipts' && (
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.espresso, margin: 0 }}>
              Depo Mal Kabul Fişleri ve İrsaliye Kayıtları
            </h3>
            <span style={{ fontSize: '12px', color: theme.colors.taupe }}>
              Son {filteredReceipts.length} mal kabul işlemi
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Mal Kabul No</th>
                <th style={{ padding: '14px 14px' }}>İrsaliye No</th>
                <th style={{ padding: '14px 14px' }}>Tedarikçi</th>
                <th style={{ padding: '14px 14px' }}>Tarih / Saat</th>
                <th style={{ padding: '14px 14px' }}>Atanan Lot (Parti)</th>
                <th style={{ padding: '14px 14px' }}>Sıcaklık & Soğuk Zincir</th>
                <th style={{ padding: '14px 14px' }}>Sipariş / Kabul</th>
                <th style={{ padding: '14px 14px' }}>Kontrol Eden</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Kalite Durumu</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((gr) => (
                <tr key={gr.id} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: theme.colors.primary }}>
                    {gr.receiptNumber}
                  </td>
                  <td style={{ padding: '14px 14px', fontFamily: 'monospace', color: theme.colors.espresso, fontWeight: 600 }}>
                    {gr.waybillNumber}
                  </td>
                  <td style={{ padding: '14px 14px', color: theme.colors.espresso, fontWeight: 500 }}>
                    {gr.supplier}
                  </td>
                  <td style={{ padding: '14px 14px', color: theme.colors.taupe }}>
                    {gr.receiptDate}
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <span style={{ padding: '2px 7px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.primarySubtle, color: theme.colors.primary, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>
                      {gr.lotAssigned}
                    </span>
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: theme.radii.xs,
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: gr.isColdChainValid ? theme.colors.statusSuccessBg : theme.colors.statusDangerBg,
                        color: gr.isColdChainValid ? theme.colors.statusSuccess : theme.colors.statusDanger,
                        border: `1px solid ${gr.isColdChainValid ? '#D5E5D4' : '#F5D3CE'}`,
                      }}
                    >
                      {gr.temperature}
                    </span>
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ fontWeight: 600, color: theme.colors.espresso }}>{gr.receivedQty}</div>
                    <div style={{ fontSize: '11px', color: gr.discrepancy.includes('-') || gr.discrepancy.includes('Hata') ? theme.colors.statusDanger : theme.colors.taupe }}>
                      {gr.discrepancy}
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', color: theme.colors.taupe }}>
                    {gr.inspector}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: theme.radii.full,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: gr.qualityBg,
                        border: `1px solid ${gr.qualityColor}`,
                        color: gr.qualityColor,
                      }}
                    >
                      {gr.qualityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
