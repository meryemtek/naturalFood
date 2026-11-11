import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { theme } from '../../theme/tokens';

interface ModuleConfig {
  title: string;
  category: string;
  description: string;
  badge: string;
  features: string[];
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // Ürün ve Menü
  '/products': {
    title: 'Tüm Ürünler',
    category: 'Ürün ve Menü Yönetimi',
    description: 'Katalogdaki tüm gıda ve organik ürünleri listeleyin, fiyatları ve stok durumlarını yönetin.',
    badge: 'Katalog',
    features: ['Toplu Fiyat Güncelleme', 'Barkod & SKU Filtreleme', 'Kategori Bazlı Listeleme', 'Dışa Aktar (Excel/PDF)'],
  },
  '/menu/catalog': {
    title: 'Restoran / Menü Listesi',
    category: 'Ürün ve Menü Yönetimi',
    description: 'Doğal yemek menüleri, hazır paketler ve haftalık organik menü sepetlerini yönetin.',
    badge: 'Menü Kataloğu',
    features: ['Haftalık Organik Sepetler', 'Diyet & Kalori Menüleri', 'Hazır Yemek Paketleri', 'Menü Aktiflik Takvimi'],
  },
  '/menu/featured': {
    title: 'Öne Çıkanlar & Vitrin',
    category: 'Ürün ve Menü Yönetimi',
    description: 'Ana sayfa vitrini, haftanın üreticisi ve mevsimlik öne çıkan organik ürünleri belirleyin.',
    badge: 'Vitrin Yönetimi',
    features: ['Mevsimsel Vitrin', 'Üretici Köşesi', 'Banner & Slayt Bağlantıları', 'Günün Fırsatları'],
  },
  '/menu/price-lists': {
    title: 'Fiyat Listeleri',
    category: 'Ürün ve Menü Yönetimi',
    description: 'Perakende, kurumsal (B2B) ve abonelik paketlerine özel farklı fiyat listelerini yönetin.',
    badge: 'Fiyatlandırma',
    features: ['B2B Toptan Fiyat Listesi', 'Abone Özel İndirimli Fiyat', 'KDV & Vergi Tanımları', 'Zamanlı İndirim Takvimi'],
  },

  // Sipariş ve Sevkiyat
  '/orders': {
    title: 'Tüm Siparişler',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Web sitesi, mobil uygulama ve pazaryerlerinden gelen tüm siparişlerin durumunu izleyin.',
    badge: 'Sipariş Havuzu',
    features: ['Sipariş Durumu Güncelleme', 'Fatura Kesme & Yazdırma', 'Müşteri İletişim Notları', 'Kurye Atama'],
  },
  '/orders/pending': {
    title: 'Bekleyen Siparişler',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Hazırlık aşamasındaki ve paketlenmeyi bekleyen taze ürün siparişlerini onaylayın.',
    badge: 'İşlem Bekliyor',
    features: ['Hızlı Onaylama', 'Toplama Listesi (Picking List)', 'Tazelik Kontrolü', 'Otomatik SMS Bildirimi'],
  },
  '/orders/completed': {
    title: 'Tamamlanan Siparişler',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Müşteriye teslim edilmiş ve başarıyla tamamlanmış siparişlerin arşivi.',
    badge: 'Arşiv',
    features: ['Teslimat Belgesi Doğrulama', 'Geçmiş Sipariş Filtreleme', 'Müşteri Puanı', 'Fatura Arşivi'],
  },
  '/orders/returns': {
    title: 'İptal ve İade Talepleri',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'İptal edilen siparişler, taze ürün iade süreçleri ve müşteri geri ödeme onayları.',
    badge: 'İadeler',
    features: ['İade İnceleme ve Kabul', 'Ücret İadesi (Refund) Entegrasyonu', 'Kusur / Hasar Fotoğrafları', 'Stok İade Fişi'],
  },
  '/shipping/shipments': {
    title: 'Sevkiyat ve Kargo Takibi',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Anlık kargo takip numaraları, kurye rotaları ve sevkiyat barkodlarını izleyin.',
    badge: 'Lojistik',
    features: ['Barkod ile Toplu Çıkış', 'Kargo Durumu Canlı Takip', 'Teslimat Süresi Ölçümü', 'Hasarlı Paket Kaydı'],
  },
  '/shipping/carriers': {
    title: 'Kargo Entegrasyonları',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Yurtiçi Kargo, Aras, MNG, Trendyol Express ve kendi özel soğuk zincir kurye filonuz.',
    badge: 'Entegrasyon',
    features: ['API Bağlantı Durumu', 'Otomatik Takip Kodu Üretme', 'Desi Hesaplama Formülleri', 'Kargo Fiyat Matrisi'],
  },
  '/shipping/zones': {
    title: 'Teslimat Bölgeleri',
    category: 'Sipariş ve Sevkiyat Yönetimi',
    description: 'Aynı gün teslimat yapılan ilçeler, soğuk zincir bölgeleri ve minimum sepet tutarları.',
    badge: 'Bölge Yönetimi',
    features: ['İlçe & Mahalle Tanımları', 'Soğuk Zincir Kapsama Alanı', 'Aynı Gün Teslimat Saatleri', 'Bölgesel Kargo Ücretleri'],
  },

