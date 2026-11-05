# Geçmiş Mimari Kararlar (ADR) ve Migration Notları

> **Durum:** Tarihsel Kayıt ve Karar Arşivi  
> **Son Güncelleme:** 5 Kasım 2026  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🏛️ 1. Mimari Karar Kayıtları (Architectural Decision Records)

### ADR-001: .NET 10 ve Yeni Solution Formatı (.slnx)
* **Bağlam:** .NET 10 SDK ile birlikte gelen modern, hafif ve okunabilir XML tabanlı solution formatı (`.slnx`) devreye girmiştir.
* **Karar:** Eski GUID tabanlı `.sln` yerine modern `ModularAdmin.slnx` formatı tercih edilmiştir.
* **Sonuç:** Solution dosyası git merge çakışmalarına karşı daha dirençli ve insan tarafından okunabilir hale gelmiştir.

---

### ADR-002: PostgreSQL 18 Docker Volume Konfigürasyonu
* **Bağlam:** PostgreSQL resmi Docker imajlarında sürüm 18 ile birlikte varsayılan veri dizini mount yolu değişmiştir.
* **Karar:** `docker-compose.yml` içinde volume bağlama noktası `/var/lib/postgresql/data` yerine `/var/lib/postgresql` olarak ayarlanmıştır.
* **Sonuç:** Container crash loop'a girmeden sağlıklı (`healthy`) olarak ayağa kalkmaktadır.

---

### ADR-003: Şema İzolasyonu ve Ayrı Migration Tablosu
* **Bağlam:** Modüler monolitik sistemlerde tüm tabloların `public` şemasına atılması, ileride modüller büyüdükçe migration kilitlenmelerine yol açar.
* **Karar:** Her modüle PostgreSQL üzerinde kendi şeması (`admin`, `inventory`, `catalog`) atanmış ve EF Core konfigürasyonunda `MigrationsHistoryTable("__EFMigrationsHistory_Admin", "admin")` kuralı getirilmiştir.
* **Sonuç:** Her modülün veritabanı yaşam döngüsü ve migration geçmişi tamamen izole edilmiştir.

---

### ADR-004: Pluggable Admin Shell Deseni
* **Bağlam:** Layout ve Sidebar içine sabit sayfaların gömülmesi, modüller arası sıkı bağımlılık (tight coupling) yaratır.
* **Karar:** `packages/admin-core` paketi içerisindeki `AdminShell` tamamen boş bir kabuk olarak tasarlanmış, menü ve rotalar `AdminFeatureModule` arayüzü ile dışarıdan verilecek şekilde ayrıştırılmıştır. [RULES.md](../../RULES.md) ile kabuk dosyalarının değiştirilmesi kilitlenmiştir.
* **Sonuç:** Yeni özellikler sisteme 0 satır kabuk kodu değiştirilerek takılabilmektedir.

---

### ADR-005: PowerShell REST İsteklerinde UTF-8 Kodlaması
* **Bağlam:** Windows PowerShell ortamında Türkçe karakter içeren (İ, ş, ç, ğ) JSON gövdeleri `Invoke-RestMethod` ile gönderildiğinde varsayılan sistem kodlaması nedeniyle bozulmakta ve backend'de 500 hatası üretmekteydi.
* **Karar:** İsteklerde `[System.Text.Encoding]::UTF8.GetBytes($body)` ve `-ContentType "application/json; charset=utf-8"` standardı benimsenmiştir.
* **Sonuç:** Türkçe karakter içeren tüm kayıtlar veritabanına eksiksiz aktarılmaktadır.

---

## 📜 2. Migration Geçmişi

1. **`20261105085449_Initial_AdminModule`:**
   - `admin` şeması oluşturuldu.
   - `AdminUsers` ve `AuditLogs` tabloları kuruldu.
   - Benzersiz e-posta index'i (`IX_AdminUsers_Email`) ve foreign key ilişkileri eklendi.
2. **`20261105093744_Add_PasswordHash_To_AdminUsers`:**
   - `AdminUsers` tablosuna PBKDF2 SHA-256 hash'leri için `PasswordHash` sütunu eklendi.
   - Varsayılan `superadmin@ecommerce.local` kullanıcısının şifre hash'i güncellendi.
