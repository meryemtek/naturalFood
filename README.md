# Modüler Monolit E-Ticaret Admin Modülü

Bu proje, **Modüler Monolit (Modular Monolith)** mimari prensipleri doğrultusunda geliştirilmiş, yeniden kullanılabilir ve şema düzeyinde izole bir **Admin Modülü** içerir.

---

## 🛠️ Teknoloji Yığını

- **Backend:** ASP.NET Core 10 / .NET 10, C# (Clean Architecture & Modüler Monolit)
- **Veritabanı:** PostgreSQL 18 (EF Core 10 + Npgsql, `"admin"` ve `"catalog"` izole şemaları)
- **Frontend:** React 19 + TypeScript + Vite (Monorepo Workspace, Earth & Botanical Design Tokens)
- **Mobil & Responsive:** Drawer çekmece menü, dokunmatik yatay kaydırılabilir tablolar, esnek grid yapısı
- **Dağıtım / Konteyner:** Docker Compose (PostgreSQL 18 + PgAdmin 4)

---

## 🏗️ Mimari Yapı

```
admin_paneli/
├── docker-compose.yml                      # PostgreSQL 18 & PgAdmin 4
├── docker/
│   └── init-scripts/
│       └── 01-init-admin-schema.sql        # "admin" şeması otomatik oluşturma
├── backend/
│   ├── ModularAdmin.slnx                   # .NET 10 Solution (Klasik Onion Architecture)
│   └── src/
│       ├── Domain/                         # Çekirdek Domain Katmanı
│       │   ├── Entities/Admin/             # Admin Varlıkları (AdminUser, AuditLog)
│       │   ├── Entities/Catalog/           # Katalog Varlıkları (Product, Category, ProductLot, StorageCondition)
│       │   └── Enums/Admin/                # Admin Enum'ları (AdminRole)
│       ├── Application/                    # Uygulama Katmanı (Use Cases & DTOs)
│       │   ├── DTOs/Admin/                 # Admin DTO'ları (Product, Lot, Storage, Details)
│       │   ├── DTOs/Catalog/               # Müşteri Katalog DTO'ları
│       │   └── Services/                   # Servis Arayüzleri (IAdminService, ILotService, IStorageService, ICatalogService)
│       ├── Infrastructure/                 # Altyapı Katmanı
│       │   ├── Persistence/AdminDbContext.cs     # "admin" şeması (AdminUsers, AuditLogs)
│       │   ├── Persistence/CatalogDbContext.cs   # "catalog" şeması (Products, Categories, Lots, StorageConditions)
│       │   ├── Persistence/Migrations/           # İzole migration geçmişleri (__EFMigrationsHistory_Admin, _Catalog)
│       │   └── Services/                         # EF Core servis implementasyonları
│       ├── Endpoints/                      # Sunum / Minimal API Katmanı
│       │   ├── Admin/                      # Admin CRUD, Envanter, Detay, Lot ve Saklama uçları
│       │   └── Catalog/                    # Müşteri (Public) Katalog uçları (/api/catalog/products)
│       └── ApiHost/
│           └── ApiHost.csproj              # Web API giriş noktası
└── frontend/                               # React 19 + TypeScript + Vite Portalı
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── api/                            # Backend API İstemcisi (adminApi.ts, types.ts)
        ├── components/
        │   ├── layout/                     # Sidebar, Header, MainLayout
        │   └── common/                     # Modal, StatCard, StatusBadge
        ├── pages/
        │   ├── dashboard/                  # DashboardPage (Gösterge Paneli, Ciro & Metrikler)
        │   ├── admin/                      # UsersPage (Yöneticiler), AuditLogsPage (Denetim)
        │   └── inventory/                  # InventoryPage (Ürün & Stok Yönetimi)
        ├── App.tsx                         # Rota Yönetimi
        └── main.tsx                        # React Giriş Noktası
```

---

## 🔑 Önemli Mimari Kurallar (Klasik Onion Architecture)

