# Tamamlanan İşler, Checkpoint'ler ve Geliştirme Günlüğü (YAPILANLAR)

> **Durum:** Canlı & Doğrulanmış Teslimat Kayıtları  
> **Son Güncelleme:** 12 Kasım 2026  
> **İlgili Yol Haritası (Yapılacaklar):** [YAPILACAKLAR_VE_FAZ_HARITASI.md](YAPILACAKLAR_VE_FAZ_HARITASI.md)  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 📌 Özet Durum Tablosu (Bugün Canlı Çalışan Modüller)

| Alan / Modül | Tamamlanma Durumu | Veritabanı Şeması & Tablolar | Backend & Frontend Bağlantısı |
|---|---|---|---|
| **Çekirdek Omurga & Docker** | ✅ %100 Tamamlandı | PostgreSQL 18 (Port 5433) | EF Core 10 + Onion Architecture + Vite Proxy |
| **Yönetici, Dinamik RBAC & Admin Login (`MOD-01`)** | ✅ %100 Tamamlandı | `admin` (`AdminUsers`, `Roles`, `ModulePermissions`, `RolePermissions`, `AuditLogs`) | `/admin/login`, `/admin/users`, `/admin/roles`, `/admin/audit-logs` |
| **Ürün & Menü Yönetimi (`MOD-03`)** | ✅ %100 Tamamlandı (5/5 Dilim) | `catalog` (`Products`, `Categories`, `ProductLots`, `StorageConditions`) | 5 Dikey Dilimin tamamı canlı PostgreSQL'e bağlı |
| **Stok & Envanter (`MOD-02`)** | 🚧 %20 Tamamlandı (1/5 Dilim) | `catalog` (`StockQuantity`) + `admin` (`AuditLogs`) | `/inventory` canlı bağlı (Diğer 4 alt sekme Faz 2'de) |
| **Müşteri Vitrini & Storefront** | ✅ %100 MVP Tamamlandı | `catalog`, `cart`, `orders`, `customer`, `content`, `promotions`, `experience`, `payments` | 10+ Ekran (Vitrin, Ürünler, Detay, Sepet, Ödeme, Profil, Auth) |
| **Slider & Vitrin Yönetimi (`MOD-05`)** | ✅ %100 Tamamlandı | `content` (`Banners`) | `/marketing/slider` + Canlı Bento Önizleme + Otomatik Karusel |
| **Mobil & Responsive Çekirdek** | ✅ %100 Tamamlandı | — | Çekmece (Drawer) Menü, Hamburger Butonu, Responsive Tablolar |

---

## 🏛️ AŞAMA 1: Çekirdek Altyapı, Onion Mimari ve Müşteri Backend Birleşimi (5–6 Kasım 2026)

### ✅ CHECKPOINT 1–3: Proje İskeleti, PostgreSQL 18 ve `Admin` Modülü
* Kök dizinde PostgreSQL 18 (`modular_admin_postgres`, Port: `5433`) ve pgAdmin 4 (`5050`) için `docker-compose.yml` ayağa kaldırıldı.
* `AdminUser` ve `AuditLog` domain varlıkları ile PBKDF2 SHA-256 şifreleme servisi (`IPasswordHasher`) yazıldı.
* `AdminDbContext` oluşturularak `"admin"` şeması ve `"__EFMigrationsHistory_Admin"` tablosu izole edildi.
* Minimal API uçları açıldı: `/api/admin/health`, `/api/admin/users`, `/api/admin/users/{id}/status`, `/api/admin/audit-logs`.

### ✅ CHECKPOINT 4–6: React 19 + TypeScript Frontend ve Vite Ters Proxy
* React 19, TypeScript ve Vite tabanlı admin frontend kuruldu (`frontend/`).
* `vite.config.ts` üzerinde Port `3000` -> Port `5000` ters proxy köprüsü yapılandırılarak CORS sorunu olmadan E2E bağlantı sağlandı.
* Yönetici ekleme, aktif/pasif yapma ve Audit Log denetim kayıtlarının canlı yazılması doğrulandı.

### ✅ CHECKPOINT 7: Klasik Onion Architecture ve `musteri_backend` Birleşimi
* Backend katmanları (`Domain`, `Application`, `Infrastructure`, `Endpoints`, `ApiHost`) klasik Onion Architecture modeline oturtuldu.
* Müşteri e-ticaret çekirdeğini barındıran modüller (`Catalog`, `Content`, `Customer`, `Cart`, `Orders`, `Payments`, `Promotions`, `Experience`) aynı `ApiHost` altında modüler şemalarla birleştirildi (`merge: musteri_backend`).

---

## 🌾 AŞAMA 2: Doğal Gıda Ürün ve Menü Yönetimi — 5 Dikey Dilim (6–9 Kasım 2026)

Bu fazda "Ürün ve Menü Yönetimi" menüsündeki tüm ekranlar geçici belleklerden arındırılmış ve uçtan uca canlı PostgreSQL `catalog` şemasına bağlanmıştır.

### ✅ CHECKPOINT 8 (1. Dikey Dilim): Gelişmiş Ürün Tanımlama & Tek Kaynak Doğrulaması
* **Rota & Ekran:** `/products/definition` ([`FoodProductPages.tsx`](../../frontend/src/pages/products/FoodProductPages.tsx) -> `ProductDefinitionPage`)
* **Backend & DB:** `AdminEndpointsHandler.cs` (`/api/admin/products`) doğrudan müşteri vitrininin kullandığı **`catalog."Products"`** tablosuna bağlandı.
* **Özellikler:**
  - Tartılı (`Kg`, `Gramaj`), Hacimsel (`Litre`) ve Paketli (`Adet`) doğal gıda ürün tanımlama.
  - SKU, barkod, taban fiyat, satış fiyatı ve kategori atama.
  - **Single Source of Truth:** Admin panelinden eklenen ve `"Aktif"` olan ürünler anında müşteri vitrininin kullandığı `GET /api/catalog/products` yanıtında listelenir hale getirildi.

### ✅ CHECKPOINT 9 (2. Dikey Dilim): Stok ve Envanter Yönetimi (`/inventory`)
* **Rota & Ekran:** `/inventory` ([`InventoryPage.tsx`](../../frontend/src/pages/inventory/InventoryPage.tsx), [`inventoryService.ts`](../../frontend/src/services/inventoryService.ts))
* **Backend Uçları:**
  - `GET /api/admin/inventory`: Ürün ID, Ad, SKU, Kategori, `StockQuantity`, `UnitInfo` ve isteğe bağlı kritik stok eşiği filtresiyle sayfalanmış liste.
  - `PATCH /api/admin/inventory/{id}/stock`: Gelen `delta` veya `newQuantity` değerine göre stoğu güncelleyen, 0'ın altına düşürmeyen ve işlemi `admin."AuditLogs"` tablosuna `'StockUpdated'` aksiyonuyla kaydeden uç.
* **Temizlik:** Eski tarayıcı hafızasına (`localStorage` / `ProductInventoryStore.ts`) dayalı geçici mekanizma tamamen kaldırıldı. Hızlı `+1 / -1` butonları doğrudan PostgreSQL'e yazacak şekilde bağlandı.

### ✅ CHECKPOINT 10 (3. Dikey Dilim): İçerik, Alerjen ve 100g Besin Değerleri
* **Rota & Ekran:** `/products/allergens-nutrition` (`AllergensNutritionPage`, [`productService.ts`](../../frontend/src/services/productService.ts))
* **Veritabanı & Migration:** `20261109094455_Add_Product_Allergens_And_Nutrition` migration'ı ile `catalog."Products"` tablosuna eklendi:
  - `Ingredients` (text, içindekiler listesi)
  - `Allergens` (text[], örn: Gluten, Laktoz, Kuruyemiş, Soya)
  - `Certifications` (text[], örn: Organik Sertifikalı, Vegan, Taş Baskı)
  - `NutritionalValues` (jsonb: `EnergyKcal`, `Fat`, `SaturatedFat`, `Carbohydrates`, `Sugar`, `Protein`, `Salt`)
* **Backend Uçları:** `GET /api/admin/products/{id}/details` ve `PUT /api/admin/products/{id}/details` (`admin."AuditLogs"` -> `'ProductDetailsUpdated'`).
* **Frontend:** Yasal etiketleme bileşenleri, hızlı alerjen/sertifika çipleri ve 100g Besin Öğeleri Değerleri düzenleme kartı.

### ✅ CHECKPOINT 11 (4. Dikey Dilim): STT / TETT ve Parti (Lot) Takibi
* **Rota & Ekran:** `/products/lot-expiry` (`LotExpiryTrackingPage`, [`lotService.ts`](../../frontend/src/services/lotService.ts))
* **Veritabanı & Migration:** `20261109104241_Add_Product_Lots_Table` migration'ı ile `catalog."ProductLots"` tablosu oluşturuldu (`Id`, `ProductId`, `LotNumber`, `ProductionDate`, `ExpiryDate`, `Quantity`, `Status`, `CreatedAtUtc`).
* **Backend Uçları:**
  - `GET /api/admin/lots`: Ürün, durum (`Active`, `NearExpiry`, `Expired`, `WrittenOff`), kalan gün ve arama filtreleriyle partileri ve özet metrikleri döner.
  - `POST /api/admin/lots`: Yeni parti girişi yapar, bağlı ürünün `catalog."Products"."StockQuantity"` değerini otomatik artırır ve `'ProductLotCreated'` audit logu yazar.
  - `PATCH /api/admin/lots/{id}/status`: Partiyi `'WrittenOff'` (Fire/İmha) veya `'NearExpiry'` durumuna günceller (fire durumunda ürün stoğunu parti miktarı kadar düşer).
* **Frontend:** Üst özet metrik kartları, kalan gün hesaplamalı sakin rozetler (<7 gün amber, tarihi geçmiş kırmızı) ve `+ Yeni Parti Girişi` modalı.

### ✅ CHECKPOINT 12 (5. Dikey Dilim): Saklama Koşulları ve Depo Raf Takibi
* **Rota & Ekran:** `/products/storage-conditions` (`StorageConditionsPage`, [`storageService.ts`](../../frontend/src/services/storageService.ts))
* **Veritabanı & Migration:** `20261109110148_Add_Storage_Conditions_Table` migration'ı ile `catalog."StorageConditions"` tablosu kuruldu; `catalog."Products"` tablosuna `StorageConditionId` (UUID?) ve `ShelfLocation` (varchar 100) eklendi.
* **Seed Verisi:** 4 temel doğal gıda saklama şablonu eklendi (`Kuru Gıda & Bakliyat`, `Soğuk Muhafaza`, `Dondurulmuş / Donuk`, `Serin Mahzen & Taze Manav`).
* **Backend Uçları:** `GET/POST /api/admin/storage-conditions`, `GET /api/admin/storage-conditions/products`, `PATCH /api/admin/products/{id}/storage` (`admin."AuditLogs"` -> `'ProductStorageUpdated'`).
* **Frontend:** 4 canlı saklama koşulu kartı (tıklandığında tabloyu filtreler), ürün bazlı sıcaklık aralığı / soğuk zincir / raf koordinatı (`📍 Kiler-A / Sıra-3`) tablosu ve düzenleme modalı.

---

## 📱 AŞAMA 3: Mobil Uyumluluk ve Responsive Shell Optimizasyonu (9 Kasım 2026)

### ✅ CHECKPOINT 13: Mobil Çekmece Menü (Drawer) ve Esnek Arayüz
* **Sorun Çözümü:** Sabit 270px genişliğindeki Sidebar'ın dar ekranlarda içerik alanını sıkıştırması sorunu giderildi.
* **Shell Mimarisi ([`MainLayout.tsx`](../../frontend/src/components/layout/MainLayout.tsx), [`Sidebar.tsx`](../../frontend/src/components/layout/Sidebar.tsx), [`Header.tsx`](../../frontend/src/components/layout/Header.tsx)):**
  - `1024px` ve altındaki ekranlarda Sidebar ekran dışına gizlenir (`translateX(-100%)`).
  - Üst bara mobil hamburger butonu (`☰`) ve çekmece içine kapatma (`✕`) butonu eklendi.
  - Açılışta ekranı kaplayan yarı saydam backdrop eklendi; sayfa seçildiğinde menü otomatik kapanır.
* **Sayfa İyileştirmeleri ([`responsive.css`](../../frontend/src/styles/responsive.css)):**
  - Başlık, rozet ve arama kutularına esnek sarmalama (`flex-wrap: wrap`) ve `clamp` boyutlandırma uygulandı.
  - Grid yapıları `minmax(min(100%, ...), 1fr)` ile tek sütuna kırılır hale getirildi.
  - Tüm tablolara dokunmatik yatay kaydırma (`overflow-x: auto`) desteği eklendi.

---

---

## ⭐ AŞAMA 5: CRM Müşteri Değerlendirmeleri ve Dashboard Entegrasyonu (11 Kasım 2026)

### ✅ CHECKPOINT 14: Düşük Puanlı Müşteri Yorumları (Dashboard Takibi) & Tüm Yorumlar (/crm/reviews)
* **Veritabanı & Migration:** `experience."Reviews"` tablosuna `AdminResponse` ve `RespondedAtUtc` kolonları eklendi (`20261111132129_Add_AdminResponse_To_Reviews`), `customer` ve `experience` şemaları PostgreSQL 5433'e uygulandı.
* **Backend Uçları ([`AdminEndpointsHandler.cs`](../../backend/src/Endpoints/Admin/AdminEndpointsHandler.cs), [`AdminReviewService.cs`](../../backend/src/Infrastructure/Services/Admin/AdminReviewService.cs)):**
  - `GET /api/admin/reviews/dashboard-attention`: Genel mağaza ortalama puanını (`averageStoreRating`), incelenmemiş düşük puanlı sayısını (`unresolvedNegativeCount`) ve sadece `Rating <= 3` olan son 5 müdahale bekleyen yorumu döner.
  - `POST /api/admin/reviews/{id}/quick-response`: Satıcı yanıtı ekler ve/veya yorumu `'Reviewed'` (İncelendi) durumuna geçirir; `admin."AuditLogs"` tablosuna `'ReviewResponded'` / `'ReviewMarkedAsReviewed'` yazar.
  - `GET /api/admin/reviews` & `PATCH /api/admin/reviews/{id}/status`: `/crm/reviews` detay sayfası için 1–5 yıldız tüm yorumların filtrelenebilir listesi.
* **Frontend Ekranları:**
  - **Dashboard (`DashboardPage.tsx`):** Üstte "Müşteri Memnuniyeti" KPI kartı (⭐ Ortalama Puan + soft amber uyarı rozeti) ve "Dikkat Gerektiren Müşteri Geri Bildirimleri (1-3 Yıldız)" müdahale widget'ı, hızlı yanıt modalı ve `/crm/reviews` yönlendirme butonları bağlandı.
  - **Müşteri Değerlendirmeleri (`CustomerReviewsPage.tsx`):** `/crm/reviews` rotasına bağlı tam özellikli 1–5 yıldız yorum listesi, arama/puan/durum filtreleri ve yanıt yönetimi.

---

## 🛒 AŞAMA 6: Müşteri Deneyimi, E-Ticaret Mağazası ve Storefront MVP (10–11 Kasım 2026)

👉 **Ayrıntılı Müşteri Şartnamesi:** [docs/03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md](../03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md) · [docs/MUSTERI_MODULU.md](../MUSTERI_MODULU.md)

### ✅ CHECKPOINT 15: Müşteri Backend Altyapısı (.NET 10, 8 Modül & PostgreSQL)
* **Commit:** `8f5511e` (`musteri backend oluşturuldu`)
* **Modüller & Şemalar:** `catalog`, `cart`, `customer`, `orders`, `promotions`, `content`, `experience`, `payments` şemaları kuruldu.
* **Minimal API Sözleşmeleri:** `/api/catalog/*` (ürünler & kategoriler), `/api/cart/*` (sepet & misafir sepeti), `/api/auth/*` ve `/api/customer/*` (JWT Auth, profil, adresler, favoriler), `/api/orders/*` (sipariş oluşturma), `/api/payments/*` (ödeme simülasyonu), `/api/experience/*` (yorumlar ve bülten).
* **Arka Plan Servisi:** `ReservationExpiryWorker` ile sepette kalan ürünlerin stok rezervasyonlarının 30 dakika sonra otomatik düşürülüp iade edilmesi sağlandı.
* **Katalog Birleşimi:** `d1fc598` ile Admin ürün yönetiminin doğrudan müşteri vitriniyle aynı `catalog."Products"` tablosunu yönetmesi sağlandı (Single Source of Truth).

### ✅ CHECKPOINT 16: Müşteri Mağazası Frontend Arayüzü (React 19 + TypeScript + Tailwind)
* **Commit:** `5a6f0fc` (`müsteri frontend tamamlandi`)
* **Ekranlar & Rotalar:**
  - Ana Sayfa Vitrini (`/` - `StorefrontPage.tsx`): Bento köy sofrası vitrini, güven bantları, kategori kartları, çok satanlar, üretici spotu, mevsim lezzetleri.
  - Ürün Kataloğu (`/products` - `ProductsPage.tsx`): Yöre, kategori, fiyat filtreleri, anlık metin arama, sıralama ve sayfalama.
  - Ürün Detay (`/products/:slug` - `ProductDetailPage.tsx`): Fotoğraf galerisi, gramaj/ambalaj seçicisi, yasal 100g besin değerleri, alerjen rozetleri, kullanıcı değerlendirmeleri.
  - Sepet Ekranı (`/cart` - `CartPage.tsx`): Dinamik ücretsiz kargo barı (750 TL eşiği), kupon kodu alanı, miktar yönetimi.
  - Ödeme / Kasa (`/odeme` - `CheckoutPage.tsx`): Teslimat adresi seçimi, kart bilgileri simülasyonu, sipariş tamamlama.
  - Bizim Hikâyemiz (`/hikayemiz` - `OurStoryPage.tsx`): Yerel kooperatifler ve geleneksel üretim felsefesi.
  - Giriş & Kayıt (`/giris`, `/uye-ol` - `AuthPage.tsx`): Müşteri JWT kimlik doğrulama, form validasyonu.
  - Hesabım Portali (`/hesabim/*` - `AccountPage.tsx`): Profilim, Siparişlerim, Adreslerim, Favorilerim ve Değerlendirmelerim.
  - Gezinme & Çekirdek: Kategori mega menülü `StorefrontHeader.tsx`, SVG sebze animasyonlu `HomeLoadingOverlay.tsx` açılış ekranı.

### ✅ CHECKPOINT 17: Kusursuz Otantik Doğal Gıda Görselleri
* Eski mockup arayüzlerinden ekran görüntüsü alınarak kırpılmış ve piksellerine *"18 Ürün"*, *"12 Ürün"*, tarayıcı üst bantları gömülmüş görseller tamamen temizlendi.
* Yapay zeka destekli profesyonel stüdyo ve köy sofrası fotoğrafçılığı ile 6 kategori görseli (`cat-kahvaltilik`, `cat-zeytinyagi`, `cat-salca`, `cat-bal-recel`, `cat-bakliyat`, `cat-kuruyemis`), 6 ürün görseli (`product-zeytinyagi`, `product-salca`, `product-kasar`, `product-cam-bali`, `product-tereyagi`, `product-eriste`) ve hikâye görseli (`mehmet-ali-dayi`) sıfırdan yüksek çözünürlükte üretilerek sisteme entegre edildi.

---

## 🔐 AŞAMA 7: Dinamik Rol & Modül Yetkilendirme (RBAC) ve İzole Admin Giriş Sistemi (12 Kasım 2026)

### ✅ CHECKPOINT 18: Dinamik RBAC Altyapısı (Veritabanı, API & Yetki Matrisi)
* **Veritabanı & Migration (`admin` Şeması):** `Role`, `ModulePermission` ve `RolePermission` tabloları ile `AdminUser.CustomRoleName` alanı eklendi (`20261112120222_Add_Dynamic_RBAC_Tables`, `20261112132036_Seed_AdminUsers_And_CustomRole`, `20261112133841_Seed_Remaining_Module_Permissions`).
* **Seed Edilen Modül Anahtarları (9 Adet):** `products.view`, `inventory.view`, `storage.view`, `crm.reviews`, `crm.manage`, `finance.reports`, `orders.view`, `marketing.view`, `users.manage`.
* **Seed Edilen Varsayılan Roller:** `SuperAdmin`, `BranchManager` (Şube Müdürü), `WarehouseStaff` (Depo Personeli).
* **Backend Güvenliği & Uçlar ([`AdminEndpointsHandler.cs`](../../backend/src/Endpoints/Admin/AdminEndpointsHandler.cs), [`AdminRbacService.cs`](../../backend/src/Infrastructure/Services/Admin/AdminRbacService.cs), [`PermissionEndpointFilter.cs`](../../backend/src/Endpoints/Admin/PermissionEndpointFilter.cs)):**
  - `GET /api/admin/roles`, `POST /api/admin/roles` (arayüzden yeni özel rol ekleme), `GET /api/admin/permissions`, `PUT /api/admin/roles/{roleId}/permissions` (`RolePermissionsUpdated` audit logu), `GET /api/admin/auth/me/permissions`.
  - Korumalı minimal API uçlarına `.RequirePermission(...)` eklendi; `SuperAdmin` / `Root` rolü tüm kontrolleri bypass eder.
  - **Fail-Closed Güvenlik Politikası:** `admin."Roles"` tablosunda karşılığı bulunmayan roller (`Admin`, `Moderator` veya tanımsız roller) varsayılan olarak boş izin listesi (`[]`) ve `403 Forbidden` alır.

### ✅ CHECKPOINT 19: İzole `/admin/login` Giriş Akışı, Tek Adımda Rol+Kullanıcı Oluşturma & Sıkı Modül İzolasyonu
* **İzole Kimlik Doğrulama:** Müşteri vitrinindeki `/giris` (`kk_access_token`) yapısından tamamen bağımsız `POST /api/admin/auth/login` ucu ve [`AdminLoginPage.tsx`](../../frontend/src/pages/admin/AdminLoginPage.tsx) (`/admin/login`) kuruldu. Başarılı/başarısız girişler `admin."AuditLogs"` tablosuna (`AdminLoginSuccess` / `AdminLoginFailed`) yazılır.
* **Seed Test Hesapları:**
  - `superadmin@naturalfood.local` / `Admin123!` (`SuperAdmin`)
  - `sube.muduru@naturalfood.local` / `Sube123!` (`BranchManager`)
  - `depo@naturalfood.local` / `Depo123!` (`WarehouseStaff`)
* **Frontend Oturum & Rota Koruması ([`PermissionContext.tsx`](../../frontend/src/context/PermissionContext.tsx), [`Sidebar.tsx`](../../frontend/src/components/layout/Sidebar.tsx), [`App.tsx`](../../frontend/src/App.tsx), [`DashboardPage.tsx`](../../frontend/src/pages/dashboard/DashboardPage.tsx)):**
  - Oturum bilgisi `nf_admin_session` anahtarıyla saklanır; `/api/admin/*` çağrılarına otomatik `Authorization` + `X-Admin-Role` başlıkları eklenir (`rbacService.ts`).
  - `AdminAuthGuard` aktif oturumu olmayan istekleri `/admin/login` sayfasına yönlendirir; `PermissionGuard` ise yetkisi olmayan sayfalarda `Yetkisiz Erişim` uyarısı gösterir.
  - Sidebar menüleri ve Dashboard KPI/işlem kartları (`orders.view`, `finance.reports`, `inventory.view`, `products.view`, `crm.reviews`) aktif rol izinlerine göre dinamik filtrelenir; pencere odağa döndüğünde yetkiler sessizce senkronize edilir.
* **Yönetim Ekranı İyileştirmeleri ([`RolePermissionsPage.tsx`](../../frontend/src/pages/admin/RolePermissionsPage.tsx), [`UsersPage.tsx`](../../frontend/src/pages/admin/UsersPage.tsx)):**
  - `+ Yeni Rol Ekle` penceresine **"Bu rol için ilk kullanıcıyı da oluştur"** (ad soyad, e-posta, şifre) seçeneği eklenerek yeni rol + giriş hesabı tek adımda oluşturulabilir hale getirildi.
  - `UsersPage.tsx` `+ Yeni Yönetici Ekle` formundaki rol seçimi tüm built-in ve özel rolleri (`CustomRoleName`) destekleyecek şekilde dinamikleştirildi.

---

## 📚 AŞAMA 8: Dokümantasyon Güncellemesi (9–12 Kasım 2026)
* Tüm teknik şartnameler, `docs/README.md` ve devir rehberi belgeleri yapılan dikey dilimlerle senkronize edildi.
* **Yapılanlar** ([`YAPILANLAR_VE_TAMAMLANANLAR.md`](YAPILANLAR_VE_TAMAMLANANLAR.md)) ve **Yapılacaklar / Faz Haritası** ([`YAPILACAKLAR_VE_FAZ_HARITASI.md`](YAPILACAKLAR_VE_FAZ_HARITASI.md)) ayrı sayfalara bölündü.

---

## 🎨 AŞAMA 9: Ana Sayfa Hero Slider & Vitrin Yönetim Modülü (13 Kasım 2026)

### ✅ CHECKPOINT 20: Admin Hero Slider Yönetimi & Dinamik Vitrin Entegrasyonu
* **Kullanıcı Talebi:** Admin paneline yeni bir modül eklenmesi; adminin ana sayfada yer alan slider/hero vitrini (başlık, alt başlık, rozet, özellik etiketleri, butonlar ve yönlendirme linkleri, görsel yükleme veya URL seçimi, sıra ve aktiflik durumu) değiştirip güncelleyebilmesi.
* **Veritabanı & Entity Geliştirmesi (`content."Banners"` Tablosu):**
  - `Domain/Entities/Content/Banner.cs` varlığına `BadgeText`, `Features` (virgülle ayrılmış etiketler), `SecondaryButtonText`, `SecondaryTargetUrl` alanları ve `Update(...)` metodu eklendi.
  - `Infrastructure/Persistence/Configurations/Content/ContentConfigurations.cs` EF Core yapılandırmaları ve `Application/Content/DTOs/ContentDtos.cs` DTO sözleşmeleri güncellendi.
  - `DependencyInjection.cs` üzerinden kullanıcının paylaştığı otantik köy sofrası görseli (`/images/hero-bento-showcase.png`) ve metinleri varsayılan 1. slayt (`b1`), geleneksel odun ateşi salça görseli ise 2. slayt (`b2`) olarak seed edildi.
  - `Program.cs` içerisine `InitializeContentModuleDatabaseAsync` eklenerek `content` şeması ve `content."Banners"` tablosunun otomatik ayağa kaldırılması sağlandı.
* **Admin Minimal API Uçları ([`AdminEndpointsHandler.cs`](../../backend/src/Endpoints/Admin/AdminEndpointsHandler.cs)):**
  - `GET /api/admin/banners`: Tüm banner'ları sıralı listeleme (`marketing.view` izni korumalı).
  - `GET /api/admin/banners/{id}`: Tekil banner detayını getirme.
  - `POST /api/admin/banners`: Yeni vitrin slaytı oluşturma + `AuditLog` kaydı (`BannerCreated`).
  - `PUT /api/admin/banners/{id}`: Banner metin, görsel, buton ve sıralamasını güncelleme + `AuditLog` kaydı (`BannerUpdated`).
  - `PATCH /api/admin/banners/{id}/status`: Banner'ı anında aktif/pasif yapma + `AuditLog` kaydı (`BannerStatusChanged`).
  - `DELETE /api/admin/banners/{id}`: Banner silme + `AuditLog` kaydı (`BannerDeleted`).
  - `POST /api/admin/banners/upload-image`: Görsel dosyasını doğrudan `wwwroot/images/banners` ve `frontend/public/images/banners` dizinlerine yükleyip relative URL dönen uç.
* **Admin Paneli Arayüzü ([`BannerSliderPage.tsx`](../../frontend/src/pages/marketing/BannerSliderPage.tsx)):**
  - **Rota:** `/marketing/slider` (Sidebar menüsünde *"PAZARLAMA VE KAMPANYA YÖNETİMİ"* altında *"Slider & Vitrin Yönetimi"* başlığıyla entegre edildi).
  - **Canlı Bento Önizleme (Live Bento Hero Preview):** Admin formda metinleri, rozeti, etiketleri veya görseli değiştirirken anında ana sayfada nasıl görüneceğini birebir yansıtan interaktif görsel bento önizleme kutusu.
  - **Hazır Doğal Gıda Görsel Presetleri:** Dosya yüklemenin yanında tek tıkla seçilebilen yüksek çözünürlüklü vitrin görselleri (`hero-bento-showcase.png`, `hero-anadolu-sofrasi.jpg`, vb.).
  - **Slayt Listesi:** Sıralama rozetleri, görsel önizlemesi, buton hedefleri, tek tıkla aktif/pasif anahtarı (toggle) ve silme/düzenleme işlemleri.
* **Müşteri Vitrini Dinamik Slayt Entegrasyonu ([`StorefrontPage.tsx`](../../frontend/src/pages/storefront/StorefrontPage.tsx)):**
  - Sabit kodlanmış hero alanı kaldırılıp `GET /api/content/banners` üzerinden gelen aktif slaytları dinamik render eden yapıya geçirildi.
  - Birden fazla slayt olduğunda 6 saniyede bir otomatik dönen, fare üzerine geldiğinde duraklayan (pause on hover), önceki/sonraki okları ve slayt gösterge noktaları (indicator dots) içeren akıcı bir karusel eklendi.
  - API yanıt vermezse veya liste boşsa hiçbir görsel bozulma olmadan şık varsayılan vitrine düşen güvenli fallback mekanizması kuruldu.
* **Hata Giderimi ([`MainLayout.tsx`](../../frontend/src/components/layout/MainLayout.tsx), [`adminApi.ts`](../../frontend/src/api/adminApi.ts), [`BannerSliderPage.tsx`](../../frontend/src/pages/marketing/BannerSliderPage.tsx)):**
  - Git pull sonrasında admin paneline girmeye çalışan yöneticileri yetkisiz sayıp müşteri `/giris` sayfasına atan çakışan kontrol, izole admin oturum kontrolü (`isAdminAuthenticated`) ile değiştirilerek buton ve sayfa kaymaları giderildi.
  - Slayt silme işleminde `HTTP 204 No Content` yanıtının `adminApi.ts` içerisindeki JSON ayrıştırıcıyı tetiklemesi ve modalın açık kalarak mükerrer istekte `404 Not Found` hatasına yol açması giderildi; backend silme ucu idempotent hale getirildi ve silme butonuna `isDeleting` kilidi eklendi.
