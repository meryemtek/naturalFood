# MODÜLER E-TİCARET ALTYAPISI — Mühendis ve Ekip Devir Teslim Rehberi (Master Hub)

> **Durum:** Yaşayan Ana Devir Belgesi  
> **Son Güncelleme:** 5 Kasım 2026  
> **Sorumlu:** Mimari & Çekirdek Ekip  
>
> **Dokümantasyon Hiyerarşisi:**
> * **Mimari & Altyapı:** [docs/01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md](01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md) · [docs/01-mimari-ve-altyapi/PLUGGABLE_SHELL_VE_FRONTEND_MIMARISI.md](01-mimari-ve-altyapi/PLUGGABLE_SHELL_VE_FRONTEND_MIMARISI.md)
> * **Güncel Teslim ve Yol Haritası (Checkpoint & To-Do):** [docs/00-devir-rehberi/DURUM_VE_YOL_HARITASI.md](00-devir-rehberi/DURUM_VE_YOL_HARITASI.md)
> * **Hızlı Başlangıç & Devir (Onboarding):** [docs/00-devir-rehberi/DEVIR_REHBERI.md](00-devir-rehberi/DEVIR_REHBERI.md)
> * **Operasyon & Kasa Şartnamesi:** [docs/02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md)
> * **İş Alanları & Modül Şartnameleri:** [docs/03-is-alanlari-ve-yonetim/](03-is-alanlari-ve-yonetim/)
> * **Test & Doğrulama Rehberleri:** [docs/04-test-ve-rehberler/E2E_TEST_VE_DOGRULAMA_REHBERI.md](04-test-ve-rehberler/E2E_TEST_VE_DOGRULAMA_REHBERI.md)
> * **Tarihsel Kararlar & Arşiv:** [docs/05-gecmis-ve-arsiv/GECMIS_KARARLAR_VE_MIGRATION_NOTLARI.md](05-gecmis-ve-arsiv/GECMIS_KARARLAR_VE_MIGRATION_NOTLARI.md)

---

