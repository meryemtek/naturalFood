import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';

// --- Types ---
interface ShelfLifeItem {
  id: string;
  lotNumber: string;
  productName: string;
  category: string;
  storageLocation: string;
  remainingHours: number;
  remainingText: string;
  stockQty: string;
  unitPrice: number;
  status: 'normal' | 'discounted' | 'quarantined';
  discountRate?: number;
}

interface OrderItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryType: 'Adrese Teslimat' | 'Gel-Al (Mağazadan)';
  vehicleType?: string;
  paymentMethod: 'Online Ödeme' | 'Kapıda Tahsilat (POS)' | 'Kapıda Tahsilat (Nakit)';
  status: 'Sipariş Alındı' | 'Hazırlanıyor' | 'Kuryede' | 'Teslim Edildi';
  totalAmount: number;
  orderTime: string;
  items: { name: string; qty: string; price: number }[];
}

export const DashboardPage: React.FC = () => {
  // --- Notification Toast State ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // --- Modals State ---
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [isStockCountModalOpen, setIsStockCountModalOpen] = useState(false);
  const [isSensorHistoryModalOpen, setIsSensorHistoryModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderItem | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<OrderItem | null>(null);

  // --- Raf Ömrü Yaklaşanlar (Parti / Lot) State ---
  const [shelfItems, setShelfItems] = useState<ShelfLifeItem[]>([
    {
      id: 'lot-1',
      lotNumber: 'LOT-2026-094',
      productName: 'Organik Günlük Çiğ Çiftlik Sütü 1L',
      category: 'Süt & Süt Ürünleri',
      storageLocation: 'Soğuk Depo A-1 (+4°C)',
      remainingHours: 14,
      remainingText: '14 Saat kaldı (Bugün 20:00)',
      stockQty: '32 Şişe',
      unitPrice: 45.0,
      status: 'normal',
    },
    {
      id: 'lot-2',
      lotNumber: 'LOT-2026-081',
      productName: "Taze Köy Yumurtası 15'li (Gezen Tavuk)",
      category: 'Yumurta & Kahvaltılık',
      storageLocation: 'Serin Reyon (+12°C)',
      remainingHours: 29,
      remainingText: '29 Saat kaldı (Yarın 11:30)',
      stockQty: '18 Viyol',
      unitPrice: 110.0,
      status: 'normal',
    },
    {
      id: 'lot-3',
      lotNumber: 'LOT-2026-077',
      productName: 'Geleneksel Yayık Tereyağı 500g',
      category: 'Şarküteri & Süt',
      storageLocation: 'Soğuk Dolap C-2 (+3°C)',
      remainingHours: 36,
      remainingText: '36 Saat kaldı (Yarın 18:00)',
      stockQty: '14 Paket',
      unitPrice: 240.0,
      status: 'normal',
    },
    {
      id: 'lot-4',
      lotNumber: 'LOT-2026-062',
      productName: 'Taze Çilek (Mersin Organik Çiftliği)',
      category: 'Taze Meyve-Sebze',
      storageLocation: 'Manav Nemlendirmeli Reyon (+6°C)',
      remainingHours: 40,
      remainingText: '40 Saat kaldı (Yarın 22:00)',
      stockQty: '22 Kase',
      unitPrice: 75.0,
      status: 'normal',
    },
  ]);

  // Handle Quick Discount Action
  const handleApplyDiscount = (id: string, rate: number) => {
    setShelfItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'discounted', discountRate: rate } : item
      )
    );
    const target = shelfItems.find((i) => i.id === id);
    const discountedPrice = target ? (target.unitPrice * (1 - rate / 100)).toFixed(2) : '0';
    showToast(
      `✓ ${target?.productName} için %${rate} anlık indirim tanımlandı. Yeni Fiyat: ₺${discountedPrice}. Müşteri vitrininde "Günün Taze İndirimi" rozeti aktif edildi.`
    );
  };

  // Handle Quarantine / Depodan Çek Action
  const handleQuarantine = (id: string) => {
    setShelfItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'quarantined' } : item))
    );
    const target = shelfItems.find((i) => i.id === id);
    showToast(
      `⚠️ ${target?.productName} (${target?.lotNumber}) reyon satışından çekildi ve karantina/fire önleme alanına taşındı.`
    );
  };

  // --- Canlı Akış Son Siparişler State ---
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: 'ord-1',
      code: 'ORD-8492',
      customerName: 'Zeynep Kaya',
      phone: '0532 411 22 33',
      address: 'Erenköy Mah. Çamlık Sok. No:14 D:6, Kadıköy / İstanbul',
      deliveryType: 'Adrese Teslimat',
      vehicleType: 'Soğuk Zincir Araç (Bölge A)',
      paymentMethod: 'Online Ödeme',
      status: 'Hazırlanıyor',
      totalAmount: 1420.0,
      orderTime: '14:28 (12 dk önce)',
      items: [
        { name: 'Organik Günlük Çiğ Çiftlik Sütü 1L', qty: '2 Adet', price: 90.0 },
        { name: 'Geleneksel Yayık Tereyağı 500g', qty: '1 Adet', price: 240.0 },
        { name: 'Ege Erken Hasat Soğuk Sıkım Zeytinyağı 1L', qty: '2 Adet', price: 980.0 },
        { name: 'Geleneksel Siyez Ekşi Mayalı Ekmek 800g', qty: '1 Adet', price: 110.0 },
      ],
    },
    {
      id: 'ord-2',
      code: 'ORD-8491',
      customerName: 'Murat Gökhan',
      phone: '0544 288 77 66',
      address: 'Moda Şubesi Müşteri Teslim Noktası',
      deliveryType: 'Gel-Al (Mağazadan)',
      paymentMethod: 'Kapıda Tahsilat (POS)',
      status: 'Sipariş Alındı',
      totalAmount: 685.5,
      orderTime: '14:15 (25 dk önce)',
      items: [
        { name: "Taze Köy Yumurtası 15'li (Gezen Tavuk)", qty: '2 Viyol', price: 220.0 },
        { name: 'Karakovan Organik Petek Balı 400g', qty: '1 Kavanoz', price: 365.5 },
        { name: 'Taş Değirmen Siyez Unu 1kg', qty: '1 Paket', price: 100.0 },
      ],
    },
    {
      id: 'ord-3',
      code: 'ORD-8490',
      customerName: 'Elif & Selim Arslan',
      phone: '0533 123 99 88',
      address: 'Levent Mah. Menekşe Çıkmazı No:8, Beşiktaş / İstanbul',
      deliveryType: 'Adrese Teslimat',
      vehicleType: 'Ekspres Elektrikli Kargo',
      paymentMethod: 'Online Ödeme',
      status: 'Kuryede',
      totalAmount: 2340.0,
      orderTime: '13:50 (50 dk önce)',
      items: [
        { name: 'Haftalık Organik Aile Meyve-Sebze Sandığı', qty: '1 Sandık', price: 1450.0 },
        { name: 'Şirden Mayalı Organik Keçi Beyaz Peyniri 500g', qty: '1 Kalıp', price: 290.0 },
        { name: 'Çamlıhemşin Doğal Kestane Balı 450g', qty: '1 Kavanoz', price: 600.0 },
      ],
    },
    {
      id: 'ord-4',
      code: 'ORD-8489',
      customerName: 'Fatma Çetinkaya',
      phone: '0535 777 44 11',
      address: 'Kısıklı Mah. Çamlıca Tepesi Cad. No:22, Üsküdar / İstanbul',
      deliveryType: 'Adrese Teslimat',
      vehicleType: 'Standart Rota Aracı',
      paymentMethod: 'Online Ödeme',
      status: 'Teslim Edildi',
      totalAmount: 920.0,
      orderTime: '13:10 (1 saat önce)',
      items: [
        { name: 'Ata Tohumu Kırmızı Mercimek 1kg', qty: '2 Paket', price: 240.0 },
        { name: 'Urla Sakız Enginarı (Taze Soyulmuş 4 Adet)', qty: '2 Paket', price: 380.0 },
        { name: 'Finike Taze Dalından Portakal 3kg', qty: '1 Kese', price: 300.0 },
      ],
    },
    {
      id: 'ord-5',
      code: 'ORD-8488',
      customerName: 'Burak Yıldız',
      phone: '0530 980 12 34',
      address: 'Batı Ataşehir Sedef Cad. Varyap Meridian No:4, Ataşehir / İstanbul',
      deliveryType: 'Adrese Teslimat',
      vehicleType: 'Soğuk Zincir Araç (Bölge B)',
      paymentMethod: 'Kapıda Tahsilat (Nakit)',
      status: 'Teslim Edildi',
      totalAmount: 1850.0,
      orderTime: '12:45 (1.5 saat önce)',
      items: [
        { name: 'Gurme Doğal Şarküteri Paketi (Kavurma & Pastırma)', qty: '1 Paket', price: 950.0 },
        { name: 'İsli Çerkes Peyniri 400g', qty: '1 Adet', price: 280.0 },
        { name: 'Doğal Yayla Süzme Çiçek Balı 850g', qty: '1 Kavanoz', price: 620.0 },
      ],
    },
    {
      id: 'ord-6',
      code: 'ORD-8487',
      customerName: 'Ayten Özdemir',
      phone: '0542 333 88 12',
      address: 'Tarabya Sahil Yolu No:84, Sarıyer / İstanbul',
      deliveryType: 'Gel-Al (Mağazadan)',
      paymentMethod: 'Online Ödeme',
      status: 'Teslim Edildi',
      totalAmount: 3410.0,
      orderTime: '11:30 (3 saat önce)',
      items: [
        { name: 'Aylık Organik Kiler Paketi (12 Kalem Bakliyat & Tahıl)', qty: '1 Set', price: 2450.0 },
        { name: 'Ege Soğuk Sıkım Erken Hasat Zeytinyağı 2L', qty: '1 Teneke', price: 960.0 },
      ],
    },
  ]);

  // Order status filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Tümü');

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'Tümü') return true;
    return o.status === orderStatusFilter;
  });

  // Handle Order Status Update inside Detail Modal
  const updateOrderStatus = (
    orderId: string,
    newStatus: 'Sipariş Alındı' | 'Hazırlanıyor' | 'Kuryede' | 'Teslim Edildi'
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrderForDetail && selectedOrderForDetail.id === orderId) {
      setSelectedOrderForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`✓ Sipariş durumu "${newStatus}" olarak güncellendi.`);
  };

  // --- Manual Order Form State ---
  const [manualForm, setManualForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    deliveryType: 'Adrese Teslimat' as 'Adrese Teslimat' | 'Gel-Al (Mağazadan)',
    paymentMethod: 'Online Ödeme' as 'Online Ödeme' | 'Kapıda Tahsilat (POS)' | 'Kapıda Tahsilat (Nakit)',
    selectedProduct: 'Organik Günlük Çiğ Çiftlik Sütü 1L',
    quantity: '2',
  });

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customerName || !manualForm.phone) {
      alert('Lütfen müşteri adı ve telefon numarasını giriniz.');
      return;
    }

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      code: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: manualForm.customerName,
      phone: manualForm.phone,
      address: manualForm.address || 'Mağazadan Gel-Al',
      deliveryType: manualForm.deliveryType,
      vehicleType: manualForm.deliveryType === 'Adrese Teslimat' ? 'Soğuk Zincir Araç' : undefined,
      paymentMethod: manualForm.paymentMethod,
      status: 'Sipariş Alındı',
      totalAmount: parseInt(manualForm.quantity, 10) * 85.0,
      orderTime: 'Şimdi (Yeni)',
      items: [
        {
          name: manualForm.selectedProduct,
          qty: `${manualForm.quantity} Adet`,
          price: parseInt(manualForm.quantity, 10) * 85.0,
        },
      ],
    };

    setOrders([newOrder, ...orders]);
    setIsManualOrderModalOpen(false);
    setManualForm({
      customerName: '',
      phone: '',
      address: '',
      deliveryType: 'Adrese Teslimat',
      paymentMethod: 'Online Ödeme',
      selectedProduct: 'Organik Günlük Çiğ Çiftlik Sütü 1L',
      quantity: '2',
    });
    showToast(`✓ ${newOrder.code} kodlu manuel sipariş başarıyla oluşturuldu ve mutfağa iletildi.`);
  };

  // --- Download Daily Dispatch / Sevkiyat Listesi (CSV / Excel format) ---
  const handleDownloadDispatchList = () => {
    const csvHeader = 'Siparis_Kodu,Musteri,Telefon,Teslimat_Turu,Adres,Odeme_Turu,Durum,Tutar_TL\n';
    const csvRows = orders
      .map(
        (o) =>
          `"${o.code}","${o.customerName}","${o.phone}","${o.deliveryType}","${o.address.replace(
            /"/g,
            '""'
          )}","${o.paymentMethod}","${o.status}","${o.totalAmount.toFixed(2)}"`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `gunluk_sevkiyat_listesi_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📥 Günlük sevkiyat ve kurye dağıtım listesi (CSV/Excel) başarıyla indirildi.');
  };

  // Helper for status badge styling
  const getStatusBadgeStyle = (status: OrderItem['status']) => {
    switch (status) {
      case 'Hazırlanıyor':
        return {
          bg: theme.colors.statusWarningBg,
          color: theme.colors.statusWarning,
          border: '1px solid #F1D4B8',
          dot: theme.colors.statusWarning,
        };
      case 'Kuryede':
        return {
          bg: theme.colors.statusInfoBg,
          color: theme.colors.statusInfo,
          border: '1px solid #C8DCE8',
          dot: theme.colors.statusInfo,
        };
      case 'Teslim Edildi':
        return {
          bg: theme.colors.statusSuccessBg,
          color: theme.colors.statusSuccess,
          border: '1px solid #C9E2CB',
          dot: theme.colors.statusSuccess,
        };
      case 'Sipariş Alındı':
      default:
        return {
          bg: theme.colors.bgSurface,
          color: theme.colors.cedar,
          border: `1px solid ${theme.colors.border}`,
          dot: theme.colors.taupe,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert Notification */}
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

      {/* =========================================================================
          BÖLÜM 1: HEADER & HIZLI İŞLEM KISAYOLLARI (Header / Üst Sağ Kısım)
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '4px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '23px',
                fontWeight: 700,
                color: theme.colors.espresso,
                letterSpacing: '-0.4px',
                margin: 0,
              }}
            >
              Doğal Gıda Operasyon & Satış Paneli
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 9px',
                borderRadius: theme.radii.full,
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: theme.colors.statusSuccessBg,
                color: theme.colors.statusSuccess,
                border: '1px solid #C9E2CB',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.statusSuccess,
                }}
              />
              Canlı Operasyon
            </span>
          </div>
          <p
            style={{
              fontSize: '13.5px',
              color: theme.colors.taupe,
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            Çiftlikten sofraya sipariş döngüsü, taze stok metrikleri ve soğuk zincir izleme
          </p>
        </div>

        {/* Hızlı İşlem Kısayolları Butonları */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '9px' }}>
          {/* 1. Yeni Ürün Ekle */}
          <Link
            to="/products/definition"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> Yeni Ürün Ekle
          </Link>

          {/* 2. Manuel Sipariş Oluştur */}
          <button
            onClick={() => setIsManualOrderModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              border: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              e.currentTarget.style.borderColor = theme.colors.cedar;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgSurface;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <span>🛒</span> Manuel Sipariş Oluştur
          </button>

          {/* 3. Stok Sayımı Başlat */}
          <button
            onClick={() => setIsStockCountModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              border: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              e.currentTarget.style.borderColor = theme.colors.cedar;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgSurface;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <span>📋</span> Stok Sayımı Başlat
          </button>

          {/* 4. Günlük Sevkiyat Listesini İndir (PDF/Excel) */}
          <button
            onClick={handleDownloadDispatchList}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: theme.radii.sm,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              fontWeight: 600,
              border: `1px solid ${theme.colors.border}`,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              e.currentTarget.style.borderColor = theme.colors.cedar;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bgSurface;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <span>📥</span> Sevkiyat Listesi İndir (Excel/PDF)
          </button>
        </div>
      </div>

      {/* =========================================================================
          BÖLÜM 2: ÜST ÖZET METRİKLERİ (AYRI BAĞIMSIZ KPI KARTLARI)
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {/* KPI Kartı 1: Günlük Sipariş Hacmi */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: theme.colors.taupe,
              textTransform: 'uppercase',
            }}
          >
            GÜNLÜK SİPARİŞ HACMİ
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.colors.espresso,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              148
            </span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe, fontWeight: 500 }}>
              sipariş
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: theme.colors.statusSuccess,
                backgroundColor: theme.colors.statusSuccessBg,
                padding: '2px 7px',
                borderRadius: theme.radii.xs,
                marginLeft: 'auto',
              }}
            >
              ↑ %14,2 düne göre
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
            <strong style={{ color: theme.colors.espresso }}>132</strong> tamamlanan teslimat ·{' '}
            <span style={{ color: theme.colors.primary, fontWeight: 600 }}>16 aktif kuryede</span>
          </div>
        </div>

        {/* KPI Kartı 2: Bugünkü Net Ciro */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: theme.colors.taupe,
              textTransform: 'uppercase',
            }}
          >
            BUGÜNKÜ NET CİRO
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.colors.espresso,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              ₺42.850
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: theme.colors.statusSuccess,
                backgroundColor: theme.colors.statusSuccessBg,
                padding: '2px 7px',
                borderRadius: theme.radii.xs,
                marginLeft: 'auto',
              }}
            >
              ↑ +%8,2 artış
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
            Dünkü aynı saate göre sade karşılaştırma{' '}
            <span style={{ color: theme.colors.stoneMuted }}>(Dün: ₺39.600)</span>
          </div>
        </div>

        {/* KPI Kartı 3: Bekleyen / Hazırlanan Siparişler */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: theme.colors.taupe,
              textTransform: 'uppercase',
            }}
          >
            BEKLEYEN / HAZIRLANAN SİPARİŞLER
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.colors.espresso,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              14
            </span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe, fontWeight: 500 }}>
              sipariş
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: theme.colors.statusWarning,
                backgroundColor: theme.colors.statusWarningBg,
                padding: '2px 7px',
                borderRadius: theme.radii.xs,
                marginLeft: 'auto',
              }}
            >
              4 acil hazırlık
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
            Mutfak & depo paketleme hattında bekleyen siparişler
          </div>
        </div>

        {/* KPI Kartı 4: Kritik Raf Ömrü & Stok Alarmı */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: theme.colors.taupe,
              textTransform: 'uppercase',
            }}
          >
            KRİTİK RAF ÖMRÜ & STOK ALARMI
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: theme.colors.espresso,
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
              }}
            >
              7
            </span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe, fontWeight: 500 }}>
              parti / ürün
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: theme.colors.statusDanger,
                backgroundColor: theme.colors.statusDangerBg,
                padding: '2px 7px',
                borderRadius: theme.radii.xs,
                marginLeft: 'auto',
              }}
            >
              Eylem Gerekli
            </span>
          </div>
          <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
            <strong style={{ color: theme.colors.statusDanger }}>4 parti</strong> STT &lt; 48 saat ·{' '}
            <strong style={{ color: theme.colors.statusWarning }}>3 ürün</strong> kritik eşik altı
          </div>
        </div>
      </div>

      {/* =========================================================================
          BÖLÜM 3: TAZELİK, SKT VE FİRE UYARI TABLOSU (Gıdaya Özel Blok)
          ========================================================================= */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header of Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🌱</span>
              <h2
                style={{
                  fontSize: '16.5px',
                  fontWeight: 700,
                  color: theme.colors.espresso,
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                Tazelik, SKT ve Fire Uyarı Tablosu
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.primarySubtle,
                  padding: '2px 8px',
                  borderRadius: theme.radii.xs,
                }}
              >
                Gıdaya Özel Operasyonel Kontrol
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: theme.colors.taupe,
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Standart e-ticaretten farklı olarak operasyonel gıda kayıplarını önleyen aktif parti ve
              soğuk zincir izleme alanı
            </p>
          </div>

          <Link
            to="/products/lot-expiry"
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: theme.colors.primary,
              textDecoration: 'none',
            }}
          >
            Tüm STT/Lot Kayıtlarını Gör →
          </Link>
        </div>

        {/* 1. Sıcaklık Sapma Uyarısı Satırı (Hafif Renkli Sakin Uyarı Satırı) */}
        <div
          style={{
            backgroundColor: theme.colors.statusWarningBg,
            border: '1px solid #F1D4B8',
            borderRadius: theme.radii.sm,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#FDEEE0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              🌡️
            </span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: theme.colors.espresso }}>
                Soğuk Zincir Sıcaklık Sapması Tespiti:{' '}
                <span style={{ color: theme.colors.statusWarning, fontWeight: 700 }}>
                  Reyon 2 - Süt & Şarküteri Dolabı (+5.2°C)
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: theme.colors.taupe, marginTop: '2px' }}>
                Sensör ölçümü ideal aralığı (+2.0°C / +4.0°C) aşmıştır. 24 dakikadır eşik aşımı
                tespit edildi. Dolap kapak sızdırmazlığı veya kompresör devri kontrol edilmelidir.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsSensorHistoryModalOpen(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: theme.radii.xs,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                border: '1px solid #E2C4A8',
                cursor: 'pointer',
              }}
            >
              Sensör Geçmişi
            </button>
            <button
              onClick={() =>
                showToast(
                  '✓ Teknik servis ve soğuk zincir kontrol birimine anlık bildirim iletildi. Kontrol ekibi yönlendiriliyor.'
                )
              }
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: theme.radii.xs,
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Müdahale Kaydı Aç
            </button>
          </div>
        </div>

        {/* 2. Raf Ömrü Yaklaşanlar Tablosu */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                  color: theme.colors.taupe,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                <th style={{ padding: '10px 12px' }}>Parti / Lot No</th>
                <th style={{ padding: '10px 12px' }}>Ürün Adı & Kategori</th>
                <th style={{ padding: '10px 12px' }}>Depolama Konumu</th>
                <th style={{ padding: '10px 12px' }}>Kalan Süre (STT / TETT)</th>
                <th style={{ padding: '10px 12px' }}>Mevcut Stok</th>
                <th style={{ padding: '10px 12px' }}>Birim Fiyat</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Hemen Eylem / Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {shelfItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                    backgroundColor:
                      item.status === 'discounted'
                        ? theme.colors.bgActiveSubmenu
                        : item.status === 'quarantined'
                        ? theme.colors.statusDangerBg
                        : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Parti No */}
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                    <span
                      style={{
                        padding: '3px 7px',
                        backgroundColor: theme.colors.bgSurface,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.xs,
                        color: theme.colors.espresso,
                      }}
                    >
                      {item.lotNumber}
                    </span>
                  </td>

                  {/* Ürün & Kategori */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: theme.colors.taupe }}>
                      {item.category}
                    </div>
                  </td>

                  {/* Depolama Konumu */}
                  <td style={{ padding: '12px', color: theme.colors.taupe }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <span>❄️</span> {item.storageLocation}
                    </span>
                  </td>

                  {/* Kalan Süre */}
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: theme.radii.xs,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        backgroundColor:
                          item.remainingHours <= 24
                            ? theme.colors.statusDangerBg
                            : theme.colors.statusWarningBg,
                        color:
                          item.remainingHours <= 24
                            ? theme.colors.statusDanger
                            : theme.colors.statusWarning,
                        border: `1px solid ${
                          item.remainingHours <= 24 ? '#F5C6CB' : '#F1D4B8'
                        }`,
                      }}
                    >
                      <span>⏳</span> {item.remainingText}
                    </span>
                  </td>

                  {/* Mevcut Stok */}
                  <td style={{ padding: '12px', fontWeight: 600, color: theme.colors.espresso }}>
                    {item.stockQty}
                  </td>

                  {/* Birim Fiyat */}
                  <td style={{ padding: '12px' }}>
                    {item.status === 'discounted' && item.discountRate ? (
                      <div>
                        <span
                          style={{
                            textDecoration: 'line-through',
                            color: theme.colors.stoneMuted,
                            fontSize: '11px',
                            marginRight: '4px',
                          }}
                        >
                          ₺{item.unitPrice.toFixed(2)}
                        </span>
                        <strong style={{ color: theme.colors.primary, fontSize: '13px' }}>
                          ₺{(item.unitPrice * (1 - item.discountRate / 100)).toFixed(2)}
                        </strong>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, color: theme.colors.espresso }}>
                        ₺{item.unitPrice.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Aksiyon Butonları */}
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {item.status === 'normal' ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          onClick={() => handleApplyDiscount(item.id, 25)}
                          title="Hızlı %25 İndirim Kampanyası Tanımla"
                          style={{
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.primary,
                            color: theme.colors.textInverse,
                            border: 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ⚡ %25 İndirim Tanımla
                        </button>
                        <button
                          onClick={() => handleQuarantine(item.id)}
                          title="Satıştan Çek / Karantina Deposu"
                          style={{
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.bgSurface,
                            color: theme.colors.statusDanger,
                            border: '1px solid #F5C6CB',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🚫 Depodan Çek
                        </button>
                      </div>
                    ) : item.status === 'discounted' ? (
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: theme.colors.primary,
                          backgroundColor: theme.colors.primarySubtle,
                          padding: '3px 8px',
                          borderRadius: theme.radii.xs,
                        }}
                      >
                        ✓ %{item.discountRate} İndirim Aktif
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: theme.colors.statusDanger,
                          backgroundColor: theme.colors.statusDangerBg,
                          padding: '3px 8px',
                          borderRadius: theme.radii.xs,
                        }}
                      >
                        🚫 Karantinada / Fire Engellendi
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          BÖLÜM 4: SATIŞ VE TALEP TRENDLERİ (Minimalist Grafikler)
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Grafik 1: Saatlik Sipariş Yoğunluğu (Sade, Dolgusuz Çizgi Grafik) */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: theme.colors.espresso,
                  letterSpacing: '-0.2px',
                  margin: 0,
                }}
              >
                Saatlik Sipariş Yoğunluğu (Gün İçi Pik Saatler)
              </h3>
              <span
                style={{
                  fontSize: '11.5px',
                  color: theme.colors.taupe,
                  fontWeight: 500,
                }}
              >
                08:00 – 22:00 Canlı Akış
              </span>
            </div>
            <p
              style={{
                fontSize: '12.5px',
                color: theme.colors.taupe,
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Sabah kahvaltılık & akşam yemeği öncesi sipariş yoğunluk dalgaları
            </p>
          </div>

          {/* Minimalist SVG Dolgusuz Çizgi Grafik - Kart Dışına Taşmayan Güvenli Koordinatlar */}
          <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <svg
              viewBox="0 0 540 190"
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'hidden' }}
            >
              {/* Yatay Kılavuz Çizgiler */}
              <line x1="35" y1="25" x2="515" y2="25" stroke={theme.colors.border} strokeDasharray="3 3" strokeWidth="1" />
              <line x1="35" y1="65" x2="515" y2="65" stroke={theme.colors.border} strokeDasharray="3 3" strokeWidth="1" />
              <line x1="35" y1="105" x2="515" y2="105" stroke={theme.colors.border} strokeDasharray="3 3" strokeWidth="1" />
              <line x1="35" y1="145" x2="515" y2="145" stroke={theme.colors.border} strokeWidth="1" />

              {/* Sol Y Ekseni Değerleri */}
              <text x="12" y="29" fill={theme.colors.stoneMuted} fontSize="9" textAnchor="start">40</text>
              <text x="12" y="69" fill={theme.colors.stoneMuted} fontSize="9" textAnchor="start">25</text>
              <text x="12" y="109" fill={theme.colors.stoneMuted} fontSize="9" textAnchor="start">10</text>
              <text x="12" y="149" fill={theme.colors.stoneMuted} fontSize="9" textAnchor="start">0</text>

              {/* DOLGUSUZ Saf Çizgi - Kontrollü Kübik Bezier (Taşma Yapmayan Hassas Eğri) */}
              <path
                d="M 45 135 C 65 130, 80 55, 100 48 C 120 48, 140 105, 160 110 C 180 115, 195 92, 215 88 C 235 85, 250 112, 270 115 C 290 118, 305 88, 325 82 C 345 75, 365 32, 385 30 C 405 30, 425 85, 440 92 C 460 98, 475 130, 495 132"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pik Noktaları ve Veri Düğümleri */}
              {/* 08:00 */}
              <circle cx="45" cy="135" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 09:30 Sabah Pik Noktası (32 sipariş) */}
              <circle cx="100" cy="48" r="5" fill={theme.colors.primary} stroke={theme.colors.bgCard} strokeWidth="2" />
              <text x="100" y="36" fill={theme.colors.primary} fontSize="10" fontWeight="700" textAnchor="middle">
                32 sipariş
              </text>

              {/* 11:30 */}
              <circle cx="160" cy="110" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 13:30 */}
              <circle cx="215" cy="88" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 15:30 */}
              <circle cx="270" cy="115" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 17:00 */}
              <circle cx="325" cy="82" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 18:45 Akşam Pik Noktası (42 sipariş - Zirve) */}
              <circle cx="385" cy="30" r="5" fill={theme.colors.statusWarning} stroke={theme.colors.bgCard} strokeWidth="2" />
              <text x="385" y="18" fill={theme.colors.statusWarning} fontSize="10" fontWeight="700" textAnchor="middle">
                42 sipariş (Zirve)
              </text>

              {/* 20:30 */}
              <circle cx="440" cy="92" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* 22:00 */}
              <circle cx="495" cy="132" r="3.5" fill={theme.colors.bgSurface} stroke={theme.colors.primary} strokeWidth="2" />

              {/* Alt X Ekseni Saat Etiketleri */}
              <text x="45" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">08:00</text>
              <text x="100" y="166" fill={theme.colors.espresso} fontWeight="600" fontSize="9.5" textAnchor="middle">09:30</text>
              <text x="160" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">11:30</text>
              <text x="215" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">13:30</text>
              <text x="270" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">15:30</text>
              <text x="325" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">17:00</text>
              <text x="385" y="166" fill={theme.colors.espresso} fontWeight="600" fontSize="9.5" textAnchor="middle">18:45</text>
              <text x="440" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">20:30</text>
              <text x="495" y="166" fill={theme.colors.taupe} fontSize="9.5" textAnchor="middle">22:00</text>
            </svg>
          </div>

          {/* Grafik Altı Açıklama Rozetleri */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingTop: '8px',
              borderTop: `1px solid ${theme.colors.borderSubtle}`,
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.colors.espresso }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.primary,
                }}
              />
              <span>🍳 09:30 Kahvaltılık Hazırlık Piki</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.colors.espresso }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.statusWarning,
                }}
              />
              <span>🥗 18:45 Akşam Yemeği Sipariş Zirvesi</span>
            </div>
          </div>
        </div>

        {/* Grafik 2: Kategori Dağılımı (İnce Halka / Donut Grafik) */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: theme.colors.espresso,
                  letterSpacing: '-0.2px',
                  margin: 0,
                }}
              >
                Kategori Satış Dağılımı
              </h3>
              <span
                style={{
                  fontSize: '11.5px',
                  color: theme.colors.taupe,
                  fontWeight: 500,
                }}
              >
                Günün Sepet Hacmi
              </span>
            </div>
            <p
              style={{
                fontSize: '12.5px',
                color: theme.colors.taupe,
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Taze manav, organik süt ve kiler ürünlerinin ciro payları
            </p>
          </div>

          {/* Donut Grafik ve Legend Yan Yana */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '6px 0',
            }}
          >
            {/* SVG İnce Donut */}
            <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
              <svg width="150" height="150" viewBox="0 0 160 160">
                {/* 
                    Circumference = 2 * PI * 60 ≈ 376.99
                    1. Taze Manav: %38 -> dash: 143.25, offset: 0
                    2. Organik Süt: %27 -> dash: 101.78, offset: -143.25
                    3. Kuru Bakliyat: %20 -> dash: 75.40, offset: -245.03
                    4. Şarküteri: %15 -> dash: 56.55, offset: -320.43
                */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#EFECE6"
                  strokeWidth="15"
                />
                {/* Segment 1: Taze Manav (%38) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#2D5A27"
                  strokeWidth="15"
                  strokeDasharray="143.25 377"
                  strokeDashoffset="0"
                  transform="rotate(-90 80 80)"
                />
                {/* Segment 2: Organik Süt & Çiftlik (%27) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#527E50"
                  strokeWidth="15"
                  strokeDasharray="101.78 377"
                  strokeDashoffset="-143.25"
                  transform="rotate(-90 80 80)"
                />
                {/* Segment 3: Kuru Bakliyat & Tahıl (%20) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#8E775B"
                  strokeWidth="15"
                  strokeDasharray="75.40 377"
                  strokeDashoffset="-245.03"
                  transform="rotate(-90 80 80)"
                />
                {/* Segment 4: Şarküteri & Zeytinyağı (%15) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="#4A3B32"
                  strokeWidth="15"
                  strokeDasharray="56.55 377"
                  strokeDashoffset="-320.43"
                  transform="rotate(-90 80 80)"
                />
              </svg>

              {/* Merkez Metni */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: theme.colors.espresso,
                    lineHeight: 1.1,
                  }}
                >
                  ₺42.8k
                </span>
                <span style={{ fontSize: '10px', color: theme.colors.taupe, marginTop: '2px' }}>
                  Toplam Net
                </span>
              </div>
            </div>

            {/* Kategori Açıklama Listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', minWidth: '190px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#2D5A27' }} />
                  <span style={{ color: theme.colors.espresso, fontWeight: 500 }}>Taze Manav & Meyve</span>
                </div>
                <strong style={{ color: theme.colors.espresso }}>%38 (₺16.2k)</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#527E50' }} />
                  <span style={{ color: theme.colors.espresso, fontWeight: 500 }}>Organik Süt & Çiftlik</span>
                </div>
                <strong style={{ color: theme.colors.espresso }}>%27 (₺11.5k)</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#8E775B' }} />
                  <span style={{ color: theme.colors.espresso, fontWeight: 500 }}>Kuru Bakliyat & Tahıl</span>
                </div>
                <strong style={{ color: theme.colors.espresso }}>%20 (₺8.5k)</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#4A3B32' }} />
                  <span style={{ color: theme.colors.espresso, fontWeight: 500 }}>Zeytinyağı & Sos</span>
                </div>
                <strong style={{ color: theme.colors.espresso }}>%15 (₺6.4k)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BÖLÜM 5: SON SİPARİŞLER TABLOSU (Canlı Akış)
          ========================================================================= */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header of Orders Table */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📦</span>
              <h2
                style={{
                  fontSize: '16.5px',
                  fontWeight: 700,
                  color: theme.colors.espresso,
                  letterSpacing: '-0.3px',
                  margin: 0,
                }}
              >
                Son Siparişler Tablosu (Canlı Akış)
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.colors.taupe,
                  backgroundColor: theme.colors.bgSurface,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '2px 8px',
                  borderRadius: theme.radii.xs,
                }}
              >
                {filteredOrders.length} Sipariş Listeleniyor
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: theme.colors.taupe,
                marginTop: '4px',
                marginBottom: 0,
              }}
            >
              Gelen siparişlerin teslimat türü, tahsilat durumu ve canlı hazırlık rozetleri
            </p>
          </div>

          {/* Durum Filtre Çipleri */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {['Tümü', 'Sipariş Alındı', 'Hazırlanıyor', 'Kuryede', 'Teslim Edildi'].map((filter) => {
              const isSelected = orderStatusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setOrderStatusFilter(filter)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    borderRadius: theme.radii.xs,
                    backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.bgSurface,
                    color: isSelected ? theme.colors.primary : theme.colors.taupe,
                    border: `1px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Siparişler Tablosu */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                  color: theme.colors.taupe,
                  fontSize: '11.5px',
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                <th style={{ padding: '10px 12px' }}>Sipariş Kodu & Müşteri</th>
                <th style={{ padding: '10px 12px' }}>Teslimat Türü</th>
                <th style={{ padding: '10px 12px' }}>Ödeme Durumu</th>
                <th style={{ padding: '10px 12px' }}>Durum Rozeti</th>
                <th style={{ padding: '10px 12px' }}>Tutar (₺)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>İşlem Menüsü</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const badgeStyle = getStatusBadgeStyle(order.status);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForDetail(order)}
                    style={{
                      borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.bgSurface)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Sipariş Kodu & Müşteri */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: theme.colors.espresso,
                            backgroundColor: theme.colors.bgSurface,
                            padding: '2px 6px',
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            fontSize: '12px',
                          }}
                        >
                          {order.code}
                        </span>
                        <strong style={{ color: theme.colors.espresso }}>{order.customerName}</strong>
                      </div>
                      <div style={{ fontSize: '11.5px', color: theme.colors.stoneMuted, marginTop: '3px' }}>
                        {order.orderTime} · {order.phone}
                      </div>
                    </td>

                    {/* Teslimat Türü */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500, color: theme.colors.espresso }}>
                        {order.deliveryType === 'Adrese Teslimat' ? '🚚 Adrese Teslimat' : '🏪 Gel-Al (Mağazadan)'}
                      </div>
                      {order.vehicleType && (
                        <div style={{ fontSize: '11.5px', color: theme.colors.taupe }}>
                          {order.vehicleType}
                        </div>
                      )}
                    </td>

                    {/* Ödeme Durumu */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: theme.radii.xs,
                          fontSize: '11.5px',
                          fontWeight: 500,
                          backgroundColor:
                            order.paymentMethod === 'Online Ödeme'
                              ? theme.colors.primarySubtle
                              : theme.colors.bgSurface,
                          color:
                            order.paymentMethod === 'Online Ödeme'
                              ? theme.colors.primary
                              : theme.colors.cedar,
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        {order.paymentMethod === 'Online Ödeme' ? '💳 Online Ödeme' : '💵 Kapıda Tahsilat'}
                      </span>
                    </td>

                    {/* Durum Rozeti */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: theme.radii.full,
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: badgeStyle.border,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: badgeStyle.dot,
                          }}
                        />
                        {order.status}
                      </span>
                    </td>

                    {/* Tutar */}
                    <td style={{ padding: '12px', fontWeight: 700, color: theme.colors.espresso, fontSize: '14px' }}>
                      ₺{order.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* İşlem Menüsü */}
                    <td
                      style={{ padding: '12px', textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedOrderForDetail(order)}
                          style={{
                            padding: '4px 9px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.bgSurface,
                            color: theme.colors.espresso,
                            border: `1px solid ${theme.colors.border}`,
                            cursor: 'pointer',
                          }}
                        >
                          Detay
                        </button>
                        <button
                          onClick={() => setSelectedOrderForInvoice(order)}
                          style={{
                            padding: '4px 9px',
                            fontSize: '12px',
                            fontWeight: 600,
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.bgSurface,
                            color: theme.colors.primary,
                            border: `1px solid ${theme.colors.border}`,
                            cursor: 'pointer',
                          }}
                        >
                          Fatura
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

      {/* =========================================================================
          MODAL 1: SİPARİŞ DETAYI MODALI
          ========================================================================= */}
      {selectedOrderForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderForDetail(null)}
          title={`Sipariş Detayı — ${selectedOrderForDetail.code}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Üst Müşteri & Teslimat Özeti */}
            <div
              style={{
                backgroundColor: theme.colors.bgCanvas,
                padding: '14px 16px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: theme.colors.taupe, fontSize: '11.5px' }}>Müşteri:</span>
                <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                  {selectedOrderForDetail.customerName}
                </div>
                <div style={{ color: theme.colors.taupe, fontSize: '12px' }}>
                  {selectedOrderForDetail.phone}
                </div>
              </div>
              <div>
                <span style={{ color: theme.colors.taupe, fontSize: '11.5px' }}>Teslimat Adresi:</span>
                <div style={{ color: theme.colors.espresso, fontSize: '12.5px', lineHeight: 1.3 }}>
                  {selectedOrderForDetail.address}
                </div>
              </div>
              <div>
                <span style={{ color: theme.colors.taupe, fontSize: '11.5px' }}>Teslimat Yöntemi:</span>
                <div style={{ fontWeight: 500, color: theme.colors.espresso }}>
                  {selectedOrderForDetail.deliveryType}
                  {selectedOrderForDetail.vehicleType && ` (${selectedOrderForDetail.vehicleType})`}
                </div>
              </div>
              <div>
                <span style={{ color: theme.colors.taupe, fontSize: '11.5px' }}>Ödeme Yöntemi:</span>
                <div style={{ fontWeight: 500, color: theme.colors.espresso }}>
                  {selectedOrderForDetail.paymentMethod}
                </div>
              </div>
            </div>

            {/* Ürün Listesi */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '8px' }}>
                Siparişteki Kalemler ({selectedOrderForDetail.items.length})
              </h4>
              <div
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: theme.colors.bgSurface,
                        borderBottom: `1px solid ${theme.colors.border}`,
                        color: theme.colors.taupe,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Ürün</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Miktar</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderForDetail.items.map((it, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: theme.colors.espresso }}>
                          {it.name}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: theme.colors.taupe }}>
                          {it.qty}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: theme.colors.espresso }}>
                          ₺{it.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toplam ve Durum Değiştirme */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: theme.colors.taupe }}>Toplam Tutar:</span>
                <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.espresso }}>
                  ₺{selectedOrderForDetail.totalAmount.toFixed(2)}
                </div>
              </div>

              {/* Hızlı Durum Değiştirme Butonları */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: theme.colors.taupe, marginRight: '4px' }}>
                  Aşama:
                </span>
                {(['Sipariş Alındı', 'Hazırlanıyor', 'Kuryede', 'Teslim Edildi'] as const).map(
                  (st) => {
                    const isCurrent = selectedOrderForDetail.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => updateOrderStatus(selectedOrderForDetail.id, st)}
                        style={{
                          padding: '5px 9px',
                          fontSize: '11px',
                          fontWeight: isCurrent ? 700 : 500,
                          borderRadius: theme.radii.xs,
                          backgroundColor: isCurrent ? theme.colors.primary : theme.colors.bgSurface,
                          color: isCurrent ? theme.colors.textInverse : theme.colors.espresso,
                          border: `1px solid ${isCurrent ? theme.colors.primary : theme.colors.border}`,
                          cursor: 'pointer',
                        }}
                      >
                        {st}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: FATURA ÖNİZLEME MODALI (e-Arşiv / e-Fatura)
          ========================================================================= */}
      {selectedOrderForInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderForInvoice(null)}
          title={`e-Arşiv Fatura Belgesi — ${selectedOrderForInvoice.code}`}
          maxWidth="640px"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#FFFFFF',
              padding: '16px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.sm,
            }}
          >
            {/* Fatura Başlığı */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: `2px solid ${theme.colors.border}`,
                paddingBottom: '12px',
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: theme.colors.espresso }}>
                  NATURAL FOOD DOĞAL GIDA TİC. A.Ş.
                </strong>
                <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginTop: '2px' }}>
                  Organik Tarım Ürünleri Dağıtım & Perakende
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>
                  Vergi Dairesi: Kadıköy V.D. · VKN: 6290881920 · Mersis: 0629088192000001
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: theme.colors.primarySubtle,
                    color: theme.colors.primary,
                    padding: '2px 8px',
                    borderRadius: theme.radii.xs,
                  }}
                >
                  e-ARŞİV FATURA
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '6px', fontFamily: 'monospace' }}>
                  GDA202600008492
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.taupe }}>
                  Tarih: {new Date().toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>

            {/* Alıcı Bilgileri */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                paddingBottom: '10px',
              }}
            >
              <div>
                <span style={{ color: theme.colors.taupe }}>Sayın / Alıcı:</span>
                <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                  {selectedOrderForInvoice.customerName}
                </div>
                <div style={{ color: theme.colors.taupe, maxWidth: '280px' }}>
                  {selectedOrderForInvoice.address}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: theme.colors.taupe }}>Ödeme / Tahsilat:</span>
                <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                  {selectedOrderForInvoice.paymentMethod}
                </div>
                <div style={{ color: theme.colors.primary, fontWeight: 600 }}>Ödendi / Onaylandı</div>
              </div>
            </div>

            {/* Fatura Kalemleri */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.colors.bgSurface,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    color: theme.colors.taupe,
                  }}
                >
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Açıklama</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Miktar</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>KDV</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderForInvoice.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                    <td style={{ padding: '8px', color: theme.colors.espresso }}>{it.name}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: theme.colors.taupe }}>
                      {it.qty}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: theme.colors.taupe }}>
                      %1 (Gıda)
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: theme.colors.espresso }}>
                      ₺{it.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Toplam Matrah ve KDV */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-end',
                fontSize: '12px',
                borderTop: `1px solid ${theme.colors.border}`,
                paddingTop: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '30px' }}>
                <span style={{ color: theme.colors.taupe }}>KDV Matrahı:</span>
                <span style={{ fontWeight: 500 }}>
                  ₺{(selectedOrderForInvoice.totalAmount / 1.01).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '30px' }}>
                <span style={{ color: theme.colors.taupe }}>Hesaplanan KDV (%1):</span>
                <span style={{ fontWeight: 500 }}>
                  ₺{(selectedOrderForInvoice.totalAmount - selectedOrderForInvoice.totalAmount / 1.01).toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '30px', fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                <span style={{ color: theme.colors.espresso }}>Genel Toplam:</span>
                <span style={{ color: theme.colors.primary }}>
                  ₺{selectedOrderForInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Fatura Aksiyonları */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: `1px solid ${theme.colors.borderSubtle}`,
              }}
            >
              <button
                onClick={() => {
                  window.print();
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🖨️ Yazdır
              </button>
              <button
                onClick={() => {
                  showToast(`✓ ${selectedOrderForInvoice.code} için e-Fatura PDF olarak indirildi.`);
                  setSelectedOrderForInvoice(null);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📥 e-Fatura PDF İndir
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 3: MANUEL SİPARİŞ OLUŞTURMA MODALI
          ========================================================================= */}
      {isManualOrderModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsManualOrderModalOpen(false)}
          title="Manuel Sipariş Oluştur (Telefon / Mağaza)"
          maxWidth="540px"
        >
          <form onSubmit={handleCreateManualOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Müşteri Adı Soyadı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ayşe Yılmaz"
                value={manualForm.customerName}
                onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Telefon Numarası *
              </label>
              <input
                type="tel"
                required
                placeholder="05XX XXX XX XX"
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Teslimat Türü
                </label>
                <select
                  value={manualForm.deliveryType}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      deliveryType: e.target.value as any,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Adrese Teslimat">Adrese Teslimat (Kurye)</option>
                  <option value="Gel-Al (Mağazadan)">Gel-Al (Mağazadan)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Ödeme Durumu
                </label>
                <select
                  value={manualForm.paymentMethod}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      paymentMethod: e.target.value as any,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Online Ödeme">Online Ödeme (Kart)</option>
                  <option value="Kapıda Tahsilat (POS)">Kapıda Tahsilat (POS)</option>
                  <option value="Kapıda Tahsilat (Nakit)">Kapıda Tahsilat (Nakit)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Teslimat Adresi
              </label>
              <textarea
                rows={2}
                placeholder="Mahalle, Cadde, No, Daire, İlçe"
                value={manualForm.address}
                onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Ürün Seçimi
                </label>
                <select
                  value={manualForm.selectedProduct}
                  onChange={(e) => setManualForm({ ...manualForm, selectedProduct: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Organik Günlük Çiğ Çiftlik Sütü 1L">Organik Günlük Çiğ Çiftlik Sütü 1L</option>
                  <option value="Taze Köy Yumurtası 15'li (Gezen Tavuk)">Taze Köy Yumurtası 15'li (Gezen Tavuk)</option>
                  <option value="Geleneksel Yayık Tereyağı 500g">Geleneksel Yayık Tereyağı 500g</option>
                  <option value="Ege Erken Hasat Zeytinyağı 1L">Ege Erken Hasat Zeytinyağı 1L</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Miktar
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsManualOrderModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Siparişi Kaydet & Hazırla
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 4: STOK SAYIMI BAŞLAT MODALI
          ========================================================================= */}
      {isStockCountModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsStockCountModalOpen(false)}
          title="Fiziki Stok ve Raf Sayımı Başlat"
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <p style={{ color: theme.colors.taupe, margin: 0 }}>
              Sayım oturumu başlatıldığında ilgili depo veya reyon için barkod okutma ve parti (lot)
              eşitleme protokolü devreye girer.
            </p>

            <div>
              <label style={{ display: 'block', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Sayım Yapılacak Depo / Bölüm
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option>Soğuk Depo A (+2°C / +4°C - Süt & Şarküteri)</option>
                <option>Donuk Depo B (-18°C - Dondurulmuş Gıda)</option>
                <option>Kuru Gıda Kiler Deposu (Bakliyat & Tahıllar)</option>
                <option>Taze Manav Ön Reyon (Hızlı Tüketim)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Sayım Modu
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="countMode" defaultChecked />
                  <span>Kör Sayım (Mevcut miktar gizlenir, bağımsız sayım yapılır)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="countMode" />
                  <span>STT / Lot Doğrulama Sayımı (Yaklaşan partiler kontrol edilir)</span>
                </label>
              </div>
            </div>

            <div
              style={{
                backgroundColor: theme.colors.primarySubtle,
                padding: '10px 14px',
                borderRadius: theme.radii.xs,
                fontSize: '12px',
                color: theme.colors.primary,
              }}
            >
              ℹ️ Sayım süresince ilgili depo lokasyonundaki stok düşümleri otomatik rezerve edilecektir.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setIsStockCountModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  setIsStockCountModalOpen(false);
                  showToast('📋 Sayım oturumu başlatıldı. Mobil el terminalleri aktif hale getirildi.');
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sayım Oturumunu Aç
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 5: SOĞUK ZİNCİR SENSÖR GEÇMİŞİ MODALI
          ========================================================================= */}
      {isSensorHistoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSensorHistoryModalOpen(false)}
          title="Soğuk Zincir Telemetrisi — Reyon 2 (Süt & Şarküteri)"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                <span style={{ fontSize: '11px', color: theme.colors.taupe }}>Anlık Sıcaklık</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.statusWarning }}>
                  +5.2°C
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                <span style={{ fontSize: '11px', color: theme.colors.taupe }}>Hedef Aralık</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.espresso }}>
                  +2.0°C ~ +4.0°C
                </div>
              </div>
              <div style={{ padding: '10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                <span style={{ fontSize: '11px', color: theme.colors.taupe }}>Nem Oranı</span>
                <div style={{ fontSize: '16px', fontWeight: 600, color: theme.colors.espresso }}>
                  %68 RH (Normal)
                </div>
              </div>
            </div>

            <div>
              <strong style={{ fontSize: '12.5px', color: theme.colors.espresso }}>
                Son 5 Ölçüm Kaydı (Her 5 dakikada bir telemetri)
              </strong>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: theme.colors.statusWarningBg, borderRadius: theme.radii.xs, border: '1px solid #F1D4B8' }}>
                  <span>14:35 (Şimdi)</span>
                  <strong style={{ color: theme.colors.statusWarning }}>+5.2°C (Eşik Üstü)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: theme.colors.statusWarningBg, borderRadius: theme.radii.xs, border: '1px solid #F1D4B8' }}>
                  <span>14:30</span>
                  <strong style={{ color: theme.colors.statusWarning }}>+4.9°C (Eşik Üstü)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                  <span>14:25</span>
                  <strong style={{ color: theme.colors.statusSuccess }}>+4.1°C (Sınırda)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                  <span>14:20</span>
                  <strong style={{ color: theme.colors.statusSuccess }}>+3.8°C (Normal)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.xs, border: `1px solid ${theme.colors.border}` }}>
                  <span>14:15</span>
                  <strong style={{ color: theme.colors.statusSuccess }}>+3.6°C (Normal)</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={() => setIsSensorHistoryModalOpen(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Kapat
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
