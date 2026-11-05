# Hızlı Devir Teslim & Geliştirici Başlangıç Rehberi (Onboarding)

> **Hedef:** Yeni bir mühendisin repoyu klonladıktan sonra 30 dakika içinde projeyi ayağa kaldırması, test etmesi ve kod kurallarına hakim olması.  
> **Son Güncelleme:** 5 Kasım 2026  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## ⚡ 1. Sistem Gereksinimleri

Geliştirme ortamınızda aşağıdaki araçların kurulu olduğunu doğrulayın:

* **.NET SDK:** `10.0.100` veya üzeri (`dotnet --version`)
* **Node.js:** `v20.x` veya üzeri ve `npm v10+` (`node -v`, `npm -v`)
* **Docker & Docker Compose:** Docker Desktop veya Docker Engine (`docker --version`, `docker compose version`)
* **PostgreSQL İstemcisi (Opsiyonel):** pgAdmin veya `psql` (Docker içerisinden de erişilebilir)

---

## 🚀 2. Projeyi 3 Adımda Ayağa Kaldırma

### Adım 1: Veritabanı Container'ını Başlatma
Kök dizinde Docker Compose ile PostgreSQL 18 container'ını arka planda başlatın:
```bash
docker compose up -d
```
Container sağlık durumunu kontrol edin:
```bash
docker ps
# modular_admin_postgres container'ının (healthy) olduğunu görmelisiniz.
```
* **Veritabanı Adı:** `ecommerce_admin`
* **Kullanıcı:** `admin_user`
* **Şifre:** `AdminSecretPass123!`
* **Dış Port:** `5432`

---

### Adım 2: Backend API'yi Çalıştırma
Backend projesini derleyip `http://localhost:5000` portunda başlatın:
```bash
dotnet run --project backend/src/ApiHost/ApiHost.csproj --urls "http://localhost:5000"
```
Doğrulama:
* Tarayıcıdan veya curl ile sağlık ucunu test edin:
  ```bash
  curl http://localhost:5000/api/admin/health
  # Yanıt: {"status":"Healthy","module":"AdminModule"}
  ```
* Swagger / OpenAPI Arayüzü: `http://localhost:5000/swagger` (geliştirme modunda aktiftir).

---

### Adım 3: Frontend Web Uygulamasını Çalıştırma
Yeni bir terminalde frontend dizinine geçip dev sunucusunu başlatın:
```bash
cd frontend
npm run --workspace=web-app dev
```
Uygulama `http://localhost:3000` adresinde açılacaktır.

---

## 🔑 3. Varsayılan Hesaplar ve Portlar

| Hizmet | Adres / Port | Açıklama |
|---|---|---|
| **Web Uygulaması (Shell)** | `http://localhost:3000/admin` | React 19 Admin Shell |
| **Backend REST API** | `http://localhost:5000` | ASP.NET Core 10 Minimal API |
| **API Health Check** | `http://localhost:5000/api/admin/health` | Modül canlılık kontrolü |
| **PostgreSQL 18** | `localhost:5432` (Docker) | `admin` şeması ve tabloları |
| **Varsayılan SuperAdmin** | `superadmin@ecommerce.local` | Şifre: `Admin123!*` |

---

## 🛡️ 4. Çekirdek Geliştirici Kuralı (KIRILMAZ KURAL)

Bu projede **Modüler Kabuk (Pluggable Shell)** mimarisi uygulanır.
Kök dizindeki [RULES.md](../../RULES.md) ve `.cursorrules` dosyaları şu değişmez kuralı tanımlar:

> [!CAUTION]
> **DOKUNULMAZ DİZİN:**  
> `"packages/admin-core"` altındaki Layout, Shell veya Sidebar dosyalarına (`AdminShell.tsx`, `AdminLayout.tsx` vb.) **kesinlikle dokunulamaz, içeriği elle değiştirilemez.**

### Yeni Bir Özellik / Modül Ekleme Akışı:
1. `apps/web-app/src/modules/[ozellik-adi]/` altında yeni bir klasör açılır.
2. Sayfa bileşeni yazılır.
3. `AdminFeatureModule` sözleşmesi (`id`, `title`, `navItems`, `routes`) ile bir modül nesnesi olarak dışa aktarılır (export edilir).
4. Oluşturulan modül, yalnızca `apps/web-app/src/App.tsx` içindeki `<AdminShell modules={[...]}>` dizisine parametre olarak eklenir.
5. Menü ağacı ve rotalar kabuk tarafından otomatik olarak üretilir.

---

## 🔍 5. Sorun Giderme (Troubleshooting)

* **PostgreSQL Port Çakışması:** Yerel makinenizde zaten çalışan bir PostgreSQL varsa, `docker-compose.yml` içindeki dış portu değiştirebilir veya yerel servisi durdurabilirsiniz.
* **Vite Proxy Hatası (ECONNREFUSED):** Backend API'nin `http://localhost:5000` portunda çalıştığından emin olun. `apps/web-app/vite.config.ts` dosyası istekleri bu porta iletir.
* **Migration Hatası:** Migration script'ini container'a elle uygulamak isterseniz:
  ```bash
  dotnet ef migrations script --project backend/src/Infrastructure/Infrastructure.csproj --startup-project backend/src/ApiHost/ApiHost.csproj --context AdminDbContext | docker exec -i modular_admin_postgres psql -U admin_user -d ecommerce_admin
  ```
