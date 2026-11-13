# MÜŞTERİ MODÜLÜ (STOREFRONT & E-TİCARET MAĞAZASI)

> **Dokümantasyon:** [docs/03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md)  
> **Durum:** ✅ MVP + Canlı Katalog, Sipariş Takibi ve Mobil UX Tamamlandı  
> **Son Güncelleme:** 13 Kasım 2026  
> **İlgili Yol Haritası:** [docs/00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md](00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md) · [YAPILANLAR_VE_TAMAMLANANLAR.md](00-devir-rehberi/YAPILANLAR_VE_TAMAMLANANLAR.md)

---

## 📌 Hızlı Bakış

Bu belge; projede atılan commit'ler (`8f5511e`, `7517f8e`, `d1fc598`, `5a6f0fc`, `3c30ad9` ve görsel iyileştirme çalışmaları) doğrultusunda geliştirilen **Müşteri E-Ticaret Mağazası (Storefront)** ve bağlı **Müşteri Backend** altyapısının eksiksiz mimari özetini, tamamlanan işlerini ve gerçek üretime geçiş için yapılacak faz planlamasını içerir.

Ayrıntılı teknik şartname ve kod haritası için:
👉 **[docs/03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md)**

---

## 🏛️ 1. Şu Ana Kadar Yapılanlar ve Tamamlananlar

