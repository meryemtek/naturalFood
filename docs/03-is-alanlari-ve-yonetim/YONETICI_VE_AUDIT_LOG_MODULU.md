# [Modül Şartnamesi] Yönetici ve Denetim İzi Modülü (Admin & Audit)

> **Modül Kodu:** `MOD-01`  
> **Durum:** Canlı / Kalıcı Çekirdek (Production MVP)  
> **Sorumlu Katman:** `backend/src/` (`Domain`, `Application`, `Infrastructure`, `Endpoints` katmanları altındaki `Admin/`) ve `packages/admin-core/`  
> **Veritabanı Şeması:** `admin` (`AdminUsers`, `Roles`, `ModulePermissions`, `RolePermissions`, `AuditLogs`)  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

Bu modül, platforma erişebilen sistem yöneticilerinin, şifre ve rol bazlı yetkilerinin yönetilmesini ve sistem genelinde gerçekleşen tüm kritik işlemlerin denetim günlüğüne (audit log) geri döndürülemez biçimde kaydedilmesini sağlar.

---

## 📊 2. Veri Modeli ve Entity Şartnamesi

### A. `admin.AdminUsers` Tablosu
| Alan Adı | Tip | Kısıt / Açıklama |
|---|---|---|
| `Id` | `UUID` | Birincil anahtar (PK) |
| `Email` | `VARCHAR(256)` | Benzersiz (Unique), Boş olamaz |
| `FullName` | `VARCHAR(128)` | Boş olamaz |
| `PasswordHash` | `VARCHAR(512)` | PBKDF2 SHA-256 tuzlanmış hash |
| `Role` | `INTEGER` / `VARCHAR` | `SuperAdmin (1)`, `Admin (2)`, `Moderator (3)`, `BranchManager (4)`, `WarehouseStaff (5)` |
| `CustomRoleName` | `VARCHAR(100)` | Opsiyonel; arayüzden eklenen özel roller için rol adı (`EffectiveRoleName`) |
| `IsActive` | `BOOLEAN` | Varsayılan `true` |
| `CreatedAtUtc` | `TIMESTAMP` | Kayıt tarihi (UTC) |
| `LastLoginAtUtc` | `TIMESTAMP` | Opsiyonel, son oturum açma zamanı |

### B. Dinamik RBAC Tabloları (`Roles`, `ModulePermissions`, `RolePermissions`)
* **`admin.Roles`:** `Id (UUID)`, `Name (Unique)`, `Description` — `SuperAdmin`, `BranchManager`, `WarehouseStaff` ve arayüzden eklenen özel roller.
* **`admin.ModulePermissions`:** `Id (UUID)`, `Key (Unique)`, `Title`, `Category` — 9 temel modül izin anahtarı (`products.view`, `inventory.view`, `storage.view`, `crm.reviews`, `crm.manage`, `finance.reports`, `orders.view`, `marketing.view`, `users.manage`).
* **`admin.RolePermissions`:** `RoleId`, `PermissionKey` bileşik anahtarlı Many-to-Many yetki eşleşme tablosu.

### C. `admin.AuditLogs` Tablosu
| Alan Adı | Tip | Kısıt / Açıklama |
|---|---|---|
| `Id` | `UUID` | Birincil anahtar (PK) |
| `AdminUserId` | `UUID` | İşlemi gerçekleştiren yönetici ID |
| `Action` | `VARCHAR(64)` | İşlem tipi (`CreateUser`, `UpdateUserStatus` vb.) |
| `Resource` | `VARCHAR(64)` | Etkilenen kaynak (`AdminUser`) |
| `TimestampUtc` | `TIMESTAMP` | İşlem tarihi (UTC) |
| `IpAddress` | `VARCHAR(45)` | IPv4 veya IPv6 adresi |
| `Details` | `TEXT` | Yapılan değişikliğin JSON temsili |

---

## 🔌 3. REST API Uç Noktaları

Tüm uç noktalar `/api/admin` taban rotası altındadır:

* **`GET /api/admin/users`**  
  Parametreler: `page` (varsayılan: 1), `pageSize` (varsayılan: 10), `search` (opsiyonel), `role` (opsiyonel).  
  Dönüş: `PaginatedList<AdminUserDto>`.
* **`GET /api/admin/users/{id}`**  
  Tekil kullanıcı detayını döner. Bulunamazsa 404 döner.
* **`POST /api/admin/users`**  
  Gövde: `{ "email": "...", "fullName": "...", "password": "...", "role": 4, "customRoleName": null }`.  
  Başarılıysa 201 Created döner ve otomatik `AuditLog` oluşturur.
* **`PATCH /api/admin/users/{id}/status`**  
  Gövde: `{ "isActive": false }`.  
  Kullanıcının durumunu değiştirir, 200 OK döner ve `AuditLog` oluşturur.
* **`GET /api/admin/audit-logs`**  
  Parametreler: `page`, `pageSize`.  
  Sistem loglarını ters kronolojik sırayla döner.
* **`POST /api/admin/auth/login`**  
  Admin e-posta ve şifresini PBKDF2 ile doğrular (`IsActive == false` ise engeller), oturum token'ı, rol ve aktif izin dizisini döner; sonucu `AuditLogs` (`AdminLoginSuccess` / `AdminLoginFailed`) tablosuna işler.
* **`GET /api/admin/roles` & `POST /api/admin/roles`**  
  Tanımlı rolleri modül izinleriyle listeler; kod yazmadan yeni özel rol oluşturur.
* **`GET /api/admin/permissions` & `PUT /api/admin/roles/{roleId}/permissions`**  
  Sistem modül anahtarlarını döner ve seçili rolün açık/kapalı modüllerini günceller (`RolePermissionsUpdated`).
* **`GET /api/admin/auth/me/permissions`**  
  Giriş yapan kullanıcının rolüne ait aktif izin anahtarlarını (`string[]`) döner (kayıtsız roller için fail-closed `[]`).

---

## 🖥️ 4. Kullanıcı Arayüzü (Frontend)

* **`AdminLoginPage.tsx` (`/admin/login`):** Müşteri vitrinindeki `/giris` sayfasından tamamen izole yönetici giriş ekranı (`nf_admin_session`).
* **`UsersPage.tsx` (`/admin/users`):** Yönetici listesi, dinamik rol seçimiyle `+ Yeni Yönetici Ekle` modalı, aktif/pasif anahtarı ve **Rol & Modül Yetkileri (Dinamik RBAC)** sekmesi.
* **`RolePermissionsPage.tsx` (`/admin/roles`):** Rol seçici, kategori bazlı sage yeşili modül toggle anahtarları ve `+ Yeni Rol Ekle` modalı (aynı pencerede opsiyonel ilk yönetici e-posta/şifre tanımlama dahil).
* **`AuditLogsPage.tsx` (`/admin/audit-logs`):** Log tablosu, tarih/saat, IP adresi ve işlem detayı görüntüleme.
