# MODÜLER E-TİCARET ALTYAPISI — Mühendis ve Ekip Devir Teslim Rehberi (Master Hub)

> **Durum:** Yaşayan Ana Devir Belgesi  
> **Son Güncelleme:** 13 Kasım 2026  
> **Sorumlu:** Mimari & Çekirdek Ekip  
>
> **Dokümantasyon Hiyerarşisi:**
> * **Mimari & Altyapı:** [docs/01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md](01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md) · [docs/01-mimari-ve-altyapi/PLUGGABLE_SHELL_VE_FRONTEND_MIMARISI.md](01-mimari-ve-altyapi/PLUGGABLE_SHELL_VE_FRONTEND_MIMARISI.md)
> * **Tamamlanan İşler & Geliştirme Günlüğü (YAPILANLAR):** [docs/00-devir-rehberi/YAPILANLAR_VE_TAMAMLANANLAR.md](00-devir-rehberi/YAPILANLAR_VE_TAMAMLANANLAR.md)
> * **Faz Haritası & Yapılacak İşler (YAPILACAKLAR):** [docs/00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md](00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md)
> * **Hızlı Başlangıç & Devir (Onboarding):** [docs/00-devir-rehberi/DEVIR_REHBERI.md](00-devir-rehberi/DEVIR_REHBERI.md)
> * **Operasyon & Kasa Şartnamesi:** [docs/02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md)
> * **İş Alanları & Modül Şartnameleri:** [docs/03-is-alanlari-ve-yonetim/](03-is-alanlari-ve-yonetim/) (Ürün, Stok, Yönetici, [Müşteri & Storefront](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md))
> * **Test & Doğrulama Rehberleri:** [docs/04-test-ve-rehberler/E2E_TEST_VE_DOGRULAMA_REHBERI.md](04-test-ve-rehberler/E2E_TEST_VE_DOGRULAMA_REHBERI.md)
> * **Tarihsel Kararlar & Arşiv:** [docs/05-gecmis-ve-arsiv/GECMIS_KARARLAR_VE_MIGRATION_NOTLARI.md](05-gecmis-ve-arsiv/GECMIS_KARARLAR_VE_MIGRATION_NOTLARI.md)

---

