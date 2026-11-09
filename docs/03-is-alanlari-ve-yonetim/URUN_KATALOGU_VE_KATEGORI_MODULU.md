# [Modül Şartnamesi] Ürün Kataloğu ve Doğal Gıda Yönetimi Modülü (Catalog)

> **Modül Kodu:** `MOD-03`  
> **Durum:** ✅ Tamamlandı (Canlı PostgreSQL `catalog` Şeması Entegrasyonu)  
> **Son Güncelleme:** 9 Kasım 2026  
> **Sorumlu Katman:** `backend/src/Domain/Entities/Catalog/`, `Application/`, `Infrastructure/Persistence/`, `Endpoints/Catalog/`, `Endpoints/Admin/` ve `frontend/src/pages/products/`  
> **Hedef Veritabanı Şeması:** `catalog`  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

Doğal ve organik gıda e-ticaret operasyonuna özel olarak geliştirilen bu modül; taze ve işlenmiş gıda ürünlerinin, saklama koşullarının, parti (lot) takiplerinin, son tüketim tarihlerinin (STT/TETT), alerjen ve 100g besin değerlerinin yönetildiği çekirdek iş alanıdır.

Sistemde **Single Source of Truth (Tek Gerçek Kaynak)** mimarisi uygulanır: Hem Admin yönetim paneli hem de müşteri vitrini doğrudan PostgreSQL `catalog` şemasına bağlıdır.

---

## 📊 2. Canlı Veri Modeli (`catalog` Şeması)

### 1. `catalog."Categories"`
* `Id` (UUID, PK)
* `Name` (varchar 150)
* `Slug` (varchar 160, Unique)
* `Description` (varchar 1000)
* `ParentCategoryId` (UUID, nullable, hiyerarşik kategori ağacı)
* `DisplayOrder` (int)
* `IsActive` (boolean)
* `CreatedAtUtc` (timestamp with time zone)

### 2. `catalog."Products"`
* `Id` (UUID, PK)
* `CategoryId` (UUID, FK -> Categories)
* `Name` (varchar 200)
* `Slug` (varchar 220, Unique)
* `ShortDescription` (varchar 500)
* `BasePrice` (decimal 18,2)
* `DiscountPrice` (decimal 18,2, nullable)
* `StockQuantity` (int, güncel depo mevcudu)
* `Sku` (varchar 50, Unique)
* `UnitInfo` (varchar 50 - Örn: Kg, Gramaj, Litre, Adet)
* `Ingredients` (text, içindekiler ve bileşen listesi)
* `Allergens` (text[], örn: Gluten, Laktoz, Kuruyemiş)
* `Certifications` (text[], örn: Organik Sertifikalı, Taş Baskı, Vegan)
* `NutritionalValues` (jsonb: EnergyKcal, Fat, SaturatedFat, Carbohydrates, Sugar, Protein, Salt)
* `StorageConditionId` (UUID, nullable, FK -> StorageConditions)
* `ShelfLocation` (varchar 100, örn: 'Kiler-A / Sıra-3 / Bölme-1')
* `IsActive`, `IsBestSeller`, `IsNew`, `IsFeatured`, `IsSeasonal` (boolean)
* `CreatedAtUtc` (timestamp with time zone)

### 3. `catalog."ProductLots"` (STT & Parti Takibi)
* `Id` (UUID, PK)
* `ProductId` (UUID, FK -> Products)
* `LotNumber` (varchar 100, örn: 'LOT-2026-001')
* `ProductionDate` (timestamp with time zone)
* `ExpiryDate` (timestamp with time zone, STT/TETT)
* `Quantity` (int, bu partideki mevcut stok)
* `Status` (varchar 50: Active, NearExpiry, Expired, WrittenOff)
* `CreatedAtUtc` (timestamp with time zone)

### 4. `catalog."StorageConditions"` (Saklama ve Muhafaza Şablonları)
* `Id` (UUID, PK)
* `Name` (varchar 150, örn: 'Kuru Gıda & Bakliyat', 'Soğuk Muhafaza', 'Dondurulmuş', 'Serin Mahzen')
* `MinTemperature` (numeric 5,2)
* `MaxTemperature` (numeric 5,2)
* `MaxHumidity` (int?, bağıl nem oranı)
* `RequiresColdChain` (boolean, soğuk zincir lojistiği şartı)
* `DefaultShelfZone` (varchar 100, varsayılan depo bölgesi)
* `Description` (varchar 1000)
* `CreatedAtUtc` (timestamp with time zone)

---

## 🚀 3. Tamamlanan 5 Dikey Dilim (Vertical Slices)

| Dilim | Başlık | Ekran Rotaları | Backend Uçları | Temel Özellikler |
|---|---|---|---|---|
| **1. Dilim** | **Gelişmiş Ürün Tanımlama** | `/products/definition` | `GET/POST /api/admin/products` | Tartılı, hacimsel ve paketli ürün girişi, SKU, kategori seçimi |
| **2. Dilim** | **Stok & Envanter Yönetimi** | `/inventory` | `GET /api/admin/inventory`<br>`PATCH /api/admin/inventory/{id}/stock` | Hızlı +1/-1 butonları, 0'ın altına düşmeme garantisi, Audit Log (`StockUpdated`) |
| **3. Dilim** | **İçerik ve Alerjen Bilgileri** | `/products/allergens-nutrition` | `GET/PUT /api/admin/products/{id}/details` | Yasal etiketleme, alerjen uyarıları, 100g Besin Değerleri kartı (`ProductDetailsUpdated`) |
| **4. Dilim** | **STT / TETT ve Parti Takibi** | `/products/lot-expiry` | `GET/POST /api/admin/lots`<br>`PATCH /api/admin/lots/{id}/status` | Son kullanma tarihi takibi, kalan gün rozetleri, yeni partiyle genel stoğu artırma |
| **5. Dilim** | **Saklama Koşulları & Raf Takibi** | `/products/storage-conditions` | `GET/POST /api/admin/storage-conditions`<br>`PATCH /api/admin/products/{id}/storage` | 4 canlı saklama kartı, depo koordinatları (`Kiler-A/Raf-02`), Soğuk Zincir filtresi |

---

## 🌐 4. Müşteri (Public) Katalog API Entegrasyonu

Müşteri tarafına yönelik API uçları (`Endpoints/Catalog/CatalogEndpointsHandler.cs`), admin panelinde yapılan her değişikliği anında yansıtır:

* `GET /api/catalog/products`: Aktif olan (`Where(p => p.IsActive)`) ürünleri, kategori ve görselleriyle sayfalanmış döner.
* `GET /api/catalog/products/{slug}`: Ürünün detayını, varyantlarını ve özelliklerini döner.
* `GET /api/catalog/products/id/{id}`: ID ile ürün detayını döner.
* `GET /api/catalog/categories/tree`: Hiyerarşik kategori ağacını döner.

Admin panelinden eklenen veya güncellenen bir ürün `IsActive == true` olduğu sürece anında müşteri vitrinine düşer.
