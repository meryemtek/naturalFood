# [Modül Şartnamesi] Stok ve Depo Yönetimi Modülü (Inventory)

> **Modül Kodu:** `MOD-02`  
> **Durum:** 🚧 Kısmi (`1/5` Canlı — `/inventory` Canlı PostgreSQL; Kalan 4 Alt Ekran Faz 2'de)  
> **Son Güncelleme:** 11 Kasım 2026  
> **Sorumlu Katman:** `backend/src/Endpoints/Admin/AdminEndpointsHandler.cs`, `Infrastructure/Admin/`, `frontend/src/services/inventoryService.ts` ve `frontend/src/pages/inventory/`  
> **Veritabanı Şemaları:** `catalog` (`Products`, `ProductLots`), `admin` (`AuditLogs`) ve planlanan `inventory` şeması  
> **İlgili Belgeler:** [YAPILANLAR](../00-devir-rehberi/YAPILANLAR_VE_TAMAMLANANLAR.md) · [YAPILACAKLAR](../00-devir-rehberi/YAPILACAKLAR_VE_FAZ_HARITASI.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

Doğal ve taze gıda operasyonlarında stok hassasiyeti kritik öneme sahiptir. Bu modül; depodaki mevcut stok adetlerinin, kritik emniyet sınırlarının, hızlı stok düzeltmelerinin (+1 / -1), tedarikçi satın almalarının, çoklu depoların ve stok hareket fişlerinin yönetildiği operasyon merkezidir.

---

## 📊 2. Canlı Çalışan Envanter Özellikleri (`/inventory` — 2. Dikey Dilim ✅)

* **Temel Stok Deposu:** `catalog."Products"."StockQuantity"` sütunu (integer).
* **Parti Bazlı Stok:** `catalog."ProductLots"."Quantity"` sütunu; yeni parti eklendiğinde genel stok otomatik artırılır.
* **Negatif Stok Önleme:** Hiçbir ürünün stoğu 0'ın altına düşürülemez (`Math.Max(0, product.StockQuantity + delta)`).
* **Denetim İzi (Audit Log):** Her stok değişiminde `admin."AuditLogs"` tablosuna `Action = 'StockUpdated'` kaydedilir.
* **localStorage Temizliği:** Tarayıcı hafızasına (`ProductInventoryStore.ts`) dayalı geçici yapı tamamen kaldırılmıştır.

### Canlı API Uçları
* **`GET /api/admin/inventory`:** Sayfalanmış `items` listesi, ürün/SKU araması ve `criticalOnly` (<= 5) filtresi.
* **`PATCH /api/admin/inventory/{id}/stock`:** `{ delta?, newQuantity? }` ile anında veritabanı güncellemesi ve Audit Log kaydı.

---

## 🚧 3. Sıradaki Geliştirmeler (Faz 2 Kapsamındaki Kalan 4 Alt Ekran)

Stok ve Depo Yönetimi menüsünün diğer 4 alt sekmesi henüz veritabanına bağlanmamıştır:

1. **Tedarikçi ve Alım Yönetimi (`/inventory/suppliers-procurement`):**
   - Mevcut durumda [`SupplierProcurementPage.tsx`](../../frontend/src/pages/inventory/SupplierProcurementPage.tsx) içinde statik/mock veri göstermektedir.
   - `inventory` şeması altında `Suppliers`, `PurchaseOrders`, `GoodsReceipts` tabloları kurulacak ve mal kabulünde otomatik Lot oluşturulacaktır.
2. **Depo Tanımları (`/inventory/warehouses`):**
   - Şu an `ModulePlaceholderPage` göstermektedir. Merkez depo, +4°C soğuk oda ve şube tanımları eklenecektir.
3. **Stok Hareketleri ve Fişler (`/inventory/transactions`):**
   - Şu an `ModulePlaceholderPage` göstermektedir. Giriş, çıkış, transfer ve fire fişlerinin hareket defteri eklenecektir.
4. **Kritik Stok Uyarıları (`/inventory/alerts`):**
   - Şu an `ModulePlaceholderPage` göstermektedir. Ürün bazlı emniyet stoğu sınırları ve acil tedarik yönlendirmesi eklenecektir.