> [!IMPORTANT]
> ### ⚠️ BUGÜNKÜ GERÇEK DURUM (Gerçeklik Beyanı)
> **Bu repo şu anda "Çekirdek Modüler Kabuk (Pluggable Shell)" ve "Yönetici & Denetim İzi (Admin & Audit)" modüllerini canlı ve kalıcı olarak çalıştıran, diğer e-ticaret modüllerini (Stok, Katalog, Sipariş, Kasa/Ödeme) ise tak-çıkar sözleşmesiyle kabul etmeye hazır bir Modüler Monolit omurgadır.**
>
> * **Mevcut Çalışan Kalıcı Dilimler (Production MVP):**
>   - **Admin & Yetki Yönetimi:** `AdminUser` yaşam döngüsü, PBKDF2 SHA-256 şifre hash'leme, kullanıcı durumu güncelleme (`admin` PostgreSQL şeması).
>   - **Sistem Denetim İzi (Audit Log):** Kullanıcı, ürün, stok, alerjen, parti ve saklama koşulu değişikliklerini IP ve detaylarıyla kaydeden kalıcı `AuditLog` motoru.
>   - **Doğal Gıda Ürün ve Menü Yönetimi (5 Dikey Dilim):**
>     1. Gelişmiş Ürün Tanımlama (Tartılı, hacimsel ve paketli doğal gıda ürünleri).
>     2. Stok ve Envanter Yönetimi (`StockQuantity`, Minimal API `PATCH`, AuditLog, sıfır localStorage).
>     3. İçerik, Alerjen ve 100g Besin Değerleri (`NutritionalValues` JSONB/DTO, gıda güvenliği etiketleri).
>     4. STT / TETT ve Parti (Lot) Takibi (`ProductLots` tablosu, parti girişiyle otomatik genel stok artışı, fire düşümü).
>     5. Saklama Koşulları ve Raf Takibi (`StorageConditions`, 4 temel saklama şablonu, `ShelfLocation` koordinatları).
>   - **Müşteri (Public) Vitrini Entegrasyonu:** `/api/catalog/products` ile admin panelinden eklenen ürünlerin anında müşteri vitrinine düşmesi garantisi (Single Source of Truth).
>   - **Mobil & Responsive Deneyim:** Çekmece menü (drawer), hamburger butonu (`☰`), arka plan karartması (`backdrop`) ve dokunmatik kaydırılabilir tablolar.
>   - **Docker & PostgreSQL 18:** İzolasyonlu `admin` ve `catalog` şemaları; modüle özel migration tabloları (`__EFMigrationsHistory_Admin`, `__EFMigrationsHistory_Catalog`).
>   - **E2E Entegrasyon & Vite Proxy:** React 19 Frontend (Port 3000) ile .NET 10 Backend (Port 5000) arasındaki CORS'suz canlı ters proxy köprüsü.
>
> * **Gerçek Canlı Müşteri / E-Ticaret Ortamı İçin Eksik & Sıradaki Fazlar:**
>   - **Stok & Depo Yönetimi — Kalan 4 Alt Ekran (Faz 2):** `/inventory` canlıdır; ancak Tedarikçi & Alım (`SupplierProcurementPage` şu an mock UI), Depo Tanımları, Stok Hareketleri ve Kritik Uyarılar ekranlarının veritabanı bağlantıları sıradadır.
>   - **Dashboard Canlı Verileri & Admin JWT Koruması (Faz 3):** `DashboardPage` metrikleri henüz mock'tur; admin paneline `LoginPage` ve JWT Bearer token kilidi bağlanacaktır.
>   - **Sipariş & Sevkiyat Yönetimi Admin Ekranları (Faz 4):** Sipariş yönetimi (`/orders/*` ve müşteri `/hesabim/siparisler`, `/siparis-takip`) `OrderWorkflow` ile canlıya alındı (**Faz 4.1 ✅**); Sevkiyat/Kargo ekranları (`/shipping/*`, **Faz 4.2**) sırada.
>   - **CRM, Pazarlama & Analitik Ekranları (Faz 5):** Backend `Customer`, `Promotions` ve `Experience` modülleri hazırdır; `/crm/reviews` canlıdır, diğer Admin ekranları ve raporlama geliştirilecektir.
>   - **Müşteri Web Vitrini (Faz 6):** Ana sayfa (`StorefrontPage`) ve ürün kataloğu (`ProductsPage`) canlı `/api/catalog/products` ve `Origin` filtrelemesine bağlandı; `ProductDetailPage` tam kilidi, `cart` senkronizasyonu ve Sanal POS/Kargo fazları sıradadır.

---

## 1. Proje Ne İş Yapar? (1 Paragrafta Modüler E-Ticaret Admin)

**Modüler E-Ticaret Admin Paneli**; farklı e-ticaret iş modellerine (B2C perakende, B2B toptan, çok depolu satış) tek bir merkezden uyarlanabilen, **boş bir kabuk (Pluggable Shell)** mantığıyla tasarlanmış yeni nesil bir yönetim platformudur. Sistemde çekirdek kabuk (`packages/admin-core`) UI bileşenlerini ve menü ağacını sağlar; projeye göre ihtiyaç duyulan iş modülleri (Yöneticiler, Stok, Katalog, Kasa, Sipariş) kabuk mimarisini bozmadan bağımsız tak-çıkar parçalar olarak monte edilir. Backend tarafında her modül PostgreSQL üzerinde kendi şemasına (`admin`, `inventory`, `catalog`, `sales`) sahip bağımsız bir Clean Architecture dilimi olarak yaşar.

---

## 📊 2. Modül Gerçeklik ve Üretim Hazırlık Matrisi

Yeni katılan bir geliştiricinin ilk 30 dakikada sistemin neyinin çalışıp neyinin henüz plan aşamasında olduğunu anlamasını sağlayan özet durum tablosu:

### A. Mevcut Çalışan Kalıcı Dilimler (Production MVP)

