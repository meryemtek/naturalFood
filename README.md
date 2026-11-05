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
│   ├── ModularAdmin.slnx                   # .NET 10 Solution
│   └── src/
│       ├── Host/
│       │   └── ApiHost/                    # Web API Host (Yalnızca Admin.Endpoints'e referans verir)
│       └── Modules/Admin/
│           ├── Admin.Domain/               # Bağımsız Domain modelleri ve kuralları
│           ├── Admin.Application/          # Servis arayüzleri, DTO'lar, CQRS
│           ├── Admin.Infrastructure/       # EF Core 10, Npgsql ("admin" şeması)
│           └── Admin.Endpoints/            # Minimal API Haritalama (Dışa sadece AdminModuleExtensions açılır)
└── frontend/                               # Monorepo Workspace
    ├── package.json
    ├── packages/
    │   └── admin-core/                     # Yeniden kullanılabilir React 19 Admin Kütüphanesi
    │       ├── src/
    │       │   ├── components/Layout/      # AdminLayout (Sidebar, Header, Menü)
    │       │   ├── components/Table/       # DataTable (Generic, Sıralama, Arama, Sayfalama)
    │       │   ├── components/Guard/       # AdminGuard (Oturum ve Rol bazlı koruma)
    │       │   └── types/                  # TypeScript tip tanımları
    │       └── dist/                       # ESM, CJS ve .d.ts paket çıktıları
    └── apps/
        └── web-app/                        # @modular-admin/admin-core tüketen React 19 uygulaması
```

---

## 🔑 Önemli Modüler Monolit Kuralları

1. **Şema İzolasyonu:**
   - Admin modülüne ait tablolar (`Users`, `AuditLogs`, `__EFMigrationsHistory`), PostgreSQL veritabanında `"admin"` şeması altında tutulur.
   - `modelBuilder.HasDefaultSchema("admin");` ile izole edilmiştir.
2. **Kapsülleme (Encapsulation):**
   - `ApiHost`, modülün iç implementasyon detaylarını (DbContext, Repository'ler vb.) doğrudan bilmez.
   - Dışarıya yalnızca `Admin.Endpoints` içerisindeki `AdminModuleExtensions` sunulur:
     - `builder.Services.AddAdminModule(builder.Configuration);`
     - `app.MapAdminEndpoints();`

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
dotnet run --project backend/src/Host/ApiHost/ApiHost.csproj
```
- API Host: `http://localhost:5000` (veya `https://localhost:5001`)
- OpenAPI / Dokümantasyon: `http://localhost:5000/openapi/v1.json`
- Admin Sağlık Kontrolü: `http://localhost:5000/api/admin/health`

### 3. Frontend (React 19 Monorepo)
```bash
cd frontend

# Bağımlılıkları yükle (çalıştırılmadıysa)
npm install

# admin-core kütüphanesini derle
npm run --workspace=@modular-admin/admin-core build

# Örnek React uygulamasını (web-app) başlat
npm run --workspace=web-app dev
```
- Web App Portalı: `http://localhost:3000`