  // Stok ve Depo
  '/inventory/warehouses': {
    title: 'Depo Tanımları',
    category: 'Stok ve Depo Yönetimi',
    description: 'Merkez depo, soğuk hava deposu ve şube depolarının lokasyon ve raf tanımları.',
    badge: 'Depo Ağı',
    features: ['Soğuk Hava Deposu Sıcaklık Takibi', 'Raf & Göz Adresleme', 'Depolar Arası Transfer', 'Sorumlu Personel'],
  },
  '/inventory/transactions': {
    title: 'Stok Hareketleri ve Fişler',
    category: 'Stok ve Depo Yönetimi',
    description: 'Üreticiden mal kabul fişleri, fire / zayiat kayıtları ve depo transfer geçmişi.',
    badge: 'Stok Fişleri',
    features: ['Mal Kabul Fişi (Giriş)', 'Fire / Son Kullanma Çıkışı', 'Depo Transfer Fişi', 'Sayım Fark Fişi'],
  },
  '/inventory/alerts': {
    title: 'Kritik Stok Uyarıları',
    category: 'Stok ve Depo Yönetimi',
    description: 'Emniyet stok limitinin altına düşen taze sebze, meyve ve şarküteri ürünleri.',
    badge: 'Kritik Uyarılar',
    features: ['Otomatik Tedarikçi Sipariş Önerisi', 'E-Posta / SMS Bildirimi', 'Kritik Eşik Ayarları', 'Son Kullanma Tarihi (SKT) Alarmı'],
  },

  // CRM
  '/crm/customers': {
    title: 'Müşteri Listesi',
    category: 'Müşteri İlişkileri ve Destek (CRM)',
    description: 'Kayıtlı tüm müşteriler, iletişim bilgileri, sipariş geçmişi ve toplam harcama tutarları.',
    badge: 'Müşteri Tabanı',
    features: ['Detaylı Müşteri Profili', 'Sipariş Geçmişi', 'İletişim İzinleri (KVKK / İYS)', 'Müşteri Notları'],
  },
  '/crm/segments': {
    title: 'Müşteri Segmentleri',
    category: 'Müşteri İlişkileri ve Destek (CRM)',
    description: 'VIP organik tüketiciler, haftalık aboneler, pasif müşteriler ve yeni kayıtlılar.',
    badge: 'Segmentasyon',
    features: ['RFM Skorlama', 'Haftalık Abone Grubu', 'Terk Edilmiş Sepet Sahipleri', 'Hedefli Kampanya Gönderimi'],
  },
  '/crm/tickets': {
    title: 'Destek Biletleri (Tickets)',
    category: 'Müşteri İlişkileri ve Destek (CRM)',
    description: 'Müşteri soruları, şikayetler, teslimat gecikmeleri ve canlı destek kayıtları.',
    badge: 'Yardım Masası',
    features: ['Destek Talebi Yanıtlama', 'Öncelik Derecelendirme (Yüksek/Orta)', 'Departman Yönlendirme', 'Çözüm Süresi Raporu'],
  },
  '/crm/reviews': {
    title: 'Müşteri Değerlendirmeleri',
    category: 'Müşteri İlişkileri ve Destek (CRM)',
    description: 'Ürün yorumları, puanlamalar, fotoğraf değerlendirmeleri ve onay mekanizması.',
    badge: 'Yorumlar & Puan',
    features: ['Yorum Onaylama / Gizleme', 'Fotoğraflı Ürün Yorumları', 'Satıcı Yanıtı Ekleme', 'Ortalama Mağaza Puanı'],
  },