| Modül Adı | Durum | PostgreSQL Şeması | Panel / Ekran | API (.NET 10) | Test & Doğrulama | Üretime Hazır mı? |
|---|---|---|---|---|---|---|
| **Yönetici, Dinamik RBAC & Admin Login** | Canlı Kalıcı Çekirdek | `admin` (`AdminUsers`, `Roles`, `ModulePermissions`, `RolePermissions`) | Var (`AdminLoginPage.tsx`, `UsersPage.tsx`, `RolePermissionsPage.tsx`) | Var (`/api/admin/auth/login`, `/users`, `/roles`, `/permissions`) | Var (Çoklu Rol & Özel Rol E2E Doğrulandı) | Evet (İzole Admin Login, Dinamik RBAC, Tek Adımda Rol+Hesap Oluşturma) |
| **Denetim İzi (Audit Log)** | Canlı Kalıcı Çekirdek | `admin` (`AuditLogs`) | Var (`AuditLogsPage.tsx`) | Var (`/api/admin/audit-logs`) | Var (E2E Veritabanı Doğrulandı) | Evet (Sayfalanabilir sistem geçmişi ve IP kaydı) |
| **Pluggable Admin Shell** | Canlı Modüler Kabuk | Bağımsız (State-free) | Var (`AdminShell.tsx`) | N/A (Frontend Kabuğu) | Var (TypeScript strict derlendi) | Evet (`AdminFeatureModule` sözleşmesiyle dinamik) |
| **Docker & DB Altyapısı** | Canlı Veritabanı | `admin` şeması, port 5433 | pgAdmin / psql | Var (EF Core 10 Npgsql) | Var (`docker compose` healthy) | Evet (PostgreSQL 18 container & volume) |
| **Vite Dev Proxy & E2E Köprüsü** | Canlı Entegrasyon | N/A | Port 3000 -> 5000 | Port 5000 `ApiHost` | Var (CORS bypass doğrulandı) | Evet (Geliştirici ve test ortamı hazır) |
| **Ürün Kataloğu & Doğal Gıda (5 Dikey Dilim)** | Canlı Kalıcı Çekirdek | `catalog` (`Products`, `Categories`, `ProductLots`, `StorageConditions`) | Var (`FoodProductPages.tsx`) | Var (`/api/admin/products`, `/details`, `/lots`, `/storage-conditions`) | Var (PostgreSQL E2E Test Edildi) | Evet (Yasal etiketler, STT/TETT, saklama ve raf takibi) |
| **Stok & Envanter Yönetimi** | Canlı Kalıcı Çekirdek | `catalog` (`StockQuantity`), `admin` (`AuditLogs`) | Var (`InventoryPage.tsx`) | Var (`/api/admin/inventory`, `PATCH /stock`) | Var (Canlı veritabanı bağlandı) | Evet (Hızlı +1/-1, 0 altına düşmeme, kurumsal audit log) |
| **Müşteri (Public) Katalog Uçları** | Canlı Kalıcı Çekirdek | `catalog` (`Products`, `Categories`) | Hazır API | Var (`/api/catalog/products`, `/categories`) | Var (Single Source of Truth) | Evet (Admin değişiklikleri anında vitrinde listelenir) |
| **Mobil & Responsive Çekirdek** | Canlı UI İyileştirmesi | N/A | Var (`Sidebar.tsx`, `Header.tsx`, `MainLayout.tsx`) | N/A | Var (Vite build & Mobil test) | Evet (Çekmece menü, hamburger butonu, esnek layout) |
| **Müşteri Mağazası & Storefront** | Canlı Katalog + MVP Çekirdek | `catalog`, `cart`, `customer`, `orders`, `promotions`, `content`, `experience`, `payments` | Var (`StorefrontPage`, `ProductsPage`, `ProductDetailPage`, `CartPage`, `CheckoutPage`, `AccountPage`, `AuthPage`, `GuestOrderTrackingPage`) | Var (`/api/catalog/*`, `/api/cart/*`, `/api/auth/*`, `/api/orders/*`) | Var (React 19, TypeScript E2E derlendi) | Evet (Canlı `/api/catalog/products`, il/ilçe/mahalle adres, sipariş takibi, mobil vitrin) |

### B. Kalan Fazlar & Geliştirilecek Modüller ([YAPILACAKLAR_VE_FAZ_HARITASI.md](00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md))