> [!IMPORTANT]
> ### ⚠️ BUGÜNKÜ GERÇEK DURUM (Gerçeklik Beyanı)
> **Bu repo şu anda "Çekirdek Modüler Kabuk (Pluggable Shell)" ve "Yönetici & Denetim İzi (Admin & Audit)" modüllerini canlı ve kalıcı olarak çalıştıran, diğer e-ticaret modüllerini (Stok, Katalog, Sipariş, Kasa/Ödeme) ise tak-çıkar sözleşmesiyle kabul etmeye hazır bir Modüler Monolit omurgadır.**
>
> * **Mevcut Çalışan Kalıcı Dilimler (Production MVP):**
>   - **Admin & Yetki Yönetimi:** `AdminUser` yaşam döngüsü, PBKDF2 SHA-256 şifre hash'leme, kullanıcı durumu güncelleme (`admin` PostgreSQL şeması).
>   - **Sistem Denetim İzi (Audit Log):** Kullanıcı oluşturma, pasife alma, oturum ve veri değişikliklerini IP ve detaylarıyla kaydeden kalıcı `AuditLog` motoru.
>   - **Pluggable Admin Shell:** React 19 tabanlı `packages/admin-core` dış kütüphanesi; dinamik `AdminShell`, menü ağacı ve dinamik rota üretimi.
>   - **Genişletilebilir Modül Sözleşmesi:** `AdminFeatureModule` sözleşmesi üzerinden sisteme 0 satır kabuk kodu değiştirilerek bağlanan modüller (`UserManagementModule`, `InventoryModule`).
>   - **Docker & PostgreSQL 18:** İzolasyonlu `admin` şeması ve modüle özel migration geçmiş tablosu (`__EFMigrationsHistory_Admin`).
>   - **E2E Entegrasyon & Vite Proxy:** React 19 Frontend (`apps/web-app`, Port 3000) ile .NET 10 Backend (`ApiHost`, Port 5000) arasındaki CORS'suz canlı ters proxy köprüsü.
>
> * **Gerçek Canlı Müşteri / E-Ticaret Ortamı İçin Eksik & Planlananlar:**
>   - Gerçek JWT / Refresh Token / Cookie Kimlik Doğrulama (Şu an açık geliştirme portu ve seed SuperAdmin hesabı aktiftir; Login sayfası ve JWT Bearer auth sıradadır).
>   - Ürün Kataloğu ve Kategori Yönetimi (`catalog` şeması, varyantlar, SKU, görsel yükleme).
>   - Sipariş ve Sepet Yönetimi (`orders` şeması, sipariş yaşam döngüsü, kargo entegrasyonu).
>   - Kasa, Sanal POS ve Parçalı Ödeme (`payments` şeması, İyzico/PayTR sağlayıcıları).
>   - Gerçek Stok Veritabanı ve Rezerve Stok (`inventory` şeması; şu an UI'da `InventoryModule` mock olarak çalışmaktadır).
>   - Çoklu Dil (i18n) ve Çoklu Para Birimi Desteği.

---

## 1. Proje Ne İş Yapar? (1 Paragrafta Modüler E-Ticaret Admin)

**Modüler E-Ticaret Admin Paneli**; farklı e-ticaret iş modellerine (B2C perakende, B2B toptan, çok depolu satış) tek bir merkezden uyarlanabilen, **boş bir kabuk (Pluggable Shell)** mantığıyla tasarlanmış yeni nesil bir yönetim platformudur. Sistemde çekirdek kabuk (`packages/admin-core`) UI bileşenlerini ve menü ağacını sağlar; projeye göre ihtiyaç duyulan iş modülleri (Yöneticiler, Stok, Katalog, Kasa, Sipariş) kabuk mimarisini bozmadan bağımsız tak-çıkar parçalar olarak monte edilir. Backend tarafında her modül PostgreSQL üzerinde kendi şemasına (`admin`, `inventory`, `catalog`, `sales`) sahip bağımsız bir Clean Architecture dilimi olarak yaşar.

---

## 📊 2. Modül Gerçeklik ve Üretim Hazırlık Matrisi

Yeni katılan bir geliştiricinin ilk 30 dakikada sistemin neyinin çalışıp neyinin henüz plan aşamasında olduğunu anlamasını sağlayan özet durum tablosu:

### A. Mevcut Çalışan Kalıcı Dilimler (Production MVP)

| Modül Adı | Durum | PostgreSQL Şeması | Panel / Ekran | API (.NET 10) | Test & Doğrulama | Üretime Hazır mı? |
|---|---|---|---|---|---|---|
| **Yönetici & Kullanıcı Yönetimi** | Canlı Kalıcı Çekirdek | `admin` (`AdminUsers`) | Var (`UsersPage.tsx`) | Var (`/api/admin/users`) | Var (E2E API & UI Doğrulandı) | Evet (Admin CRUD, Aktif/Pasif, PBKDF2 Hash) |
| **Denetim İzi (Audit Log)** | Canlı Kalıcı Çekirdek | `admin` (`AuditLogs`) | Var (`AuditLogsPage.tsx`) | Var (`/api/admin/audit-logs`) | Var (E2E Veritabanı Doğrulandı) | Evet (Sayfalanabilir sistem geçmişi ve IP kaydı) |
| **Pluggable Admin Shell** | Canlı Modüler Kabuk | Bağımsız (State-free) | Var (`AdminShell.tsx`) | N/A (Frontend Kabuğu) | Var (TypeScript strict derlendi) | Evet (`AdminFeatureModule` sözleşmesiyle dinamik) |
| **Docker & DB Altyapısı** | Canlı Veritabanı | `admin` şeması, port 5433 | pgAdmin / psql | Var (EF Core 10 Npgsql) | Var (`docker compose` healthy) | Evet (PostgreSQL 18 container & volume) |
| **Vite Dev Proxy & E2E Köprüsü** | Canlı Entegrasyon | N/A | Port 3000 -> 5000 | Port 5000 `ApiHost` | Var (CORS bypass doğrulandı) | Evet (Geliştirici ve test ortamı hazır) |

### B. Hedeflenen / Geliştirilecek Bileşenler (Gelecek Yol Haritası)

| Planlanan Bileşen | Durum | PostgreSQL Şeması | Panel / Ekran | API (.NET 10) | Test | Üretime Hazır mı? |
|---|---|---|---|---|---|---|
| **Kimlik Doğrulama & JWT (Auth)** | Planlandı (Sırada) | `admin` veya `auth` | Planlandı (`LoginPage.tsx`) | Taslak (`IPasswordHasher` var, Token Endpoint sırada) | Kısmi | Hayır (JWT Bearer middleware ve Login formu henüz yok) |
| **Stok & Envanter Çekirdeği** | Mock UI Mevcut; DB Planlandı | Yok (`inventory` sırada) | Kısmi (`InventoryPage.tsx` mock) | Yok (`InventoryService` sırada) | Yok | Hayır (Gerçek veritabanı ve rezerve stok bağlantısı yok) |
| **Ürün Kataloğu & Kategoriler** | Planlandı | Yok (`catalog` sırada) | Planlandı (`ProductsPage.tsx`) | Planlandı (`CatalogService`) | Yok | Hayır (Varyant, fiyatlandırma ve görsel yönetimi yok) |
| **Sipariş & Sevkiyat (Orders)** | Planlandı | Yok (`sales`/`orders` sırada) | Planlandı (`OrdersPage.tsx`) | Planlandı (`OrderService`) | Yok | Hayır (Sipariş durum makinesi ve kargo entegrasyonu yok) |
| **Kasa, Tahsilat & Sanal POS** | Planlandı | Yok (`payments` sırada) | Planlandı (`CashierPage.tsx`) | Planlandı (`PaymentService`) | Yok | Hayır (İyzico/PayTR sanal POS ve tahsilat entegrasyonu yok) |

---

## 👥 3. Mühendisler İçin Modül Bazlı İş Dağıtım Modeli

Projeye başlayan geliştiricilere ve yapay zeka ajanlarına rehberlik eden modül şartnameleri aşağıdadır. Çalışma prensibi [RULES.md](../../RULES.md) belgesindeki Çekirdek Kurallar ile kilitlenmiştir:

| Modül No | Modül Adı | Kapsam | Ayrıntılı Modül Şartnamesi | Güncel Yol Haritası Referansı |
|---|---|---|---|---|
| **[Modül 1]** | **Yönetici & Kullanıcı Yönetimi** | Admin kullanıcıları, roller (SuperAdmin, Admin, Moderator), durum yönetimi. | 👉 [YONETICI_VE_AUDIT_LOG_MODULU.md](03-is-alanlari-ve-yonetim/YONETICI_VE_AUDIT_LOG_MODULU.md) | Checkpoint 1–6 (Tamamlandı, Yaşayan Çekirdek) |
| **[Modül 2]** | **Sistem Güvenlik & Audit Log** | Admin işlemlerinin IP, zaman, aktör ve değişiklik detaylarıyla izlenmesi. | 👉 [YONETICI_VE_AUDIT_LOG_MODULU.md](03-is-alanlari-ve-yonetim/YONETICI_VE_AUDIT_LOG_MODULU.md) | Checkpoint 1–6 (Tamamlandı, Yaşayan Çekirdek) |
| **[Modül 3]** | **Stok & Depo Yönetimi** | Depo tanımları, SKU bazlı stok, kritik stok uyarıları, sayım ve düzeltmeler. | 👉 [STOK_VE_ENVANTER_MODULU.md](03-is-alanlari-ve-yonetim/STOK_VE_ENVANTER_MODULU.md) | Faz 2 (UI Vitrini hazır; DB & Backend sırada) |
| **[Modül 4]** | **Ürün Kataloğu & Kategori** | Kategori ağacı, varyantlar (renk/beden), ürün resimleri, fiyatlandırma. | 👉 [URUN_KATALOGU_VE_KATEGORI_MODULU.md](03-is-alanlari-ve-yonetim/URUN_KATALOGU_VE_KATEGORI_MODULU.md) | Faz 3 (Planlandı) |
| **[Modül 5]** | **Kasa, Tahsilat & Sanal POS** | Sanal POS entegrasyonu, iade/iptal süreçleri, parçalı tahsilat, ciro raporu. | 👉 [KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md) | Faz 5 (Planlandı) |
| **[Modül 6]** | **Sipariş & Sevkiyat Yönetimi** | Sipariş akışı (Yeni, Hazırlanıyor, Kargoda, Teslim Edildi), kargo fişi. | 👉 [KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md](02-kasa-ve-operasyon/KASA_VE_SIPARIS_OPERASYON_SOZLESMESI.md) | Faz 4 (Planlandı) |
| **[Modül 7]** | **Kimlik Doğrulama & JWT (Auth)** | Güvenli JWT/Cookie tabanlı oturum, yetki kontrolleri (Guard), RBAC. | 👉 [BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md](01-mimari-ve-altyapi/BACKEND_MIMARISI_VE_MODUL_BAGIMLILIKLARI.md) | Faz 2 (Sırada Bekleyen İlk Öncelik) |

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

Depolardaki ürün miktarlarının, rezerve stokların, kritik eşiklerin ve fiziksel sayım mutabakatlarının yönetildiği alandır.

#### A. Projedeki Rolü ve İş Değeri
* Stokta olmayan ürünün satılmasını (over-selling) engeller.
* Tedarik planlaması ve depo transferleri bu modül üzerinden yürütülür.

#### B. ✅ Bugün Kodda Çalışanlar (Mevcut Durum)
* **Stok Vitrini ([InventoryPage.tsx](../../packages/admin-core/src/pages/InventoryPage.tsx)):**
  - `InventoryModule` sözleşmesiyle `AdminShell`'e dinamik olarak eklenmiştir.
  - Stok Kodu (SKU), Ürün Adı, Kategori, Depo Konumu, Mevcut Miktar, Kritik Eşik ve Durum badge'leri içeren vitrin tablosu aktiftir.
  - Sistem mimarisinin modülerliğini kanıtlayan canlı örnektir.

#### C. 🚧 Henüz Yapılmayanlar & Hedef Ekran Davranışları (Geliştirilecek Backlog)
1. **PostgreSQL `inventory` Şeması:** `inventory.Warehouses`, `inventory.StockItems`, `inventory.StockMovements` tablolarının oluşturulması.
2. **Kritik Stok Alarmları:** Belirlenen eşiğin altına düşen ürünlerde admin üst barında kırmızı bildirim rozeti.
3. **Fiziksel Sayım & Düzeltme Modalı:** Depo sayımı sonucunda oluşan farkların yönetici onayıyla stok hareketi olarak işlenmesi.

---

### [Modül 4] Ürün Kataloğu & Kategori Yönetimi Modülü (Catalog & Products)

Mağazada satılan tüm fiziksel ve dijital ürünlerin tanımlandığı, kategorize edildiği ve fiyatlandırıldığı kalptir.

#### A. Projedeki Rolü ve İş Değeri
* Ürünlerin SEO başlıkları, açıklamaları, resimleri, barkodları ve varyant ağaçları (Örn: Siyah/XL) burada kurgulanır.
* Kampanyalar ve dönemsel indirimli fiyat sürümleri burada tanımlanır.

#### B. 🚧 Geliştirilecek Backlog & Hedef Ekran Davranışları
1. **Hiyerarşik Kategori Ağacı Ekranı:** Sürükle-bırak destekli alt kategori/üst kategori yönetimi.
2. **Varyant Matrisi Editörü:** Bir ürün seçildiğinde Beden x Renk x Kumaş kombinasyonlarına göre dinamik SKU ve barkod üreten arayüz.
3. **Medya Yöneticisi:** Ürün görsellerini yükleme, sıralama ve CDN/S3 optimizasyonu.
4. **Backend `catalog` Şeması:** `catalog.Products`, `catalog.Categories`, `catalog.Variants`, `catalog.Media`.

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

## 🚀 6. Güncel Yol Haritası ve Fazlar

Tüm geliştirme adımları ve geçmiş checkpoint kayıtları için canonical belge:  
👉 **[DURUM_VE_YOL_HARITASI.md](00-devir-rehberi/DURUM_VE_YOL_HARITASI.md)**

Özet Aşamalar:
* **FAZ 1 (Tamamlandı):** Çekirdek Altyapı, Docker, PostgreSQL 18, Admin & Audit Log Modülü, React 19 Pluggable Admin Shell, E2E Entegrasyon.
* **FAZ 2 (Aktif / Sırada):** Gerçek Kimlik Doğrulama (JWT Bearer Auth & Login UI), İzin Matrisi.
* **FAZ 3 (Planlandı):** Ürün Kataloğu ve Kategori Modülü (Backend + Frontend).
* **FAZ 4 (Planlandı):** Stok & Envanter Modülü (Gerçek DB Entegrasyonu).
* **FAZ 5 (Planlandı):** Sipariş ve Sevkiyat Yönetimi.
* **FAZ 6 (Planlandı):** Sanal POS & Kasa Modülü, Üretime Dağıtım (CI/CD).

---

## 🛡️ 7. Teknik Kalite Kapıları ve Test Kriterleri

Geliştirilen her yeni özellik şu 5 kalite kapısından geçmek zorundadır:
1. **İdempotency ve Güvenlik:** Şifreler asla düz metin (plain text) saklanamaz; tuzlanmış PBKDF2 SHA-256 veya BCrypt kullanılmalıdır.
2. **Denetim İzi (Audit Log Zorunluluğu):** Veritabanında durum değiştiren (Create, Update, Delete, Status Change) her API çağrısı, arkaplanda otomatik olarak `AuditLog` kaydı üretmelidir.
3. **Pluggable Sözleşmesine Sadakat:** Hiçbir modül çekirdek kabuğun (`packages/admin-core`) kaynak kodunu değiştiremez; yalnızca `AdminFeatureModule` arayüzü ile eklenir.
4. **Şema İzolasyonu:** Hiçbir modül başka bir modülün veritabanı tablosuna doğrudan SQL join atamaz; iletişimler yalnızca servis sözleşmeleri veya domain event'leri üzerinden akar.
5. **Otomatik Derleme & Tip Güvenliği:** Backend `dotnet build` komutundan 0 hata ve 0 uyarı ile çıkmalı; Frontend `npm run build` komutuyla TypeScript strict modunda hatasız derlenmelidir.