### A. Müşteri Backend Altyapısı (.NET 10 & PostgreSQL 18)
* **8 Bağımsız Şema:** `catalog`, `cart`, `customer`, `orders`, `promotions`, `content`, `experience`, `payments` şemaları ve migration'ları kuruldu.
* **Minimal API Katmanı:**
  - `/api/catalog/*` (Hiyerarşik kategori ağacı, filtrelenebilir/sayfalanabilir ürünler, slug ile detay).
  - `/api/cart/*` (Misafir sepeti token'ı `X-Guest-Cart-Token`, miktar artır/azalt, kupon uygulama/kaldırma, kullanıcı girişinde otomatik sepet birleştirme `merge`).
  - `/api/auth/*` ve `/api/customer/*` (PBKDF2 SHA-256 şifreleme, JWT Access/Refresh Token, profil, adresler ve favoriler).
  - `/api/orders/*` ve `/api/payments/*` (Sipariş oluşturma, sipariş geçmişi ve kasa ödeme simülasyonu).
  - `/api/experience/*` ve `/api/content/*` (Ürün değerlendirmeleri, bülten aboneliği, vitrin banner'ları ve SSS).
* **Arka Plan İşçisi:** `ReservationExpiryWorker` ile sepette bekletilen stokların 30 dakika sonra otomatik serbest bırakılması sağlandı.
* **Single Source of Truth:** Admin panelinden tanımlanan ürün, stok ve parti bilgilerinin anında müşteri vitrinine yansıması garanti edildi.

### B. Müşteri Frontend Arayüzü (React 19, TypeScript, Tailwind)
* **10+ Tamamlanmış Ekran ve Bileşen:**
  - **Ana Sayfa Vitrini (`/`):** Bento köy sofrası vitrini, güven bantları, hover etkileşimli 6 kategori kartı, kompakt 4 sütunlu çok satanlar vitrini, üretici hikâyesi spotu, mevsim lezzetleri (`pageSize=100` canlı veri).
  - **Ürünler Kataloğu (`/products`):** Canlı `/api/catalog/products` bağlantısı, sunucu taraflı kategori/yöre (`Origin`)/fiyat filtreleri, sıralama, arama, sayfalama ve mobil uyumlu filtre çekmecesi.
  - **Ürün Detay (`/products/:slug`):** Fotoğraf galerisi, gramaj/ambalaj seçicisi, yasal 100g besin değerleri, alerjen rozetleri, kullanıcı yorumları.
  - **Sepet Sayfası (`/cart`):** Dinamik ücretsiz kargo ilerleme çubuğu (750 TL eşiği), kupon uygulama, ürün miktarı yönetimi.
  - **Ödeme Ekranı (`/odeme`):** İlk kayıtlı adresin otomatik seçimi + `+ Yeni adres ekle` seçeneği, Türkiye il/ilçe/mahalle kademeli adres seçimi, kart bilgileri simülasyonu, sipariş tamamlama.
  - **Sipariş Takip (`GuestOrderTrackingPage` / `/siparis-takip` & `/hesabim/siparisler`):** Canlı sipariş durum aşamaları ve sadeleştirilmiş zaman çizelgesi (`OrderWorkflowView`, `OrderCustomerDetail`).
  - **Bizim Hikâyemiz (`/hikayemiz`):** Yerel üretici kooperatifleri ve doğal gıda felsefesi.
  - **Giriş & Kayıt (`/giris`, `/uye-ol`):** Birleşik giriş ekranı, müşteri (`kk_access_token`) ve yönetici (`nf_admin_session`) oturum izolasyonu, form validasyonu.
  - **Hesabım Portali (`/hesabim/*`):** Mobil uyumlu sekme yapısı, Profilim, Siparişlerim (canlı takip entegreli), Adreslerim (il/ilçe/mahalle destekli), Favorilerim ve Değerlendirmelerim.
  - **Gezinme & Çekirdek:** Sadeleştirilmiş `StorefrontHeader` (mobil taşma düzeltmeleri, arama çubuğu sadeleştirmesi), SVG animasyonlu `HomeLoadingOverlay`, 404 sayfası.
* **Görsel Temizliği & Ürün Seed Kataloğu:** 6 birleştirilmiş kategori altında 37 ürün veritabanına seed edildi; ekran görüntüsü kırpıntılarından arındırılmış yüksek çözünürlüklü kategori, vitrin ve ürün görselleri (`frontend/public/images/products/`) sisteme entegre edildi.

---

## 🧭 2. Eksiklikler ve Gerçek Canlıya Çıkış Yol Haritası (Fazlar)

Sistemin gerçek para tahsilatı yapan, canlı kargo kuryesiyle çalışan ve tam donanımlı bir e-ticaret platformuna dönüşmesi için kalan eksiklikler **5 Faza** ayrılmıştır:

### 🟢 FAZ 1: Uçtan Uca Canlı Veri Kilidi (Mock Verilerden %100 Arınma)
* [x] Ana sayfa vitrini (`StorefrontPage`) ve ürün kataloğunun (`ProductsPage`) sunucu taraflı filtreleme, sayfalama ve `Origin` (Yöre) desteğiyle doğrudan `/api/catalog/products` ve `/api/catalog/categories` uçlarına bağlanması.
* [ ] `ProductDetailPage.tsx` içindeki kalan fallback/mock verilerin tamamen kaldırılıp canlı `/api/catalog/products/{slug}` verisine kilitlenmesi.
* [ ] Müşteri sepetinin `X-Guest-Cart-Token` ile doğrudan PostgreSQL `cart` şemasıyla canlı eşleşmesi ve üye girişi yapıldığında `POST /api/cart/merge` çağrısının otomatik tetiklenmesi.
* [ ] Canlı kupon indirimlerinin sepet toplamına backend `promotions` üzerinden yansıtılması.

### 💳 FAZ 2: Gerçek Finans ve Ödeme Entegrasyonu (Sanal POS & 3D Secure)
* [ ] `SimulatedPayment` yerine BDDK lisanslı gerçek Sanal POS sağlayıcısı (Iyzico / PayTR / Param) entegrasyonu.
* [ ] Banka SMS doğrulaması için 3D Secure callback akışları ve hata yönetimi.
* [ ] Başarılı ödeme sonrası yasal e-Fatura / e-Arşiv taslağının oluşturulması (Paraşüt / Foriba entegrasyonu).

### 🚚 FAZ 3: Lojistik, Kargo & Çok Kanallı Müşteri Bildirimleri
* [ ] Kargo firması API entegrasyonu (Yurtiçi / MNG / Kolay Gelsin) ile sipariş anında otomatik gönderi takip numarası ve barkod üretimi.
* [ ] Soğuk zincir gerektiren ürünler (peynir, tereyağı, kaymak) için otomatik buz akülü koruma seçimi ve kurye teslimat saat dilimleri.
* [ ] Netgsm / Twilio ile SMS ve SendGrid ile kurumsal e-posta bildirimleri (Sipariş Alındı, Kargoya Verildi).

### ⚡ FAZ 4: Arama Motoru Optimizasyonu (SEO), Sosyal Paylaşım ve PWA
* [ ] `react-helmet-async` ile dinamik meta etiketleri, OpenGraph kartları ve Schema.org `Product` JSON-LD zengin snippet'ları.
* [ ] Google Merchant Center için otomatik güncellenen XML ürün akışı (`/api/catalog/google-feed.xml`).
* [ ] Progressive Web App (PWA) desteği (mobil tarayıcılarda ana ekrana ekleme ve çevrimdışı önbellekleme).

### 🌟 FAZ 5: Müşteri Sadakati, CRM ve Dönüşüm Artırma (Growth & Retention)
* [ ] Teslim edilmiş siparişler için fotoğraflı müşteri değerlendirme ve puanlama arayüzü (`POST /api/experience/reviews`).
* [ ] Terk edilmiş sepet (Abandoned Cart) kurtarma için otomatik hatırlatma e-postaları.
* [ ] Alışverişlerden %3–%5 "Köy Puanı" kazanımı ve sonraki siparişlerde harcanabilmesi.
* [ ] Akıllı çapraz satış öneri modülü (*"Zeytinyağı ile iyi gider: Halhalı Zeytin"*).

---

> Ayrıntılı mimari, veritabanı şemaları ve ekran sözleşmeleri için lütfen **[docs/03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md)** şartnamesini inceleyiniz.