| Planlanan Bileşen | Mevcut Durum | Backend / Şema Durumu | Panel / Ekran | Hedef Faz | Üretime Hazır mı? |
|---|---|---|---|---|---|
| **Tedarikçi, Depo, Hareket & Alarmlar** | 1/5 Canlı (`/inventory` ok) | `inventory` şeması sırada | Kısmi (`SupplierProcurementPage` mock, diğer 3'ü placeholder) | **Faz 2 (Aktif Odak)** | Kısmi (`/inventory` hazır, 4 alt modül sırada) |
| **Dashboard Canlı Veri & Admin JWT** | Kısmi Canlı UI + İzole Auth ✅ | `AdminUsers` + `/giris` izole RBAC hazır; Dashboard özet API'si sırada | `DashboardPage` (yorum widget'ı canlı), `/giris` ✅ | **Faz 3** | Kısmi (Auth/RBAC hazır, Dashboard KPI özetleri sırada) |
| **Sipariş & Sevkiyat Admin Ekranları** | Siparişler ✅ / Sevkiyat Placeholder | `orders`, `OrderWorkflow`, `payments` hazır | `OrdersPage.tsx` (`/orders/*` ✅) / `/shipping/*` (`ModulePlaceholderPage`) | **Faz 4** | Kısmi (Sipariş İş Akışı ✅, Sevkiyat/Kargo ekranları sırada) |
| **CRM, Pazarlama & Analitik** | Placeholder UI | `customer`, `promotions`, `experience`, `content` hazır | `ModulePlaceholderPage` | **Faz 5** | Hayır (Admin UI & raporlama bekliyor) |
| **Müşteri Canlı POS & Kargo Fazları** | Frontend & Backend MVP ✅ | Public API uçları ve React ekranları hazır | Canlı Mağaza Arayüzü Hazır | **Müşteri Fazları (1-5)** | MVP Hazır; Sanal POS, Canlı Kargo ve API kilidi sırada 👉 [MUSTERI_MODULU.md](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md) |

---

## 👥 3. Mühendisler İçin Modül Bazlı İş Dağıtım Modeli

Projeye başlayan geliştiricilere ve yapay zeka ajanlarına rehberlik eden modül şartnameleri aşağıdadır. Çalışma prensibi [RULES.md](../../RULES.md) belgesindeki Çekirdek Kurallar ile kilitlenmiştir:

| Modül No | Modül Adı | Kapsam | Ayrıntılı Modül Şartnamesi | Güncel Yol Haritası Referansı |
|---|---|---|---|---|
| **[Modül 1]** | **Yönetici & Kullanıcı Yönetimi** | Admin kullanıcıları, roller (SuperAdmin, Admin, Moderator), durum yönetimi. | 👉 [YONETICI_VE_AUDIT_LOG_MODULU.md](03-is-alanlari-ve-yonetim/YONETICI_VE_AUDIT_LOG_MODULU.md) | Checkpoint 1–6 (Tamamlandı, Yaşayan Çekirdek) |
| **[Modül 2]** | **Sistem Güvenlik & Audit Log** | Admin işlemlerinin IP, zaman, aktör ve değişiklik detaylarıyla izlenmesi. | 👉 [YONETICI_VE_AUDIT_LOG_MODULU.md](03-is-alanlari-ve-yonetim/YONETICI_VE_AUDIT_LOG_MODULU.md) | Checkpoint 1–6 (Tamamlandı, Yaşayan Çekirdek) |
| **[Modül 3]** | **Stok & Depo Yönetimi** | Envanter, tedarikçi/alım, çoklu depo, stok hareket fişleri ve kritik uyarılar. | 👉 [STOK_VE_ENVANTER_MODULU.md](03-is-alanlari-ve-yonetim/STOK_VE_ENVANTER_MODULU.md) | `/inventory` ✅ Canlı; Kalan 4 alt modül **Faz 2**'de |
| **[Modül 4]** | **Ürün Kataloğu & Doğal Gıda** | Tartılı/paketli ürün, alerjen/besin değerleri, STT/Lot, saklama ve raf takibi. | 👉 [URUN_KATALOGU_VE_KATEGORI_MODULU.md](03-is-alanlari-ve-yonetim/URUN_KATALOGU_VE_KATEGORI_MODULU.md) | Checkpoint 8–12 (**5/5 Dikey Dilim Tamamlandı ✅**) |
| **[Modül 5]** | **Kasa, Tahsilat & Sanal POS** | Sanal POS entegrasyonu, iade/iptal süreçleri, parçalı tahsilat, ciro raporu. | 👉 [KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md) | **Faz 4 & Faz 5** |
| **[Modül 6]** | **Sipariş & Sevkiyat Yönetimi** | Sipariş akışı (Yeni, Hazırlanıyor, Kargoda, Teslim Edildi), soğuk kurye. | 👉 [KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md) | Backend hazır; Admin UI **Faz 4** |
| **[Modül 7]** | **Kimlik Doğrulama & JWT (Auth)** | Güvenli JWT tabanlı Admin giriş ekranı, token interceptor ve RBAC kilidi. | 👉 [BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md](01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md) | Müşteri JWT hazır; Admin Login **Faz 3** |
| **[Modül 8]** | **Müşteri Deneyimi & Storefront** | B2C vitrini, ürün kataloğu, sepet, ödeme, hikayemiz, hesap portali ve otantik görseller. | 👉 [MUSTERI_MODULU.md](03-is-alanlari-ve-yonetim/MUSTERI_MODULU.md) | Canlı MVP ✅ (Kalan Fazlar: Canlı API kilidi, Sanal POS, Kargo) |