  // Pazarlama
  '/marketing/coupons': {
    title: 'İndirim Kuponları',
    category: 'Pazarlama ve Kampanya Yönetimi',
    description: 'Yüzdelik indirim, sabit tutar indirimi ve sepette ücretsiz kargo kuponları oluşturun.',
    badge: 'Kuponlar',
    features: ['Kupon Kodu Üretici', 'Minimum Sepet Tutarı Kuralı', 'Kullanım Limiti (Kişi Başı / Toplam)', 'Geçerlilik Tarihi'],
  },
  '/marketing/campaigns': {
    title: 'Promosyon ve Kampanyalar',
    category: 'Pazarlama ve Kampanya Yönetimi',
    description: '3 Al 2 Öde, Belirli Kategoride %20 İndirim ve Sepet Promosyonlarını kurgulayın.',
    badge: 'Kampanyalar',
    features: ['X Al Y Öde Kurguları', 'Hediye Ürün Promosyonu', 'Otomatik Sepet İndirimi', 'Kampanya Banner Eşleştirme'],
  },
  '/marketing/flash-sales': {
    title: 'Flaş İndirimler',
    category: 'Pazarlama ve Kampanya Yönetimi',
    description: 'Geri sayım sayaçlı, saatlik ve günlük taze ürün flaş indirim fırsatları.',
    badge: 'Flaş İndirim',
    features: ['Geri Sayım Sayacı (Countdown)', 'Sınırlı Stoklu İndirim', 'Saatlik Kampanya Planlama', 'Bildirim Gönderimi'],
  },
  '/marketing/loyalty': {
    title: 'Sadakat ve Puan Programı',
    category: 'Pazarlama ve Kampanya Yönetimi',
    description: 'Her organik alışverişte puan kazanımı, tavsiye et kazan (Referral) sistemi.',
    badge: 'Puan & Ödül',
    features: ['Harcama Başına Puan Oranı', 'Arkadaşını Getir Bonusu', 'Puanı İndirime Dönüştürme', 'Sadakat Seviyeleri (Bronze/Gold)'],
  },
  '/marketing/newsletters': {
    title: 'E-Bülten & SMS Gönderimi',
    category: 'Pazarlama ve Kampanya Yönetimi',
    description: 'Haftalık taze hasat bültenleri, SMS ve e-posta pazarlama duyuruları.',
    badge: 'Pazarlama İletişimi',
    features: ['Şablon Editörü', 'Segment Bazlı Gönderim', 'Açılma & Tıklanma Oranları', 'İYS İzinli Numara Listesi'],
  },

