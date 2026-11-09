# [Modül Şartnamesi] Stok ve Envanter Yönetimi Modülü (Inventory)

> **Modül Kodu:** `MOD-02`  
> **Durum:** ✅ Tamamlandı (Canlı PostgreSQL `catalog` Şeması Entegrasyonu)  
> **Son Güncelleme:** 9 Kasım 2026  
> **Sorumlu Katman:** `backend/src/Endpoints/Admin/AdminEndpointsHandler.cs`, `Infrastructure/Admin/`, `frontend/src/services/inventoryService.ts` ve `frontend/src/pages/inventory/InventoryPage.tsx`  
> **Hedef Veritabanı Şeması:** `catalog` (`Products`, `ProductLots`) ve `admin` (`AuditLogs`)  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

Doğal ve taze gıda operasyonlarında stok hassasiyeti kritik öneme sahiptir. Bu modül; depodaki mevcut stok adetlerinin, kritik emniyet sınırlarının, hızlı stok düzeltmelerinin (+1 / -1), parti bazlı stok girişlerinin ve bunların denetim izlerinin (Audit Log) yönetildiği operasyon merkezidir.

Tarayıcı hafızasına (`localStorage`) dayalı geçici mock vitrini tamamen ortadan kaldırılmış, tüm işlemler doğrudan PostgreSQL veritabanına bağlanmıştır.

---

## 📊 2. Envanter Veri Modeli ve Kuralları

* **Temel Stok Deposu:** `catalog."Products"."StockQuantity"` sütunu (integer).
* **Parti Bazlı Stok:** `catalog."ProductLots"."Quantity"` sütunu (her bir partideki kalan miktar).
* **Negatif Stok Önleme:** Hiçbir ürünün stoğu 0'ın altına düşürülemez (`Math.Max(0, product.StockQuantity + delta)`).
* **Otomatik Parti Senkronizasyonu:** Yeni bir parti girişi (`POST /api/admin/lots`) yapıldığında, partideki miktar kadar bağlı ürünün genel `StockQuantity` değeri otomatik artırılır.
* **Denetim İzi (Audit Log):** Her stok değişiminde `admin."AuditLogs"` tablosuna `Action = 'StockUpdated'`, eski/yeni stok miktarları ve işlemi yapan admin IP/kullanıcı bilgisi kaydedilir.

---

## 🔌 3. Minimal API Uçları

### 1. `GET /api/admin/inventory`
* **Girdi Parametreleri:** `search` (ürün adı veya SKU), `criticalOnly` (kritik stok eşiği <= 5 olanlar), `page`, `pageSize`.
* **Çıktı:** Sayfalanmış `items` listesi (`Id`, `Name`, `Sku`, `Category`, `StockQuantity`, `UnitInfo`, `BasePrice`) ve `totalCount`.

### 2. `PATCH /api/admin/inventory/{id}/stock`
* **Girdi:** `{ delta?: number, newQuantity?: number }`
* **İşlem:** Ürün stoğunu günceller, 0 altına düşürmez, `admin.AuditLogs` tablosuna `'StockUpdated'` yazar.
* **Çıktı:** Güncellenmiş ürün bilgisi (`id`, `stockQuantity`, `sku`, `name`).

---

## 🖥️ 4. Frontend Entegrasyonu (`InventoryPage.tsx`)

* **Canlı Veri Servisi (`inventoryService.ts`):** `getInventory()` ve `updateStock()` metotları ile backend'e bağlanır.
* **Hızlı Aksiyonlar:** Tablodaki `+1` ve `-1` butonları doğrudan `PATCH` API çağrısı yapar.
* **Kritik Eşik Uyarıları:** 5 ve altı kalan ürünler soft amber rozetle, tükenenler soft kırmızı rozetle belirtilir.
* **Filtreler:** Kritik stok filtresi ve anlık ürün/SKU arama kutusu mevcuttur.
* **Mobil Uyumluluk:** Tablo `responsive-table-container` ile yatay kaydırılabilir; KPI kartları mobilde 2 sütuna uyarlanır.