---

## 🏛️ 4. MODÜL MODÜL AYRINTILI MİMARİ VE EKRAN DAVRANIŞLARI

---

### [Modül 1] Yönetici & Kullanıcı Yönetimi Modülü (Admin & IAM)

Sisteme erişebilen yöneticilerin, e-posta, şifre ve yetki seviyelerinin (Rol) yönetildiği ana güvenlik kapısıdır.

#### A. Projedeki Rolü ve İş Değeri
* E-ticaret platformunda farklı departmanlar (Katalog Yöneticisi, Depo Sorumlusu, Müşteri Temsilcisi) sadece kendi yetki alanlarına erişmelidir.
* `SuperAdmin` tüm sisteme hakimken, `Admin` operasyonel süreçleri yönetir, `Moderator` ise salt okunur veya kısıtlı işlem yapar.
* İşten ayrılan bir personelin hesabı kalıcı silinmek yerine anında pasife alınarak veri bütünlüğü korunur.

#### B. ✅ Bugün Kodda Çalışanlar (Mevcut Durum)
* **Kullanıcı Yönetim Ekranı ([UsersPage.tsx](../../packages/admin-core/src/pages/UsersPage.tsx)):**
  - Sayfalanabilir modern liste tablosu (`AdminTable`).
  - Rol ve durum etiketleri (`StatusBadge`).
  - "Yeni Yönetici Ekle" modali (`Modal` bileşeni); tam ad, e-posta, şifre ve rol seçimi ile backend'e POST isteği atar.
  - Kullanıcı aktif/pasif anahtarlama butonu; backend'e PATCH isteği gönderir ve anlık reaktif güncelleme sağlar.
* **Backend API & Servis Katmanı:**
  - `AdminService.cs` -> PBKDF2 SHA-256 ile şifre tuzlama (salt) ve hash'leme (`IPasswordHasher`).
  - `AdminDbContext.cs` -> PostgreSQL `admin.AdminUsers` tablosu.
  - `AdminEndpoints.cs` -> `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/{id}/status`.
* **Seed Mekanizması:** Sistem ilk açıldığında `superadmin@ecommerce.local` kullanıcısını otomatik olarak ekler.

#### C. 🚧 Henüz Yapılmayanlar & Hedef Ekran Davranışları (Geliştirilecek Backlog)
1. **Şifre Sıfırlama & Değiştirme Modalı:** Yöneticinin kendi şifresini değiştirebilmesi veya SuperAdmin'in tek kullanımlık geçici şifre tanımlayabilmesi.
2. **Kapsamlı İzin Ağacı (Granular Permissions):** Rollerin ötesinde modül bazlı yetki matrisi (`users:read`, `users:write`, `stock:approve`).
3. **Profil Düzenleme:** Yöneticinin avatar, telefon ve iki aşamalı doğrulama (2FA) ayarlarını yapabilmesi.

---

### [Modül 2] Sistem Denetim İzi ve Güvenlik Logları (Audit & Security)