  // Raporlama
  '/analytics/sales': {
    title: 'Satış Analitiği',
    category: 'Raporlama ve Analitik',
    description: 'Günlük, haftalık ve aylık sipariş adetleri, satış trendleri ve kanal dağılımı.',
    badge: 'Satış Grafiği',
    features: ['Dönemsel Satış Karşılaştırması', 'Kanal Bazlı Gelir Dağılımı', 'Ödeme Yöntemi Tercihleri', 'Saatlik Satış Yoğunluğu'],
  },
  '/analytics/revenue': {
    title: 'Gelir ve Ciro Raporu',
    category: 'Raporlama ve Analitik',
    description: 'Net ciro, brüt kâr marjları, vergi ve kargo giderleri dökümü.',
    badge: 'Finans',
    features: ['Net vs Brüt Ciro', 'Kategori Kâr Marjları', 'İptal / İade Finansal Etkisi', 'Muhasebe Dışa Aktarımı'],
  },
  '/analytics/products': {
    title: 'Ürün Performans Analizi',
    category: 'Raporlama ve Analitik',
    description: 'En çok satan organik ürünler, sepetten terk edilen ürünler ve stok devir hızı.',
    badge: 'Ürün Analitiği',
    features: ['Top 20 En Çok Satan', 'Stok Devir Süresi', 'Düşük Performanslı Ürünler', 'Sepete Eklenme / Satış Dönüşümü'],
  },
  '/analytics/traffic': {
    title: 'Ziyaretçi ve Sepet Analitiği',
    category: 'Raporlama ve Analitik',
    description: 'Mağaza ziyaretçi sayısı, terk edilen sepet analizleri ve dönüşüm oranları (CR).',
    badge: 'Dönüşüm Oranı',
    features: ['Terk Edilmiş Sepet Tutarı', 'Ziyaretçi -> Sipariş Dönüşümü', 'Cihaz Dağılımı (Mobil / Masaüstü)', 'Trafik Kaynakları'],
  },

  // Güvenlik & Ayarlar
  '/settings/security': {
    title: 'İki Aşamalı Doğrulama (2FA) & Güvenlik',
    category: 'Rol, Güvenlik ve Sistem Ayarları',
    description: 'Yönetici oturum açma güvenlik politikaları, 2FA zorunluluğu ve IP kısıtlamaları.',
    badge: 'Güvenlik Protokolü',
    features: ['Zorunlu 2FA Aktivasyonu', 'Yönetici IP Beyaz Listesi', 'Şifre Karmaşıklık Kuralları', 'Aktif Oturumları Sonlandırma'],
  },
  '/settings/payments': {
    title: 'Ödeme ve Fatura Entegrasyonları',
    category: 'Rol, Güvenlik ve Sistem Ayarları',
    description: 'Kredi kartı POS altyapıları, E-Fatura / E-Arşiv entegratörleri ve komisyon oranları.',
    badge: 'Finansal Entegrasyon',
    features: ['Iyzico / PayTR / Stripe POS', 'Garanti BBVA & İş Bankası Sanal POS', 'Paraşüt / Sovos E-Fatura Entegrasyonu', 'Kapıda Ödeme ve Havale/EFT Ayarları'],
  },
  '/settings/invoicing': {
    title: 'E-Fatura & Mali Ayarlar',
    category: 'Rol, Güvenlik ve Sistem Ayarları',
    description: 'GİB uyumlu e-Arşiv, e-Fatura seri numaraları, vergi dairesi ve şirket unvan bilgileri.',
    badge: 'Mali Yapılandırma',
    features: ['GİB Portalı Kimlik Bilgileri', 'Fatura Şablonu & Logo', 'Tevkifat & Stopaj Ayarları', 'Otomatik Fatura Kesme Kuralı'],
  },
  '/settings/general': {
    title: 'Genel Sistem ve API Ayarları',
    category: 'Rol, Güvenlik ve Sistem Ayarları',
    description: 'Mağaza genel bilgileri, para birimi, çalışma saatleri, webhook ve API entegrasyon anahtarları.',
    badge: 'Sistem Konfigürasyonu',
    features: ['Mağaza Adı & İletişim', 'REST API Anahtarları (Bearer Token)', 'Webhook Olay Bildirimleri', 'Sistem Bakım Modu'],
  },
};