1. **Katman Bağımlılık Yönü (Dependency Inversion):**
   - `Domain` hiçbir katmana bağımlı değildir; sadece iş kurallarını ve saf varlıkları barındırır.
   - `Application` yalnızca `Domain`'e bağımlıdır; DTO ve servis sözleşmelerini tanımlar.
   - `Infrastructure` veri tabanı, ORM (EF Core) ve dış servis bağımlılıklarını yönetir; `Application` sözleşmelerini uygular.
   - `Endpoints` Minimal API rotalarını tanımlar; dışarıya `AdminModuleExtensions` sözleşmesini sunar.
   - `ApiHost` uygulamanın giriş noktasıdır; servisleri ve rotaları ayağa kaldırır.

2. **Katmanlar Altında Modüler Yapı:**
   - Her katmanın altında modüller klasörler halinde ayrılmıştır (örn: `Entities/Admin/`, `DTOs/Admin/`, `Services/Admin/`, `Endpoints/Admin/`).
   - Yeni bir e-ticaret modülü eklendiğinde (örn. `Catalog`), katmanlar altına `Catalog/` klasörleri açılır.

3. **Şema İzolasyonu:**
   - Admin modülüne ait tablolar (`AdminUsers`, `AuditLogs`, `__EFMigrationsHistory_Admin`), PostgreSQL veritabanında `"admin"` şeması altında tutulur.
   - `modelBuilder.HasDefaultSchema("admin");` ile izole edilmiştir.
4. **Kapsülleme (Encapsulation):**
   - `ApiHost`, modülün iç implementasyon detaylarını (DbContext vb.) doğrudan bilmek zorunda kalmaz.
   - Rotalar ve servis kayıtları `Endpoints.Admin` içerisindeki `AdminModuleExtensions` üzerinden açılır:
     - `builder.Services.AddAdminModule(builder.Configuration);`
     - `app.MapAdminEndpoints();`

### Yeni modüller ve paralel çalışma

Her modül kendi adını taşıyan klasörlerde entity, sözleşme, servis, endpoint, veri erişimi ve migration dosyalarını tutar. Altyapı kayıtları `Infrastructure/<Modül>/DependencyInjection.cs`, endpoint kayıtları `Endpoints/<Modül>/` altında yer alır. Modüller birbirlerinin DbContext veya tablolarına doğrudan erişmemeli; ihtiyaç duyulan iletişim açık sözleşmeler üzerinden yapılmalıdır. Her modül kendi şemasını ve migration geçmişini kullanmalıdır.

Yeni bir modülü uygulamaya bağlarken `ApiHost/Program.cs` dosyasına kayıt ve rota çağrıları eklenir. Bu dosya ve katman proje dosyaları ortak birleşme noktalarıdır; paralel branch'lerde bu dosyalarda çakışma hâlâ mümkündür. Mevcut yapı klasör düzeyinde ayrım sağlar, derleme düzeyinde modül izolasyonu sağlamaz. Migration'ları aynı modülde eşzamanlı değiştirirken birleştirme sonrası sıralamayı ve veritabanı güncellemesini ayrıca doğrulayın.

---


---

## 🌾 Doğal Gıda & Ürün Yönetimi Modülü (5 Dikey Dilim Tamamlandı)

Projede doğal gıda e-ticaret operasyonuna özel 5 dikey dilim canlı PostgreSQL veritabanına bağlanmıştır:

1. **Gelişmiş Ürün Tanımlama (`/products/definition`):**
   - Tartılı (Kg, Gramaj), Hacimsel (Litre) ve Adet/Paket bazlı ürün tanımları.
   - Doğrudan `catalog."Products"` tablosuna kayıt; müşteri vitrini (`/api/catalog/products`) ile **Single Source of Truth** uyumu.
2. **Stok & Envanter Yönetimi (`/inventory`):**
   - Hızlı `+1` ve `-1` stok güncelleme butonları (`PATCH /api/admin/inventory/{id}/stock`).
   - Stoğun 0'ın altına düşmesini engelleyen koruma ve `admin."AuditLogs"` tablosuna `'StockUpdated'` denetim kaydı.
   - Tarayıcı hafızasına (`localStorage`) bağımlılık tamamen kaldırılmıştır.