Platformda gerçekleşen tüm kritik işlemlerin (kim yaptı, ne zaman yaptı, hangi IP'den yaptı, neyi değiştirdi) geri döndürülemez biçimde kaydedildiği kara kutudur.

#### A. Projedeki Rolü ve İş Değeri
* Finansal ve operasyonel manipülasyonları engellemek, KVKK/GDPR uyumluluğunu sağlamak ve güvenlik ihlallerini tespit etmek için zorunludur.
* Bir kullanıcının pasife alınması veya yeni bir yönetici atanması şüpheye yer bırakmayacak şekilde kayıt altına alınır.

#### B. ✅ Bugün Kodda Çalışanlar (Mevcut Durum)
* **Denetim İzi Ekranı ([AuditLogsPage.tsx](../../packages/admin-core/src/pages/AuditLogsPage.tsx)):**
  - Tarih/Saat, İşlem Tipi (`CreateUser`, `UpdateUserStatus`), İlgili Kaynak (`AdminUser`), Yapan Yönetici ID'si, IP Adresi ve JSON detaylarını listeleyen modern arayüz.
* **Backend API & Servis Katmanı:**
  - `AdminService.cs` içindeki her yazma operasyonunda otomatik `AuditLog` nesnesi oluşturulup `admin.AuditLogs` tablosuna yazılır.
  - `GET /api/admin/audit-logs` endpoint'i ile ters kronolojik (en yeni en üstte) sayfalanabilir liste sunulur.

#### C. 🚧 Henüz Yapılmayanlar & Hedef Ekran Davranışları (Geliştirilecek Backlog)
1. **Filtreleme & Arama Çubuğu:** Kullanıcı ID, IP adresi veya tarih aralığına göre dinamik arama paneli.
2. **Detay Görüntüleyici Modalı:** Loglanan JSON içeriğinin okunabilir renkli (diff formatında) görüntülenmesi.
3. **Log Arşivleme & Export:** Sistem loglarının CSV/Excel veya harici bir SIEM sistemine (Elasticsearch, Seq) aktarılması.

---

### [Modül 3] Stok & Envanter Yönetimi Modülü (Inventory & Stock)

Depolardaki ürün miktarlarının, hızlı stok artış/azalışlarının, tedarikçi/alım süreçlerinin ve çoklu depo hareketlerinin yönetildiği alandır.

#### A. ✅ Bugün Kodda Çalışanlar (2. Dikey Dilim Tamamlandı)
* **Canlı Envanter Ekranı ([InventoryPage.tsx](../../frontend/src/pages/inventory/InventoryPage.tsx)):**
  - `inventoryService.ts` aracılığıyla `GET /api/admin/inventory` ve `PATCH /api/admin/inventory/{id}/stock` uçlarına bağlıdır.
  - Hızlı `+1 / -1` butonları doğrudan PostgreSQL `catalog."Products"."StockQuantity"` değerini günceller, 0'ın altına düşürmez ve `admin."AuditLogs"` tablosuna `'StockUpdated'` yazar.
  - Eski `localStorage` deposu tamamen kaldırılmıştır.

#### B. 🚧 Henüz Yapılmayanlar (Faz 2 Kapsamı)
1. **Tedarikçi ve Alım Yönetimi (`/inventory/suppliers-procurement`):** Mevcut mock ekranın (`SupplierProcurementPage.tsx`) PostgreSQL'e bağlanması.
2. **Depo Tanımları & Transferler (`/inventory/warehouses`):** Merkez depo, soğuk hava deposu ve şube tanımları.
3. **Stok Hareket Fişleri & Alarmlar (`/inventory/transactions`, `/inventory/alerts`):** Hareket defteri ve kapsamlı alarm merkezi.

---

### [Modül 4] Ürün Kataloğu ve Doğal Gıda Yönetimi Modülü (5/5 Dikey Dilim Tamamlandı ✅)

Doğal gıda ürünlerinin tanımlandığı, yasal etiket/alerjen bilgilerinin, STT/Parti takiplerinin ve soğuk zincir/saklama koşullarının yönetildiği alandır.

#### A. ✅ Bugün Kodda Çalışanlar
1. **Gelişmiş Ürün Tanımlama (`/products/definition`):** Tartılı/hacimsel/paketli ürün girişi ve düzenleme (`catalog."Products"`).
2. **İçerik, Alerjen ve 100g Besin Değerleri (`/products/allergens-nutrition`):** `Ingredients`, `Allergens[]`, `Certifications[]` ve `NutritionalValues` (JSONB) canlı yönetimi.
3. **STT / TETT ve Parti Takibi (`/products/lot-expiry`):** `catalog."ProductLots"` tablosu, kalan gün rozetleri, parti girişiyle otomatik stok artırma ve fire düşümü.
4. **Saklama Koşulları & Depo Rafı (`/products/storage-conditions`):** `catalog."StorageConditions"` (4 temel şablon) ve ürün bazlı `ShelfLocation` koordinat atamaları.
5. **Müşteri Vitrini Senkronizasyonu:** Public `/api/catalog/products` uçlarıyla ortak `catalog."Products"` tablosunu kullanır (Single Source of Truth).

---

### [Modül 5] Kasa, Tahsilat ve Sanal POS Operasyonu (Cashier & Payments)

Müşterilerden gelen ödemelerin, taksitli tahsilatların, iade ve iptal işlemlerinin yönetildiği finans merkezidir.

#### A. Projedeki Rolü ve İş Değeri
* Sanal POS (İyzico, PayTR, Garanti, İş Bankası) entegrasyonu ile tahsilat başarısı izlenir.
* Müşteri siparişi iptal ettiğinde kartına anında veya parçalı iade (refund) basılması bu modülden yönetilir.

#### B. 🚧 Geliştirilecek Backlog & Hedef Ekran Davranışları
1. **Sanal POS Başarısızlık & İşlem Monitörü:** Anlık ödeme denemeleri, 3D Secure durumları ve hata kodları (`Err: Limit Yetersiz`, `Err: Hatalı CVV`).
2. **İade / İptal Sihirbazı Modalı:** Siparişin tamamını veya belirli bir kalemini kartına geri iade eden onaylı modal.
3. **Günlük Hasılat & Ciro Kartları:** Nakit akışı, komisyon kesintileri ve net hakediş özet grafikleri.

---

### [Modül 6] Sipariş & Sevkiyat Yönetimi (Orders & Fulfillment)

Müşterinin satın alma butonuna bastığı andan kargonun kapıya teslim edilmesine kadar geçen tüm operasyonel yaşam döngüsüdür.

#### A. Projedeki Rolü ve İş Değeri
* Siparişlerin durum makinesi (State Machine) doğrultusunda hatasız ilerlemesi: `Onay Bekliyor -> Hazırlanıyor -> Kargoya Verildi -> Teslim Edildi -> İptal/İade`.
* Depo görevlisine toplama listesi (Picking list) ve kargo barkodu üretilmesi.

#### B. 🚧 Geliştirilecek Backlog & Hedef Ekran Davranışları
1. **Sipariş Detay Ekranı:** Müşteri teslimat adresi, fatura bilgileri, sipariş kalemleri ve kargo takip entegrasyonu.
2. **Toplu Kargo Etiketi Basımı:** Seçilen siparişler için Yurtiçi, MNG, Aras Kargo entegrasyonu üzerinden tek tıkla barkod dökümü.
3. **Backend `sales` / `orders` Şeması:** `orders.Orders`, `orders.OrderItems`, `orders.Shipments`.

---

### [Modül 7] Kimlik Doğrulama & İzin Omurgası (Auth & RBAC)

Sisteme güvenli giriş ve oturum sürekliliğini sağlayan güvenlik altyapısıdır.

#### A. Projedeki Rolü ve İş Değeri
* Şu an geliştirme aşamasında API uçları doğrudan açıktır; üretim ortamında her istek geçerli bir JWT Bearer token taşımalıdır.
* Sayfa yenilendiğinde oturumun korunması ve yetkisiz kullanıcıların otomatik olarak Login ekranına fırlatılması sağlanmalıdır.

#### B. 🚧 Geliştirilecek Backlog & Hedef Ekran Davranışları
1. **Yönetici Giriş Ekranı (`LoginPage.tsx`):** E-posta ve şifre ile giriş formu, "Beni Hatırla" seçeneği, hata mesajı gösterimi.
2. **Backend JWT Token Üretimi:** `POST /api/auth/login` endpoint'i, Claims (Id, Email, Role, Permissions), Refresh Token mekanizması.
3. **Frontend Token Entegrasyonu:** `AdminApiClient` içine Authorization Bearer header inject eden interceptor eklenmesi.

---

## 🌐 5. İLERİ SEVİYE SİSTEM ALTYAPILARI

---

### [Altyapı A] Pluggable Shell (Modüler Kabuk) Mimarisi

* **Konsept:** Çekirdek paket (`packages/admin-core`), içerisinde iş mantığı veya sabit menü barındırmaz. Tamamen boş ve modern bir kabuktur (`AdminShell`).
* **Sözleşme:** Her iş alanı `AdminFeatureModule` sözleşmesini uygulayan bir nesne olarak dışarı aktarılır:
  ```typescript
  export interface AdminFeatureModule {
    id: string;
    title: string;
    navItems: NavigationItem[];
    routes: { path: string; element: ReactNode }[];
  }
  ```
* **Montaj:** Ana uygulama (`apps/web-app/src/App.tsx`), kabuğa sadece `modules={[userManagementModule, inventoryModule]}` prop'unu iletir. Menü ağacı ve rotalar otomatik oluşturulur.
* **Kural:** [RULES.md](../../RULES.md) gereği `packages/admin-core` altındaki Shell, Layout ve Sidebar bileşenlerine asla doğrudan dokunulmaz.

---

### [Altyapı B] PostgreSQL 18 Çoklu Şema İzolasyonu & Modüler Veritabanı

* **Şema Ayrımı:** Tüm tablolar `public` şeması yerine iş alanına ait şemada toplanır (`admin.AdminUsers`, `admin.AuditLogs`).
* **Bağımsız Migration Tablosu:** Her modül kendi migration geçmişini ayrı tutar (`__EFMigrationsHistory_Admin`). Böylece yarın bir gün `InventoryModule` veya `CatalogModule` eklendiğinde birbirlerinin migration akışını kilitlemez veya kirletmez.
* **Bağlantı ve Container:** PostgreSQL 18 container'ı port 5433'de kalıcı Docker volume ile çalışır.

---

## 🚀 6. Tamamlananlar ve Faz Haritaları (Ayrı Sayfalar)

Proje dokümantasyonu netlik açısından iki ayrı sayfada tutulmaktadır:
* **Tamamlanan İşler & Checkpoint Günlüğü (YAPILANLAR):** 👉 **[YAPILANLAR_VE_TAMAMLANANLAR.md](00-devir-rehberi/YAPILANLAR_VE_TAMAMLANANLAR.md)**
* **Faz Haritaları & Gelecek İşler (YAPILACAKLAR):** 👉 **[YAPILACAKLAR_VE_FAZ_HARITASI.md](00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md)**

Özet Faz Haritası:
* **FAZ 1 (✅ Tamamlandı):** Çekirdek Altyapı, Admin & Audit Log, Müşteri Backend Birleşimi, Doğal Gıda Ürün Yönetimi (5/5 Dikey Dilim), `/inventory` Canlı Envanter ve Mobil/Responsive Shell.
* **FAZ 2 (🚧 Aktif Odak):** Stok ve Depo Yönetiminin kalan 4 alt modülü (Tedarikçi & Alım, Depo Tanımları, Stok Hareket Fişleri, Kritik Uyarılar).
* **FAZ 3 (📋 Planlandı):** Dashboard (`DashboardPage`) Canlı Veri Entegrasyonu & Admin JWT Login Koruması.
* **FAZ 4 (📋 Planlandı):** Sipariş ve Sevkiyat Yönetimi Admin Ekranları (`/orders/*`, `/shipping/*`).
* **FAZ 5 (📋 Planlandı):** CRM, Pazarlama & Kampanya, Analitik Raporlar ve Sistem Ayarları.
* **FAZ 6 (📋 Planlandı):** Müşteri Web Vitrini Frontend Bağlantısı & Production CI/CD.

---

## 🛡️ 7. Teknik Kalite Kapıları ve Test Kriterleri

Geliştirilen her yeni özellik şu 5 kalite kapısından geçmek zorundadır:
1. **İdempotency ve Güvenlik:** Şifreler asla düz metin (plain text) saklanamaz; tuzlanmış PBKDF2 SHA-256 veya BCrypt kullanılmalıdır.
2. **Denetim İzi (Audit Log Zorunluluğu):** Veritabanında durum değiştiren (Create, Update, Delete, Status Change) her API çağrısı, arkaplanda otomatik olarak `AuditLog` kaydı üretmelidir.
3. **Pluggable Sözleşmesine Sadakat:** Hiçbir modül çekirdek kabuğun (`packages/admin-core`) kaynak kodunu değiştiremez; yalnızca `AdminFeatureModule` arayüzü ile eklenir.
4. **Şema İzolasyonu:** Hiçbir modül başka bir modülün veritabanı tablosuna doğrudan SQL join atamaz; iletişimler yalnızca servis sözleşmeleri veya domain event'leri üzerinden akar.
5. **Otomatik Derleme & Tip Güvenliği:** Backend `dotnet build` komutundan 0 hata ve 0 uyarı ile çıkmalı; Frontend `npm run build` komutuyla TypeScript strict modunda hatasız derlenmelidir.
