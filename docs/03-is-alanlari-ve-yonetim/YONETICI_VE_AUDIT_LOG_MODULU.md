# [Modül Şartnamesi] Yönetici ve Denetim İzi Modülü (Admin & Audit)

> **Modül Kodu:** `MOD-01`  
> **Durum:** Canlı / Kalıcı Çekirdek (Production MVP)  
> **Sorumlu Katman:** `backend/src/Modules/Admin/` ve `packages/admin-core/`  
> **Veritabanı Şeması:** `admin` (`AdminUsers`, `AuditLogs`)  
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
| `Role` | `VARCHAR(32)` | `SuperAdmin`, `Admin`, `Moderator` |
| `IsActive` | `BOOLEAN` | Varsayılan `true` |
| `CreatedAtUtc` | `TIMESTAMP` | Kayıt tarihi (UTC) |
| `LastLoginAtUtc` | `TIMESTAMP` | Opsiyonel, son oturum açma zamanı |

### B. `admin.AuditLogs` Tablosu
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
  Gövde: `{ "email": "...", "fullName": "...", "password": "...", "role": "Admin" }`.  
  Başarılıysa 201 Created döner ve otomatik `AuditLog` oluşturur.
* **`PATCH /api/admin/users/{id}/status`**  
  Gövde: `{ "isActive": false }`.  
  Kullanıcının durumunu değiştirir, 204 No Content döner ve `AuditLog` oluşturur.
* **`GET /api/admin/audit-logs`**  
  Parametreler: `page`, `pageSize`.  
  Sistem loglarını ters kronolojik sırayla döner.

---

## 🖥️ 4. Kullanıcı Arayüzü (Frontend)

* **`UsersPage.tsx`:** Kullanıcı listeleme tablosu, rol filtreleri, "Yeni Yönetici Ekle" modalı ve anlık durum değiştirme anahtarı.
* **`AuditLogsPage.tsx`:** Log tablosu, tarih/saat, IP adresi ve işlem detayı görüntüleme.
* Bu sayfalar `userManagementModule` olarak `packages/admin-core` içerisinden dışa aktarılır.