3. **İçerik, Alerjen ve Besin Değerleri (`/products/allergens-nutrition`):**
   - İçindekiler listesi (`Ingredients`), yasal alerjen uyarıları (`Allergens`), sertifikalar (`Certifications`).
   - 100g referanslı Besin Öğeleri Değerleri (`NutritionalValues` JSONB).
   - `PUT /api/admin/products/{id}/details` ve `'ProductDetailsUpdated'` audit logu.
4. **STT / TETT ve Parti (Lot) Takibi (`/products/lot-expiry`):**
   - `catalog."ProductLots"` tablosu ile son tüketim tarihi ve parti bazlı stok kontrolü.
   - Yeni parti eklendiğinde bağlı ürünün genel stoğunu otomatik artırma (`POST /api/admin/lots`).
   - Kalan gün hesaplaması, sakin renkli durum rozetleri ve fireye ayırma (`WrittenOff`).
5. **Saklama Koşulları ve Depo Raf Takibi (`/products/storage-conditions`):**
   - `catalog."StorageConditions"` tablosu ve 4 doğal gıda şablonu (Kuru Gıda, Soğuk Muhafaza, Donuk, Mahzen).
   - Ürün bazında sıcaklık aralığı, bağıl nem, soğuk zincir zorunluluğu ve depo raf koordinatı (`ShelfLocation`).
   - `PATCH /api/admin/products/{id}/storage` ve `'ProductStorageUpdated'` denetim kaydı.

### 📱 Mobil & Responsive Tasarım
- 1024px ve altı ekranlar için sol çekmece menü (Drawer) ve Header üzerinde Hamburger menü butonu (`☰`).
- Yarı saydam ekran karartması (`backdrop`), menü içi kapatma butonu ve sayfa tıklandığında otomatik kapanma.
- Tüm tablolarda dokunmatik yatay kaydırma (`responsive-table-container`) ve mobilde 2'li sütunlara kırılan KPI metrik kartları.

## 🚀 Başlatma ve Çalıştırma

### ⚡ Hızlı Başlatma (Windows - Çift Tıklama)
Tüm servisleri (PostgreSQL + Backend + Frontend + Tarayıcı) tek adımda çalıştırmak veya durdurmak için kök dizindeki scriptleri çift tıklayabilirsiniz:
- **aslat.bat**: PostgreSQL (Docker), .NET 10 API ve React Vite sunucularını başlatır, otomatik olarak tarayıcıda http://localhost:3000 sayfasını açar.
- **durdur.bat**: Backend, Frontend ve Docker konteynerlerini tek tıkla güvenle kapatır.
- **kontrol-paneli.bat**: Başlatma, durdurma, yeniden başlatma ve servis durumlarını görüntüleme seçenekleri sunan interaktif yönetim konsolunu açar.

---

### Manuel Başlatma Adımları

### 1. PostgreSQL 18 Başlatma (Docker)
```bash
docker compose up -d
```
- PostgreSQL Bağlantısı: `localhost:5433` (Kullanıcı: `postgres`, Şifre: `postgres`, DB: `ecommerce_admin`)
- PgAdmin 4: `http://localhost:5050` (E-posta: `admin@ecommerce.com`, Şifre: `postgres`)

### 2. Backend (.NET 10 Web API)
```bash
# Çözümü derle
dotnet build backend/ModularAdmin.slnx

# API Host'u çalıştır
dotnet run --project backend/src/ApiHost/ApiHost.csproj
```
- API Host: `http://localhost:5000` (veya `https://localhost:5001`)
- OpenAPI / Dokümantasyon: `http://localhost:5000/openapi/v1.json`
- Admin Sağlık Kontrolü: `http://localhost:5000/api/admin/health`

### 3. Frontend (React 19 + TypeScript + Vite)
```bash
cd frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Üretim için derle
npm run build
```
- Web Portalı: `http://localhost:3000`

