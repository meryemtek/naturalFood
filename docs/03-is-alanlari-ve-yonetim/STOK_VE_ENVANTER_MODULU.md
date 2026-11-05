# [Modül Şartnamesi] Stok ve Envanter Yönetimi Modülü (Inventory)

> **Modül Kodu:** `MOD-02`  
> **Durum:** Mock UI Aktif; Veritabanı & Backend Planlandı  
> **Sorumlu Katman:** Planlanan `backend/src/Modules/Inventory/` ve `apps/web-app/src/modules/`  
> **Hedef Veritabanı Şeması:** `inventory`  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

Stok ve Envanter modülü, depolardaki ürün miktarlarının, rezerve edilmiş sipariş stoklarının, kritik eşik uyarılarının ve fiziksel depo sayımlarının takibini sağlar.

---

## 📊 2. Planlanan Veri Modeli (`inventory` Şeması)

* **`inventory.Warehouses`:** Depo ID, Depo Adı (Örn: `Merkez Depo`, `Ege Bölge Depo`), Adres, Aktiflik Durumu.
* **`inventory.StockItems`:** Stok ID, SKU (Stok Kodu), Ürün ID, Depo ID, Eldeki Miktar (OnHand), Rezerve Miktar (Reserved), Kullanılabilir Miktar (Available = OnHand - Reserved), Kritik Eşik.
* **`inventory.StockMovements`:** Hareket ID, Stok ID, Hareket Tipi (`Inbound`, `Outbound`, `Reservation`, `Release`, `Adjustment`), Miktar, Referans Belge No, Tarih (UTC).
* **`inventory.StockCounts`:** Sayım ID, Depo ID, Sayım Tarihi, Sayılan Miktar, Sistem Miktarı, Fark (Variance), Onay Durumu.

---

## 🖥️ 3. Mevcut Durum ve Hedef UI

### Mevcut Durum (Mock Vitrini):
`packages/admin-core/src/pages/InventoryPage.tsx` sayfası üzerinden `inventoryModule` sözleşmesiyle sisteme bağlanmıştır. Aşağıdaki mock alanları sergiler:
* SKU (Örn: `ELEC-NK-001`, `MODA-TSH-002`)
* Ürün Adı, Kategori, Depo Konumu
* Mevcut Stok ve Kritik Eşik göstergesi
* Durum Rozeti (Örn: `Kritik Seviye`, `Normal`, `Tükendi`)

### Gelecek Geliştirme (Backlog):
1. Mock verinin kaldırılıp `GET /api/inventory/items` API servisine bağlanması.
2. "Stok Girişi / Hareketi Ekle" modalı.
3. Fiziksel sayım taslağı oluşturma ve yönetici onay kilitli düzeltme hareketi.
