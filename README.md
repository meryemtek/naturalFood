# Modüler Monolit E-Ticaret Admin Modülü

Bu proje, **Modüler Monolit (Modular Monolith)** mimari prensipleri doğrultusunda geliştirilmiş, yeniden kullanılabilir ve şema düzeyinde izole bir **Admin Modülü** içerir.

---

## 🛠️ Teknoloji Yığını

- **Backend:** ASP.NET Core 10 / .NET 10, C# (Clean Architecture & Modular Design)
- **Veritabanı:** PostgreSQL 18 (EF Core 10 + Npgsql, `"admin"` izole şeması)
- **Frontend:** React 19 + TypeScript + Vite (Monorepo Workspace)
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
│       │   ├── Entities/Admin/             # Admin Domain Varlıkları (AdminUser, AuditLog)
│       │   └── Enums/Admin/                # Admin Enum'ları (AdminRole)
│       ├── Application/                    # Uygulama Katmanı (Use Cases)
│       │   ├── Common/                     # Ortak Arayüzler ve Güvenlik (IAdminDbContext, PasswordHasher)
│       │   ├── DTOs/Admin/                 # Admin Veri Transfer Nesneleri
│       │   ├── Services/Admin/             # Admin Servis Arayüzleri (IAdminService)
│       │   └── Validators/Admin/           # Admin FluentValidation Kuralları
│       ├── Infrastructure/                 # Altyapı Katmanı
│       │   ├── Persistence/AdminDbContext.cs
│       │   ├── Persistence/Configurations/Admin/ # EF Core Varlık Konfigürasyonları
│       │   ├── Persistence/Migrations/Admin/     # İzole Migration Geçmişi
│       │   └── Services/Admin/             # Servis Implementasyonları (AdminService)
│       ├── Endpoints/                      # Sunum / Minimal API Katmanı
│       │   └── Admin/                      # Admin Endpoint Haritalama (AdminModuleExtensions, AdminEndpointsHandler)
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

## 🚀 Başlatma ve Çalıştırma

### 1. PostgreSQL 18 Başlatma (Docker)
```bash
docker compose up -d
```
- PostgreSQL Bağlantısı: `localhost:5432` (Kullanıcı: `postgres`, Şifre: `postgres`, DB: `ecommerce_admin`)
- PgAdmin 4: `http://localhost:5050` (E-posta: `admin@ecommerce.local`, Şifre: `postgres`)

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
