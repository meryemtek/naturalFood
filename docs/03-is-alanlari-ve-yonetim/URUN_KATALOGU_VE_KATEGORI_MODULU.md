# [Modül Şartnamesi] Ürün Kataloğu ve Kategori Yönetimi Modülü (Catalog)

> **Modül Kodu:** `MOD-03`  
> **Durum:** Planlandı / Tasarım Aşamasında  
> **Sorumlu Katman:** Planlanan `backend/src/Modules/Catalog/` ve `apps/web-app/src/modules/catalog/`  
> **Hedef Veritabanı Şeması:** `catalog`  
> **İlgili Ana Belge:** [docs/README.md](../README.md)  

---

## 🎯 1. Modülün Amacı ve Kapsamı

E-ticaret sitesinde sergilenen tüm ürünlerin, kategori hiyerarşisinin, varyant kombinasyonlarının (Beden, Renk), fiyatlandırma ve görsellerinin yönetildiği temel iş alanıdır.

---

## 📊 2. Planlanan Veri Modeli (`catalog` Şeması)

* **`catalog.Categories`:** Kategori ID, Üst Kategori ID (ParentId), Ad, Slug, Sıra No, Aktiflik.
* **`catalog.Products`:** Ürün ID, Kategori ID, Başlık, Kısa Açıklama, Detaylı HTML Açıklama, Temel Fiyat, KDV Oranı, Yayında mı (IsPublished).
* **`catalog.ProductVariants`:** Varyant ID, Ürün ID, SKU, Barkod, Varyant Özellikleri JSON (Örn: `{"Beden": "XL", "Renk": "Siyah"}`), Ek Fiyat.
* **`catalog.ProductMedia`:** Medya ID, Ürün ID, Görsel URL, Sıra No, Kapak Görseli mi (IsCover).

---

## 🖥️ 3. Hedef Kullanıcı Arayüzü (Frontend)

1. **Kategori Ağacı Yönetimi (`CategoriesPage.tsx`):**
   - Ağaç görünümünde (Tree view) kategorileri sürükle-bırak ile yeniden sıralama ve alt kategoriye taşıma.
2. **Ürün Yönetimi ve Düzenleyici (`ProductsPage.tsx`):**
   - Ürün tablosu (Görsel küçük resim, Başlık, Kategori, Fiyat, Varyant Sayısı, Yayın Durumu).
   - Yeni ürün oluşturma sihirbazı: Genel Bilgiler -> Varyant Matrisi -> Görsel Yükleyici -> SEO Ayarları.