export const ModulePlaceholderPage: React.FC = () => {
  const location = useLocation();
  const config = MODULE_CONFIGS[location.pathname] || {
    title: 'Modül Sayfası',
    category: 'Yönetim Modülü',
    description: 'Bu sayfa yapılandırılmış ve kullanıma hazır modül şablonudur.',
    badge: 'Aktif Modül',
    features: ['Otomatik Veri Senkronizasyonu', 'İşlem Yetki Kontrolü', 'Loglama & İzlenebilirlik', 'Dışa Aktarma'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Breadcrumb & Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.colors.taupe, marginBottom: '8px' }}>
          <Link to="/dashboard" style={{ color: theme.colors.primary, textDecoration: 'none', fontWeight: 600 }}>
            Ana Sayfa
          </Link>
          <span>/</span>
          <span>{config.category}</span>
          <span>/</span>
          <span style={{ color: theme.colors.espresso, fontWeight: 600 }}>{config.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
                {config.title}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: theme.radii.full,
                  backgroundColor: theme.colors.primarySubtle,
                  color: theme.colors.primary,
                  border: '1px solid #D5E5D4',
                }}
              >
                {config.badge}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
              {config.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '9px 18px',
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgCard,
                color: theme.colors.espresso,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Dışa Aktar (Excel)
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
              }}
            >
              + Yeni İşlem Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Feature & KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
        {config.features.map((feature, idx) => (
          <div
            key={idx}
            style={{
              padding: '18px 20px',
              backgroundColor: theme.colors.bgCard,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.primarySubtle,
                color: theme.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.espresso }}>{feature}</div>
              <div style={{ fontSize: '11px', color: theme.colors.taupe }}>Aktif & Yapılandırılmış</div>
            </div>
          </div>
        ))}
      </div>

      {/* Special Content for Payments & Integrations */}
      {location.pathname === '/settings/payments' && (
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '16px' }}>
            💳 Bağlı Ödeme Ağ Geçitleri & E-Fatura Entegratörleri
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
            {[
              { name: 'PayTR Sanal POS', status: 'Bağlı (Canlı Mod)', type: 'Kredi / Banka Kartı', color: theme.colors.primary, bg: theme.colors.primarySubtle },
              { name: 'Iyzico Checkout', status: 'Bağlı (Canlı Mod)', type: 'Kredi Kartı + Taksit', color: theme.colors.primary, bg: theme.colors.primarySubtle },
              { name: 'Paraşüt E-Fatura', status: 'Senkronize', type: 'E-Arşiv & E-Fatura', color: theme.colors.cedar, bg: '#F5F2EF' },
              { name: 'Sovos / Foriba', status: 'Yedek Servis', type: 'Mali Mühür & GİB', color: theme.colors.taupe, bg: theme.colors.bgSurface },
            ].map((gate, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>{gate.name}</div>
                  <div style={{ fontSize: '12px', color: theme.colors.taupe, marginTop: '2px' }}>{gate.type}</div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: theme.radii.xs,
                    backgroundColor: gate.bg,
                    border: `1px solid ${gate.color}`,
                    color: gate.color,
                  }}
                >
                  {gate.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table Preview Area */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.espresso, margin: 0 }}>
              {config.title} Kayıtları
            </h3>
            <span style={{ fontSize: '12px', color: theme.colors.taupe }}>
              Son senkronize edilen modül verileri
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Kayıt ara..."
              style={{
                padding: '7px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.colors.taupe, backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, border: `1px dashed ${theme.colors.border}` }}>
          <div style={{ fontSize: '30px', marginBottom: '8px' }}>🌱</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso }}>
            {config.title} modülü aktif ve hazır.
          </div>
          <div style={{ fontSize: '12px', color: theme.colors.taupe, marginTop: '4px' }}>
            Organik operasyon ve canlı veri akış kuralları bağlandı.
          </div>
        </div>
      </div>
    </div>
  );
};
